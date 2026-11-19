/* Xuper Eclectic HEVC Transmux Engine v2.0.19 */
(function(w,d){'use strict';
  var active=null, mediaClass=w.MediaSource||w.WebKitMediaSource;
  function say(s,msg){
    s.phase=msg;
    if(s.label){
      if(msg.indexOf('convirtiendo')!==-1||msg.indexOf('segmento')!==-1||msg.indexOf('inicializando')!==-1){
        s.label.style.display='none';
        return;
      }
      s.label.textContent='Película: '+msg;
    }
  }
  function msg(e){return String(e && e.message || e || 'Error de video').slice(0,260);}
  function q(id){return d.getElementById(id);}
  function segmentAt(segments,time){
    var elapsed=0;
    for(var i=0;i<segments.length;i++){elapsed+=Math.max(.05,Number(segments[i].duration)||0);if(time<elapsed)return i;}
    return Math.max(0,segments.length-1);
  }
  function buffered(video,time){
    for(var i=0;i<video.buffered.length;i++)if(time>=video.buffered.start(i)&&time<video.buffered.end(i)-.1)return true;
    return false;
  }
  // Tizen necesita iniciar la nueva fuente antes de aceptar un salto lejano.
  // El fragmento cero ya se descargó para identificar las pistas: usarlo para
  // preparar el decodificador y después pedir directamente el intervalo destino.
  function resumePrepared(s,target,paused,muted){return new Promise(function(resolve,reject){
    var video=s.video,finished=false;
    var timeout=setTimeout(function(){
      console.warn('[HEVC resumePrepared] Posición exacta no alcanzada en tiempo límite, reanudando posición actual:', video?video.currentTime:0);
      finish();
    },12000);
    var poll=setInterval(check,150);
    function cleanup(){clearTimeout(timeout);clearInterval(poll);video.removeEventListener('seeked',check);s.cancelResume=null;}
    function finish(error){if(finished)return;finished=true;cleanup();video.muted=muted;
      if(error){reject(error);return;}
      if(paused){video.pause();resolve(true);}else video.play().then(function(){resolve(true);},reject);
    }
    function check(){if(s.ended||active!==s){finish(Error('Reproducción cancelada'));return;}
      if(!video.seeking&&video.readyState>=2&&(Math.abs(video.currentTime-target)<8||buffered(video,video.currentTime)))finish();
    }
    s.cancelResume=function(){finish(Error('Reproducción cancelada'));};
    // En Tizen el salto puede quedar pendiente si se pausa el decodificador.
    // Mantenerlo activo y silenciado; finish restaura el estado del usuario.
    video.addEventListener('seeked',check);
    try{video.currentTime=target;}catch(e){finish();return;}
    check();
  });}
  function renewSession(s){
    if(!s||!s.sessionOpts||!w.CactusDirect||typeof w.CactusDirect.connect!=='function'){
      return Promise.reject(Error('Sin sesión renovable'));
    }
    if(s._renewing)return s._renewing;
    s._renewing=w.CactusDirect.connect().then(function(c){
      return c.stream.getSlbInfo({forceRefresh:true}).then(function(slb){
        var fresh=c.stream.createCflSession('vod',s.sessionOpts,slb);
        s.session=fresh;
        s._renewing=null;
        return fresh;
      });
    }).catch(function(err){
      s._renewing=null;
      throw err;
    });
    return s._renewing;
  }
  function request(s,num,attempt){
    attempt=attempt||0;
    var part=s.segments[num];if(!part)return Promise.reject(Error('Segmento no encontrado'));
    if(s.session&&s.session.expired&&(Date.now()/1000)>=(s.session.expired-150)){
      renewSession(s).catch(function(){});
    }
    var req=s.session.mediaRequest('bytes='+part.start+'-'+part.end);
    if(!req || !/^https?:\/\//i.test(req.url))return Promise.reject(Error('Destino multimedia no válido'));
    var ctrl=new AbortController();s.pending=ctrl;
    var timedOut=false,timeout=setTimeout(function(){timedOut=true;ctrl.abort();},25000);
    return fetch(req.url,{method:'GET',headers:req.headers||{},redirect:'follow',cache:'no-store',signal:ctrl.signal}).then(function(r){
      if((r.status===401||r.status===403)&&attempt<3&&s.sessionOpts){
        clearTimeout(timeout);if(s.pending===ctrl)s.pending=null;
        return renewSession(s).then(function(){
          return request(s,num,attempt+1);
        });
      }
      if(r.status!==206)throw Error('El CDN respondió HTTP '+r.status+'; se requiere HTTP 206');
      return r.arrayBuffer();
    }).then(function(data){
      clearTimeout(timeout);if(s.pending===ctrl)s.pending=null;
      if(data.byteLength<188)throw Error('Segmento demasiado corto');
      if(data.byteLength%188!==0){
        var validLen=Math.floor(data.byteLength/188)*188;
        if(validLen>=188)data=data.slice(0,validLen);
      }
      return data;
    }).catch(function(e){
      clearTimeout(timeout);if(s.pending===ctrl)s.pending=null;
      if(s.ended||active!==s)throw e;
      if(attempt<3){
        return new Promise(function(r){setTimeout(r,500*(attempt+1));}).then(function(){
          return request(s,num,attempt+1);
        });
      }
      throw e;
    });
  }
  function codeType(input){
    var b=new Uint8Array(input),off=0;
    if(b.length<376)return false;
    // The source format is MPEG-TS in fixed 188-byte packets.
    for(var j=0;j<Math.min(5,Math.floor(b.length/188));j++)if(b[j*188]!==0x47)return false;
    return true;
  }
  function codecMime(kind,codec){return kind+'/mp4; codecs="'+codec+'"';}
  function waitSbIdle(sb,callback){
    if(!sb||!sb.updating){callback();return;}
    var done=false,tm=setTimeout(function(){if(!done){done=true;sb.removeEventListener('updateend',onEnd);callback();}},4000);
    function onEnd(){if(done)return;done=true;clearTimeout(tm);sb.removeEventListener('updateend',onEnd);callback();}
    sb.addEventListener('updateend',onEnd);
  }
  function tryPruneForQuota(sb,cur,retryCount){
    if(!sb||!sb.buffered||!sb.buffered.length)return false;
    for(var b=sb.buffered.length-1;b>=0;b--){
      if(sb.buffered.start(b)>cur+22){
        try{sb.remove(sb.buffered.start(b),sb.buffered.end(b));return true;}catch(_){}
      }
    }
    var tiers=retryCount>=2?[2]:(retryCount===1?[6,2]:[10,5,2]);
    for(var ti=0;ti<tiers.length;ti++){
      var removeEnd=Math.max(0,cur-tiers[ti]);
      if(removeEnd>sb.buffered.start(0)+0.5){
        try{sb.remove(sb.buffered.start(0),removeEnd);return true;}catch(_){}
      }
    }
    return false;
  }
  function bufferAppend(sb,data,retryCount){
    retryCount=retryCount||0;
    return new Promise(function(resolve,reject){
      if(!sb)return resolve();
      function doAppend(){
        if(active&&active.ended)return reject(Error('Reproducción cancelada'));
        if(sb.updating){
          waitSbIdle(sb,doAppend);
          return;
        }
        var timeout=setTimeout(function(){cleanup();reject(Error('Tiempo de espera al escribir buffer MSE'));},15000);
        function cleanup(){clearTimeout(timeout);sb.removeEventListener('updateend',ok);sb.removeEventListener('error',bad);}
        function ok(){cleanup();resolve();}
        function handleQuota(){
          if(retryCount<3&&sb.buffered&&sb.buffered.length>0){
            var cur=(active&&active.video?active.video.currentTime:60);
            if(tryPruneForQuota(sb,cur,retryCount)){
              waitSbIdle(sb,function(){
                bufferAppend(sb,data,retryCount+1).then(resolve,reject);
              });
              return true;
            }
          }
          return false;
        }
        function bad(ev){
          cleanup();
          if(ev&&(ev.name==='QuotaExceededError'||ev.code===22||/quota/i.test(ev.message||''))){
            if(handleQuota())return;
          }else if(retryCount<1&&sb.buffered&&sb.buffered.length>0){
            var cur=(active&&active.video?active.video.currentTime:60);
            if(tryPruneForQuota(sb,cur,retryCount+1)){
              waitSbIdle(sb,function(){
                bufferAppend(sb,data,retryCount+1).then(resolve,reject);
              });
              return;
            }
          }
          reject(ev||Error('Error al escribir buffer MSE'));
        }
        sb.addEventListener('updateend',ok);sb.addEventListener('error',bad);
        try{
          sb.appendBuffer(data);
        }catch(e){
          cleanup();
          if(e&&(e.name==='QuotaExceededError'||e.code===22||/quota/i.test(e.message||''))){
            if(handleQuota())return;
          }
          reject(e||Error('Error al escribir buffer MSE'));
        }
      }
      doAppend();
    });
  }
  function bufferPrune(sb,now,force){
    return new Promise(function(resolve){
      if(!sb||!sb.buffered.length)return resolve();
      if(sb.updating){
        waitSbIdle(sb,function(){bufferPrune(sb,now,force).then(resolve);});
        return;
      }
      var timeout=null;
      function done(){if(timeout){clearTimeout(timeout);timeout=null;}sb.removeEventListener('updateend',done);resolve();}
      try{
        var start=sb.buffered.start(0);
        var removeUntil=force?Math.max(0,now-6):(now>25?now-14:-1);
        if(removeUntil>start+1.5){
          timeout=setTimeout(function(){done();},4000);
          sb.addEventListener('updateend',done);sb.remove(start,removeUntil);
          return;
        }
        if(sb.buffered.length>1){
          var lastIdx=sb.buffered.length-1;
          var lastSt=sb.buffered.start(lastIdx),lastEn=sb.buffered.end(lastIdx);
          if(lastSt>now+26){
            timeout=setTimeout(function(){done();},4000);
            sb.addEventListener('updateend',done);sb.remove(lastSt,lastEn);
            return;
          }
        }
        resolve();
      }catch(e){resolve();}
    });
  }
  function prepareUi(s,title){
    var panel=q('screen-player')||q('player'),video=q('player-video')||q('video');if(!panel||!video)throw Error('No se encontró el reproductor Samsung');
    w.CactusVODBrowser.stop();
    s.panel=panel;s.video=video;s.oldMuted=video.muted;
    var isMini = panel.classList.contains('is-mini') || (typeof ke !== 'undefined' && ke.screen === 'detail');
    if (!isMini) {
      panel.classList.remove('is-mini');
      d.documentElement.classList.add('modal-open');
    } else {
      panel.classList.add('is-mini');
      d.documentElement.classList.remove('modal-open');
    }
    panel.classList.add('cactus-browser-vod','cactus-hevc-vod');
    var titleEl=q('vod-infobar-title')||q('player-title');if(titleEl)titleEl.textContent=title||'Película';
    if(!q('cactus-hevc-vod-style')){
      var style=d.createElement('style');style.id='cactus-hevc-vod-style';
      style.textContent='#screen-player:not(.is-mini).cactus-hevc-vod #player-video,#player:not(.is-mini).cactus-hevc-vod #video{display:block!important;position:absolute;top:0;left:0;right:0;bottom:0;width:100%;height:100%;z-index:5;object-fit:contain;background:#000}'+
        '#screen-player.is-mini.cactus-hevc-vod #player-video{display:block!important;position:absolute;top:0;left:0;width:765px!important;height:430px!important;z-index:5;background:#000;object-fit:contain}'+
        '#screen-player.is-mini #cactus-hevc-hint{display:none!important}'+
        '#player.cactus-hevc-vod #player-ui{display:none!important}'+
        '#cactus-hevc-hint{display:none!important}';
      d.head.appendChild(style);
    }
    s.label=q('cactus-hevc-hint');if(!s.label){s.label=d.createElement('div');s.label.id='cactus-hevc-hint';panel.appendChild(s.label);}
    s.label.hidden=true;
    s.label.style.display='none';
    say(s,'preparando conversión HEVC');
    s.onKey=function(ev){
      if(active!==s)return;
      var code=ev.keyCode||ev.which;
      if(code===415||code===19){
        if(video.paused&&code===415)video.play().catch(function(){});
        else if(!video.paused&&code===19)video.pause();
      }
    };
    d.addEventListener('keydown',s.onKey,false);
    s.onSeeking=function(){
      if(s.ended)return;
      var cur=video.currentTime;
      if(buffered(video,cur))return;
      // Un salto solicita el intervalo de destino, con un fragmento previo para decodificar.
      s.seekIndex=Math.max(0,segmentAt(s.segments,cur)-1);
      s.seekGeneration=(s.seekGeneration||0)+1;
      if(s.stallReset)s.stallReset();
      if(s.pending)try{s.pending.abort();}catch(e){}
      if(s.drainTimer){clearTimeout(s.drainTimer);s.drainTimer=null;}
      if(s.loopTimer){clearTimeout(s.loopTimer);s.loopTimer=null;}
      if(s.seekDebounceTimer){clearTimeout(s.seekDebounceTimer);s.seekDebounceTimer=null;}
      say(s,'cargando la posición elegida');
      // Podar búferes viejos futuros al saltar hacia atrás para evitar QuotaExceeded y atasco en waitDrain
      var maxFwd=cur+25;
      [s.vb,s.ab].forEach(function(sb){
        if(!sb||sb.updating||!sb.buffered.length)return;
        for(var b=0;b<sb.buffered.length;b++){
          var bSt=sb.buffered.start(b),bEn=sb.buffered.end(b);
          if(bSt>maxFwd){
            try{sb.remove(bSt,bEn);}catch(_){}
          }else if(bEn>maxFwd&&bSt<maxFwd){
            try{sb.remove(maxFwd,bEn);}catch(_){}
          }
        }
      });
      if(typeof s.wakeLoop==='function'){
        s.seekDebounceTimer=setTimeout(function(){
          s.seekDebounceTimer=null;
          if(!s.ended&&active===s)s.wakeLoop();
        },95);
      }
    };
    video.addEventListener('seeking',s.onSeeking);
    active=s;
  }
  function dispose(){
    var s=active;if(!s)return;if(w.CactusProgress)w.CactusProgress.suspend();active=null;s.ended=true;
    if(s.stallTimer){clearInterval(s.stallTimer);s.stallTimer=null;}
    if(s.drainTimer){clearTimeout(s.drainTimer);s.drainTimer=null;}
    if(s.loopTimer){clearTimeout(s.loopTimer);s.loopTimer=null;}
    if(s.seekDebounceTimer){clearTimeout(s.seekDebounceTimer);s.seekDebounceTimer=null;}
    if(s.cancelStart)s.cancelStart();
    if(s.cancelResume)s.cancelResume();
    if(s.pending)try{s.pending.abort();}catch(e){}
    if(s.onKey)d.removeEventListener('keydown',s.onKey,false);
    if(s.onSeeking&&s.video)s.video.removeEventListener('seeking',s.onSeeking);
    if(s.video&&s.video._cactusAudio===s.audioAdapter)s.video._cactusAudio=null;
    if(s.video&&s.video._captions){s.video._captions.destroy();s.video._captions=null;}
    if(s.ms&&s.ms.readyState==='open')try{s.ms.endOfStream();}catch(e){}
    if(s.video){try{s.video.pause();s.video.removeAttribute('src');s.video.load();s.video.muted=s.oldMuted;}catch(e){}}
    if(s.url)try{URL.revokeObjectURL(s.url);}catch(e){}
    if(s.label)s.label.hidden=true;
    if(s.panel){s.panel.classList.remove('cactus-browser-vod','cactus-hevc-vod');}
    d.documentElement.classList.remove('modal-open');
  }
  function beginMse(s,first,info){
    var parsed=first;
    var preferredAudio=w.CactusTracks?w.CactusTracks.preferredIndex(parsed.audio,info&&info.audioLanguage):-1;
    var audioIndex=Math.max(0,Math.min((parsed.audio?parsed.audio.length:1)-1,info&&info.audioIndex!=null?Number(info.audioIndex)||0:preferredAudio>=0?preferredAudio:0));
    var video=parsed.video, audio=(!s.noAudio&&!w.__mseNoAudio&&parsed.audio&&parsed.audio.length)?parsed.audio[audioIndex]:null;
    if(!video || !(/^hvc1\./.test(video.codec) || /^avc1\./.test(video.codec)))throw Error('No se identificó códec de vídeo compatible');
    var vMime=codecMime('video',video.codec),aMime=audio?codecMime('audio',audio.codec):null;
    if(!mediaClass || !mediaClass.isTypeSupported || !mediaClass.isTypeSupported(vMime))
      throw Error('Este Samsung no admite el códec en MSE ('+video.codec+').');
    if(audio && (!mediaClass.isTypeSupported || !mediaClass.isTypeSupported(aMime))){
      audio=null;aMime=null;
    }
    s.audioTrackId=audio&&audio.id;
    var tracks=[video].concat(audio?[audio]:[]).filter(Boolean);
    if(!s.panel||!s.video)prepareUi(s,info&&info.title);
    s.audioAdapter={tracks:(parsed.audio||[]).map(function(track){return{lang:track.lang||'und',label:w.CactusTracks?w.CactusTracks.label(track.lang):track.lang||'Idioma no identificado'};}),selected:audioIndex,
      select:function(index){if(!parsed.audio||index<0||index>=parsed.audio.length)return Promise.reject(Error('Pista no disponible'));
        if(index===s.audioAdapter.selected)return Promise.resolve(true);
        var wasPaused=s.video.paused;
        return start(s.source,{title:info&&info.title,resume:s.video.currentTime,pausedAfterStart:wasPaused,mutedAfterStart:s.video.muted,audioIndex:index,audioLanguage:info&&info.audioLanguage,subtitles:s.subtitles,subtitleLanguage:info&&info.subtitleLanguage,subtitleIndex:s.video._captions&&s.video._captions._selected},s.legacyStart);
      }};
    s.video._cactusAudio=s.audioAdapter;
    if(w.CactusTracks){w.CactusTracks.attach(s.video,s.subtitles,function(message){if(message)say(s,message);},info&&info.subtitleIndex!=null?'off':info&&info.subtitleLanguage);
      if(s.video._captions&&info&&info.subtitleIndex!=null)s.video._captions.select(info.subtitleIndex);}
    var resumeTarget=info&&Number(info.resume)>0?Number(info.resume):0;
    var resumeMuted=info&&info.mutedAfterStart!=null?!!info.mutedAfterStart:s.video.muted;
    if(resumeTarget>0)s.video.muted=true;
    s.ms=new mediaClass();s.url=URL.createObjectURL(s.ms);s.video.src=s.url;
    var done=false,myMs=s.ms;
    return new Promise(function(resolve,reject){
      var timeout=setTimeout(function(){bad(Error('El video no comenzó tras 35 segundos. Etapa: '+s.phase));},35000);
      s.cancelStart=function(){if(done)return;done=true;clearTimeout(timeout);reject(Error('Reproducción cancelada'));};
      function complete(){if(done||s.ended)return;done=true;clearTimeout(timeout);s.video.muted=resumeMuted;if(info&&info.pausedAfterStart)s.video.pause();say(s,'reproduciendo / OK pausa / ←→ 10 s / Atrás salir');if(w.CactusProgress)w.CactusProgress.ready();resolve(true);}
      function good(){if(done)return;
        if(resumeTarget>0)resumePrepared(s,resumeTarget,!!(info&&info.pausedAfterStart),resumeMuted).then(complete,bad);
        else complete();
      }
      function bad(e){if(s.ended)return;var errMsg=msg(e);if(/cancelad/i.test(errMsg))return;if(done){say(s,'No se pudo cargar el fragmento: '+errMsg);if(s.label)s.label.hidden=false;w.CactusLastPlayError=errMsg;return;}done=true;clearTimeout(timeout);dispose();reject(Error(errMsg));}
      s.video.addEventListener('playing',good,{once:true});
      s.video.addEventListener('ended',function(){
        if(w.CactusPlaybackActions&&typeof w.CactusPlaybackActions.completed==='function'){
          try{w.CactusPlaybackActions.completed();}catch(_){}
        }
      });
      s.video.addEventListener('error',function(ev){
        if(s.ended||active!==s||s.ms!==myMs)return;
        var ve = s.video.error;
        var errCode = ve ? ve.code : 'unknown';
        var errMsg = ve ? (ve.message || '') : '';
        if(audio && !s.noAudio){
          done=true;clearTimeout(timeout);
          s.video.removeEventListener('playing',good);
          if(s.url)try{URL.revokeObjectURL(s.url);}catch(_){}
          s.noAudio=true;w.__mseNoAudio=true;
          s.started=false;
          console.warn('[CactusHEVC] Audio MSE rechazado (err '+errCode+'), reintentando en modo solo-video');
          beginMse(s,first,info).then(resolve,reject);
          return;
        }
        if(done)return;
        bad(Error('Decodificador rechazó video (err ' + errCode + ': ' + errMsg + ', etapa=' + s.phase + ', lastSb=' + (s.lastSbError||'ninguno') + ', v=' + video.codec + ', a=' + (audio ? audio.codec : 'none') + ')'));
      },{once:true});
      myMs.addEventListener('sourceopen',function(){
        if(done||s.ended||active!==s||s.ms!==myMs||myMs.readyState!=='open')return;
        say(s,'inicializando MSE ('+video.codec+')');
        var vb=myMs.addSourceBuffer(vMime),ab=audio?myMs.addSourceBuffer(aMime):null;
        s.vb=vb; s.ab=ab;
        vb.addEventListener('error',function(){s.lastSbError='VB_ERROR';});
        if(ab)ab.addEventListener('error',function(){s.lastSbError='AB_ERROR';});
        var videoOrigin=video.samples[0].dts;
        var audioOrigin=audio?audio.samples[0].dts:0;
        myMs.duration=s.segments.reduce(function(sum,x){return sum+Math.max(.05,x.duration||0);},0);
        say(s,'append_vb_init');
        bufferAppend(vb,w.CactusFmp4.initSegment(video)).then(function(){
          say(s,'append_ab_init');
          return (ab&&audio)?bufferAppend(ab,w.CactusFmp4.initSegment(audio)):null;
        }).then(function(){
          if(done||s.ended||active!==s)return;
          say(s,'inits_completados');
          var hints={video:{params:video.params,sps:video.sps}};
          var idx=0,sequence=0;
          s.seekGeneration=0;
          var segRetryCount=0;
          var appendRetryCount=0;
          var loopRunning=false;

          function getFwdBuf(){
            if(!s.video||!s.video.buffered||!s.video.buffered.length)return 0;
            var cur=s.video.currentTime,maxE=cur;
            for(var b=0;b<s.video.buffered.length;b++){
              var bSt=s.video.buffered.start(b),bEn=s.video.buffered.end(b);
              if(cur>=bSt-0.5&&cur<=bEn+0.5){
                if(bEn>maxE)maxE=bEn;
              }
            }
            return Math.max(0,maxE-cur);
          }

          // Watchdog contra congelamientos o micro-huecos en Tizen MSE durante series/peliculas
          var lastWatchTime=-1,stallTicks=0;
          s.stallReset=function(){lastWatchTime=-1;stallTicks=-2;};
          s.stallTimer=setInterval(function(){
            if(s.ended||active!==s||s.ms!==myMs||!s.started||!s.video)return;
            if(s.video.paused||s.video.seeking){lastWatchTime=s.video.currentTime;stallTicks=0;return;}
            var cur=s.video.currentTime||0;
            if(Math.abs(cur-lastWatchTime)<0.05){
              stallTicks++;
              if(stallTicks>=3){
                var jumped=false;
                if(s.video.buffered&&s.video.buffered.length){
                  for(var bi=0;bi<s.video.buffered.length;bi++){
                    var bs=s.video.buffered.start(bi),be=s.video.buffered.end(bi);
                    if(bs>cur&&bs<=cur+3.5){
                      try{
                        console.warn('[CactusHEVC] Saltando micro-hueco MSE:',cur.toFixed(2),'->',bs.toFixed(2));
                        s.video.currentTime=bs+0.05;
                        s.video.play().catch(function(){});
                        jumped=true;
                        stallTicks=0;
                      }catch(_){}
                      break;
                    }
                  }
                }
                if(!jumped&&stallTicks>=4){
                  stallTicks=0;
                  var expectedIdx=segmentAt(s.segments,cur);
                  if(idx>expectedIdx+3&&getFwdBuf()<1){
                    console.warn('[CactusHEVC] Buffer atascado lejos del cursor; reajustando idx',idx,'->',expectedIdx);
                    s.seekIndex=Math.max(0,expectedIdx);
                    s.seekGeneration=(s.seekGeneration||0)+1;
                    if(s.pending)try{s.pending.abort();}catch(_){}
                  }
                  if(!loopRunning&&!s.seekDebounceTimer){
                    if(s.drainTimer){clearTimeout(s.drainTimer);s.drainTimer=null;}
                    if(s.loopTimer){clearTimeout(s.loopTimer);s.loopTimer=null;}
                    loop();
                  }else if(s.video.paused===false&&s.video.readyState>=3){
                    try{s.video.play().catch(function(){});}catch(_){}
                  }
                }
              }
            }else{
              lastWatchTime=cur;
              stallTicks=0;
            }
          },1500);

          s.wakeLoop=function(){if(!loopRunning&&!s.seekDebounceTimer)loop();};

          function scheduleLoop(delayMs){
            if(s.loopTimer){clearTimeout(s.loopTimer);s.loopTimer=null;}
            s.loopTimer=setTimeout(function(){s.loopTimer=null;loop();},delayMs);
          }

          function loop(){
            if(loopRunning||s.seekDebounceTimer)return;
            if(done&&!s.started)return;
            if(s.ended||active!==s||s.ms!==myMs)return;
            if(s.seekIndex!=null){idx=s.seekIndex;s.seekIndex=null;segRetryCount=0;appendRetryCount=0;}
            if(idx>=s.segments.length){
              if(myMs.readyState==='open')try{myMs.endOfStream();}catch(e){}
              scheduleLoop(800);
              return;
            }
            loopRunning=true;
            var generation=s.seekGeneration;
            var reqProm=idx===0?Promise.resolve(null):request(s,idx);
            reqProm.then(function(data){
              segRetryCount=0;
              if(s.ended||active!==s||s.ms!==myMs||generation!==s.seekGeneration){loopRunning=false;return loop();}
              var parsedSegment;
              try{
                parsedSegment=idx===0?first:w.CactusFmp4.demux(new Uint8Array(data),hints);
              }catch(demuxErr){
                console.warn('[CactusHEVC] Error al demuxar segmento '+idx+':',demuxErr);
                loopRunning=false;
                idx++;
                return loop();
              }
              if(!parsedSegment||!parsedSegment.video){
                loopRunning=false;
                idx++;
                return loop();
              }
              hints={video:{params:(parsedSegment.video&&parsedSegment.video.params)||hints.video.params||video.params,sps:(parsedSegment.video&&parsedSegment.video.sps)||hints.video.sps||video.sps}};
              var v=parsedSegment.video,a=(ab&&parsedSegment.audio)?parsedSegment.audio.filter(function(track){return track.id===s.audioTrackId;})[0]:null;
              var videoBase=Math.max(0,Math.round(v.samples[0].dts-videoOrigin));
              say(s,'convirtiendo segmento '+(idx+1)+'/'+s.segments.length);
              sequence++;
              var appProm=bufferAppend(vb,w.CactusFmp4.mediaSegment(v,sequence,videoBase));
              if(ab&&a&&a.samples&&a.samples.length){
                var audioBase=Math.max(0,Math.round(a.samples[0].dts-audioOrigin));
                appProm=appProm.then(function(){
                  return bufferAppend(ab,w.CactusFmp4.mediaSegment(a,sequence,audioBase));
                });
              }
              return appProm.then(function(){
                loopRunning=false;
                appendRetryCount=0;
                if(s.ended||active!==s||s.ms!==myMs)return;
                if(generation!==s.seekGeneration)return loop();
                if(!s.started){
                  s.started=true;
                  say(s,'primeros cuadros incorporados a MSE');
                  s.video.play().catch(function(e){say(s,'pulsa OK para iniciar ('+msg(e)+')');});
                }
                idx++;
                function waitDrain(){
                  if(s.ended||active!==s||s.ms!==myMs||s.seekIndex!=null||idx>=s.segments.length)return finishDrain();
                  var fwd=getFwdBuf();
                  if(s.video.readyState>=1&&fwd>16){
                    s.drainTimer=setTimeout(waitDrain,350);
                  }else{
                    finishDrain();
                  }
                }
                function finishDrain(){
                  s.drainTimer=null;
                  if(s.ended||active!==s||s.ms!==myMs)return;
                  bufferPrune(vb,s.video.currentTime,false).then(function(){
                    return ab?bufferPrune(ab,s.video.currentTime,false):null;
                  }).then(loop,loop);
                }
                waitDrain();
              },function(appendErr){
                loopRunning=false;
                if(s.ended||active!==s||s.ms!==myMs)return;
                if(generation!==s.seekGeneration)return loop();
                appendRetryCount++;
                console.warn('[CactusHEVC] Fallo al incorporar segmento '+idx+' (intento '+appendRetryCount+'):',appendErr);
                return bufferPrune(vb,s.video.currentTime,true).then(function(){
                  return ab?bufferPrune(ab,s.video.currentTime,true):null;
                }).then(function(){
                  if(s.ended||active!==s||s.ms!==myMs)return;
                  if(!s.started){bad(appendErr);return;}
                  if(appendRetryCount<5){
                    scheduleLoop(450*appendRetryCount);
                    return;
                  }
                  appendRetryCount=0;
                  idx++;
                  scheduleLoop(300);
                });
              });
            },function(e){
              loopRunning=false;
              if(s.ended||active!==s||s.ms!==myMs)return;
              if(generation!==s.seekGeneration)return loop();
              console.warn('[CactusHEVC] Fallo al pedir segmento '+idx+':',e);
              segRetryCount++;
              if(segRetryCount===2&&s.sessionOpts){
                renewSession(s).catch(function(){});
              }
              if(segRetryCount<5){
                scheduleLoop(Math.min(4000,900*segRetryCount));
                return;
              }
              segRetryCount=0;
              idx++;
              scheduleLoop(300);
            });
          }
          loop();
        }).catch(bad);
      },{once:true});
    });
  }
  function start(player,info,legacyStart){
    if(!player||!player.segments||!player.segments.length) return legacyStart(player,info);
    if(!w.CactusFmp4 || !mediaClass)return legacyStart(player,info);
    var s={segments:player.segments,session:player.session,sessionOpts:player.sessionOpts,source:player,legacyStart:legacyStart,subtitles:info&&info.subtitles||player.subtitles||[],pending:null,_renewing:null,phase:'consultando segmento inicial',ended:false};
    return request(s,0).then(function(data){
      if(!codeType(data))throw Error('El primer fragmento no parece MPEG-TS');
      var parsed;
      try{parsed=w.CactusFmp4.demux(new Uint8Array(data));}
      catch(e){return legacyStart(player,info);}
      if(!parsed||!parsed.video||!(/^hvc1\./.test(parsed.video.codec)||/^avc1\./.test(parsed.video.codec)))return legacyStart(player,info);
      return beginMse(s,parsed,info);
    });
  }
  w.CactusHEVC={start:start,stop:dispose,isActive:function(){return !!active&&!active.ended;},segmentAt:segmentAt,version:'1.4.1'};
})(window,document);
