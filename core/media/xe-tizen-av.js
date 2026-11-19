/* Xuper Eclectic Tizen AVPlay Engine v2.0.19 */
(function (window, document) {
  'use strict';
  var av = null, obj = null, active = false, session = 0, preparingSession = 0, tick = null, hideTimer = null, toastTimer = null;
  var panel = null, ui = null, pop = null, toast = null, progress = null, playing = false, busy = false;
  var isLive = false, mode = '', currentError = null, selected = 0, menu = null, menuIndex = 0;
  var audioTracks = [], subtitleTracks = [], currentAudio = -1, currentSubtitle = -1, duration = 0;
  var externalCaptions=null,captionClock=null,captionTimer=null,imageCaptionWarned=false;
  var SAMPLE = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
  var btns = [], lastSeekAt = 0, queuedSeek = null, seekTarget = 0, seekTimer = null, seekTimeout = null, lastPosition = 0, seekingResetStamp = 0;
  function el(id) {
    if (id === 'player') return document.getElementById('screen-player') || document.getElementById('player');
    if (id === 'video') return document.getElementById('player-video') || document.getElementById('video');
    return document.getElementById(id);
  }
  function available() { return !!(window.webapis && window.webapis.avplay && typeof window.webapis.avplay.open === 'function'); }
  function errorText(err) {
    if (!err) return 'Error desconocido';
    if (typeof err === 'string') return err;
    return (String(err.message || err.name || err.type || err)).slice(0, 180);
  }
  function safely(fn, fallback) { try { return fn(); } catch (e) { return fallback; } }
  function state() { return av ? safely(function(){ return av.getState(); }, 'NONE') : 'NONE'; }
  function livePlaying() { return active && (state() === 'PLAYING' || state() === 'PAUSED'); }
  function fmt(ms) {
    var sec = Math.max(0, Math.floor(Number(ms || 0) / 1000));
    var h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
    function f(n){ return (n < 10 ? '0' : '') + n; }
    return h ? h + ':' + f(m) + ':' + f(s) : m + ':' + f(s);
  }
  function isMiniPanel() {
    var p = panel || el('screen-player') || el('player');
    if (p && p.classList.contains('is-mini')) return true;
    var det = document.getElementById('screen-detail');
    return !!(det && det.classList.contains('is-active') && (!p || !p.classList.contains('is-active')));
  }
  function applyDisplayRect() {
    if (!av || !active) return;
    try {
      if (isMiniPanel()) av.setDisplayRect(1075, 50, 765, 430);
      else av.setDisplayRect(0, 0, 1920, 1080);
    } catch (_) {}
  }
  function syncDisplayMode() {
    panel = panel || el('screen-player') || el('player');
    applyDisplayRect();
    if (!active) return;
    setTimeout(applyDisplayRect, 50);
    if (isMiniPanel()) {
      hideHUD();
      if (toast) toast.hidden = true;
      closeMenu();
    } else if (playing) {
      if (toast) toast.hidden = true;
    }
  }
  function stylesheet() {
    if (el('cactus-osd-style')) return;
    var s=document.createElement('style'); s.id='cactus-osd-style';
    s.textContent = '#screen-player.cactus-av-active #player-ui,#player.cactus-av-active #player-ui{display:none!important}' +
    '#screen-player.cactus-av-live #cactus-osd,#screen-player.cactus-av-live #cactus-toast,#player.cactus-av-live #cactus-osd,#player.cactus-av-live #cactus-toast{display:none!important}' +
    '#screen-player.cactus-av-active:not(.is-mini) #player-video,#screen-player.cactus-av-active:not(.is-mini) #player-vod-infobar{display:none!important}' +
    '#screen-player.is-mini #cactus-osd,#screen-player.is-mini #cactus-track-menu,#screen-player.is-mini #cactus-toast{display:none!important}' +
    '#screen-player.cactus-av-active #cactus-osd,#player.cactus-av-active #cactus-osd{box-sizing:border-box;position:absolute;left:0;right:0;bottom:0;z-index:15;color:#f5faff;font-family:Arial,Helvetica,sans-serif;background:linear-gradient(0deg,rgba(5,10,22,.98),rgba(5,12,27,.9) 70%,rgba(5,12,27,0));padding:90px 5% 3%;transition:opacity .2s ease}' +
    '#screen-player #cactus-osd[hidden],#screen-player #cactus-track-menu[hidden],#screen-player #cactus-toast[hidden],#player #cactus-osd[hidden],#player #cactus-track-menu[hidden],#player #cactus-toast[hidden]{display:none!important}' +
    '.cactus-osd-title{font-size:28px;font-weight:700;margin:0 0 15px;color:#f8fdff}' +
    '.cactus-osd-line{display:-webkit-flex;display:flex;-webkit-align-items:center;align-items:center;margin-bottom:17px}' +
    '#cactus-progress{-webkit-flex:1;flex:1;min-width:0;margin-right:16px;height:22px;cursor:pointer}' +
    '#cactus-progress:disabled{opacity:.28;cursor:default}' +
    '.cactus-osd-clock{font-size:21px;font-variant-numeric:tabular-nums;white-space:nowrap}' +
    '.cactus-osd-actions{display:-webkit-flex;display:flex;-webkit-flex-wrap:wrap;flex-wrap:wrap;-webkit-align-items:center;align-items:center}' +
    '.cactus-osd-actions button,.cactus-track-row{background:rgba(22,38,58,.94);border:2px solid #466277;color:white;font-size:21px;font-weight:600;padding:12px 22px;margin:0 12px 10px 0;border-radius:12px;min-height:55px}' +
    '.cactus-osd-actions button:disabled{opacity:.3}' +
    '.cactus-osd-actions button:focus,.cactus-osd-actions button.cactus-selected,.cactus-track-row:focus,.cactus-track-row.cactus-selected{outline:3px solid #42f8dc;outline-offset:2px;background:#167d8a;color:white;box-shadow:0 0 18px rgba(36,233,215,.3)}' +
    '.cactus-osd-tip{font-size:16px;color:#c7d7e7;margin:15px 0 0}' +
    '#cactus-track-menu{position:absolute;left:18%;right:18%;top:12%;bottom:9%;z-index:30;box-sizing:border-box;background:rgba(8,17,31,.98);border:2px solid #3eeed4;border-radius:18px;padding:3% 4%;overflow-y:auto;color:white;font-family:Arial,sans-serif;box-shadow:0 0 100px #000}' +
    '#cactus-track-menu h2{font-size:32px;margin:0 0 20px}' +
    '#cactus-track-menu .cactus-track-row{display:block;width:100%;text-align:left;margin:12px 0}' +
    '#cactus-track-menu .cactus-track-help{color:#b9c8dc;font-size:18px;margin-top:20px}' +
    '#cactus-toast{position:absolute;left:50%;top:30%;-webkit-transform:translateX(-50%);transform:translateX(-50%);z-index:40;color:white;background:rgba(7,21,36,.95);border:2px solid #42e7d6;border-radius:12px;padding:15px 25px;font:600 26px Arial,sans-serif;text-align:center;max-width:80%}';
    document.head.appendChild(s);
  }
  function mk(tag, cls, txt) { var v = document.createElement(tag); if (cls) v.className=cls; if (txt !== undefined) v.textContent=txt; return v; }
  function button(text, handler){ var b=mk('button','cactus-action',text); b.type='button'; b.onclick=handler; return b; }
  function buildUI() {
    stylesheet();
    panel=el('screen-player')||el('player'); if (!panel) throw Error('No existe el panel de reproduccion');
    ui=el('cactus-osd');
    if (!ui) {
      ui=mk('div'); ui.id='cactus-osd';ui.hidden=true;ui.setAttribute('aria-label','Controles del reproductor');
      var title=mk('div','cactus-osd-title');title.id='cactus-osd-title';ui.appendChild(title);
      var line=mk('div','cactus-osd-line');
      progress=mk('input');progress.type='range';progress.min='0';progress.max='100';progress.step='1';progress.value='0';progress.id='cactus-progress';progress.setAttribute('aria-label','Posición de reproducción');
      progress.addEventListener('change',function(){ if(!isLive && duration>0) seekAbsolute(Number(progress.value)*1000); });
      var clock=mk('span','cactus-osd-clock');clock.id='cactus-clock';
      line.appendChild(progress);line.appendChild(clock);ui.appendChild(line);
      var actions=mk('div','cactus-osd-actions');
      btns=[
        button('❚❚ Pausar',toggle),
        button('◀ −10 s',function(){seekBy(-10000);}),
        button('+10 s ▶',function(){seekBy(10000);}),
        button('Audio',function(){openMenu('AUDIO');}),
        button('Subtítulos',function(){openMenu('TEXT');}),
        button('← Volver',exitPlayer),
        button('↺ Desde el inicio',function(){seekAbsolute(0);}),
        button('Siguiente episodio ▶',function(){var api=window.CactusPlaybackActions;if(!api||!api.next)return;
          btns[7].disabled=true;Promise.resolve(api.next()).then(updateActions,function(){showToast('No se pudo abrir el siguiente episodio');updateActions();});})
      ];
      btns.forEach(function(b,index){b.addEventListener('focus',function(){selected=index;highlight(false);});actions.appendChild(b); }); ui.appendChild(actions);
      ui.appendChild(mk('div','cactus-osd-tip','↑ Barra de progreso · ←/→ Elegir o mover · ↓ Botones · OK Confirmar · Atrás Ocultar / salir'));
      panel.appendChild(ui);
    } else { progress=el('cactus-progress'); btns=Array.prototype.slice.call(ui.querySelectorAll('.cactus-action')); }
    pop=el('cactus-track-menu');
    if (!pop){ pop=mk('section');pop.id='cactus-track-menu';pop.hidden=true;pop.setAttribute('aria-label','Seleccionar pista');panel.appendChild(pop); }
    toast=el('cactus-toast');
    if(!toast){toast=mk('div');toast.id='cactus-toast';toast.hidden=true;toast.setAttribute('role','status');panel.appendChild(toast);}
  }
  function showToast(msg, ms){
    if(!toast||isMiniPanel()||isLive)return;
    toast.textContent=msg;toast.hidden=false;clearTimeout(toastTimer);
    toastTimer=setTimeout(function(){if(toast)toast.hidden=true;},ms||2100);
  }
  function updateActions(){
    if(!btns.length)return;
    btns[0].textContent=playing?'❚❚ Pausar':'▶ Continuar';
    btns[1].disabled=btns[2].disabled=isLive||duration<=1000;
    if(progress)progress.disabled=isLive||duration<=1000;
    if(btns[6])btns[6].hidden=isLive||duration<=1000;
    var next=window.CactusPlaybackActions&&window.CactusPlaybackActions.getNext();
    if(btns[7]){btns[7].hidden=!next;btns[7].disabled=!next;if(next)btns[7].textContent='Siguiente: Ep '+next.number+' ▶';}
  }
  function dispatchTimeUpdate(target){
    if(!target||!target.dispatchEvent)return;
    try{
      var ev=document.createEvent('Event');
      ev.initEvent('timeupdate',false,false);
      target.dispatchEvent(ev);
    }catch(e){
      try{target.dispatchEvent(new Event('timeupdate'));}catch(e2){}
    }
  }
  function updateProgress(position){
    if(!active||!ui)return;
    duration = isLive ? 0 : Number(safely(function(){return av.getDuration();},duration))||0;
    var now=typeof position==='number' ? position : (queuedSeek!==null ? queuedSeek : (busy ? seekTarget : (Number(safely(function(){return av.getCurrentTime();},0))||0)));
    lastPosition=now;if(!isLive&&window.CactusProgress)window.CactusProgress.nativeTick(now/1000,duration/1000);
    if(captionClock){captionClock.currentTime=now/1000;dispatchTimeUpdate(captionClock);}
    if(progress){progress.max=String(Math.max(1,Math.floor(duration/1000)));progress.value=String(Math.max(0,Math.min(Math.floor(now/1000),Math.floor(duration/1000))));}
    var clock=el('cactus-clock');if(clock)clock.textContent=isLive?'● EN VIVO':fmt(now)+' / '+(duration>0?fmt(duration):'--:--');
    updateActions();
    if(window.__xuperUpdateProgress){
      try{window.__xuperUpdateProgress(now/1000, duration/1000);}catch(e){}
    }
  }
  function highlight(focus){
    btns.forEach(function(b,i){ b.classList.toggle('cactus-selected',i===selected);});
    if(focus&&btns[selected]&&!btns[selected].disabled){try{btns[selected].focus();}catch(e){}}
  }
  function showHUD(focus){
    if(!active||isMiniPanel()||isLive)return;
    ui.hidden=false;panel.classList.remove('idle');
    if(focus){if(btns[selected]&&btns[selected].disabled)selected=0;highlight(true);}else highlight(false);
    scheduleHide();
  }
  function hideHUD(){if(!ui)return;ui.hidden=true;clearTimeout(hideTimer);}
  function scheduleHide(){
    clearTimeout(hideTimer);
    if(playing&&!menu)hideTimer=setTimeout(function(){if(active&&!menu)hideHUD();},6500);
  }
  function changeSelection(delta){
    if(!active)return;
    if(ui.hidden){showHUD(true);return;}
    for(var n=0;n<btns.length;n++){
      selected=(selected+delta+btns.length)%btns.length;
      if(!btns[selected].disabled&&!btns[selected].hidden)break;
    }
    highlight(true);scheduleHide();
  }
  function toggle(){
    if(!livePlaying()) {showToast('El video aun no esta preparado');return;}
    try {
      if(state()==='PLAYING'){av.pause();playing=false;showToast('Pausado');}
      else {av.play();playing=true;if(window.__onStreamPlaying)window.__onStreamPlaying();if(!isLive&&window.CactusProgress)window.CactusProgress.ready(true);showToast('Reproduciendo');}
      updateActions();showHUD(false);
    }catch(e){showToast('No se pudo pausar: '+errorText(e),4000);}
  }
  function seekBy(delta){
    if(isLive||duration<=1000){showToast('Este canal no permite adelantar ni retroceder',3000);return;}
    var now=queuedSeek!==null?queuedSeek:(busy?seekTarget:Number(safely(function(){return av.getCurrentTime();},0))||0);
    seekAbsolute(now+delta);
  }
  function seekAbsolute(value){
    if(!active||isLive||duration<=1000)return;
    var target=Math.max(1000,Math.min(duration-1000,Math.round(value)));
    clearCaption();
    lastPosition=target;
    seekingResetStamp++;
    if(captionClock){captionClock.currentTime=target/1000;dispatchTimeUpdate(captionClock);}
    if(busy||Date.now()-lastSeekAt<250){
      queuedSeek=target;clearTimeout(seekTimer);
      if(!busy)seekTimer=setTimeout(function(){var next=queuedSeek;queuedSeek=null;if(next!==null)seekAbsolute(next);},Math.max(1,250-(Date.now()-lastSeekAt)));
      return;
    }
    lastSeekAt=Date.now();
    busy=true;seekTarget=target;var my=session,finished=false;
    function finish(error){
      if(my!==session||finished)return;finished=true;clearTimeout(seekTimeout);busy=false;
      clearCaption();
      if(error)showToast('No se pudo cargar esa posición: '+errorText(error),4500);
      else{updateProgress(target);showToast('Posición: '+fmt(target));}
      if(queuedSeek!==null){var next=queuedSeek;queuedSeek=null;if(next!==target)seekAbsolute(next);}
    }
    seekTimeout=setTimeout(function(){finish('El servidor no respondió al salto. Prueba otra posición.');},15000);
    try{av.seekTo(target,function(){finish();},finish);}
    catch(e){finish(e);}
    showHUD(false);
  }
  function parseExtra(value){
    if(!value)return{};
    if(typeof value==='object')return value;
    try{return JSON.parse(String(value));}catch(e){return{};}
  }
  function humanLanguage(lang){
    if(window.CactusTracks && typeof window.CactusTracks.label==='function')return window.CactusTracks.label(lang);
    var code=String(lang||'').toLowerCase().replace(/_/g,'-').trim();
    if(/^(pt-br|por-br|brasil|brazil)/.test(code))return 'Portugués (Brasil)';
    if(/^(pt-pt|por-pt|portugal)/.test(code))return 'Portugués (Portugal)';
    if(/^(pt|por|portuguese|portugu[eé]s)/.test(code))return 'Portugués';
    if(/^(es-es|castellano|esp|spain|españa)/.test(code))return 'Español España';
    if(/^(es-(419|mx|ar|co|pe|cl|lat)|esl|lat|latino)/.test(code))return 'Español Latino';
    if(/^(es|spa|spanish|español)$/.test(code))return 'Español';
    var names={es:'Español',spa:'Español',esp:'Español España','es-es':'Español España',esl:'Español Latino','es-lat':'Español Latino',en:'Inglés',eng:'Inglés',fr:'Francés',fre:'Francés',fra:'Francés',ja:'Japonés',jpn:'Japonés',de:'Alemán',ger:'Alemán',deu:'Alemán',ita:'Italiano',it:'Italiano',ko:'Coreano',kor:'Coreano',und:'Idioma no identificado'};
    return names[code]||names[code.split('-')[0]]||String(lang||'Idioma no identificado');
  }
  function tracks(){
    audioTracks=[];subtitleTracks=[];
    if(!livePlaying())return;
    var arr=safely(function(){return av.getTotalTrackInfo();},[]);if(!Array.isArray(arr))arr=[];
    arr.forEach(function(t){
      if(!t||typeof t!=='object')return;
      var type=String(t.type||'').toUpperCase();
      if(type!=='AUDIO'&&type!=='TEXT')return;
      var extra=parseExtra(t.extra_info);
      var lang=extra.language||extra.track_lang||extra.lang||'';
      var item={index:Number(t.index),name:window.CactusTracks?window.CactusTracks.label(lang):humanLanguage(lang),details:extra};
      if(!Number.isFinite(item.index))return;
      (type==='AUDIO'?audioTracks:subtitleTracks).push(item);
    });
    var chosen=safely(function(){return av.getCurrentStreamInfo();},[]);
    if(Array.isArray(chosen))chosen.forEach(function(t){if(!t)return;if(t.type==='AUDIO')currentAudio=Number(t.index);if(t.type==='TEXT'&&typeof currentSubtitle!=='string')currentSubtitle=Number(t.index);});
  }
  function clearCaption(){
    clearTimeout(captionTimer);
    var layers=[el('subtitle-layer'),el('player-subtitles')];
    for(var li=0;li<layers.length;li++){
      var lyr=layers[li];
      if(lyr){lyr.innerHTML='';lyr.hidden=true;lyr.style.display='none';}
    }
  }
  function renderSubtitle(ms,text,type){
    if(isLive||window.__subtitlesEnabled===false||busy||queuedSeek!==null){
      clearCaption();
      return;
    }
    if(String(type)==='1'){clearCaption();if(!imageCaptionWarned){imageCaptionWarned=true;showToast('Esta pista usa subtítulos gráficos no compatibles con este modo.',4500);}return;}
    clearTimeout(captionTimer);
    var content=String(text||'').replace(/<br\s*\/?\s*>/gi,'\n');
    if(window.CollateralSubtitles){var parsed=window.CollateralSubtitles.parse('1\n00:00:00,000 --> 00:00:10,000\n'+content);content=parsed.length?parsed[0].text:'';}else content=content.replace(/<[^>]*>/g,'');
    var layers=[el('subtitle-layer'),el('player-subtitles')];
    for(var li=0;li<layers.length;li++){
      var lyr=layers[li];
      if(lyr){
        lyr.innerHTML=content?'<span class="player-subtitles-text">'+content+'</span>':'';
        lyr.hidden=!content;
        lyr.style.display=content?'block':'none';
      }
    }
    captionTimer=setTimeout(clearCaption,Math.max(50,Number(ms)||3000));
  }
  function closeMenu(){
    menu=null;menuIndex=0;if(pop)pop.hidden=true;
    showHUD(true);
  }
  function openMenu(type){
    if(!active)return;
    tracks();menu=type;menuIndex=0;
    while(pop.firstChild)pop.removeChild(pop.firstChild);pop.hidden=false;
    pop.appendChild(mk('h2','',type==='AUDIO'?'Seleccionar audio':'Seleccionar subtítulos'));
    var options=[];
    if(type==='TEXT')options.push({index:-1,name:'Desactivados'});
    var list=type==='AUDIO'?audioTracks:subtitleTracks;
    list.forEach(function(t,i){options.push({index:t.index,name:t.name+' · Pista '+(i+1)});});
    if(type==='TEXT'&&externalCaptions)externalCaptions.tracks.forEach(function(track,index){options.push({index:'external:'+index,name:track.label||track.lang});});
    if(!options.length) options.push({index:null,name:'No hay pistas adicionales en este contenido'});
    options.forEach(function(o,i){
      var selectedTrack=type==='AUDIO'?currentAudio:currentSubtitle;
      var b=mk('button','cactus-track-row',(o.index===selectedTrack?'✓ ':'')+o.name);
      b.type='button';b.disabled=o.index===null;
      b.onclick=function(){menuIndex=i;chooseTrack();};
      pop.appendChild(b);
    });
    pop.appendChild(mk('div','cactus-track-help','↑ ↓ selecciona · OK confirma · Atrás regresa al reproductor'));
    pop._options=options;
    var match=options.findIndex(function(o){return o.index===(type==='AUDIO'?currentAudio:currentSubtitle);});
    menuIndex=match>=0?match:0;
    highlightMenu();clearTimeout(hideTimer);
  }
  function highlightMenu(){
    if(!pop)return;
    var buttons=pop.querySelectorAll('.cactus-track-row');
    Array.prototype.forEach.call(buttons,function(b,i){b.classList.toggle('cactus-selected',i===menuIndex);});
    if(buttons[menuIndex]){try{buttons[menuIndex].focus();}catch(e){}}
  }
  function moveMenu(delta){
    var buttons=pop.querySelectorAll('.cactus-track-row');
    if(!buttons.length)return;
    menuIndex=(menuIndex+delta+buttons.length)%buttons.length;
    highlightMenu();
  }
  function chooseTrack(){
    var item=pop._options&&pop._options[menuIndex]; if(!item||item.index===null)return;
    try{
      if(menu==='AUDIO'){
        if(state()!=='PLAYING'){showToast('Continúa la reproducción antes de cambiar de audio',4200);return;}
        av.setSelectTrack('AUDIO',item.index); currentAudio=item.index;
      }else{
        imageCaptionWarned=false;clearCaption();if(externalCaptions)externalCaptions.select(-1);
        if(typeof item.index==='string'&&item.index.indexOf('external:')===0){av.setSilentSubtitle(true);currentSubtitle=item.index;externalCaptions.select(Number(item.index.slice(9)));}
        else if(item.index===-1){av.setSilentSubtitle(true);currentSubtitle=-1;}
        else{av.setSilentSubtitle(true);av.setSelectTrack('TEXT',item.index);currentSubtitle=item.index;}
      }
      closeMenu();showToast('Pista seleccionada: '+item.name,2400);
    }catch(e){showToast('No disponible en este video: '+errorText(e),4200);}
  }
  function exitPlayer(){
    if(typeof window.__xuperExitPlayer==='function'){window.__xuperExitPlayer();return;}
    var close=el('player-close'); if(close&&typeof close.onclick==='function')close.click();else stop();
  }
  function keydown(e){
    if(!active||e.metaKey||e.ctrlKey||e.altKey||isMiniPanel())return;
    if(isLive && !menu)return;
    var code=e.keyCode||e.which||0;var key=e.key||'';
    var back=code===10009||code===461||code===27||code===8||key==='Escape'||key==='Backspace';
    var enter=code===13||key==='Enter';
    var up=code===38||key==='ArrowUp';var down=code===40||key==='ArrowDown';
    var left=code===37||key==='ArrowLeft';var right=code===39||key==='ArrowRight';
    var handled=back||enter||up||down||left||right||[10252,415,19,412,417,413].indexOf(code)>=0;
    if(!handled)return;
    // Conserva la navegacion completa en vivo (canales, lista interna con izq, salir con der/atras, etc.)
    if(isLive && !menu && (up||down||left||right||enter||back))return;
    e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();
    if(back){
      if(e.repeat)return;
      if(menu){closeMenu();return;}
      if(!ui.hidden){hideHUD();return;}
      exitPlayer();return;
    }
    if(code===10252){toggle();return;}
    if(code===415){if(!playing)toggle();return;}
    if(code===19){if(playing)toggle();return;}
    if(code===412){seekBy(-10000);return;}
    if(code===417){seekBy(10000);return;}
    if(code===413){exitPlayer();return;}
    if(menu){
      if(up||left)moveMenu(-1);
      else if(down||right)moveMenu(1);
      else if(enter)chooseTrack();
      return;
    }
    if(progress&&!progress.disabled){
      if(document.activeElement===progress){
        if(left||right){seekBy((right?1:-1)*Math.max(10000,duration/100));return;}
        if(down||enter){highlight(true);scheduleHide();return;}
      }
      if(up){showHUD(false);progress.focus();scheduleHide();return;}
    }
    if(enter){
      if(ui.hidden){selected=0;showHUD(true);}
      else if(btns[selected]&&!btns[selected].disabled)btns[selected].click();
      return;
    }
    if(left||right){changeSelection(left?-1:1);return;}
    if(up||down){changeSelection(up?-1:1);}
  }
  function registerMediaKeys(){
    try{
      if(window.tizen&&window.tizen.tvinputdevice){
        var dev=window.tizen.tvinputdevice;
        ['MediaPlayPause','MediaPlay','MediaPause','MediaRewind','MediaFastForward','MediaStop'].forEach(function(k){try{dev.registerKey(k);}catch(e){}});
      }
    }catch(e){}
  }
  function keepScreenOn() {
    try {
      if (window.webapis && window.webapis.appcommon && typeof window.webapis.appcommon.setScreenSaver === 'function') {
        window.webapis.appcommon.setScreenSaver(window.webapis.appcommon.AppCommonScreenSaverState.SCREEN_SAVER_OFF, function(){}, function(){});
      }
    } catch(_) {}
    try {
      if (window.tizen && window.tizen.power && typeof window.tizen.power.request === 'function') {
        window.tizen.power.request('SCREEN', 'SCREEN_NORMAL');
      }
    } catch(_) {}
  }
  function restoreScreenSaver() {
    try {
      if (window.webapis && window.webapis.appcommon && typeof window.webapis.appcommon.setScreenSaver === 'function') {
        window.webapis.appcommon.setScreenSaver(window.webapis.appcommon.AppCommonScreenSaverState.SCREEN_SAVER_ON, function(){}, function(){});
      }
    } catch(_) {}
    try {
      if (window.tizen && window.tizen.power && typeof window.tizen.power.release === 'function') {
        window.tizen.power.release('SCREEN');
      }
    } catch(_) {}
  }
  function isX86Emulator(){
    try{
      var plat=String((typeof navigator!=='undefined'&&navigator.platform)||'');
      var ua=String((typeof navigator!=='undefined'&&navigator.userAgent)||'');
      if(/x86|i\d86|amd64|wow64|emul/i.test(plat+' '+ua))return true;
      var pi=window.webapis&&window.webapis.productinfo;
      var rm=pi&&typeof pi.getRealModel==='function'?String(pi.getRealModel()||''):'';
      var mc=pi&&typeof pi.getModelCode==='function'?String(pi.getModelCode()||''):'';
      if(/emulator|sdk|qemu/i.test(rm+' '+mc))return true;
      if(!plat&&!rm&&!mc&&/Tizen/i.test(ua))return true;
    }catch(_){}
    return false;
  }
  function resolveRelUrl(base,rel){
    try{return new URL(rel,base).href;}catch(_){}
    if(/^https?:\/\//i.test(rel))return rel;
    var m=/^(https?:\/\/[^\/]+)(\/.*)?$/i.exec(base);
    if(!m)return rel;
    if(rel.charAt(0)==='/')return m[1]+rel;
    var p=m[2]||'/';var idx=p.lastIndexOf('/');
    return m[1]+(idx>=0?p.slice(0,idx+1):'/')+rel;
  }
  function firstM3u8Uri(text,baseUrl){
    var lines=String(text||'').split(/\r?\n/);
    for(var i=0;i<lines.length;i++){
      var l=lines[i].trim();
      if(!l||l.charAt(0)==='#')continue;
      return resolveRelUrl(baseUrl,l);
    }
    return '';
  }
  function scanTsMpeg2Only(buf){
    if(!buf||buf.length<376)return false;
    var start=-1;
    for(var i=0;i<Math.min(buf.length-376,2048);i++){
      if(buf[i]===0x47&&buf[i+188]===0x47&&buf[i+376]===0x47){start=i;break;}
    }
    if(start<0)return false;
    var pmtPid=-1;
    for(var o=start;o+188<=buf.length;o+=188){
      if(buf[o]!==0x47)continue;
      var pid=((buf[o+1]&0x1f)<<8)|buf[o+2];
      var pusi=(buf[o+1]&0x40)!==0;
      var afc=(buf[o+3]>>4)&3;
      if(!pusi||(afc!==1&&afc!==3))continue;
      var pos=o+4;
      if(afc===3){var al=buf[pos];pos+=1+al;}
      if(pos>=o+188)continue;
      var ptr=buf[pos];pos+=1+ptr;
      if(pos+8>=o+188)continue;
      if(pid===0&&pmtPid<0&&buf[pos]===0x00){
        var patLen=(((buf[pos+1]&0x0f)<<8)|buf[pos+2])+3;
        var patEnd=Math.min(o+188,pos+patLen-4);
        for(var p=pos+8;p+4<=patEnd;p+=4){
          var prog=(buf[p]<<8)|buf[p+1];
          if(prog!==0){pmtPid=((buf[p+2]&0x1f)<<8)|buf[p+3];break;}
        }
      }else if(pmtPid>=0&&pid===pmtPid&&buf[pos]===0x02){
        var pmtLen=(((buf[pos+1]&0x0f)<<8)|buf[pos+2])+3;
        var pil=((buf[pos+10]&0x0f)<<8)|buf[pos+11];
        var esPos=pos+12+pil;
        var esEnd=Math.min(o+188,pos+pmtLen-4);
        var hasMpeg2=false,hasAvcOrHevc=false;
        while(esPos+5<=esEnd){
          var st=buf[esPos];
          if(st===0x01||st===0x02)hasMpeg2=true;
          if(st===0x1b||st===0x24)hasAvcOrHevc=true;
          var esInfo=((buf[esPos+3]&0x0f)<<8)|buf[esPos+4];
          esPos+=5+esInfo;
        }
        return hasMpeg2&&!hasAvcOrHevc;
      }
    }
    return false;
  }
  function fetchSliceBytes(url,maxBytes,headersObj,timeoutMs){
    return new Promise(function(resolve){
      if(typeof fetch!=='function'){resolve(null);return;}
      var ctrl=typeof AbortController==='function'?new AbortController():null;
      var done=false;
      var timer=setTimeout(function(){if(!done){done=true;try{if(ctrl)ctrl.abort();}catch(_){}resolve(null);}},timeoutMs||2200);
      var hdrs={};
      var hasCustomHdr=false;
      if(headersObj&&typeof headersObj==='object'){
        for(var k in headersObj){
          if(Object.prototype.hasOwnProperty.call(headersObj,k)&&headersObj[k]&&!/^(host|range|connection|content-length|user-agent|referer|origin)$/i.test(k)){hdrs[k]=headersObj[k];hasCustomHdr=true;}
        }
      }
      var fetchOpts={method:'GET',signal:ctrl?ctrl.signal:undefined};
      if(hasCustomHdr)fetchOpts.headers=hdrs;
      fetch(url,fetchOpts).then(function(res){
        if(!res||!res.ok){clearTimeout(timer);if(!done){done=true;resolve(null);}return;}
        if(!res.body||typeof res.body.getReader!=='function'){
          return res.arrayBuffer().then(function(ab){
            clearTimeout(timer);
            if(!done){done=true;resolve(new Uint8Array(ab.slice(0,maxBytes||65536)));}
          });
        }
        var reader=res.body.getReader(),chunks=[],total=0,limit=maxBytes||65536;
        function finish(){
          clearTimeout(timer);
          if(done)return;done=true;
          try{reader.cancel().catch(function(){});}catch(_){}
          try{if(ctrl)ctrl.abort();}catch(_){}
          var out=new Uint8Array(Math.min(total,limit)),off=0;
          for(var i=0;i<chunks.length&&off<out.length;i++){
            var take=Math.min(chunks[i].length,out.length-off);
            out.set(chunks[i].subarray(0,take),off);off+=take;
          }
          resolve(out);
        }
        function pump(){
          reader.read().then(function(r){
            if(done)return;
            if(r.done){finish();return;}
            if(r.value&&r.value.length){chunks.push(r.value);total+=r.value.length;}
            if(total>=limit){finish();return;}
            pump();
          }).catch(function(){clearTimeout(timer);if(!done){done=true;resolve(null);}});
        }
        pump();
      }).catch(function(){clearTimeout(timer);if(!done){done=true;resolve(null);}});
    });
  }
  function checkMpeg2UnsupportedOnEmu(url,headersObj){
    var isT3=(typeof navigator!=='undefined'&&/Tizen\s*3\.|AppleWebKit\/538/i.test(navigator.userAgent||''));
    var checkEmu=isX86Emulator();
    if((!checkEmu&&!isT3)||!/^https?:\/\//i.test(String(url||'')))return Promise.resolve({mpeg2:false,preferHls:false});
    return fetchSliceBytes(url,65536,headersObj,2000).then(function(bytes){
      if(!bytes||bytes.length<16)return {mpeg2:false,preferHls:false};
      if(bytes[0]===0x47&&bytes.length>=376)return {mpeg2:checkEmu?scanTsMpeg2Only(bytes):false,preferHls:false};
      var txt='';
      try{txt=typeof TextDecoder==='function'?new TextDecoder('utf-8').decode(bytes):String.fromCharCode.apply(null,bytes.subarray(0,4096));}catch(_){return {mpeg2:false,preferHls:false};}
      if(txt.indexOf('#EXTM3U')===-1)return {mpeg2:false,preferHls:false};
      if(isT3&&isLive&&/#EXT-X-MEDIA:[^\r\n]*TYPE=AUDIO/i.test(txt)&&!/ac-?3|ec-?3/i.test(txt)&&window.Hls&&window.Hls.isSupported()){
        return {mpeg2:false,preferHls:true};
      }
      if(!checkEmu)return {mpeg2:false,preferHls:false};
      var nextUri=firstM3u8Uri(txt,url);
      if(!nextUri)return {mpeg2:false,preferHls:false};
      if(txt.indexOf('#EXT-X-STREAM-INF')!==-1){
        return fetchSliceBytes(nextUri,65536,headersObj,1800).then(function(subBytes){
          if(!subBytes||subBytes.length<16)return {mpeg2:false,preferHls:false};
          var subTxt='';
          try{subTxt=typeof TextDecoder==='function'?new TextDecoder('utf-8').decode(subBytes):String.fromCharCode.apply(null,subBytes.subarray(0,4096));}catch(_){return {mpeg2:false,preferHls:false};}
          var segUrl=firstM3u8Uri(subTxt,nextUri);
          if(!segUrl||/\.(m4s|mp4|m4v|aac|mp3)(\?|$)/i.test(segUrl))return {mpeg2:false,preferHls:false};
          return fetchSliceBytes(segUrl,65536,headersObj,2000).then(function(b){return {mpeg2:scanTsMpeg2Only(b),preferHls:false};});
        });
      }
      if(/\.(m4s|mp4|m4v|aac|mp3)(\?|$)/i.test(nextUri))return {mpeg2:false,preferHls:false};
      return fetchSliceBytes(nextUri,65536,headersObj,2000).then(function(b){return {mpeg2:scanTsMpeg2Only(b),preferHls:false};});
    }).catch(function(){return {mpeg2:false,preferHls:false};});
  }
  function stop(keepLiveTicket){
    if(!keepLiveTicket)window.__xuperLiveResolveTicket=(window.__xuperLiveResolveTicket||0)+1;
    var wasLive=isLive;
    restoreScreenSaver();
    if(active&&window.CactusProgress)window.CactusProgress.suspend();
    if(externalCaptions){externalCaptions.destroy();externalCaptions=null;}captionClock=null;clearCaption();
    clearTimeout(seekTimer);clearTimeout(seekTimeout);queuedSeek=null;lastSeekAt=0;lastPosition=0;
    session++; currentError=null;clearInterval(tick);tick=null;clearTimeout(hideTimer);clearTimeout(toastTimer);
    var closedActive=false;
    if(av){
      if(wasLive&&preparingSession!==0){
        console.warn('[Cactus AVPlay] Deferring stop/close while prepareAsync is in flight');
      }else{
        if(preparingSession!==0)preparingSession=0;
        try{var s=state();if(s==='PLAYING'||s==='PAUSED'||s==='READY'){av.stop();closedActive=true;}}catch(e){}
        try{if(state()!=='NONE'){av.close();closedActive=true;}}catch(e){}
      }
    }
    active=false;playing=false;busy=false;isLive=false;mode='';duration=0;menu=null;
    if(!wasLive&&obj&&obj.parentNode){obj.parentNode.removeChild(obj);obj=null;}
    else if(obj)obj.style.display='none';
    if(ui)ui.hidden=true;if(pop)pop.hidden=true;if(toast)toast.hidden=true;
    panel=el('screen-player')||el('player');if(panel){panel.classList.remove('cactus-av-active');panel.classList.remove('cactus-av-live');panel.classList.remove('idle');}
    try{document.documentElement.classList.remove('cactus-av-active');document.documentElement.classList.remove('modal-open');document.body.classList.remove('cactus-av-active');}catch(_){}
    var original=el('player-video')||el('video');if(original)original.style.display='';
    var spinner=el('vspin');if(spinner)spinner.hidden=true;
    return closedActive;
  }
  function start(opts){
    opts=opts||{};var prevClosed=stop(true);
    if(opts.kind!=='live')window.__xuperLiveResolveTicket=(window.__xuperLiveResolveTicket||0)+1;
    if(!available())return Promise.reject(Error('Samsung AVPlay no esta disponible'));
    if(!opts.url||!/^https?:\/\//i.test(opts.url)){
      if(opts.engine==='cactus-live-15'&&window.CactusLiveTV&&window.CactusLiveTV.start&&opts.item){
        return window.CactusLiveTV.start(opts.item,opts);
      }
      return Promise.reject(Error('El catalogo no entrego una URL valida de video'));
    }
    var my=++session; av=window.webapis.avplay;active=true;
    isLive=opts.kind==='live'||opts.engine==='cactus-live-15'||!!opts.item;
    mode=isLive?'live':(opts.kind||'vod');
    var onError=typeof opts.onError==='function'?opts.onError:null;
    return new Promise(function(resolve,reject){
      var done=false,timeout=null;
      function clear(){if(timeout){clearTimeout(timeout);timeout=null;}}
      function fail(err,extraFlags){
        if(my!==session)return;
        clear();var message=(extraFlags&&extraFlags.mpeg2Unsupported)?String(err):('AVPlay: '+errorText(err));console.error('[Cactus AVPlay]',message);
        stop(true);
        var eObj=new Error(message);
        if(extraFlags&&extraFlags.mpeg2Unsupported)eObj.mpeg2Unsupported=true;
        if(onError)onError(eObj);if(!opts.suppressStreamError&&window.__onStreamError)window.__onStreamError(message);
        if(!done){done=true;reject(eObj);}
      }
      try{
        buildUI();
        if(opts.subtitles&&opts.subtitles.length&&window.CollateralSubtitles){captionClock=document.createElement('span');captionClock.currentTime=0;externalCaptions=window.CollateralSubtitles.create(captionClock,el('subtitle-layer')||el('player-subtitles'),opts.subtitles,{onStatus:function(message){if(message)showToast(message,4500);}});}
        var isMini = isMiniPanel();
        if (!isMini) {
          panel.classList.remove('is-mini');
          document.documentElement.classList.add('modal-open');
        } else {
          panel.classList.add('is-mini');
          document.documentElement.classList.remove('modal-open');
        }
        panel.classList.add('cactus-av-active');panel.classList.toggle('cactus-av-live',!!isLive);panel.classList.remove('idle');
        try{document.documentElement.classList.add('cactus-av-active');document.body.classList.add('cactus-av-active');}catch(_){}
        var old=el('player-video')||el('video');if(old)old.style.display='none';
        var stage=el('player-stage')||panel;
        if(!obj||!obj.parentNode){
          obj=el('cactus-native-video');
          if(!obj){
            obj=document.createElement('object');
            obj.id='cactus-native-video';
            obj.type='application/avplayer';
          }
          obj.style.cssText='position:absolute;top:0;right:0;bottom:0;left:0;width:100%;height:100%;z-index:0;';
        }
        if(obj.parentNode!==stage)stage.insertBefore(obj,stage.firstChild);
        obj.style.display='block';
        var spinner=el('vspin');if(spinner)spinner.hidden=false;
        var title=el('cactus-osd-title');if(title)title.textContent=opts.title||'Cactus TV';
        selected=0;currentAudio=-1;currentSubtitle=-1;
        showHUD(false);
        if(!isMini&&!isLive)showToast('Conectando con el video…',5000);
        keepScreenOn();
        window.__cactusLastAvUrl = opts.url;
        window.__cactusLastAvOpts = opts;
        function beginOpen(){
          if(my!==session)return;
          if(preparingSession!==0){
            console.warn('[Cactus AVPlay] Previous prepareAsync still pending, skipping AVPlay open');
            fail('AVPlay esperando respuesta anterior');
            return;
          }
          try{
            var curSt=state();
            if(curSt!=='NONE'){
              try{if(curSt==='PLAYING'||curSt==='PAUSED'||curSt==='READY')av.stop();}catch(_){}
              try{av.close();}catch(_){}
            }
            av.open(opts.url);
            try {
              if (typeof av.setStreamingProperty === 'function') {
                var ua = 'Mozilla/5.0 (SMART-TV; LINUX; Tizen 6.0) AppleWebKit/537.36';
                var hdrLines = [];
                if (opts.headers && typeof opts.headers === 'object') {
                  for (var hk in opts.headers) {
                    if (!Object.prototype.hasOwnProperty.call(opts.headers, hk) || !opts.headers[hk]) continue;
                    var lhk = String(hk).toLowerCase();
                    if (lhk === 'user-agent') { ua = String(opts.headers[hk]); continue; }
                    if (lhk === 'range' || lhk === 'connection' || lhk === 'host' || lhk === 'content-length') continue;
                    hdrLines.push(hk + ': ' + opts.headers[hk]);
                  }
                }
                av.setStreamingProperty('USER_AGENT', ua);
                if (hdrLines.length) {
                  av.setStreamingProperty('CUSTOM_HEADER', hdrLines.join('\r\n'));
                }
              }
            } catch (hdrErr) {
              console.warn('[AVPlay header config warn]', hdrErr);
            }
            try {
              if (typeof av.setTimeoutForBuffering === 'function') av.setTimeoutForBuffering(20);
            } catch (bufErr1) {
              console.warn('[AVPlay timeout config warn]', bufErr1);
            }
            try {
              if (typeof av.setBufferingParam === 'function') {
                av.setBufferingParam('PLAYER_BUFFER_FOR_PLAY', 'PLAYER_BUFFER_SIZE_IN_SECOND', isLive ? 4 : 6);
                av.setBufferingParam('PLAYER_BUFFER_FOR_RESUME', 'PLAYER_BUFFER_SIZE_IN_SECOND', isLive ? 4 : 5);
              }
            } catch (bufErr2) {
              console.warn('[AVPlay buffer config warn]', bufErr2);
            }
            var avLiveStallTimes = [];
            av.setListener({
              onbufferingstart:function(){
                if(my!==session)return;
                if(!isLive){showToast('Cargando video…',2600);return;}
                if(playing&&onError){
                  var now=Date.now();
                  avLiveStallTimes.push(now);
                  while(avLiveStallTimes.length&&(now-avLiveStallTimes[0])>25000)avLiveStallTimes.shift();
                  if(avLiveStallTimes.length>=3){
                    avLiveStallTimes=[];
                    fail('Señal inestable, cambiando a servidor de respaldo');
                  }
                }
              },
              onbufferingprogress:function(){},
              onbufferingcomplete:function(){if(my===session){if(toast)toast.hidden=true;if(window.__onStreamPlaying)window.__onStreamPlaying();}},
              oncurrentplaytime:function(t){if(my===session){updateProgress(Number(t));if(Number(t)>0&&window.__onStreamPlaying)window.__onStreamPlaying();}},
              onstreamcompleted:function(){if(my===session){playing=false;if(isLive)return;updateActions();showHUD(false);
                if(duration>0&&lastPosition<duration-15000){showToast('La reproducción se interrumpió antes del final. Puedes retomarla.',5000);return;}
                if(window.CactusProgress)window.CactusProgress.completed();
                var api=window.CactusPlaybackActions;
                if(api&&api.getNext&&api.getNext()){showToast('Siguiente episodio en 3 segundos',3200);if(api.completed)api.completed();}
                else showToast('Reproducción finalizada');
              }},
              onerror:function(t){if(my!==session)return;fail('Error del reproductor: '+errorText(t));},
              onevent:function(){},onsubtitlechange:function(ms,text,type){if(my===session)renderSubtitle(ms,text,type);},ondrmevent:function(){}
            });
            if(typeof av.setDisplayMethod==='function')av.setDisplayMethod('PLAYER_DISPLAY_MODE_LETTER_BOX');
            applyDisplayRect();
            var isTizen3Av = typeof navigator !== 'undefined' && /Tizen\s*3\.|AppleWebKit\/538/i.test(navigator.userAgent || '');
            timeout=setTimeout(function(){fail('El video no respondio a tiempo');},isLive?(isTizen3Av?10000:20000):25000);
            preparingSession=my;
            av.prepareAsync(function(){
              if(preparingSession===my)preparingSession=0;
              if(my!==session){
                try{var st=state();if(st==='PLAYING'||st==='PAUSED'||st==='READY')av.stop();}catch(_){}
                try{if(state()!=='NONE')av.close();}catch(_){}
                return;
              }
              clear();
              try{
                applyDisplayRect();
                av.play();playing=true;
                applyDisplayRect();
                if(window.__onStreamPlaying)window.__onStreamPlaying();
                tracks();
                if(audioTracks&&audioTracks.length>1){
                  var spLatIdx=-1, spEspIdx=-1, spGenericIdx=-1;
                  for(var at=0;at<audioTracks.length;at++){
                    var tItem=audioTracks[at];
                    var details=tItem.details||{};
                    var langCode=String(details.language||details.track_lang||details.lang||tItem.name||'').toLowerCase();
                    if(/es[-_]?(419|mx|ar|co|pe|cl|lat)|esl|latino/i.test(langCode)||/latino/i.test(tItem.name||'')){
                      if(spLatIdx<0)spLatIdx=tItem.index;
                    }else if(/es[-_]?es|castell|esp(?!l)|spain|españa/i.test(langCode)||/españa|castellano/i.test(tItem.name||'')){
                      if(spEspIdx<0)spEspIdx=tItem.index;
                    }else if(/^(es|spa)/i.test(langCode)||/español/i.test(tItem.name||'')){
                      if(spGenericIdx<0)spGenericIdx=tItem.index;
                    }
                  }
                  var chosenIdx=(spLatIdx>=0?spLatIdx:(spEspIdx>=0?spEspIdx:spGenericIdx));
                  var isDefaultFirstTrack=(currentAudio<0&&audioTracks[0]&&chosenIdx===audioTracks[0].index);
                  if(chosenIdx>=0&&chosenIdx!==currentAudio&&!isDefaultFirstTrack){
                    var applyTrack=function(){
                      if(my!==session||!active||state()!=='PLAYING')return;
                      try{
                        av.setSelectTrack('AUDIO',chosenIdx);
                        currentAudio=chosenIdx;
                        console.log('[AVPlay] Auto-selected Spanish audio track:',chosenIdx);
                      }catch(e){console.warn('[AVPlay auto-select audio err]',e);}
                    };
                    if(isLive&&isTizen3Av){setTimeout(applyTrack,1500);}
                    else{applyTrack();}
                  }
                }
                if(externalCaptions&&window.CactusTracks){var subtitleChoice=window.CactusTracks.preferredIndex(externalCaptions.tracks,opts.subtitleLanguage);
                  if(subtitleChoice>=0){av.setSilentSubtitle(true);currentSubtitle='external:'+subtitleChoice;externalCaptions.select(subtitleChoice);}}
                if(spinner)spinner.hidden=true;
                if(toast)toast.hidden=true;
                updateProgress();showHUD(true);
                var stallLastPos=-1,stallSec=0,liveTicks=0,liveHealthyTicks=0,vodStallSec=0,lastSeekStamp=seekingResetStamp;
                tick=setInterval(function(){
                  if(my!==session||!active)return;
                  updateProgress();
                  if(lastSeekStamp!==seekingResetStamp){lastSeekStamp=seekingResetStamp;vodStallSec=0;stallLastPos=lastPosition;}
                  if(isLive&&playing&&state()==='PLAYING'){
                    liveTicks++;
                    if(lastPosition===stallLastPos&&(lastPosition>0||liveTicks>12)){
                      liveHealthyTicks=0;
                      stallSec++;
                      if(stallSec>=15){
                        stallSec=0;
                        if((opts._stallRetry||0)<2){
                          console.warn('[Cactus AVPlay] Live frozen >=15s, reconnecting:',opts.url);
                          var retryOpts=Object.assign({},opts,{_stallRetry:(opts._stallRetry||0)+1});
                          var starter=(window.CactusAVPlay&&typeof window.CactusAVPlay.start==='function')?window.CactusAVPlay.start:start;
                          starter(retryOpts).catch(function(){});
                        }else{
                          fail('La señal en vivo se congeló o se interrumpió');
                        }
                      }
                    }else{
                      stallLastPos=lastPosition;stallSec=0;
                      liveHealthyTicks++;
                      if(liveHealthyTicks>=30&&opts._stallRetry)opts._stallRetry=0;
                    }
                  }else if(!isLive&&playing&&state()==='PLAYING'&&!busy&&queuedSeek===null){
                    if(lastPosition===stallLastPos&&lastPosition>0){
                      vodStallSec++;
                      if(vodStallSec>=20){
                        vodStallSec=0;
                        if((opts._vodStallRetry||0)<2){
                          var resumeSec=Math.floor(lastPosition/1000);
                          console.warn('[Cactus AVPlay] VOD frozen >=20s, resuming at '+resumeSec+'s:',opts.url);
                          var vodRetryOpts=Object.assign({},opts,{startTime:resumeSec,resume:resumeSec,_vodStallRetry:(opts._vodStallRetry||0)+1});
                          var vodStarter=(window.CactusAVPlay&&typeof window.CactusAVPlay.start==='function')?window.CactusAVPlay.start:start;
                          vodStarter(vodRetryOpts).catch(function(){});
                        }
                      }
                    }else{
                      stallLastPos=lastPosition;vodStallSec=0;
                    }
                  }
                },1000);
                // En reanudacion se usa seekTo solo despues de comenzar la reproduccion.
                var resumePos=Number(opts.startTime||opts.resume||0);
                if(!isLive&&resumePos>2)setTimeout(function(){
                  if(my===session&&active&&duration>1000)seekAbsolute(resumePos*1000);
                },800);
                done=true;resolve();
              }catch(e){fail(e);}
            },function(prepErr){
              if(preparingSession===my)preparingSession=0;
              if(my!==session){
                try{if(state()!=='NONE')av.close();}catch(_){}
                return;
              }
              fail(prepErr);
            });
          }catch(openErr){if(preparingSession===my)preparingSession=0;fail(openErr);}
        }
        var waitPromise=isLive?checkMpeg2UnsupportedOnEmu(opts.url,opts.headers):Promise.resolve({mpeg2:false,preferHls:false});
        waitPromise.then(function(probeRes){
          if(my!==session)return;
          if(probeRes&&probeRes.mpeg2){
            console.warn('[Cactus AVPlay] Blocked MPEG-2 TS stream on x86 emulator before av.open:',opts.url);
            fail('Señal MPEG-2 no compatible en emulador (compatible en TV física)',{mpeg2Unsupported:true});
            return;
          }
          if(probeRes&&probeRes.preferHls){
            console.log('[Cactus AVPlay] Delegating demuxed AAC HLS to Hls.js on Tizen 3.0:',opts.url);
            fail('Usando motor Hls.js para audio demuxed en Tizen 3.0');
            return;
          }
          if(prevClosed){setTimeout(beginOpen,80);}
          else{beginOpen();}
        });
      }catch(err){fail(err);}
    });
  }
  function diagnostics(msg){
    var overlay=el('cactus-feedback');
    if(!overlay){
      overlay=mk('div');overlay.id='cactus-feedback';overlay.style.cssText='position:fixed;z-index:900;top:14%;right:14%;bottom:14%;left:14%;background:#101b2c;color:white;border:3px solid #3ef1d1;border-radius:16px;padding:6%;font-size:24px;';
      var p=mk('p');p.id='cactus-feedback-message';var b=button('Cerrar diagnóstico',function(){overlay.hidden=true;});
      overlay.appendChild(p);overlay.appendChild(b);document.body.appendChild(overlay);
    }
    el('cactus-feedback-message').textContent=msg;overlay.hidden=false;overlay.querySelector('button').focus();
  }
  var suspendedForBg=false;
  function resumeAfterSuspend(attempt){
    if(!active||!av||document.hidden){suspendedForBg=false;return;}
    try{
      if(window.webapis&&window.webapis.network&&typeof window.webapis.network.isConnectedToGateway==='function'){
        if(!window.webapis.network.isConnectedToGateway()&&attempt<3){
          setTimeout(function(){resumeAfterSuspend(attempt+1);},1000);
          return;
        }
      }
    }catch(_){}
    try{
      if(typeof av.restore==='function'&&window.__cactusLastAvUrl){
        av.restore(window.__cactusLastAvUrl,isLive?0:(lastPosition||0),false);
        keepScreenOn();
        playing=true;
        suspendedForBg=false;
        return;
      }
    }catch(resErr){
      console.warn('[AVPlay restore fallback]',resErr);
    }
    suspendedForBg=false;
    if(window.__cactusLastAvOpts){
      var retryOpts=Object.assign({},window.__cactusLastAvOpts);
      if(!isLive&&lastPosition>2000)retryOpts.startTime=Math.floor(lastPosition/1000);
      start(retryOpts).catch(function(){});
    }
  }
  function init(){
    registerMediaKeys();
    var btn=el('cactus-avplay-test');if(btn){btn.onclick=function(){start({url:SAMPLE,title:'Prueba técnica AVPlay · Big Buck Bunny',kind:'vod',onError:function(e){diagnostics(errorText(e));}}).catch(function(e){diagnostics(errorText(e));});};}
    document.addEventListener('visibilitychange',function(){
      if(document.hidden){
        if(active&&av){
          try{
            if(typeof av.suspend==='function'){av.suspend();suspendedForBg=true;restoreScreenSaver();return;}
          }catch(e){}
          stop();
        }
      }else if(suspendedForBg){
        resumeAfterSuspend(0);
      }
    });
  }
  function setAudioTrack(index){
    if(!av||!active)return false;
    try{
      if(state()!=='PLAYING')return false;
      av.setSelectTrack('AUDIO',Number(index));
      currentAudio=Number(index);
      return true;
    }catch(e){
      console.warn('[AVPlay setAudioTrack err]',e);
      return false;
    }
  }
  function setSubtitleTrack(index){
    if(!av||!active)return false;
    try{
      if(index===-1){
        av.setSilentSubtitle(true);
        currentSubtitle=-1;
        clearCaption();
      }else{
        av.setSilentSubtitle(true);
        av.setSelectTrack('TEXT',Number(index));
        currentSubtitle=Number(index);
      }
      return true;
    }catch(e){
      console.warn('[AVPlay setSubtitleTrack err]',e);
      return false;
    }
  }
  // Registrar en fase de carga (antes de app.js) para no romper los botones del reproductor
  // ni el zapping existente cuando el panel de controles esta oculto.
  window.addEventListener('keydown',keydown,true);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.CactusAVPlay={
    available:available,
    start:start,
    stop:stop,
    pause:toggle,
    seek:seekBy,
    seekAbsolute:seekAbsolute,
    isSeeking:function(){return !!(busy||queuedSeek!==null);},
    getTargetPosition:function(){return (queuedSeek!==null?queuedSeek:(busy?seekTarget:lastPosition))/1000;},
    getCurrentPosition:function(){if(queuedSeek!==null)return queuedSeek/1000;if(busy)return seekTarget/1000;return Number(safely(function(){return av.getCurrentTime()/1000;},lastPosition/1000))||0;},
    tracks:tracks,
    getAudioTracks:function(){try{tracks();}catch(e){}return audioTracks.slice();},
    getSubtitleTracks:function(){try{tracks();}catch(e){}return subtitleTracks.slice();},
    getCurrentAudioTrack:function(){return currentAudio;},
    getCurrentSubtitleTrack:function(){return currentSubtitle;},
    errorString:errorText,
    setAudioTrack:setAudioTrack,
    setSubtitleTrack:setSubtitleTrack,
    syncDisplayMode:syncDisplayMode,
    isActive:function(){return !!active;}
  };
})(window,document);
