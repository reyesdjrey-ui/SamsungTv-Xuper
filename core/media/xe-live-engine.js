/* Xuper Eclectic Live Transport Engine v2.0.25 */
(function(w,d){'use strict';
  if(w.HTMLMediaElement && !w.__hookedMedia){
    w.__hookedMedia = true;
    var origLoad = HTMLMediaElement.prototype.load;
    HTMLMediaElement.prototype.load = function(){
      var stack = (new Error().stack || '').replace(/\n/g, ' -> ').slice(0, 120);
      if(w.__trace) w.__trace.push('MLOAD:' + stack);
      return origLoad.apply(this, arguments);
    };
    try {
      var srcDesc = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, 'src');
      if (srcDesc && srcDesc.set) {
        var origSetSrc = srcDesc.set;
        Object.defineProperty(HTMLMediaElement.prototype, 'src', {
          set: function(val) {
            var stack = (new Error().stack || '').replace(/\n/g, ' -> ').slice(0, 140);
            if(w.__trace) w.__trace.push('SET_SRC(' + String(val).slice(0, 20) + '):' + stack);
            return origSetSrc.call(this, val);
          }
        });
      }
    } catch(_) {}
    var origRMA = HTMLMediaElement.prototype.removeAttribute;
    HTMLMediaElement.prototype.removeAttribute = function(attr) {
      if (attr === 'src') {
        var stack = (new Error().stack || '').replace(/\n/g, ' -> ').slice(0, 140);
        if(w.__trace) w.__trace.push('RM_SRC:' + stack);
      }
      return origRMA.apply(this, arguments);
    };
    if (w.MediaSource) {
      var origEOS = MediaSource.prototype.endOfStream;
      MediaSource.prototype.endOfStream = function(err){
        var stack = (new Error().stack || '').replace(/\n/g, ' -> ').slice(0, 120);
        if(w.__trace) w.__trace.push('EOS:' + err + ' @ ' + stack);
        return origEOS.apply(this, arguments);
      };
      var origAddSB = MediaSource.prototype.addSourceBuffer;
      MediaSource.prototype.addSourceBuffer = function(type) {
        if(w.__trace) w.__trace.push('addSB:' + type);
        if(type && String(type).indexOf('audio') === 0 && w.__xeActiveAudioBridge && typeof w.__xeActiveAudioBridge.createSourceBuffer === 'function'){
          var vSb = w.__xeActiveAudioBridge.createSourceBuffer(type);
          if(vSb) return vSb;
        }
        var sb = origAddSB.call(this, type);
        sb.__type = type;
        sb.addEventListener('error', function(e) {
          if(w.__trace) w.__trace.push('SB_ERR(' + sb.__type + ')');
        });
        var origApp = sb.appendBuffer;
        sb.appendBuffer = function(buf) {
          if(w.__trace) w.__trace.push('appB(' + sb.__type.slice(0,5) + ',' + (buf?buf.byteLength:0) + ')');
          return origApp.call(this, buf);
        };
        return sb;
      };
    }
  }
  var direct=w.CactusDirect, av=w.CactusAVPlay;
  if(!direct || !av || !direct.connect) return;
  var oldHttp=direct.http, oldStart=av.start, oldStop=av.stop;
  var MEDIA='https://cactus-live.invalid', playing=null, pending=null, ticket=0, statusId='cactus-live-status';
  var MS=w.MediaSource||w.WebKitMediaSource;
  function errorMessage(e){return String(e&&e.message||e||'Error de TV en vivo').slice(0,240);}
  function isLive(i){return !!(i&&Array.isArray(i.liveAddressList)&&i.liveAddressList.length);}
  function request(req,type,signal,maxRetries,timeoutMs){
    if(!req||!/^https?:\/\//i.test(req.url||''))return Promise.reject(Error('El proveedor no devolvió una dirección multimedia válida.'));
    var retries=typeof maxRetries==='number'?maxRetries:3,attempt=0,notFoundAttempt=0,reqTimeout=timeoutMs||9000;
    function exec(){
      if(signal&&signal.aborted){var ae=new Error('AbortError');ae.name='AbortError';return Promise.reject(ae);}
      var ctrl=(typeof AbortController==='function')?new AbortController():null;
      var timedOut=false,timer=null,onParentAbort=null;
      if(ctrl){
        timer=setTimeout(function(){timedOut=true;try{ctrl.abort();}catch(_){}},reqTimeout);
        if(signal&&typeof signal.addEventListener==='function'){
          onParentAbort=function(){try{ctrl.abort();}catch(_){}};
          signal.addEventListener('abort',onParentAbort,{once:true});
        }
      }
      function cleanupSignal(){
        if(timer){clearTimeout(timer);timer=null;}
        if(onParentAbort&&signal&&typeof signal.removeEventListener==='function'){
          try{signal.removeEventListener('abort',onParentAbort);}catch(_){}
          onParentAbort=null;
        }
      }
      return fetch(req.url,{method:'GET',headers:req.headers||{},signal:ctrl?ctrl.signal:(signal||undefined),cache:'no-store',redirect:'follow'}).then(function(r){
        cleanupSignal();
        if(!r.ok){
          if((r.status===404||r.status===409)&&notFoundAttempt<Math.min(4,retries)){
            var nfDelay=160+notFoundAttempt*80;
            notFoundAttempt++;
            return new Promise(function(resolve){setTimeout(resolve,nfDelay);}).then(exec);
          }
          if(attempt<retries&&(r.status>=500||r.status===429)){
            attempt++;
            var delay=Math.min(1000,Math.round(200*Math.pow(1.5,attempt)));
            return new Promise(function(resolve){setTimeout(resolve,delay);}).then(exec);
          }
          var he=Error('El servidor multimedia rechazó la solicitud (HTTP '+r.status+').');
          he.httpStatus=r.status;
          throw he;
        }
        return type==='arraybuffer'?r.arrayBuffer():r.text();
      }).catch(function(e){
        cleanupSignal();
        if(e&&typeof e.httpStatus==='number')throw e;
        if(e&&e.name==='AbortError'&&!(timedOut&&!(signal&&signal.aborted)))throw e;
        if(attempt<retries){
          attempt++;
          var delay=Math.min(1000,Math.round(200*Math.pow(1.5,attempt)));
          return new Promise(function(resolve){setTimeout(resolve,delay);}).then(exec);
        }
        if(timedOut)throw Error('Tiempo de espera agotado al descargar segmento en vivo.');
        if(e instanceof TypeError)throw Error('Tizen no puede acceder al servidor multimedia: red, HTTP o permisos CORS del proveedor.');
        throw e;
      });
    }
    return exec();
  }
  function resolveUrl(ref,base){
    ref=String(ref||'').trim();
    if(/^https?:\/\//i.test(ref))return ref;
    try{var u=new URL(ref,base);if(/^https?:$/.test(u.protocol))return u.href;}catch(_){}
    var m=/^(https?:\/\/[^\/]+)(\/[^?#]*)?/.exec(String(base||''));
    if(!m)throw Error('Manifest HLS con URL de segmento inválida.');
    var origin=m[1],path=m[2]||'/';
    if(ref.charAt(0)==='/')return origin+ref;
    var dir=path.slice(0,path.lastIndexOf('/')+1);
    return origin+dir+ref;
  }
  function resetSegmentState(s){
    s.segCache=Object.create(null);
    s.segOrder=[];
    s.segFail=Object.create(null);
    s.lastM3uSeq=null;
    s.originJumpCount=0;
    s.consecSegFail=0;
    s.consecManFail=0;
  }
  function tryRotateCdnHost(s,reason){
    if(!s||!s.session||typeof s.session.rotateHost!=='function')return false;
    var maxRot=Math.max(2,((s.session.hostCount)||1)*2);
    if((s._rotCount||0)>=maxRot)return false;
    if(!s.session.rotateHost())return false;
    s._rotCount=(s._rotCount||0)+1;
    resetSegmentState(s);
    console.warn('[LiveTV] Rotando CDN ('+(reason||'fallo')+' #'+s._rotCount+') ->',s.session.host);
    if(s.tr)s.tr('rotateHost:'+(reason||'')+'->'+s.session.host);
    return true;
  }
  function prefetchLiveSegments(s,startSeq,count){
    if(!s||s.stopped||!s.map||!s.session||!s.abort)return;
    var targetCount=count||4,current=startSeq||0,queued=0,now=Date.now();
    var keys=Object.keys(s.map||{}).map(Number).sort(function(a,b){return a-b;});
    s.segCache=s.segCache||Object.create(null);
    s.segOrder=s.segOrder||[];
    s.segFail=s.segFail||Object.create(null);
    for(var i=0;i<keys.length;i++){
      var seq=keys[i];
      if(seq>=current&&!s.segCache[seq]){
        var candUrl=s.map&&s.map[seq];
        if(!candUrl)continue;
        if(s.segFail[candUrl]&&(now-s.segFail[candUrl])<6000)continue;
        (function(seqNo,url){
          var cacheRef=s.segCache,failRef=s.segFail;
          var p=request(s.session.segmentRequest(url),'arraybuffer',s.abort.signal,0).then(function(buf){
            if(failRef)delete failRef[url];
            if(cacheRef)cacheRef[seqNo]=buf;
            return buf;
          });
          p.catch(function(){
            if(failRef)failRef[url]=Date.now();
            if(cacheRef&&cacheRef[seqNo]===p)delete cacheRef[seqNo];
          });
          s.segCache[seqNo]=p;
          s.segOrder.push(seqNo);
        })(seq,candUrl);
        queued++;
        if(queued>=targetCount)break;
      }
    }
    while(s.segOrder&&s.segOrder.length>24){
      var oldest=s.segOrder.shift();
      if(s.segCache&&oldest<current-2){delete s.segCache[oldest];}
    }
  }
  function mediaManifest(s,txt,base,allowJump){
    if(/#EXT-X-KEY\s*:/i.test(txt)||/#EXT-X-SESSION-KEY\s*:/i.test(txt))throw Error('Esta transmisión declara cifrado: se requiere el reproductor o licencia compatible del proveedor.');
    if(/#EXT-X-MAP\s*:/i.test(txt))throw Error('Este canal utiliza un formato fMP4 que requiere otro perfil de HLS.');
    var lines=txt.replace(/\r/g,'').split('\n'), master=null, rawChunks=[], duration=4, headDur=4, live=true, disc=false, m3uSeq=null;
    for(var j=0;j<lines.length;j++){
      var line=lines[j].trim();if(!line)continue;
      if(line.indexOf('#EXT-X-STREAM-INF:')===0){for(var k=j+1;k<lines.length;k++)if(lines[k].trim()&&!/^#/.test(lines[k].trim())){master=resolveUrl(lines[k].trim(),base);break;}break;}
      if(line.indexOf('#EXT-X-TARGETDURATION:')===0)headDur=Math.max(2,Number(line.split(':')[1])||4);
      else if(line.indexOf('#EXT-X-MEDIA-SEQUENCE:')===0){var parsedSeq=Number(line.split(':')[1]);if(!isNaN(parsedSeq))m3uSeq=parsedSeq;}
      else if(line.indexOf('#EXTINF:')===0)duration=Math.max(.2,Number(line.substring(8).split(',')[0])||4);
      else if(line==='#EXT-X-ENDLIST')live=false;
      else if(line==='#EXT-X-DISCONTINUITY')disc=true;
      else if(line.indexOf('#EXT-X-BYTERANGE')===0)throw Error('Los segmentos BYTERANGE aún no son compatibles con TV en vivo.');
      else if(line.charAt(0)!=='#'){
        rawChunks.push({uri:resolveUrl(line,base),duration:duration,discontinuity:disc});
        disc=false;duration=headDur;
      }
    }
    if(master)return {variant:master};
    if(!/^#EXTM3U/.test(txt)||!rawChunks.length)throw Error('El CDN no devolvió una lista HLS válida de segmentos.');

    // Asignación de secuencias estrictamente monotónicas e inmunes a saltos de CDN
    s.uriToSeq = s.uriToSeq || Object.create(null);
    var knownIdx = -1;
    for (var m = 0; m < rawChunks.length; m++) {
      if (typeof s.uriToSeq[rawChunks[m].uri] === 'number') {
        knownIdx = m;
        break;
      }
    }
    if (knownIdx === -1 && !allowJump && typeof s.lastM3uSeq === 'number' && typeof m3uSeq === 'number' && Math.abs(m3uSeq - s.lastM3uSeq) > 25) {
      return {originJump:true,m3uSeq:m3uSeq,prevM3uSeq:s.lastM3uSeq,target:headDur,live:live,chunks:[]};
    }
    s.originJumpCount=0;
    if (typeof m3uSeq === 'number') s.lastM3uSeq = m3uSeq;
    if (knownIdx !== -1) {
      var baseSeq = s.uriToSeq[rawChunks[knownIdx].uri];
      for (var b = knownIdx; b >= 0; b--) {
        var prevSeq = baseSeq - (knownIdx - b);
        s.uriToSeq[rawChunks[b].uri] = prevSeq;
        rawChunks[b].seq = prevSeq;
      }
      for (var f = knownIdx + 1; f < rawChunks.length; f++) {
        var nextSeqVal = baseSeq + (f - knownIdx);
        s.uriToSeq[rawChunks[f].uri] = nextSeqVal;
        rawChunks[f].seq = nextSeqVal;
        if (typeof s.nextSeq !== 'number' || nextSeqVal >= s.nextSeq) s.nextSeq = nextSeqVal + 1;
      }
    } else {
      if (typeof s.nextSeq !== 'number') s.nextSeq = 1000;
      for (var n = 0; n < rawChunks.length; n++) {
        var freshSeq = s.nextSeq++;
        s.uriToSeq[rawChunks[n].uri] = freshSeq;
        rawChunks[n].seq = freshSeq;
      }
    }
    var chunks = rawChunks;
    var sequence = chunks[0].seq;
    var output=['#EXTM3U','#EXT-X-VERSION:3','#EXT-X-TARGETDURATION:'+Math.ceil(headDur),'#EXT-X-MEDIA-SEQUENCE:'+sequence];
    for(var i=0;i<chunks.length;i++){
      var chunk=chunks[i];s.map[chunk.seq]=chunk.uri;
      if(chunk.discontinuity)output.push('#EXT-X-DISCONTINUITY');
      output.push('#EXTINF:'+chunk.duration.toFixed(3)+',');output.push(MEDIA+'/seg/'+chunk.seq+'.ts');
    }
    if(!live)output.push('#EXT-X-ENDLIST');
    // Don't keep thousands of obsolete segment URLs in TV memory.
    var keys=Object.keys(s.map);if(keys.length>320){keys.sort(function(a,b){return Number(a)-Number(b)});for(var z=0;z<keys.length-260;z++)delete s.map[keys[z]];}
    var uKeys=Object.keys(s.uriToSeq);if(uKeys.length>250){for(var u=0;u<uKeys.length-150;u++)delete s.uriToSeq[uKeys[u]];}
    if(chunks.length>0){prefetchLiveSegments(s,chunks[0].seq,2);}
    return {playlist:output.join('\n')+'\n',chunks:chunks,target:headDur,live:live};
  }
  function refresh(s,opt){
    opt=opt||{};
    var req=s.session.manifestRequest();return request(req,'text',s.abort.signal,4).then(function(text){
      s.consecManFail=0;
      if(s.tr)s.tr('M3U8:' + text.slice(0, 150).replace(/\r?\n/g, ' '));
      function finishManifest(rawTxt,baseUrl){
        var data=mediaManifest(s,rawTxt,baseUrl,Boolean(opt.allowJump));
        if(data.originJump){
          s.originJumpCount=(s.originJumpCount||0)+1;
          console.warn('[LiveTV] Salto de origen en playlist ('+data.prevM3uSeq+' -> '+data.m3uSeq+'), intento '+s.originJumpCount);
          if(s.tr)s.tr('originJump:'+data.prevM3uSeq+'->'+data.m3uSeq);
          if(!opt.jumpRetry){
            return new Promise(function(resolve){setTimeout(resolve,350);}).then(function(){
              return refresh(s,{jumpRetry:1,hostRotated:opt.hostRotated});
            });
          }
          return mediaManifest(s,rawTxt,baseUrl,true);
        }
        return data;
      }
      var data=mediaManifest(s,text,req.url,Boolean(opt.allowJump));
      if(data.originJump){return finishManifest(text,req.url);}
      if(data.variant){
        var v=data.variant;
        // Provider authorizes both the main manifest and its official variant URI.
        return request(s.session.segmentRequest(v),'text',s.abort.signal,4).then(function(t){
          if(s.tr)s.tr('VM3U8:' + t.slice(0, 150).replace(/\r?\n/g, ' '));
          var p=finishManifest(t,v);if(p&&p.variant)throw Error('Manifest HLS anidado no compatible.');
          return p;
        });
      }return data;
    }).catch(function(err){
      if(err&&err.name==='AbortError')throw err;
      s.consecManFail=(s.consecManFail||0)+1;
      if(!opt.hostRotated&&s.consecManFail>=1&&tryRotateCdnHost(s,'man-'+(err&&err.httpStatus||'err'))){
        return refresh(s,{hostRotated:true,allowJump:true});
      }
      throw err;
    });
  }
  function getSegment(s,n){
    var url=s.map[n];if(!url)return Promise.reject(Error('El fragmento '+n+' ya salió de la ventana de emisión.'));
    prefetchLiveSegments(s,n+1,4);
    if(s.segCache&&s.segCache[n]){
      var c=s.segCache[n];
      if(c instanceof ArrayBuffer)return Promise.resolve(c);
      if(c&&typeof c.then==='function')return c;
    }
    s.segFail=s.segFail||Object.create(null);
    var prom=request(s.session.segmentRequest(url),'arraybuffer',s.abort.signal,4).catch(function(err){
      if(err&&err.name==='AbortError')throw err;
      if(/401|403|token/i.test(err && err.message || '')){
        return refreshWithSelfHeal(s).then(function(){
          return request(s.session.segmentRequest(s.map[n]||url),'arraybuffer',s.abort.signal,3);
        });
      }
      s.segFail[url]=Date.now();
      s.consecSegFail=(s.consecSegFail||0)+1;
      if(s.consecSegFail>=3&&tryRotateCdnHost(s,'seg-'+(err&&err.httpStatus||'err'))){
        err.cdnRotated=true;
      }
      throw err;
    }).then(function(buf){
      s.consecSegFail=0;
      s._rotCount=0;
      if(s.segFail)delete s.segFail[url];
      return (w.XuperMediaUtils&&w.XuperMediaUtils.stripPngWrapper)?w.XuperMediaUtils.stripPngWrapper(buf):buf;
    });
    s.segCache=s.segCache||Object.create(null);
    s.segOrder=s.segOrder||[];
    s.segCache[n]=prom;
    if(s.segOrder.indexOf(n)===-1)s.segOrder.push(n);
    return prom;
  }
  function stats(){return{aborted:false,loaded:0,total:0,retry:0,chunkCount:0,bwEstimate:0,
    loading:{start:0,first:0,end:0},parsing:{start:0,end:0},buffering:{start:0,first:0,end:0}};}
  function now(){return w.performance&&w.performance.now?w.performance.now():Date.now();}
  function LiveLoader(){this.stats=stats();this.aborted=false;this.controller=null;}
  LiveLoader.prototype.destroy=function(){this.abort();};
  LiveLoader.prototype.abort=function(){this.aborted=true;if(this.controller)try{this.controller.abort();}catch(_){}};
  LiveLoader.prototype.load=function(context,cfg,cb){
    var self=this,s=playing,url=String(context.url||''),seq=/\/seg\/(\d+)\.ts/.exec(url);
    self.aborted=false;
    self.controller=(typeof AbortController==='function')?new AbortController():null;
    self.stats.loading.start=now();
    if(!s||url.indexOf(MEDIA)!==0){cb.onError({code:0,text:'URL HLS no controlada por Cactus Live'},context,null,self.stats);return;}
    var task=seq?getSegment(s,Number(seq[1])):refresh(s).then(function(x){return x.playlist;});
    task.then(function(data){if(self.aborted||playing!==s)return;
      self.stats.loading.first=self.stats.loading.end=now();self.stats.loaded=self.stats.total=typeof data==='string'?data.length:data.byteLength;
      self.stats.chunkCount=1;cb.onSuccess({url:url,data:data,code:200},self.stats,context,null);
    }).catch(function(e){if(self.aborted||playing!==s)return;
      s.phase=errorMessage(e);cb.onError({code:0,text:s.phase},context,null,self.stats);
    });
  };
  function queueSB(sb,op){
    if(!sb)return Promise.resolve();
    if(!sb._queue)sb._queue=Promise.resolve();
    sb._queue=sb._queue.then(function(){
      return new Promise(function(resolve){
        if(!sb.updating){
          doOp();
        }else{
          var onWait=function(){sb.removeEventListener('updateend',onWait);doOp();};
          sb.addEventListener('updateend',onWait);
        }
        function doOp(){
          var timer=setTimeout(function(){
            sb.removeEventListener('updateend',done);
            sb.removeEventListener('error',bad);
            resolve({timeout:true});
          },8000);
          function done(){
            clearTimeout(timer);
            sb.removeEventListener('updateend',done);
            sb.removeEventListener('error',bad);
            resolve({ok:true});
          }
          function bad(ev){
            clearTimeout(timer);
            sb.removeEventListener('updateend',done);
            sb.removeEventListener('error',bad);
            resolve({error:ev||'SB_ERR'});
          }
          sb.addEventListener('updateend',done);
          sb.addEventListener('error',bad);
          try{op();}catch(e){clearTimeout(timer);sb.removeEventListener('updateend',done);sb.removeEventListener('error',bad);resolve({error:e});}
        }
      });
    });
    return sb._queue;
  }
  function removeRange(sb,from,to){
    if(!sb||to<=from)return Promise.resolve();
    return queueSB(sb,function(){
      try{sb.remove(from,to);}catch(_){}
    });
  }
  function append(sb,data,curTime){
    if(!sb||!data)return Promise.resolve();
    return queueSB(sb,function(){sb.appendBuffer(data);}).then(function(res){
      if(res&&res.error){
        var e=res.error;
        var isQuota=(e&&(e.name==='QuotaExceededError'||e.code===22||/quota/i.test(e.message||'')));
        if(isQuota&&sb.buffered&&sb.buffered.length){
          var cut=Math.max(0,(curTime||sb.buffered.end(sb.buffered.length-1))-5);
          if(cut>sb.buffered.start(0)+0.5){
            return removeRange(sb,sb.buffered.start(0),cut).then(function(){
              return queueSB(sb,function(){sb.appendBuffer(data);});
            });
          }
        }
      }
    });
  }
  function trim(sb,time){
    if(!sb||!sb.buffered||!sb.buffered.length||time<20)return Promise.resolve();
    var cutoff=time-14;
    var removals=[];
    try{
      for(var i=0;i<sb.buffered.length;i++){
        var b0=sb.buffered.start(i),b1=sb.buffered.end(i);
        if(b1<=cutoff){
          removals.push([b0,b1]);
        }else if(b0<cutoff-2){
          removals.push([b0,Math.min(cutoff,b1-0.5)]);
        }
      }
    }catch(_){}
    if(!removals.length)return Promise.resolve();
    var chain=Promise.resolve();
    for(var r=0;r<removals.length;r++){
      (function(rng){
        chain=chain.then(function(){return removeRange(sb,rng[0],rng[1]);});
      })(removals[r]);
    }
    return chain;
  }
  function note(s,msg){s.phase=msg;if(!s.logs)s.logs=[];s.logs.push(msg);if(s.logs.length>10)s.logs.shift();var e=d.getElementById(statusId);if(e&&!e.hidden)e.textContent=msg;}
  function render(s,title){
    var p=d.getElementById('screen-player')||d.getElementById('player'),video=d.getElementById('player-video')||d.getElementById('video');
    if(!p||!video)throw Error('No se encontró el reproductor del Samsung.');
    p.hidden=false;p.classList.remove('is-mini');p.classList.add('cactus-live-15');p.classList.add('is-active');p.classList.remove('idle');
    var spinner=d.getElementById('vspin');if(spinner)spinner.hidden=true;
    d.documentElement.classList.add('modal-open');s.panel=p;s.video=video;
    video.tabIndex=-1;try{video.blur();}catch(_){}
    var t=d.getElementById('player-title');if(t)t.textContent=title||'TV en vivo';
    if(!d.getElementById('cactus-live-15-style')){
      var style=d.createElement('style');style.id='cactus-live-15-style';
      style.textContent='#screen-player.cactus-live-15 #player-video,#player.cactus-live-15 #video{display:block!important;position:absolute!important;top:0!important;left:0!important;width:100%!important;height:100%!important;object-fit:contain;background:#000;z-index:5!important}'+
       '#screen-player.cactus-live-15 .player-frame{display:none!important}'+
       '#player.cactus-live-15 #player-ui{display:none!important}'+
       '#cactus-live-status{position:absolute;bottom:40px;left:40px;z-index:30!important;color:#fff;font:bold 24px Arial,sans-serif;background:rgba(0,0,0,0.85);padding:12px 24px;border-radius:8px;border:2px solid #00e676;pointer-events:none}';
      d.head.appendChild(style);
    }
    var label=d.getElementById(statusId);if(!label){label=d.createElement('div');label.id=statusId;p.appendChild(label);}
    label.hidden=false;label.textContent='Sintonizando TV en vivo…';
    s.label=label;
    s.key=function(e){if(playing!==s)return;var k=e.keyCode||e.which;
      if(typeof ke!=='undefined'&&ke.channelsOpen)return;
      if(k===415||k===19){e.preventDefault();e.stopImmediatePropagation();
        if(s.video.paused)s.video.play().catch(function(){});else s.video.pause();}
    };
    d.addEventListener('keydown',s.key,true);
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
  function stop(){
    restoreScreenSaver();
    var s=playing;playing=null;pending=null;ticket++;
    if(!s)return;
    if(s.audioBridge){try{s.audioBridge.destroy();}catch(_){} s.audioBridge=null;}
    if(w.__xeActiveAudioBridge && (!s || w.__xeActiveAudioBridge.session === s)){w.__xeActiveAudioBridge=null;}
    if(s.statTimer)try{clearInterval(s.statTimer);}catch(_){}
    s.stopped=true;if(s.abort)try{s.abort.abort();}catch(_){ }
    if(s.key)d.removeEventListener('keydown',s.key,true);
    if(s.hls)try{s.hls.destroy();}catch(_){ }
    if(s.video){try{s.video.pause();s.video.removeAttribute('src');}catch(_){ }}
    if(s.url)try{URL.revokeObjectURL(s.url);}catch(_){ }
    if(s.segCache){s.segCache=null;s.segOrder=null;}
    if(s.uriToSeq){s.uriToSeq=null;}
    if(s.label)s.label.hidden=true;
    if(s.panel){s.panel.classList.remove('cactus-live-15');}
    d.documentElement.classList.remove('modal-open');
  }
  // Re-sintoniza el canal cuando el decodificador se queda clavado (sin avanzar)
  // o cuando el búfer se agota sin poder descargar nuevos segmentos.
  var recoverGate=0;
  function recoverLive(s){
    if(!s||s.stopped||playing!==s)return;
    var item=s.rawItem;
    if(!item)return;
    var now=Date.now();
    if(now-recoverGate<8000)return;
    recoverGate=now;
    var title=s.title;
    console.warn('[LiveTV] Señal congelada detectada, re-sintonizando canal…');
    note(s,'Señal congelada, re-sintonizando…');
    if(s.video){try{s.video.pause();s.video.removeAttribute('src');s.video.load();}catch(_){}}
    stop();
    prepare(item,true).then(function(info){
      start(info,{title:title});
    }).catch(function(e){
      console.warn('[LiveTV] Re-sintonización falló:', errorMessage(e));
      if(w.__onStreamError)w.__onStreamError('Canal no disponible temporalmente');
    });
  }
  function waitPlaying(s,start){return new Promise(function(resolve,reject){
    var finished=false,timer=setTimeout(function(){bad(Error('Tiempo de espera agotado'));},25000);
    w.__trace = [];
    function tr(msg){
      if(!w.__trace)w.__trace=[];
      w.__trace.push(Math.round(performance.now())+' '+msg);
      if(w.__trace.length>15)w.__trace.shift();
    }
    s.tr = tr;
    function clear(keepErr){clearTimeout(timer);if(s.video){s.video.removeEventListener('playing',good);if(!keepErr)s.video.removeEventListener('error',badEvent);}}
    function good(){
      if(finished)return;finished=true;clear(true);
      s.hasStartedPlaying=true;
      note(s,'● EN VIVO');
      if(w.__onStreamPlaying)w.__onStreamPlaying();
      if(s.statTimer)clearInterval(s.statTimer);
      s.statTimer=setInterval(function(){
        if(playing!==s||!s.video||!s.label)return;
        var ct=s.video.currentTime||0;
        var vw=s.video.videoWidth||0, vh=s.video.videoHeight||0;
        var b=s.video.buffered;
        var bufLen=b&&b.length?(b.end(b.length-1)-ct).toFixed(1):'0';
        s.label.hidden=false;
        s.label.textContent='● EN VIVO '+(s.title||'')+' | '+vw+'x'+vh+' | '+ct.toFixed(1)+'s (buf +'+bufLen+'s)';
        // Detección de congelamiento: reproduciendo pero currentTime no avanza.
        // Cubre tanto decodificador clavado con búfer como búfer agotado sin descarga.
        if(!s.video.paused && !s.video.seeking && ct>0){
          var hasAhead = !!(b && b.length && (b.end(b.length-1)-ct)>0.5);
          if(typeof s._lastCt==='number' && ct<=s._lastCt+0.05){
            if(hasAhead){
              s._starveTicks=0;
              s._stallTicks=(s._stallTicks||0)+1;
              if(s._stallTicks===2 || s._stallTicks===5){
                try{
                  var jumped=false;
                  for(var ri=0;ri<b.length;ri++){
                    if(b.start(ri)>ct+0.05 && b.start(ri)<=ct+10){
                      s.video.currentTime=b.start(ri)+0.05;
                      jumped=true;
                      break;
                    }
                  }
                  if(!jumped){
                    var target=Math.min(b.end(b.length-1)-0.1, ct+0.12);
                    if(target>ct+0.02)s.video.currentTime=target;
                  }
                  if(s.video.paused)s.video.play().catch(function(){});
                }catch(_){}
              }else if(s._stallTicks>=10){
                s._stallTicks=0; recoverLive(s);
              }
            }else{
              s._stallTicks=0;
              s._starveTicks=(s._starveTicks||0)+1;
              if(s._starveTicks>=16){
                s._starveTicks=0; recoverLive(s);
              }
            }
          }else{
            s._stallTicks=0; s._starveTicks=0; s._lastCt=ct;
          }
        }else{
          s._stallTicks=0; s._starveTicks=0;
        }
      },500);
      resolve();
    }
    function badEvent(ev){
      if(!playing||playing!==s||s.stopped)return;
      var ve = s.video && s.video.error;
      if(!s.video || !s.video.currentSrc || (ve && ve.code === 4 && (!s.video.src || s.video.src === ''))) return;
      var c = ve ? ve.code : 0;
      var m = ve ? (ve.message || '') : '';
      if(s.onMuxedFallback && (c === 4 || c === 3)){
        finished=true;clear(false);
        var mxFn = s.onMuxedFallback; s.onMuxedFallback = null;
        console.warn('[LiveTV] Single-muxed MSE rechazado (err '+c+'), intentando WebAudio fallback');
        mxFn().then(resolve,reject);
        return;
      }
      if(s.onAudioFallback && s.hasAudio && !s.noAudio){
        finished=true;clear(false);
        s.noAudio=true;w.__mseNoAudio=true;
        console.warn('[LiveTV] Audio MSE rechazado (err '+c+'), reintentando en modo solo-video');
        s.onAudioFallback().then(resolve,reject);
        return;
      }
      if((c === 4 || c === 3) && s._triggerDualFallback && s._triggerDualFallback()){
        return;
      }
      if(finished){
        console.warn('[LiveTV] Error de video tras inicio (err '+c+': '+m+'), re-sintonizando…');
        recoverLive(s);
        return;
      }
      var info = 'rs=' + (s.video?s.video.readyState:'?') + ' ns=' + (s.video?s.video.networkState:'?') + ' ct=' + (s.video?s.video.currentTime.toFixed(2):'?');
      var tStr = (w.__trace||[]).slice(-7).join(' || ');
      bad(Error('vErr ' + c + ': ' + m + ' (' + info + ') [' + tStr + ']'));
    }
    function bad(err){if(finished)return;finished=true;clear();stop();
      var em = (err && err.message ? err.message : 'Canal no disponible por el momento');
      if(w.__onStreamError)w.__onStreamError(em);
      reject(err);
    }
    s.rejectStart=bad;
    s._triggerDualFallback=function(){
      if(finished || s.singleBufAudio || !s.onDualBufferFallback)return false;
      var cfg = w.XuperEngineConfig || {};
      var isModern = (cfg.tier === 'modern' && !cfg.isEmulator);
      finished=true;clear(false);
      if(!isModern || cfg.isEmulator){
        w.__xeLivePreferMuxed=true;
      }
      console.warn('[LiveTV] Doble SourceBuffer rechazado, activando modo single-SourceBuffer');
      s.onDualBufferFallback().then(resolve,reject);
      return true;
    };
    s.video.addEventListener('playing',good);s.video.addEventListener('error',badEvent);
    ['loadstart','loadedmetadata','loadeddata','canplay','waiting','stalled','seeked'].forEach(function(evt){
      s.video.addEventListener(evt,function(){tr('vid:'+evt);},{once:true});
    });
    Promise.resolve().then(start).catch(bad);
  });}
  function liveMSEStart(s,first,segno,preparsed,singleMuxed){
    var parsed=preparsed||w.CactusFmp4.demux(new Uint8Array(first));
    var v=parsed.video,a=(!s.noAudio&&!w.__mseNoAudio&&parsed.audio)?parsed.audio[0]:null;
    if(!v||!(/^hvc1\./.test(v.codec)||/^avc1\./.test(v.codec)))throw Error('Canal sin pista de vídeo compatible.');
    var mimeV='video/mp4; codecs="'+v.codec+'"',mimeA=a?'audio/mp4; codecs="'+a.codec+'"':null;
    var mimeMux=(singleMuxed&&a)?('video/mp4; codecs="'+v.codec+','+a.codec+'"'):null;
    var useMuxed=false;
    if(mimeMux&&MS&&MS.isTypeSupported(mimeMux)){
      useMuxed=true;
    }else if(!MS||!MS.isTypeSupported(mimeV)){
      throw Error('Este Samsung no admite el códec de vídeo ('+v.codec+') a través de MSE.');
    }
    if(!useMuxed&&a&&!MS.isTypeSupported(mimeA)){a=null;mimeA=null;}
    s.hasAudio=!!a;
    if(useMuxed){
      s.onMuxedFallback=function(){
        if(s.url)try{URL.revokeObjectURL(s.url);}catch(_){}
        s.singleBufAudio=true;
        if(!((w.XuperEngineConfig||{}).tier==='modern'&&!(w.XuperEngineConfig||{}).isEmulator)) w.__xeLiveSingleBufAudio=true;
        return h264Start(s);
      };
    }else{
      s.onAudioFallback=function(){
        if(s.url)try{URL.revokeObjectURL(s.url);}catch(_){}
        return liveMSEStart(s,first,segno,preparsed,false);
      };
    }
    var ms=new MS();s.ms=ms;s.url=URL.createObjectURL(ms);s.video.src=s.url;
    return waitPlaying(s,function(){return new Promise(function(resolve,reject){
      ms.addEventListener('sourceopen',function(){
        if(s.stopped||playing!==s||s.ms!==ms||ms.readyState!=='open')return;
        var vb=ms.addSourceBuffer(useMuxed?mimeMux:mimeV);
        var ab=(!useMuxed&&a)?ms.addSourceBuffer(mimeA):null;
        var initTracks=(useMuxed&&a)?[v,a]:v;
        function trackDurSec(tr,rate,fallback){
          if(!tr||!tr.samples||!tr.samples.length)return fallback||4;
          var sm=tr.samples;
          if(sm.length===1)return (sm[0].duration?(sm[0].duration/rate):(fallback||0.04));
          var span=sm[sm.length-1].dts-sm[0].dts;
          var avg=span>0?(span/(sm.length-1)):(sm[0].duration||0);
          return Math.max(0.04,(span+avg)/rate);
        }
        append(vb,w.CactusFmp4.initSegment(initTracks),s.video.currentTime).then(function(){
          return (!useMuxed&&ab&&a)?append(ab,w.CactusFmp4.initSegment(a),s.video.currentTime):null;
        }).then(function(){
          if(s.stopped||playing!==s||s.ms!==ms)return;
          var aRate=(a&&a.timescale)||48000;
          var videoOrigin=v.samples[0].dts, audioOrigin=a?a.samples[0].dts:0;
          var commonOriginSec=(useMuxed&&a)?Math.min(videoOrigin/90000,audioOrigin/aRate):0;
          var vOffsetSec=useMuxed?-commonOriginSec:-(videoOrigin/90000);
          var aOffsetSec=(useMuxed&&a)?-commonOriginSec:-(audioOrigin/aRate);
          var vStartBase=Math.max(0,Math.round(((videoOrigin/90000)+vOffsetSec)*90000));
          var aStartBase=(ab&&a&&a.samples.length)?Math.max(0,Math.round(((audioOrigin/aRate)+aOffsetSec)*aRate)):0;
          if(useMuxed&&a)aStartBase=Math.max(0,Math.round(audioOrigin-commonOriginSec*aRate));
          var lastVEndSec=(vStartBase/90000)+trackDurSec(v,90000,4);
          var lastAEndSec=(useMuxed&&a&&a.samples.length)
            ?((aStartBase/aRate)+trackDurSec(a,aRate,4))
            :((ab&&a&&a.samples.length)?((aStartBase/aRate)+trackDurSec(a,aRate,4)):lastVEndSec);
          var hints={video:{params:v.params,sps:v.sps}},seq=1,done={},doneUri=Object.create(null),failUri=Object.create(null),refFailCount=0;
          done[segno]=true;
          if(s.map&&s.map[segno])doneUri[s.map[segno]]=true;
          note(s,'Transmitiendo señal en vivo…');
          var appFirst;
          if(useMuxed&&a&&a.samples.length){
            appFirst=append(vb,w.CactusFmp4.mediaSegment([v,a],seq,[vStartBase,aStartBase]),s.video.currentTime);
          }else{
            var appV=append(vb,w.CactusFmp4.mediaSegment(v,seq,vStartBase),s.video.currentTime);
            appFirst=(ab&&a&&a.samples.length)?appV.then(function(){
              return append(ab,w.CactusFmp4.mediaSegment(a,seq,aStartBase),s.video.currentTime);
            }):appV;
          }
          return appFirst.then(function(){
            if(s.stopped||playing!==s||s.ms!==ms)return;
            seq++;
            try{s.video.muted=false;s.video.volume=1;}catch(_){}
            try{s.video.play().catch(function(){});}catch(_){}
            function liveStep(){
              if(s.stopped||playing!==s||s.ms!==ms)return;
              refresh(s).then(function(info){
                refFailCount=0;
                var pieces=info.chunks;
                function processChunk(n){
                  if(n>=pieces.length||s.stopped||playing!==s||s.ms!==ms){
                    if(s.stopped||playing!==s||s.ms!==ms)return;
                    setTimeout(liveStep,Math.min(3000,Math.max(800,info.target*300)));
                    return;
                  }
                  var item=pieces[n],key=item.seq,uri=item.uri;
                  if(key<=segno||done[key]||(uri&&doneUri[uri])){
                    return processChunk(n+1);
                  }
                  getSegment(s,key).then(function(part){
                    if(s.stopped||playing!==s||s.ms!==ms)return;
                    var mp4=w.CactusFmp4.demux(new Uint8Array(part),hints);
                    var video=mp4.video,audio=((useMuxed||ab)&&mp4.audio)?mp4.audio[0]:null;
                    if(!video||!video.samples.length){
                      done[key]=true;if(uri)doneUri[uri]=true;
                      return processChunk(n+1);
                    }
                    if(video.codec!==v.codec){
                      console.warn('[LiveTV] Cambio de códec en vivo ('+v.codec+' -> '+video.codec+'), re-sintonizando…');
                      recoverLive(s);
                      return;
                    }
                    hints={video:{params:video.params,sps:video.sps}};
                    var rawVSec=video.samples[0].dts/90000;
                    var relVSec=rawVSec+vOffsetSec;
                    var rebased=false;
                    if(item.discontinuity || relVSec < lastVEndSec - 1.5 || relVSec > lastVEndSec + 3.5){
                      vOffsetSec = lastVEndSec - rawVSec;
                      rebased=true;
                    }
                    var tbase=Math.max(0,Math.round((rawVSec+vOffsetSec)*90000));
                    lastVEndSec=(tbase/90000)+trackDurSec(video,90000,item.duration||4);
                    var curRate=(audio&&audio.timescale)||aRate;
                    var appChunk;
                    if(useMuxed&&a&&audio&&audio.samples.length){
                      var rawASecMux=audio.samples[0].dts/curRate;
                      var relASecMux=rawASecMux+aOffsetSec;
                      if(rebased){
                        aOffsetSec = (Math.abs(rawASecMux-rawVSec)<3.0) ? vOffsetSec : (lastAEndSec - rawASecMux);
                      }else if(relASecMux < lastAEndSec - 1.5 || relASecMux > lastAEndSec + 3.5){
                        aOffsetSec = lastAEndSec - rawASecMux;
                      }
                      var abaseMux=Math.max(0,Math.round((rawASecMux+aOffsetSec)*curRate));
                      lastAEndSec=(abaseMux/curRate)+trackDurSec(audio,curRate,item.duration||4);
                      appChunk=append(vb,w.CactusFmp4.mediaSegment([video,audio],seq,[tbase,abaseMux]),s.video.currentTime);
                    }else{
                      var appV2=append(vb,w.CactusFmp4.mediaSegment(video,seq,tbase),s.video.currentTime);
                      if(ab&&audio&&audio.samples.length){
                        var rawASec=audio.samples[0].dts/curRate;
                        var relASec=rawASec+aOffsetSec;
                        if(rebased || relASec < lastAEndSec - 1.5 || relASec > lastAEndSec + 3.5){
                          aOffsetSec = lastAEndSec - rawASec;
                        }
                        var abase=Math.max(0,Math.round((rawASec+aOffsetSec)*curRate));
                        lastAEndSec=(abase/curRate)+trackDurSec(audio,curRate,item.duration||4);
                        appChunk=appV2.then(function(){
                          return append(ab,w.CactusFmp4.mediaSegment(audio,seq,abase),s.video.currentTime);
                        });
                      }else{
                        appChunk=appV2;
                      }
                    }
                    return appChunk.then(function(){
                      done[key]=true;if(uri)doneUri[uri]=true;
                      if(key>segno)segno=key;
                      seq++;
                      if(s.segCache)delete s.segCache[key];
                      return trim(vb,s.video.currentTime).then(function(){
                        return ab?trim(ab,s.video.currentTime):null;
                      });
                    }).then(function(){
                      function waitLiveDrain(){
                        if(s.stopped||playing!==s||s.ms!==ms||!s.video.buffered.length||s.video.buffered.end(s.video.buffered.length-1)-s.video.currentTime<=16){
                          return processChunk(n+1);
                        }
                        setTimeout(waitLiveDrain,300);
                      }
                      waitLiveDrain();
                    });
                  }).catch(function(err){
                    if(s.tr)s.tr('chunkErr('+key+'):'+err.message);
                    if(err&&err.cdnRotated){
                      if(!s.stopped&&playing===s&&s.ms===ms)liveStep();
                      return;
                    }
                    if(uri){
                      failUri[uri]=(failUri[uri]||0)+1;
                      if(failUri[uri]>=2){doneUri[uri]=true;done[key]=true;}
                    }
                    processChunk(n+1);
                  });
                }
                processChunk(0);
              }).catch(function(rErr){
                refFailCount++;
                if(s.tr)s.tr('refErr('+refFailCount+'):'+rErr.message);
                if(s.stopped||playing!==s||s.ms!==ms)return;
                var msg=errorMessage(rErr);
                if(refFailCount>=2 || /401|403|expir|token|sesi/i.test(msg)){
                  refreshWithSelfHeal(s).then(function(){
                    refFailCount=0;
                    if(!s.stopped&&playing===s&&s.ms===ms)liveStep();
                  }).catch(function(){
                    if(refFailCount>=4){
                      recoverLive(s);
                    }else if(!s.stopped&&playing===s&&s.ms===ms){
                      setTimeout(liveStep,2000);
                    }
                  });
                }else{
                  setTimeout(liveStep,2000);
                }
              });
            }
            liveStep();
          });
        }).catch(reject);
      },{once:true});
    });});
  }
  function readUint32BE(u8, off){
    return ((u8[off] << 24) >>> 0) + (u8[off + 1] << 16) + (u8[off + 2] << 8) + u8[off + 3];
  }
  function parseMp4AudioTimescale(u8){
    if(!u8 || u8.length < 16) return 44100;
    for(var i = 0; i <= u8.length - 16; i++){
      if(u8[i+4] === 0x6d && u8[i+5] === 0x64 && u8[i+6] === 0x68 && u8[i+7] === 0x64){
        var ver = u8[i + 8];
        var tsOff = ver === 1 ? (i + 28) : (i + 20);
        if(tsOff + 4 <= u8.length){
          var ts = readUint32BE(u8, tsOff);
          if(ts >= 8000 && ts <= 192000) return ts;
        }
      }
    }
    return 44100;
  }
  function parseMoofTfdt(u8){
    if(!u8 || u8.length < 20) return null;
    for(var i = 0; i <= u8.length - 20; i++){
      if(u8[i+4] === 0x74 && u8[i+5] === 0x66 && u8[i+6] === 0x64 && u8[i+7] === 0x74){
        var ver = u8[i + 8];
        if(ver === 1 && i + 20 <= u8.length){
          var hi = readUint32BE(u8, i + 12);
          var lo = readUint32BE(u8, i + 16);
          return hi * 4294967296 + lo;
        }
        if(ver === 0 && i + 16 <= u8.length){
          return readUint32BE(u8, i + 12);
        }
      }
    }
    return null;
  }
  function parseMoofAudioDurTicks(u8){
    if(!u8 || u8.length < 28) return 0;
    var defDur = 0, totalTicks = 0, pos = 0;
    function scanBoxes(start, end){
      var p = start;
      while(p + 8 <= end){
        var sz = readUint32BE(u8, p);
        if(sz < 8 || p + sz > end) break;
        var t0 = u8[p+4], t1 = u8[p+5], t2 = u8[p+6], t3 = u8[p+7];
        var tag = String.fromCharCode(t0, t1, t2, t3);
        if(tag === 'moof' || tag === 'traf'){
          scanBoxes(p + 8, p + sz);
        }else if(tag === 'tfhd' && p + 16 <= end){
          var tfFlags = ((u8[p+9] << 16) | (u8[p+10] << 8) | u8[p+11]);
          var off = p + 16;
          if(tfFlags & 0x01) off += 8;
          if(tfFlags & 0x02) off += 4;
          if((tfFlags & 0x08) && off + 4 <= p + sz) defDur = readUint32BE(u8, off);
        }else if(tag === 'trun' && p + 16 <= end){
          var trFlags = ((u8[p+9] << 16) | (u8[p+10] << 8) | u8[p+11]);
          var sc = readUint32BE(u8, p + 12);
          var rOff = p + 16;
          if(trFlags & 0x01) rOff += 4;
          if(trFlags & 0x04) rOff += 4;
          var hasDur = !!(trFlags & 0x100);
          var hasSize = !!(trFlags & 0x200);
          var hasFlags = !!(trFlags & 0x400);
          var hasCts = !!(trFlags & 0x800);
          if(!hasDur){
            totalTicks += sc * (defDur || 1024);
          }else{
            var stride = (hasDur?4:0) + (hasSize?4:0) + (hasFlags?4:0) + (hasCts?4:0);
            for(var si = 0; si < sc && rOff + 4 <= p + sz; si++){
              totalTicks += readUint32BE(u8, rOff);
              rOff += stride;
            }
          }
        }
        p += sz;
      }
    }
    scanBoxes(0, u8.length);
    return totalTicks;
  }
  function createVirtualAudioBridge(s){
    var AC = w.AudioContext || w.webkitAudioContext;
    var ctx = null;
    if(AC){
      try{
        if(!w.__xeSharedAudioCtx || w.__xeSharedAudioCtx.state === 'closed'){
          w.__xeSharedAudioCtx = new AC();
        }
        ctx = w.__xeSharedAudioCtx;
        if(ctx.state === 'suspended' && ctx.resume){ var rp0 = ctx.resume(); if(rp0 && rp0.catch) rp0.catch(function(){}); }
      }catch(_){ ctx = null; }
    }
    var bridge = {
      session: s,
      destroyed: false,
      ctx: ctx,
      initSeg: null,
      timescale: 44100,
      ranges: [],
      cursorSec: 0,
      nextScheduleTime: 0,
      lastNodeEnd: 0,
      activeNodes: [],
      decodedQueue: [],
      gainNode: null,
      syncTimer: null
    };
    if(ctx && ctx.createGain){
      try{
        bridge.gainNode = ctx.createGain();
        bridge.gainNode.connect(ctx.destination);
      }catch(_){ bridge.gainNode = null; }
    }
    function stopAllNodes(){
      for(var i = 0; i < bridge.activeNodes.length; i++){
        try{ bridge.activeNodes[i].stop(); }catch(_){}
        try{ bridge.activeNodes[i].disconnect(); }catch(_){}
      }
      bridge.activeNodes = [];
      bridge.nextScheduleTime = 0;
      bridge.lastNodeEnd = 0;
    }
    function syncGain(){
      if(!bridge.gainNode || !s.video) return;
      bridge.gainNode.gain.value = s.video.muted ? 0 : (typeof s.video.volume === 'number' ? s.video.volume : 1);
    }
    function pumpAudio(){
      if(bridge.destroyed || s.stopped || playing !== s || !ctx || !s.video) return;
      if(s.video.paused || s.video.readyState < 2){
        if(bridge.activeNodes.length) stopAllNodes();
        return;
      }
      if(ctx.state === 'suspended' && ctx.resume){ var rp1 = ctx.resume(); if(rp1 && rp1.catch) rp1.catch(function(){}); }
      syncGain();
      var vTime = Number(s.video.currentTime || 0);
      var nowCtx = ctx.currentTime;
      while(bridge.decodedQueue.length){
        var item = bridge.decodedQueue[0];
        if(item.scheduled) { bridge.decodedQueue.shift(); continue; }
        if(item.endSec <= vTime + 0.04){
          bridge.decodedQueue.shift();
          continue;
        }
        if(item.startSec > vTime + 4.0) break;
        bridge.decodedQueue.shift();
        try{
          var priming = item.primingSec || 0;
          var usableDur = item.exactDur > 0.02 ? Math.min(item.ab.duration - priming, item.exactDur) : Math.max(0.02, item.ab.duration - priming * 2);
          var offset = Math.max(0, vTime - item.startSec);
          var lead = Math.max(0, item.startSec - vTime);
          var targetStart = nowCtx + lead;
          if(bridge.lastNodeEnd > nowCtx){
            var drift = targetStart - bridge.lastNodeEnd;
            if(Math.abs(drift) < 0.09 && offset === 0){
              targetStart = bridge.lastNodeEnd;
            }else if(drift < -0.005){
              var trimAhead = bridge.lastNodeEnd - targetStart;
              offset += trimAhead;
              targetStart = bridge.lastNodeEnd;
            }
          }
          var playDur = usableDur - offset;
          if(playDur <= 0.015) continue;
          var src = ctx.createBufferSource();
          src.buffer = item.ab;
          src.connect(bridge.gainNode || ctx.destination);
          src.start(targetStart, priming + offset, playDur);
          bridge.nextScheduleTime = targetStart + playDur;
          bridge.lastNodeEnd = bridge.nextScheduleTime;
          bridge.activeNodes.push(src);
          src.onended = function(){
            var idx = bridge.activeNodes.indexOf(this);
            if(idx >= 0) bridge.activeNodes.splice(idx, 1);
          };
        }catch(_){}
      }
    }
    if(s.video){
      bridge._onPause = function(){ stopAllNodes(); };
      bridge._onSeeked = function(){ stopAllNodes(); pumpAudio(); };
      bridge._onPlay = function(){ pumpAudio(); };
      s.video.addEventListener('pause', bridge._onPause);
      s.video.addEventListener('seeked', bridge._onSeeked);
      s.video.addEventListener('playing', bridge._onPlay);
      s.video.addEventListener('volumechange', syncGain);
    }
    bridge.syncTimer = setInterval(pumpAudio, 80);
    bridge.createSourceBuffer = function(){
      var listeners = {};
      var vSb = {
        updating: false,
        mode: 'segments',
        timestampOffset: 0,
        appendWindowStart: 0,
        appendWindowEnd: Infinity,
        onupdatestart: null,
        onupdate: null,
        onupdateend: null,
        onerror: null,
        onabort: null,
        buffered: {
          get length(){ return bridge.ranges.length; },
          start: function(i){ return bridge.ranges[i] ? bridge.ranges[i][0] : 0; },
          end: function(i){ return bridge.ranges[i] ? bridge.ranges[i][1] : 0; }
        },
        addEventListener: function(ev, fn){
          if(!listeners[ev]) listeners[ev] = [];
          if(listeners[ev].indexOf(fn) === -1) listeners[ev].push(fn);
        },
        removeEventListener: function(ev, fn){
          if(!listeners[ev]) return;
          var idx = listeners[ev].indexOf(fn);
          if(idx >= 0) listeners[ev].splice(idx, 1);
        },
        dispatchEvent: function(ev){
          var t = ev && ev.type ? ev.type : String(ev || '');
          var obj = (ev && typeof ev === 'object') ? ev : { type: t };
          var cb = vSb['on' + t];
          if(typeof cb === 'function') try{ cb.call(vSb, obj); }catch(_){}
          var arr = (listeners[t] || []).slice();
          for(var i = 0; i < arr.length; i++){
            try{ arr[i].call(vSb, obj); }catch(_){}
          }
        },
        changeType: function(){},
        abort: function(){ vSb.dispatchEvent({ type: 'abort' }); },
        remove: function(start, end){
          vSb.updating = true;
          vSb.dispatchEvent({ type: 'updatestart' });
          setTimeout(function(){
            if(bridge.destroyed) return;
            var nextRanges = [];
            for(var i = 0; i < bridge.ranges.length; i++){
              var r0 = bridge.ranges[i][0], r1 = bridge.ranges[i][1];
              if(r1 <= start || r0 >= end) nextRanges.push([r0, r1]);
              else{
                if(r0 < start) nextRanges.push([r0, start]);
                if(r1 > end) nextRanges.push([end, r1]);
              }
            }
            bridge.ranges = nextRanges;
            vSb.updating = false;
            vSb.dispatchEvent({ type: 'update' });
            vSb.dispatchEvent({ type: 'updateend' });
          }, 0);
        },
        appendBuffer: function(buf){
          vSb.updating = true;
          vSb.dispatchEvent({ type: 'updatestart' });
          var u8 = buf ? new Uint8Array(buf instanceof ArrayBuffer ? buf : buf.buffer, buf.byteOffset || 0, buf.byteLength || 0) : new Uint8Array(0);
          var copy = new Uint8Array(u8.length);
          copy.set(u8);
          var finishUpdate = function(sTime, eTime){
            if(bridge.destroyed) return;
            if(eTime > sTime){
              if(!bridge.ranges.length){
                bridge.ranges.push([sTime, eTime]);
              }else{
                var last = bridge.ranges[bridge.ranges.length - 1];
                if(sTime <= last[1] + 0.35){
                  last[0] = Math.min(last[0], sTime);
                  last[1] = Math.max(last[1], eTime);
                }else{
                  bridge.ranges.push([sTime, eTime]);
                }
              }
            }
            vSb.updating = false;
            vSb.dispatchEvent({ type: 'update' });
            vSb.dispatchEvent({ type: 'updateend' });
          };
          if(!bridge.initSeg || (copy.length >= 8 && copy[4] === 0x66 && copy[5] === 0x74 && copy[6] === 0x79 && copy[7] === 0x70)){
            bridge.initSeg = copy;
            bridge.timescale = parseMp4AudioTimescale(copy);
            setTimeout(function(){ finishUpdate(0, 0); }, 0);
            return;
          }
          if(!ctx || !ctx.decodeAudioData){
            setTimeout(function(){
              var vb = s.video && s.video.buffered;
              var t0 = (vb && vb.length) ? vb.start(0) : bridge.cursorSec;
              var t1 = (vb && vb.length) ? vb.end(vb.length - 1) : (t0 + 2);
              finishUpdate(t0, t1);
            }, 0);
            return;
          }
          var tfdtTicks = parseMoofTfdt(copy);
          var moofDurTicks = parseMoofAudioDurTicks(copy);
          var comb = new Uint8Array(bridge.initSeg.length + copy.length);
          comb.set(bridge.initSeg, 0);
          comb.set(copy, bridge.initSeg.length);
          ctx.decodeAudioData(comb.buffer, function(ab){
            if(bridge.destroyed) return;
            var sr = ab.sampleRate || bridge.timescale || 48000;
            var ts = bridge.timescale || sr;
            var exactDur = (moofDurTicks > 0 && ts > 0) ? (moofDurTicks / ts) : 0;
            var primingSec = (exactDur > 0 && ab.duration > exactDur + 0.01) ? Math.min(0.045, (ab.duration - exactDur) * 0.5) : Math.min(0.025, 1024 / sr);
            var segDur = exactDur > 0 ? exactDur : Math.max(0.02, ab.duration - primingSec * 2);
            var startSec = (tfdtTicks !== null && ts > 0) ? (tfdtTicks / ts) : bridge.cursorSec;
            var endSec = startSec + segDur;
            bridge.cursorSec = Math.max(bridge.cursorSec, endSec);
            bridge.decodedQueue.push({ startSec: startSec, endSec: endSec, exactDur: segDur, primingSec: primingSec, ab: ab });
            if(bridge.decodedQueue.length > 24) bridge.decodedQueue.shift();
            pumpAudio();
            finishUpdate(startSec, endSec);
          }, function(){
            var vb = s.video && s.video.buffered;
            var t0 = (vb && vb.length) ? vb.start(0) : bridge.cursorSec;
            var t1 = (vb && vb.length) ? vb.end(vb.length - 1) : (t0 + 2);
            finishUpdate(t0, t1);
          });
        }
      };
      return vSb;
    };
    bridge.destroy = function(){
      bridge.destroyed = true;
      if(bridge.syncTimer){ clearInterval(bridge.syncTimer); bridge.syncTimer = null; }
      stopAllNodes();
      if(bridge.gainNode){ try{ bridge.gainNode.disconnect(); }catch(_){} bridge.gainNode = null; }
      if(s.video){
        try{ s.video.removeEventListener('pause', bridge._onPause); }catch(_){}
        try{ s.video.removeEventListener('seeked', bridge._onSeeked); }catch(_){}
        try{ s.video.removeEventListener('playing', bridge._onPlay); }catch(_){}
        try{ s.video.removeEventListener('volumechange', syncGain); }catch(_){}
      }
      if(w.__xeActiveAudioBridge === bridge) w.__xeActiveAudioBridge = null;
    };
    return bridge;
  }
  function h264Start(s){
    if(!w.Hls||!w.Hls.isSupported())return Promise.reject(Error('Hls.js/MSE no está disponible para este canal.'));
    var cfg = w.XuperEngineConfig || {};
    var isModern = (cfg.tier === 'modern' && !cfg.isEmulator);
    var useBridge = !!(s.singleBufAudio || (!isModern && w.__xeLiveSingleBufAudio));
    s.singleBufAudio = useBridge;
    if(!useBridge){
      s.onDualBufferFallback = function(){
        if(s.hls){try{s.hls.destroy();}catch(_){} s.hls=null;}
        if(s.video){try{s.video.pause();s.video.removeAttribute('src');s.video.load();}catch(_){}}
        if(!s.singleMuxedTried && s._firstSeg && s._firstSeg.parsed && s._firstSeg.parsed.video && s._firstSeg.parsed.audio && s._firstSeg.parsed.audio.length && MS){
          var fv = s._firstSeg.parsed.video, fa = s._firstSeg.parsed.audio[0];
          var muxMime = 'video/mp4; codecs="' + fv.codec + ',' + fa.codec + '"';
          if(MS.isTypeSupported(muxMime)){
            s.singleMuxedTried = true;
            return liveMSEStart(s, s._firstSeg.bytes, s._firstSeg.seq, s._firstSeg.parsed, true);
          }
        }
        s.singleBufAudio = true;
        if(!isModern) w.__xeLiveSingleBufAudio = true;
        return h264Start(s);
      };
    }
    return waitPlaying(s,function(){
      if(s.audioBridge){try{s.audioBridge.destroy();}catch(_){} s.audioBridge=null;}
      if(s.singleBufAudio){
        s.audioBridge = createVirtualAudioBridge(s);
        w.__xeActiveAudioBridge = s.audioBridge;
      }else if(w.__xeActiveAudioBridge){
        w.__xeActiveAudioBridge = null;
      }
      var h=new w.Hls({loader:LiveLoader,enableWorker:false,lowLatencyMode:false,
        maxBufferLength:60,maxMaxBufferLength:120,backBufferLength:20,liveSyncDurationCount:6,
        liveMaxLatencyDurationCount:16,maxLiveSyncPlaybackRate:1.0,manifestLoadingTimeOut:12000,
        manifestLoadingMaxRetry:2,manifestLoadingRetryDelay:400,fragLoadingTimeOut:15000,
        fragLoadingMaxRetry:2,fragLoadingRetryDelay:400,nudgeOffset:0.1,nudgeMaxRetry:5,
        liveDurationInfinity:true,highBufferWatchdogPeriod:2});
      s.hls=h;
      var fragNetErrs=0,activeHlsHost=s.session&&s.session.host||'';
      h.on(w.Hls.Events.ERROR,function(e,data){
        var d = data ? (data.details || data.type || 'err') : 'err';
        if(s.tr)s.tr('hlsErr:'+d);
        if(data&&data.fatal){
          switch(data.type){
            case w.Hls.ErrorTypes.NETWORK_ERROR:
              fragNetErrs++;
              var curHost=s.session&&s.session.host||'';
              var hostChanged=(curHost&&curHost!==activeHlsHost);
              if(hostChanged || (fragNetErrs>=2 && tryRotateCdnHost(s,'hls-'+d))){
                activeHlsHost=s.session&&s.session.host||'';
                fragNetErrs=0;
                console.warn('[LiveTV] Reload Hls.js en nuevo CDN ->', activeHlsHost);
                try{h.loadSource(MEDIA+'/playlist.m3u8');h.startLoad(-1);}catch(_){}
                break;
              }
              if(fragNetErrs>=4){
                fragNetErrs=0;
                console.warn('[LiveTV] CDN sin respuesta en Hls.js ('+d+'), re-sintonizando...');
                if(!s.hasStartedPlaying && s.rejectStart){s.rejectStart(Error('CDN sin respuesta: '+d));}
                else{recoverLive(s);}
                break;
              }
              console.warn('[LiveTV] Error de red fatal Hls.js, reanudando carga...', d);
              try{h.startLoad();}catch(_){}
              break;
            case w.Hls.ErrorTypes.MEDIA_ERROR:
              var isSbDualErr = (d === 'bufferAddCodecError') || (w.__trace && w.__trace.join(' ').indexOf('SB_ERR(audio') !== -1);
              if(!s.hasStartedPlaying && !s.singleBufAudio && (!isModern || isSbDualErr) && s._triggerDualFallback && s._triggerDualFallback()){
                return;
              }
              console.warn('[LiveTV] Error multimedia fatal Hls.js, recuperando...', d);
              try{h.recoverMediaError();}catch(_){}
              break;
            default:
              console.error('[LiveTV] Error Hls.js no recuperable:', d);
              if(s.rejectStart)s.rejectStart(Error('Error de señal en directo: '+d));
              else recoverLive(s);
              break;
          }
        }
      });
      h.on(w.Hls.Events.MEDIA_ATTACHED,function(){
        if(s.tr)s.tr('hls:attached');
        h.loadSource(MEDIA+'/playlist.m3u8');
      });
      h.on(w.Hls.Events.MANIFEST_PARSED,function(){
        fragNetErrs=0;
        if(s.tr)s.tr('hls:parsed');
        if(s.video)s.video.play().catch(function(e){if(s.tr)s.tr('playErr:'+e.message);});
      });
      h.on(w.Hls.Events.FRAG_PARSED,function(ev,data){
        fragNetErrs=0;
        var es=data&&data.frag&&data.frag.elementaryStreams;
        var aInfo=es&&es.audio?(es.audio.startPTS.toFixed(1)+'-'+es.audio.endPTS.toFixed(1)):'noA';
        var vInfo=es&&es.video?(es.video.startPTS.toFixed(1)+'-'+es.video.endPTS.toFixed(1)):'noV';
        if(s.tr)s.tr('FP:A('+aInfo+') V('+vInfo+')');
      });
      h.on(w.Hls.Events.BUFFER_CREATED,function(){if(s.tr)s.tr('hls:bufCreate');});
      h.on(w.Hls.Events.BUFFER_APPENDED,function(ev,data){
        fragNetErrs=0;
        var type=data?data.type:'?';
        var b=s.video&&s.video.buffered;
        var bInfo=b&&b.length?'['+b.start(0).toFixed(1)+'-'+b.end(0).toFixed(1)+']':'none';
        if(s.tr)s.tr('app('+type+','+bInfo+')');
      });
      h.attachMedia(s.video);
    });
  }
  function refreshWithSelfHeal(s){
    return refresh(s).catch(function(firstErr){
      if(s.stopped||playing!==s)throw firstErr;
      note(s,'Renovando señal del canal…');
      return direct.connect().then(function(c){
        var liveProm=s.channelCode?c.live.getLiveData({columnId:76182}).catch(function(){return null;}):Promise.resolve(null);
        return Promise.all([liveProm,c.stream.getSlbInfo({forceRefresh:true})]).then(function(res){
          if(s.stopped||playing!==s)throw firstErr;
          var liveData=res[0],slb=res[1],freshItem=null;
          if(liveData&&Array.isArray(liveData.channelList)&&s.channelCode){
            for(var i=0;i<liveData.channelList.length;i++){
              if(liveData.channelList[i].channelCode===s.channelCode){freshItem=liveData.channelList[i];break;}
            }
          }
          if(freshItem&&freshItem.liveAddressList&&freshItem.liveAddressList.length){
            s.session=c.stream.createCflSession('live',freshItem,slb);
          }else if(s.rawItem){
            s.session=c.stream.createCflSession('live',s.rawItem,slb);
          }
          return refresh(s);
        });
      }).catch(function(){throw firstErr;});
    });
  }
  function fetchFirstSegment(s,info,triedRot){
    var chunks=info&&info.chunks||[];
    var startIdx=chunks.length>6?chunks.length-6:(chunks.length>3?chunks.length-3:0);
    if(!chunks[startIdx])return Promise.reject(Error('El canal no entregó segmentos disponibles.'));
    var candidates=[startIdx];
    if(chunks[startIdx+1])candidates.push(startIdx+1);
    if(chunks[startIdx+2])candidates.push(startIdx+2);
    if(startIdx>0&&chunks[startIdx-1])candidates.push(startIdx-1);
    function tryIdx(ci){
      if(ci>=candidates.length){
        if(!triedRot&&tryRotateCdnHost(s,'start-404')){
          return refresh(s,{hostRotated:true,allowJump:true}).then(function(nextInfo){
            return fetchFirstSegment(s,nextInfo,true);
          });
        }
        return Promise.reject(Error('El CDN no entregó el fragmento inicial.'));
      }
      var idx=candidates[ci],chunk=chunks[idx];
      return getSegment(s,chunk.seq).then(function(bytes){
        return {bytes:bytes,chunks:chunks,startIdx:idx,first:chunk};
      }).catch(function(err){
        if(err&&(err.name==='AbortError'||playing!==s||s.stopped))throw err;
        return tryIdx(ci+1);
      });
    }
    return tryIdx(0);
  }
  function start(s,opt){
    stop();keepScreenOn();playing=s;s.abort=new AbortController();s.map={};s.stopped=false;
    s.segCache=Object.create(null);s.segOrder=[];s.segFail=Object.create(null);s.uriToSeq=Object.create(null);s.nextSeq=1000;
    s.lastM3uSeq=null;s.originJumpCount=0;s.consecSegFail=0;s.consecManFail=0;s._rotCount=0;
    s.title=(opt&&opt.title)||s.title||'TV en vivo';
    s._lastCt=null;s._stallTicks=0;s._starveTicks=0;
    render(s,s.title);
    note(s,'Conectando con el canal real…');
    return refreshWithSelfHeal(s).then(function(info){
      return fetchFirstSegment(s,info,false).then(function(picked){
        if(playing!==s)throw Error('Sintonización cancelada.');
        var bytes=picked.bytes,chunks=picked.chunks,startIdx=picked.startIdx,first=picked.first;
        var result=null,finalBytes=bytes,finalSeq=first.seq;
        if(w.CactusFmp4&&bytes.byteLength>=376){try{result=w.CactusFmp4.demux(new Uint8Array(bytes));}catch(e){}}
        var nextChunk=(!result||!result.video)?(chunks[startIdx+1]||chunks[startIdx-1]||null):null;
        var nextProm=nextChunk?getSegment(s,nextChunk.seq).then(function(bytes2){
          var u1=new Uint8Array(bytes),u2=new Uint8Array(bytes2);
          var comb=new Uint8Array(u1.length+u2.length);
          if(nextChunk.seq>first.seq){comb.set(u1,0);comb.set(u2,u1.length);finalSeq=nextChunk.seq;}
          else{comb.set(u2,0);comb.set(u1,u2.length);finalSeq=first.seq;}
          finalBytes=comb.buffer;
          try{result=w.CactusFmp4.demux(comb);}catch(e){console.warn('[LiveTV demux2 err]',e.message);}
        }).catch(function(){}):Promise.resolve();
        return nextProm.then(function(){
          if(playing!==s)throw Error('Sintonización cancelada.');
          s._firstSeg = { bytes: finalBytes, seq: finalSeq, parsed: result };
          if(result&&result.video&&/^hvc1\./.test(result.video.codec)){
            console.log('[LiveTV] MSE Direct HEVC codec:', result.video.codec, 'vSamples:', result.video.samples.length, 'aTracks:', result.audio?result.audio.length:0);
            note(s,'Canal HEVC: preparando MSE directo…');
            return liveMSEStart(s,finalBytes,finalSeq,result,false);
          }
          var cfg = w.XuperEngineConfig || {};
          if((w.__xeLivePreferMuxed || cfg.isEmulator || cfg.disableDualSourceBuffer || cfg.tier === 'legacy') && result && result.video && result.audio && result.audio.length && MS){
            var muxMime = 'video/mp4; codecs="' + result.video.codec + ',' + result.audio[0].codec + '"';
            if(MS.isTypeSupported(muxMime)){
              console.log('[LiveTV] Using single muxed SourceBuffer:', muxMime);
              s.singleMuxedTried = true;
              note(s,'Iniciando reproducción…');
              return liveMSEStart(s,finalBytes,finalSeq,result,true);
            }
          }
          console.log('[LiveTV] Using Hls.js engine (h264Start)');
          note(s,'Iniciando reproducción…');return h264Start(s);
        });
      });
    }).catch(function(err){if(s.stopped||playing!==s||(err&&err.name==='AbortError'))return;var message=errorMessage(err);console.error('[LiveTV start err]',message);stop();if(w.__onStreamError)w.__onStreamError(message);throw Error('TV en vivo: '+message);});
  }
  function prepare(item,forceFreshSlb){
    if(!isLive(item))return Promise.reject(Error('Este elemento no contiene una transmisión en vivo.'));
    return direct.connect().then(function(c){
      if(!c.stream||typeof c.stream.getSlbInfo!=='function'||typeof c.stream.createCflSession!=='function')
        throw Error('No está disponible el módulo de transmisión original.');
      return c.stream.getSlbInfo({forceRefresh:!!forceFreshSlb}).then(function(slb){
        var session=c.stream.createCflSession('live',item,slb);
        if(!session||!session.manifestRequest||!session.segmentRequest)throw Error('El proveedor no concedió una sesión multimedia utilizable.');
        return {session:session,map:{},title:item.name||item.title||'TV en vivo',channelCode:item.channelCode||'',rawItem:item};
      });
    });
  }
  direct.http=function(method,args){
    if(method!=='play'||!args||!isLive(args[0]))return oldHttp(method,args);
    var my=++ticket;
    return prepare(args[0]).then(function(info){
      if(my!==ticket)throw Error('Cambio de canal cancelado.');
      pending=info;
      return {ok:true,json:function(){return Promise.resolve({data:{kind:'live',engine:'cactus-live-15',url:''}});}};
    },function(err){return {ok:false,json:function(){return Promise.resolve({error:errorMessage(err)});}};});
  };
  av.start=function(opts){
    if(opts&&opts.engine==='cactus-live-15'){
      if(!pending)return Promise.reject(Error('No se recibió la sesión de TV en vivo.'));
      var info=pending;pending=null;return start(info,opts);
    }
    stop();return oldStart.call(av,opts);
  };
  av.stop=function(){stop();return oldStop.call(av);};
  w.CactusLiveTV={version:'2.0.25',start:start,stop:stop,active:function(){return !!playing;},parseManifest:mediaManifest};
})(window,document);
