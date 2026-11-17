/* Conserva pistas entregadas por la fuente. No busca traducciones ni fabrica idiomas. */
(function(w,d){'use strict';
 function parseTime(str){
  if(!str)return 0;
  var m=String(str).trim().match(/(?:(\d+):)?(\d{1,2}):(\d{2})(?:[.,](\d{1,3}))?/);
  if(!m)return 0;
  var hours=m[1]?parseInt(m[1],10):0;
  var mins=parseInt(m[2],10)||0;
  var secs=parseInt(m[3],10)||0;
  var msStr=m[4]?(m[4]+'00').slice(0,3):'0';
  var ms=parseInt(msStr,10)||0;
  return hours*3600+mins*60+secs+ms/1000;
 }
 function parseSubtitles(text){
  var cues=[];
  if(!text||typeof text!=='string')return cues;
  var normalized=text.replace(/\r\n/g,'\n').replace(/\r/g,'\n');
  normalized=normalized.replace(/^\uFEFF?WEBVTT[^\n]*\n+/i,'');
  var blocks=normalized.split(/\n\s*\n/);
  for(var b=0;b<blocks.length;b++){
   var lines=blocks[b].trim().split('\n');
   if(!lines.length)continue;
   var timeLineIdx=-1;
   for(var l=0;l<lines.length;l++){
    if(lines[l].indexOf('-->')!==-1){timeLineIdx=l;break;}
   }
   if(timeLineIdx===-1)continue;
   var parts=lines[timeLineIdx].split('-->');
   if(parts.length<2)continue;
   var start=parseTime(parts[0]);
   var end=parseTime(parts[1]);
   if(end<=start)continue;
   var textLines=lines.slice(timeLineIdx+1);
   var cueText=textLines.join('<br>')
    .replace(/<v[^>]*>/gi,'')
    .replace(/<\/v>/gi,'')
    .replace(/<font[^>]*>/gi,'')
    .replace(/<\/font>/gi,'')
    .replace(/<c[^>]*>/gi,'')
    .replace(/<\/c>/gi,'')
    .trim();
   if(cueText){cues.push({start:start,end:end,text:cueText});}
  }
  return cues;
 }
 w.CollateralSubtitles={
  parse:function(text){return parseSubtitles(text);},
  create:function(clockOrMedia,layer,tracks,options){
   layer=layer||d.getElementById('subtitle-layer')||d.getElementById('player-subtitles');
   var trackCues={},selected=-1,activeCue=null,currentXhr=null,lastTime=-1;
   function findCue(cues,time){
    if(!cues||!cues.length)return null;
    var lo=0,hi=cues.length-1,pos=-1;
    while(lo<=hi){
     var mid=(lo+hi)>>1;
     if(cues[mid].start<=time){pos=mid;lo=mid+1;}
     else hi=mid-1;
    }
    if(pos>=0){
     for(var j=pos;j>=0&&pos-j<=6;j--){
      if(time>=cues[j].start&&time<=cues[j].end)return cues[j];
     }
    }
    return null;
   }
   function update(time){
    if(selected<0||!layer||window.__subtitlesEnabled===false){
     if(layer){layer.innerHTML='';layer.hidden=true;layer.style.display='none';}
     activeCue=null;
     lastTime=-1;
     return;
    }
    var jumped=lastTime>=0&&Math.abs(time-lastTime)>1.2;
    lastTime=time;
    var cues=trackCues[selected]||[];
    var match=findCue(cues,time);
    if(match){
     if(activeCue!==match||jumped){
      activeCue=match;
      layer.innerHTML='<span class="player-subtitles-text">'+match.text+'</span>';
      layer.hidden=false;
      layer.style.display='';
     }
    }else{
     if(activeCue!==null||jumped){
      activeCue=null;
      layer.innerHTML='';
      layer.hidden=true;
      layer.style.display='none';
     }
    }
   }
   function onTimeUpdate(){
    var t=(clockOrMedia&&clockOrMedia.currentTime)||0;
    update(t);
   }
   if(clockOrMedia&&clockOrMedia.addEventListener){
    clockOrMedia.addEventListener('timeupdate',onTimeUpdate);
    clockOrMedia.addEventListener('seeked',onTimeUpdate);
   }
   var tickInterval=setInterval(function(){
    var t=(clockOrMedia&&Number(clockOrMedia.currentTime))||0;
    update(t);
   },200);
   function select(index){
    index=Number(index);
    if(isNaN(index)||index<0||!tracks||index>=tracks.length){
     selected=-1;activeCue=null;
     if(layer){layer.innerHTML='';layer.hidden=true;layer.style.display='none';}
     if(currentXhr){try{currentXhr.abort();}catch(e){}currentXhr=null;}
     return;
    }
    window.__subtitlesEnabled=true;
    selected=index;
    var tr=tracks[index];
    if(trackCues[index]){
     update((clockOrMedia&&clockOrMedia.currentTime)||0);
     return;
    }
    if(tr&&tr.url){
     if(currentXhr){try{currentXhr.abort();}catch(e){}}
     function loadSub(reqUrl,isFallback){
      var xhr=new XMLHttpRequest();
      currentXhr=xhr;
      xhr.open('GET',reqUrl,true);
      xhr.onload=function(){
       if((xhr.status===0||(xhr.status>=200&&xhr.status<300))&&xhr.responseText){
        trackCues[index]=parseSubtitles(xhr.responseText);
        if(selected===index&&window.__subtitlesEnabled!==false){update((clockOrMedia&&clockOrMedia.currentTime)||0);}
       }else if(!isFallback&&w.XuperRelay&&w.XuperRelay.wrapSubtitleUrl&&(xhr.status===403||xhr.status===451||xhr.status>=500)){
        var relayedUrl=w.XuperRelay.wrapSubtitleUrl(tr.url);
        if(relayedUrl&&relayedUrl!==reqUrl){loadSub(relayedUrl,true);return;}
        if(options&&typeof options.onStatus==='function'){options.onStatus('Error al cargar subtítulo');}
       }else{
        if(options&&typeof options.onStatus==='function'){options.onStatus('Error al cargar subtítulo');}
       }
      };
      xhr.onerror=function(){
       if(!isFallback&&w.XuperRelay&&w.XuperRelay.wrapSubtitleUrl){
        var relayedUrl=w.XuperRelay.wrapSubtitleUrl(tr.url);
        if(relayedUrl&&relayedUrl!==reqUrl){loadSub(relayedUrl,true);return;}
       }
       if(options&&typeof options.onStatus==='function'){options.onStatus('Error de red al cargar subtítulo');}
      };
      xhr.send();
     }
     loadSub(tr.url,false);
    }
   }
   function destroy(){
    clearInterval(tickInterval);
    if(clockOrMedia&&clockOrMedia.removeEventListener){
     clockOrMedia.removeEventListener('timeupdate',onTimeUpdate);
     clockOrMedia.removeEventListener('seeked',onTimeUpdate);
    }
    if(currentXhr){try{currentXhr.abort();}catch(e){}currentXhr=null;}
    if(layer){layer.innerHTML='';layer.hidden=true;layer.style.display='none';}
    activeCue=null;selected=-1;
   }
   return {tracks:tracks||[],_selected:-1,select:select,destroy:destroy,update:update};
  }
 };
 function label(lang){if((lang!=null&&typeof lang!=='string')||(typeof lang==='string'&&lang.length>48))return 'Idioma no identificado';
  var code=String(lang||'').toLowerCase().replace(/_/g,'-').trim();
  if(/^(es-(419|mx|ar|co|pe|cl|lat)|esl|lat|latino)/.test(code))return 'Español Latino';
  if(/^(es-es|castellano|esp|spain|españa)/.test(code))return 'Español España';
  if(/^(es|spa|spanish|español)$/.test(code))return 'Español Latino';
  if(/^(pt-br|por-br|brasil|brazil)/.test(code))return 'Portugués (Brasil)';
  if(/^(pt-pt|por-pt|portugal)/.test(code))return 'Portugués (Portugal)';
  if(/^(pt|por|portuguese|portugu[eé]s)/.test(code))return 'Portugués';
  if(/^(en|eng|english|ingl[eé]s)/.test(code))return 'Inglés';
  if(/^(ja|jpn|japanese|japon[eé]s)/.test(code))return 'Japonés';
  if(/^(fr|fra|fre|french|franc[eé]s)/.test(code))return 'Francés';
  if(/^(it|ita|italian|italiano)/.test(code))return 'Italiano';
  if(/^(de|deu|ger|german|alem[aá]n)/.test(code))return 'Alemán';
  if(/^(ko|kor|korean|coreano)/.test(code))return 'Coreano';
  if(/^(zh|chi|zho|chinese|chino)/.test(code))return 'Chino';
  if(/^(ru|rus|russian|ruso)/.test(code))return 'Ruso';
  return {und:'Idioma no identificado'}[code]||(code?code.charAt(0).toUpperCase()+code.slice(1):'Idioma no identificado');
 }
 function collect(){var tracks=[],seen={};
  function field(value,names){var keys=Object.keys(value);for(var i=0;i<keys.length;i++)if(names.indexOf(keys[i].toLowerCase().replace(/[_-]/g,''))>=0&&value[keys[i]])return value[keys[i]];return '';}
  function add(value,parent,depth){depth=depth||0;if(!value||typeof value!=='object'||depth>2||tracks.length>=32)return;
   var lang=field(value,['lang','language','languagecode','subtitlelanguage','code'])||(parent&&parent.lang)||'und';
   if(typeof lang!=='string'||lang.length>48)lang='und';
   var name=field(value,['label','name','subtitlename'])||(parent&&parent.name)||'';if(typeof name!=='string')name='';
   var files=field(value,['file','files']);
   if(Array.isArray(files))files.slice(0,8).forEach(function(file){add(file,{lang:lang,name:name},depth+1);});
   var url=field(value,['subtitleurl','fileurl','url','src'])||(typeof files==='string'?files:'');
   if(typeof url!=='string'||!/^https?:\/\//i.test(url)||/[\r\n]/.test(url))return;
   var format=String(value.format||value.fileType||'').toLowerCase();
   if(/\.(sup|sub|idx)([?#]|$)/i.test(url)||/^(pgs|dvbsub|dvdsub)$/.test(format))return;
   if(seen[url])return;seen[url]=true;
   if(tracks.length<32)tracks.push({url:url,lang:lang,label:name.slice(0,80)||label(lang),format:format});
  }
  function source(value,depth){if(!value||depth>2||typeof value!=='object')return;
   Object.keys(value).forEach(function(key){var name=key.toLowerCase().replace(/[_-]/g,'');
    if(/^(subtitles?|subtitlelist|subtitletracks|subtitlefilelist|subtitleinfo|subtitleinfolist|captionlist|captions|texttracks|subtitleslist)$/.test(name)){
      var entries=value[key];if(Array.isArray(entries))entries.slice(0,32).forEach(function(entry){add(entry);});else add(entries);
    }
    if(/^(assetdata|playinfo|mediainfo)$/.test(name))source(value[key],depth+1);
   });
  }
  for(var i=0;i<arguments.length;i++)source(arguments[i],0);
  return tracks;
 }
 function collectSelected(meta,movie,item){
  var episode=null,episodes=meta&&meta.episodeList||[];
  for(var i=0;i<episodes.length;i++){
   var groups=episodes[i].totalMovieList||[];
   for(var j=0;j<groups.length;j++)if((groups[j].movieList||[]).indexOf(movie)>=0)episode=episodes[i];
  }
  return collect(movie,episode,meta,item);
 }
 function preferredIndex(tracks,preference){
  if(!tracks||!tracks.length)return -1;
  var wanted=preference?String(preference).toLowerCase().replace(/_/g,'-'):'';
  if(!wanted||/^(auto|es|spa|es-lat|latino|español latino)$/i.test(wanted)){
    var latIdx=-1, espIdx=-1, genIdx=-1;
    for(var i=0;i<tracks.length;i++){
      var c=String(tracks[i].lang||tracks[i].language||tracks[i].name||'').toLowerCase().replace(/_/g,'-');
      var lbl=(typeof label==='function'?label(c):'');
      if(/^(es-(419|mx|ar|co|pe|cl|lat)|esl|lat|latino)/.test(c)||lbl==='Español Latino'){if(latIdx<0)latIdx=i;}
      else if(/^(es-es|castellano|esp|spain|españa)/.test(c)||lbl==='Español España'){if(espIdx<0)espIdx=i;}
      else if(/^(es|spa)/.test(c)){if(genIdx<0)genIdx=i;}
    }
    if(latIdx>=0)return latIdx;
    if(espIdx>=0)return espIdx;
    if(genIdx>=0)return genIdx;
    return -1;
  }
  var choice=-1;
  tracks.some(function(track,index){
    var code=String(track.lang||track.language||track.name||'').toLowerCase().replace(/_/g,'-');
    if(code===wanted||(typeof label==='function'&&label(code).toLowerCase()===wanted)){choice=index;return true;}return false;
  });
  if(choice<0&&/^(es|spa)/.test(wanted)){
    tracks.some(function(track,index){
      if(/^es(?:-|$)|^spa$/.test(track.lang||track.language||track.name||'')){choice=index;return true;}return false;
    });
  }
  return choice;
 }
 function attach(video,tracks,onStatus,preferredLanguage){
  if(video._captions){video._captions.destroy();video._captions=null;}
  var layer=d.getElementById('subtitle-layer')||d.getElementById('player-subtitles');
  if(!layer||!w.CollateralSubtitles||!tracks||!tracks.length)return null;
  video._captions=w.CollateralSubtitles.create(video,layer,tracks,{onStatus:onStatus});
  var captions=video._captions,select=captions.select;captions._selected=-1;
  captions.select=function(index){captions._selected=Number(index);return select(index);};
  var preference=typeof preferredLanguage==='string'?preferredLanguage:w.CollateralSettings&&w.CollateralSettings.prefs&&w.CollateralSettings.prefs.subs;
  var choice=preferredIndex(tracks,preference);
  if(choice>=0&&window.__subtitlesEnabled!==false){captions.select(choice);}else{captions.select(-1);}
  return captions;
 }
 w.CactusTracks={label:label,collect:collect,collectSelected:collectSelected,preferredIndex:preferredIndex,attach:attach};
})(window,document);
