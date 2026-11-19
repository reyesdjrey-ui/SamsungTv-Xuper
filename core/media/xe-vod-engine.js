/* Xuper Eclectic VOD Transport Engine v2.0.23 */
(function (w, d) {
  'use strict';
  var oldHttp = w.CactusDirect && w.CactusDirect.http;
  if (!oldHttp) return;
  var H = 'https://cactus-media.invalid';
  var current = null, movieSequence = 0, cachedSeriesColId = 0;
  var FOUR_MB = 4 * 1024 * 1024;
  function errText(e) { return String(e && (e.message || e.name) || e || 'Error'); }
  function reported(e) { return new Error(errText(e).slice(0,240)); }
  function int(v, fallback) { var n = Number(v); return isFinite(n) && n >= 0 ? n : fallback; }
  function httpRequest(req, array, rangeCheck) {
    if (!req || !/^https?:\/\//i.test(req.url)) return Promise.reject(Error('El proveedor no entregó un destino de video válido.'));
    return w.fetch(req.url, {method:'GET', headers:req.headers || {}, redirect:'follow', cache:'no-store'})
      .then(function (r) {
        if (!r.ok && r.status !== 206) {try{if(r.body)r.body.cancel();}catch(_){ }throw Error('El servidor multimedia rechazó la solicitud (HTTP '+r.status+').');}
        if (rangeCheck && r.status === 200) {
          try {if(r.body)r.body.cancel();}catch(_){}
          throw Error('El servidor no acepta solicitudes HTTP Range; no se descargará una película completa.');
        }
        if (!array) return r;
        return r.arrayBuffer();
      }).catch(function(e) {
        if (e instanceof TypeError) throw Error('El navegador Tizen no pudo leer el servidor multimedia. Revisa permisos CORS/HTTP del proveedor.');
        throw e;
      });
  }
  function inspectIdxg(buffer, total) {
    var b = new Uint8Array(buffer), v = new DataView(buffer);
    if (b.length < 32 || String.fromCharCode(b[4],b[5],b[6],b[7]) !== 'idxg') throw Error('El índice IDXG no tiene un encabezado válido.');
    var len = b[12], base = 13 + len;
    if (base >= b.length - 12) throw Error('Índice IDXG incompleto.');
    var headerTotal = v.getUint32(base, false) * 4294967296 + v.getUint32(base + 4, false);
    if (!total || total <= 0 || !isFinite(total)) {
      total = (Number.isSafeInteger(headerTotal) && headerTotal > 0) ? headerTotal : 0;
    }
    function offset(pos) { return v.getUint32(pos,false)*4294967296 + v.getUint32(pos+4,false); }
    function point(pos) { return {off:offset(pos),ts:v.getUint32(pos+8,false)}; }
    function scan(pos, max) {
      var lastOff = -1, lastTs = -1, n = 0;
      for (var p=pos;p+12<=b.length && n<max;p+=12) {
        var x=point(p);
        if (!Number.isSafeInteger(x.off) || x.off<lastOff || x.ts<lastTs || (total && x.off>total+8388608)) break;
        lastOff=x.off; lastTs=x.ts; n++;
      }
      return n;
    }
    var best = -1, longest = 0;
    for (var s=base;s<base+256 && s+12<=b.length;s++) {
      var n=scan(s,32);
      if(n>longest){longest=n;best=s;}
    }
    if (best<0 || longest<2) throw Error('No se pudo leer la tabla de segmentos IDXG.');
    var count=scan(best, Math.min(100000,Math.floor((b.length-best)/12)));
    var entries=[];
    for(var j=0;j<count;j++)entries.push(point(best+j*12));
    var chunks=[], prevMs=0;
    for(var k=0;k<entries.length;k++) {
      var e=entries[k], end=k+1<entries.length ? entries[k+1].off : total;
      var duration=Math.max(0.05,(e.ts-prevMs)/1000);
      prevMs=e.ts;
      if(!end || end<=e.off) {
        end=e.off+Math.max(FOUR_MB,k>0 ? (e.off-entries[k-1].off)*2 : FOUR_MB);
      }
      if(end>e.off)chunks.push({start:e.off,end:end-1,length:end-e.off,duration:duration});
    }
    var grouped=[],pending=null;
    chunks.forEach(function(c){
      if(!pending)pending={start:c.start,end:c.end,duration:0};
      pending.end=c.end;pending.duration+=c.duration;
      if(pending.duration>=6){grouped.push(pending);pending=null;}
    });
    if(pending){if(grouped.length && pending.duration<3){var last=grouped[grouped.length-1];last.end=pending.end;last.duration+=pending.duration;} else grouped.push(pending);}
    if(!grouped.length)throw Error('El índice IDXG no contiene segmentos.');
    return grouped;
  }
  function movieFrom(meta) {
    var best=null;
    (meta.episodeList||[]).forEach(function(ep){
      (ep.totalMovieList||[]).forEach(function(tm){
        (tm.movieList||[]).forEach(function(m){
          if(!m.licenseList || !m.licenseList.length)return;
          var score=(String(m.videoFormat||'ts').toLowerCase()==='ts'?0:10)+(String(m.encodeFormat||'').toLowerCase()==='h264'?0:2);
          if(!best || score<best.score) best={movie:m,score:score};
        });
      });
    });
    if(!best)throw Error('El proveedor no devolvió variantes de video disponibles para esta película.');
    return best.movie;
  }
  function columnOptions(c,item) {
    var isSeries = String(item.type) === '0';
    if (!isSeries) return Promise.resolve({ type: '1', episode: 1 });
    var opts = {
      type: '0',
      episode: Number(item.episode) || 1,
      seriesContentId: item.seriesContentId || item.contentId
    };
    if (cachedSeriesColId) {
      opts.columnId = cachedSeriesColId;
      return Promise.resolve(opts);
    }
    return c.catalog.getRootColumns().then(function(root){
      var children = root && root.childColumnList || [];
      var sCol = children.find(function(col){ return col.code === 'masnew_series' || /series/i.test(col.name); });
      cachedSeriesColId = sCol ? sCol.id : (item.columnId || 76178);
      opts.columnId = cachedSeriesColId;
      return opts;
    }).catch(function(){
      opts.columnId = item.columnId || 76178;
      return opts;
    });
  }
  function prepare(item) {
    if(!item||!item.contentId) return Promise.reject(Error('Falta contenido para preparar el video.'));
    return w.CactusDirect.connect().then(function(c){
      var fnSign = w.signO3 || (typeof signO3 === 'function' ? signO3 : null);
      if(!c.stream || typeof fnSign !== 'function') throw Error('Falta el módulo de transporte original.');
      w.signO3 = fnSign;
      return columnOptions(c,item).then(function(o){return c.stream.startPlayVOD(item.contentId,o);}).then(function(meta){
        var m=movieFrom(meta);
        var license=(m.licenseList.find(function(e){return e.tag==='free';})||m.licenseList[0]).license;
        var params=c.stream.constructor.parseParams ? c.stream.constructor.parseParams(license) : {};
        var code=params.media_code||m.contentId;
        var container=String(m.videoFormat||'ts').toLowerCase()==='mp4'?'mp4':'ts';
        if(container==='mp4'){
          if(!w.CactusMP4)throw Error('Esta variante necesita acceso MP4 directo autorizado; el adaptador actual admite variantes TS.');
          function buildMp4Session(forceSlb){
            return c.stream.getSlbInfo({forceRefresh:!!forceSlb}).then(function(slb){
              var mp4Session=c.stream.createCflSession('vod',{mediaCode:code,license:license,container:'mp4'},slb);
              var nowSec=Math.floor(Date.now()/1000);
              if(!forceSlb&&mp4Session&&mp4Session.expired&&(Number(mp4Session.expired)-nowSec)<120){
                return buildMp4Session(true);
              }
              return {
                container:'mp4',
                segments:[],
                session:mp4Session,
                sessionOpts:{mediaCode:code,license:license,container:'mp4'},
                subtitles:w.CactusTracks?w.CactusTracks.collectSelected(meta,m,item):[]
              };
            });
          }
          return buildMp4Session(false);
        }
        function buildAndFetchIdxg(forceSlb) {
          return c.stream.getSlbInfo({forceRefresh:!!forceSlb}).then(function(slb){
            var session=c.stream.createCflSession('vod',{mediaCode:code,license:license,container:container},slb);
            return httpRequest(session.idxgRequest(),true,false).then(function(index){
              var total = null;
              try {
                var b = new Uint8Array(index), v = new DataView(index);
                if (b.length >= 32 && String.fromCharCode(b[4],b[5],b[6],b[7]) === 'idxg') {
                  var base = 13 + b[12];
                  if (base + 8 <= b.length) {
                    var sz = v.getUint32(base, false) * 4294967296 + v.getUint32(base + 4, false);
                    if (Number.isSafeInteger(sz) && sz > 0) total = sz;
                  }
                }
              } catch(_) {}
              return {
                segments:inspectIdxg(index,total),
                session:session,
                sessionOpts:{mediaCode:code,license:license,container:container},
                subtitles:w.CactusTracks?w.CactusTracks.collectSelected(meta,m,item):[]
              };
            });
          });
        }
        return buildAndFetchIdxg(false).catch(function(){
          return buildAndFetchIdxg(true);
        });
      });
    });
  }
  function keepScreenOn() {
    try {
      if (w.webapis && w.webapis.appcommon && typeof w.webapis.appcommon.setScreenSaver === 'function') {
        w.webapis.appcommon.setScreenSaver(w.webapis.appcommon.AppCommonScreenSaverState.SCREEN_SAVER_OFF, function(){}, function(){});
      }
    } catch(_) {}
    try {
      if (w.tizen && w.tizen.power && typeof w.tizen.power.request === 'function') {
        w.tizen.power.request('SCREEN', 'SCREEN_NORMAL');
      }
    } catch(_) {}
  }
  function restoreScreenSaver() {
    try {
      if (w.webapis && w.webapis.appcommon && typeof w.webapis.appcommon.setScreenSaver === 'function') {
        w.webapis.appcommon.setScreenSaver(w.webapis.appcommon.AppCommonScreenSaverState.SCREEN_SAVER_ON, function(){}, function(){});
      }
    } catch(_) {}
    try {
      if (w.tizen && w.tizen.power && typeof w.tizen.power.release === 'function') {
        w.tizen.power.release('SCREEN');
      }
    } catch(_) {}
  }
  function playlist(segments) {
    var max=1;
    segments.forEach(function(s){max=Math.max(max,Math.ceil(s.duration));});
    var lines=['#EXTM3U','#EXT-X-VERSION:3','#EXT-X-TARGETDURATION:'+max,'#EXT-X-MEDIA-SEQUENCE:0','#EXT-X-PLAYLIST-TYPE:VOD'];
    segments.forEach(function(s,i){lines.push('#EXTINF:'+s.duration.toFixed(3)+',',H+'/segment/'+i+'.ts');});
    lines.push('#EXT-X-ENDLIST');return lines.join('\n')+'\n';
  }
  // hls.js 1.5.x requires nested timing objects; v1.2 incorrectly provided
  // only the obsolete trequest/tfirst/tload fields. The playlist loader
  // later accesses stats.loading.first and can stall without visible errors.
  function perfNow(){return w.performance && typeof w.performance.now === 'function' ? w.performance.now() : Date.now();}
  function Loader(config) {
    this.config=config;this.aborted=false;this.controller=null;this.context=null;
    this.stats={aborted:false,loaded:0,total:0,retry:0,chunkCount:0,bwEstimate:0,
      loading:{start:0,first:0,end:0},parsing:{start:0,end:0},buffering:{start:0,first:0,end:0}};
  }
  Loader.prototype.destroy=function(){this.abort();};
  Loader.prototype.abort=function(){this.aborted=true;this.stats.aborted=true;if(this.controller)this.controller.abort();};
  Loader.prototype.load=function(context,config,callbacks){
    var self=this,s=current;self.aborted=false;self.context=context;
    self.stats.loading.start=perfNow();
    if(s){s.phase=context && context.type==='manifest' ? 'manifiesto HLS' :
      context && context.type==='level' ? 'lista de segmentos HLS' : 'solicitando fragmento MPEG-TS';
      if(s.status) s.status.textContent='Preparando película: '+s.phase+'…';}
    function okay(data,len) {
      if(self.aborted||!s||current!==s)return;
      self.stats.loading.first=self.stats.loading.end=perfNow();
      self.stats.loaded=self.stats.total=len;self.stats.chunkCount=1;
      if(s){s.phase=context && (context.type==='manifest'||context.type==='level')
        ? 'playlist recibida' : 'fragmento recibido ('+len+' bytes)';
        if(s.status) s.status.textContent='Preparando película: '+s.phase+'…';}
      callbacks.onSuccess({url:context.url,data:data,code:200},self.stats,context,null);
    }
    function bad(e){
      if(self.aborted||!s||current!==s)return;
      var msg=errText(e);s.error=msg;s.phase='Error de lectura multimedia';
      if(s.status)s.status.textContent='Error de video: '+msg;
      callbacks.onError({code:0,text:msg},context,null,self.stats);
    }
    if(context.url.indexOf(H+'/playlist.m3u8')===0)return okay(s&&s.playlist||'',s?s.playlist.length:0);
    var found=/\/segment\/(\d+)\.ts/.exec(context.url),number=found?Number(found[1]):-1;
    if(number<0 || !s || !s.segments[number]) return bad(Error('Fragmento de video desconocido.'));

    // Renovación preventiva de token SLB antes de expirar a los ~17 minutos
    if(s && s.session && s.session.expired && typeof s.renewSession === 'function'){
      var nowSec = Date.now() / 1000;
      if(nowSec >= s.session.expired - 150){
        s.renewSession().catch(function(){});
      }
    }

    var part=s.segments[number];
    self.controller=new AbortController();
    function fetchChunk(attempt){
      var req=s.session.mediaRequest('bytes='+part.start+'-'+part.end);
      w.fetch(req.url,{headers:req.headers,signal:self.controller.signal,redirect:'follow',cache:'no-store'})
        .then(function(r){
          if(r.status===401||r.status===403){
            if(typeof s.renewSession==='function'&&attempt<3){
              console.warn('[xe-vod-engine] CDN HTTP '+r.status+' (token expirado). Renovando sesión de inmediato...');
              return s.renewSession().then(function(){
                if(self.aborted)return;
                fetchChunk(attempt+1);
              });
            }
          }
          if(r.status!==206)throw Error('CDN HTTP '+r.status+'; se requiere Range HTTP 206.');
          return r.arrayBuffer().then(function(data){
            var clean = (w.XuperMediaUtils&&w.XuperMediaUtils.stripPngWrapper)?w.XuperMediaUtils.stripPngWrapper(data):data;
            okay(clean,clean.byteLength);
          });
        })
        .catch(function(e){
          if(self.aborted)return;
          if(attempt<3){
            var isAuth = /401|403|token|auth/i.test(e && e.message || '');
            if(isAuth && typeof s.renewSession==='function'){
              s.renewSession().then(function(){
                setTimeout(function(){if(!self.aborted)fetchChunk(attempt+1);},250);
              }).catch(function(){
                setTimeout(function(){if(!self.aborted)fetchChunk(attempt+1);},900);
              });
              return;
            }
            setTimeout(function(){if(!self.aborted)fetchChunk(attempt+1);},600);
            return;
          }
          bad(e instanceof TypeError?Error('El CDN impide consultar fragmentos desde Tizen (red/CORS).'):e);
        });
    }
    fetchChunk(0);
  };
  function stop() {
    restoreScreenSaver();
    if(w.CactusHEVC && w.CactusHEVC.stop) w.CactusHEVC.stop();
    if(w.CactusMP4 && w.CactusMP4.stop) w.CactusMP4.stop();
    if(!current)return;
    var s=current;if(w.CactusProgress)w.CactusProgress.suspend();current=null;
    if(s.stallTimer){clearInterval(s.stallTimer);s.stallTimer=null;}
    try{if(s.hls)s.hls.destroy();if(s.video._hls===s.hls)s.video._hls=null;if(s.video._captions){s.video._captions.destroy();s.video._captions=null;}}catch(_){}
    d.removeEventListener('keydown',s.onKey,false);
    try{s.video.pause();s.video.removeAttribute('src');s.video.load();}catch(_){}
    if(s.panel){s.panel.classList.remove('cactus-browser-vod');}
    if(s.status)s.status.textContent='';
    d.documentElement.classList.remove('modal-open');
  }
  function start(player,info) {
    stop();
    keepScreenOn();
    if(!w.Hls||!w.Hls.isSupported())return Promise.reject(Error('MSE/Hls.js no está disponible en este televisor.'));
    var video=d.getElementById('player-video')||d.getElementById('video'),panel=d.getElementById('screen-player')||d.getElementById('player'),title=d.getElementById('vod-infobar-title')||d.getElementById('player-title');
    if(!video||!panel)return Promise.reject(Error('No se encontró el reproductor de Cactus TV.'));
    if(title)title.textContent=info&&info.title||'Cactus TV';
    var isMini = panel.classList.contains('is-mini') || (typeof ke !== 'undefined' && ke.screen === 'detail');
    if (!isMini) {
      panel.classList.remove('is-mini');
      d.documentElement.classList.add('modal-open');
    } else {
      panel.classList.add('is-mini');
      d.documentElement.classList.remove('modal-open');
    }
    panel.classList.add('cactus-browser-vod');
    if(w.CactusTracks)w.CactusTracks.attach(video,info&&info.subtitles||player.subtitles||[],function(message){var note=d.getElementById('player-note');if(note){note.textContent=message;note.hidden=!message;}},info&&info.subtitleLanguage);
    var style=d.getElementById('cactus-vod-browser-style');
    if(!style){style=d.createElement('style');style.id='cactus-vod-browser-style';
      style.textContent='#screen-player:not(.is-mini).cactus-browser-vod #player-video,#player:not(.is-mini).cactus-browser-vod #video{display:block!important;position:absolute;top:0;left:0;width:1920px;height:1080px;z-index:5;background:#000;object-fit:contain}'+
        '#screen-player.is-mini.cactus-browser-vod #player-video{display:block!important;position:absolute;top:0;left:0;width:765px!important;height:430px!important;z-index:5;background:#000;object-fit:contain}'+
        '#screen-player.is-mini #cactus-vod-hint{display:none!important}'+
        '#player.cactus-browser-vod #player-ui{display:none!important}'+
        '#cactus-vod-hint{position:absolute;bottom:4%;left:5%;z-index:31;color:white;font:20px Arial;background:rgba(4,18,32,.85);padding:12px;border-radius:9px}';d.head.appendChild(style);}
    var hint=d.getElementById('cactus-vod-hint');
    if(!hint){hint=d.createElement('div');hint.id='cactus-vod-hint';panel.appendChild(hint);}
    hint.textContent='Preparando película… · OK: pausa · ←/→: ±10 s · Atrás: salir';
    var state={
      video:video,
      panel:panel,
      segments:player.segments,
      session:player.session,
      sessionOpts:player.sessionOpts,
      playlist:playlist(player.segments),
      hls:null,
      status:hint,
      error:'',
      phase:'iniciando Hls.js',
      onKey:null,
      _renewing:null
    };
    state.renewSession=function(){
      if(state._renewing)return state._renewing;
      console.log('[xe-vod-engine] Renovando sesión CDN/SLB para evitar corte a los 17 min...');
      state._renewing=w.CactusDirect.connect().then(function(c){
        return c.stream.getSlbInfo({forceRefresh:true}).then(function(newSlb){
          var newSession=c.stream.createCflSession('vod',state.sessionOpts,newSlb);
          state.session=newSession;
          state._renewing=null;
          console.log('[xe-vod-engine] Sesión CDN/SLB renovada con éxito. Expira:', newSession.expired);
          return newSession;
        });
      }).catch(function(err){
        state._renewing=null;
        console.warn('[xe-vod-engine] Falló renovación de sesión CDN/SLB:', err);
        throw err;
      });
      return state._renewing;
    };
    current=state;
    state.onKey=function(ev){if(current!==state)return;
      var p=d.getElementById('screen-player')||d.getElementById('player');
      if(p&&p.classList.contains('is-mini'))return;
      var k=ev.keyCode||ev.which;
      if(k===10009||k===27||k===8){return;}
      if(k===13||k===415||k===19){if(video.paused)video.play().catch(function(){});else video.pause();return;}
      if(k===37||k===39){try{video.currentTime=Math.max(0,Math.min(isFinite(video.duration)?video.duration:1e10,video.currentTime+(k===37?-10:10)));}catch(_){}return;}
    };
    d.addEventListener('keydown',state.onKey,false);
    return new Promise(function(resolve,reject){
      var finished=false,timeout=setTimeout(function(){fail(Error('El video no inició en 25 segundos. Última etapa: '+state.phase+'. '+(state.error||'')));},25000);
      function fail(e){if(finished)return;finished=true;clearTimeout(timeout);stop();reject(reported(e));}
      function success(){
        if(finished)return;
        if(w.CactusProgress)w.CactusProgress.ready();
        finished=true;clearTimeout(timeout);
        hint.textContent='OK: pausa · ←/→: ±10 s · Atrás: salir';
        setTimeout(function(){if(hint&&hint.parentNode)hint.parentNode.removeChild(hint);},4000);
        var lastHlsCt=-1,hlsStallTicks=0;
        state.stallTimer=setInterval(function(){
          if(current!==state)return;
          if(video.paused||video.seeking){lastHlsCt=video.currentTime;hlsStallTicks=0;return;}
          var ct=video.currentTime||0;
          if(Math.abs(ct-lastHlsCt)<0.05){
            hlsStallTicks++;
            if(hlsStallTicks>=3){
              var jumped=false;
              try{
                for(var bi=0;bi<video.buffered.length;bi++){
                  var bs=video.buffered.start(bi);
                  if(bs>ct&&bs<=ct+3.5){
                    video.currentTime=bs+0.05;
                    video.play().catch(function(){});
                    jumped=true;hlsStallTicks=0;break;
                  }
                }
              }catch(_){}
              if(!jumped&&hlsStallTicks>=4){
                hlsStallTicks=0;
                try{hls.startLoad(ct);}catch(_){}
              }
            }
          }else{
            lastHlsCt=ct;hlsStallTicks=0;
          }
        },2000);
        resolve(true);
      }
      var hls=new w.Hls({loader:Loader,startPosition:info&&Number(info.resume)>0?Number(info.resume):-1,backBufferLength:60,maxBufferLength:30,maxMaxBufferLength:60,enableWorker:false,lowLatencyMode:false});
      state.hls=hls;video._hls=hls;
      if(w.Hls.Events.AUDIO_TRACKS_UPDATED)hls.on(w.Hls.Events.AUDIO_TRACKS_UPDATED,function(){
        var choice=w.CactusTracks?w.CactusTracks.preferredIndex(hls.audioTracks||[],info&&info.audioLanguage):-1;if(choice>=0)hls.audioTrack=choice;
      });
      hls.on(w.Hls.Events.ERROR,function(ev,e){
        state.phase='error Hls.js: '+(e&&e.details||e&&e.type||'no especificado');
        if(e&&e.error&&e.error.message)state.error=String(e.error.message).slice(0,130);
        if(e&&e.fatal){
          switch(e.type){
            case w.Hls.ErrorTypes.NETWORK_ERROR:
              try{hls.startLoad();}catch(_){}
              break;
            case w.Hls.ErrorTypes.MEDIA_ERROR:
              try{hls.recoverMediaError();}catch(_){}
              break;
            default:
              fail(Error(state.error||state.phase));
              break;
          }
        }
      });
      hls.on(w.Hls.Events.MANIFEST_LOADING,function(){state.phase='cargando manifiesto';});
      hls.on(w.Hls.Events.MANIFEST_PARSED,function(){state.phase='manifiesto procesado; iniciando video';});
      hls.on(w.Hls.Events.FRAG_LOADING,function(){state.phase='solicitando primer fragmento';});
      hls.on(w.Hls.Events.FRAG_LOADED,function(){state.phase='fragmento recibido por Hls.js';});
      hls.on(w.Hls.Events.FRAG_PARSED,function(){state.phase='fragmento MPEG-TS interpretado';});
      hls.on(w.Hls.Events.FRAG_BUFFERED,function(){state.phase='primer fragmento incorporado a MSE';});
      video.addEventListener('playing',success,{once:true});
      video.addEventListener('error',function(){if(!finished)fail(Error('El decodificador de la TV rechazó el video (HTMLMediaElement error).'));},{once:true});
      video.addEventListener('ended',function(){
        if(w.CactusPlaybackActions&&typeof w.CactusPlaybackActions.completed==='function'){
          try{w.CactusPlaybackActions.completed();}catch(_){}
        }
      });
      video.addEventListener('timeupdate',function(){
        if(w.__xuperUpdateProgress){
          try{w.__xuperUpdateProgress(video.currentTime,video.duration);}catch(e){}
        }
      });
      hls.on(w.Hls.Events.MEDIA_ATTACHED,function(){hls.loadSource(H+'/playlist.m3u8');});
      hls.attachMedia(video);
      hls.on(w.Hls.Events.MANIFEST_PARSED,function(){
        var resumeSec=Number(info&&(info.startTime||info.resume)||player&&(player.startTime||player.resume)||0);
        if(resumeSec>2&&Math.abs(video.currentTime-resumeSec)>3){try{video.currentTime=resumeSec;}catch(e){}}
        video.play().catch(function(e){fail(e);});
      });
    });
  }
  w.CactusVODBrowser={
    start:function(player,info){
      if(player && player.container==='mp4' && w.CactusMP4){
        stop();
        keepScreenOn();
        return w.CactusMP4.start(player,info);
      }
      return w.CactusHEVC ? w.CactusHEVC.start(player,info,start) : start(player,info);
    },
    stop:stop,
    isActive:function(){return !!current || (!!w.CactusMP4 && w.CactusMP4.isActive());},
    idxg:inspectIdxg,
    version:'1.2.4'
  };
  // Replace only play: preserve all other catalog requests, favorites and sessions.
  w.CactusDirect.http=function(method,args){
    if(method!=='play')return oldHttp(method,args);
    args=Array.isArray(args)?args:[];
    var item=args[0];
    if(!item || (item.liveAddressList&&item.liveAddressList.length))return oldHttp(method,args);
    return prepare(item).then(function(data){
      return {ok:true,json:function(){return Promise.resolve({data:{engine:'cactus-vod-ts',kind:'vod',container:data.container||'ts',url:'',segments:data.segments,session:data.session,sessionOpts:data.sessionOpts,subtitles:data.subtitles}});}};
    },function(e){return {ok:false,json:function(){return Promise.resolve({error:errText(e).slice(0,240)});}};});
  };
})(window,document);
