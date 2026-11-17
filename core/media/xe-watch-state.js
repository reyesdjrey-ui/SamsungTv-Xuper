/* Xuper Eclectic Watch State Engine v2.0.19 */
(function(w,d){'use strict';
  var session=null, prefix='cactus.direct.v1.progress', limit=80;
  function profile(){return w.CollateralProfiles?w.CollateralProfiles.id():'default';}
  function key(){var id=profile();return id==='default'?prefix:prefix+'.profile.'+encodeURIComponent(id);}
  function read(){try{return JSON.parse(w.localStorage.getItem(key())||'{}')||{};}catch(_){return {};}}
  function write(rows){try{w.localStorage.setItem(key(),JSON.stringify(rows));}catch(_){}}
  function category(item,section){
    if(item._continueSection)return item._continueSection;
    if(/anime/i.test(section||'')||/^anime:/.test(item.contentId||'')||/anime/i.test(item.kind||item.columnCode||''))return 'masnew_anime';
    if(section==='masnew_series'||section==='masnew_movies')return section;
    return w.CollateralContent&&w.CollateralContent.mediaType(item)==='series'?'masnew_series':'masnew_movies';
  }
  function card(item,section){var out={};
    ['contentId','type','name','title','poster','posterUrl','imageUrl','picUrl','picture','originalTitle','latinTitle','year','kind','mediaType','seriesContentId'].forEach(function(k){if(item[k]!=null)out[k]=typeof item[k]==='string'?item[k].slice(0,500):item[k];});
    out.posterList=(item.posterList||[]).slice(0,4).map(function(p){return {fileUrl:p.fileUrl};});
    out._continueSection=category(item,section);return out;
  }
  function store(action,args){var rows=read(),value=args[0],id;
    if(action==='progressGet')return rows[String(value)]||null;
    if(action==='continueList')return Object.keys(rows).map(function(k){var p=rows[k];return p&&p.item&&p.position>5&&p.duration>p.position+2?Object.assign({},p.item,{position:p.position,duration:p.duration,episode:p.episode,updatedAt:p.updatedAt||0}):null;}).filter(Boolean).sort(function(a,b){return b.updatedAt-a.updatedAt;});
    if(action==='progressClear'){delete rows[String(value)];write(rows);return {saved:true};}
    if(action==='progressSave'){
      if(!value||!value.item||!value.item.contentId||value.item.audience==='adult'||value.item.liveAddressList)return {saved:false};
      var position=Number(value.position),duration=Number(value.duration);
      if(!isFinite(position)||!isFinite(duration)||position<=5||duration<=position+2)return {saved:false};
      id=String(value.item.contentId);rows[id]={item:card(value.item,value.item._continueSection),position:position,duration:duration,episode:Number(value.episode)||1,updatedAt:Date.now()};
      Object.keys(rows).sort(function(a,b){return (rows[b].updatedAt||0)-(rows[a].updatedAt||0);}).slice(limit).forEach(function(k){delete rows[k];});
      write(rows);return {saved:true};
    }
  }
  function flush(force){var s=session;if(!s||!s.ready||s.profile!==profile())return;
    var v=s.video,position=s.native?s.position:v.currentTime,duration=s.native?s.duration:v.duration;
    if(!s.native&&(v.seeking||v.readyState<2))return;
    if(s.target>5){if(Math.abs(position-s.target)>3)return;s.target=0;}
    if(!force&&Date.now()-s.savedAt<5000)return;
    if(!(position>5&&isFinite(duration)&&duration>position+2))return;
    if(position===s.lastPosition)return;
    try{store('progressSave',[{item:s.item,position:position,duration:duration,episode:s.episode}]);s.lastPosition=position;s.savedAt=Date.now();}catch(_){/* Mantener el reproductor disponible si se llena el almacenamiento. */}
  }
  function suspend(){flush(true);if(session)session.ready=false;}
  function ready(native){if(session){session.ready=true;if(native===true)session.native=true;
    if(!session.native&&session.video.readyState>=2&&!session.video.seeking&&Math.abs(session.video.currentTime-session.target)<3)session.target=0;
  }}
  function begin(item,section){flush(true);session=null;
    if(!item||!item.contentId||item.audience==='adult'||item.liveAddressList||item.kind==='live')return;
    session={item:card(item,section),episode:Number(item.episode)||1,profile:profile(),video:d.getElementById('player-video')||d.getElementById('video'),target:Number(item._resume)||0,ready:false,native:false,savedAt:0,lastPosition:-1};
  }
  function nativeTick(position,duration){if(!session)return;session.native=true;session.position=position;session.duration=duration;flush(false);}
  function completed(){var s=session;if(!s||!s.ready||s.profile!==profile())return;
    var pos=s.native?s.position:s.video.currentTime,dur=s.native?s.duration:s.video.duration;
    if(isFinite(dur)&&dur>0&&pos>=dur-15){store('progressClear',[s.item.contentId]);s.ready=false;}
  }
  var video=d.getElementById('player-video')||d.getElementById('video');if(video){video.addEventListener('timeupdate',function(){flush(false);});video.addEventListener('pause',function(){flush(true);});video.addEventListener('ended',completed);}
  w.addEventListener('pagehide',function(){flush(true);});w.addEventListener('beforeunload',function(){flush(true);});
  d.addEventListener('visibilitychange',function(){if(d.hidden)flush(true);},true);
  var panel=d.getElementById('screen-player')||d.getElementById('player');if(panel&&w.MutationObserver)new w.MutationObserver(function(){if(panel.hidden)w.dispatchEvent(new Event('cactus-progress-closed'));}).observe(panel,{attributes:true,attributeFilter:['hidden']});
  w.CactusProgress={store:store,begin:begin,ready:ready,suspend:suspend,flush:function(){flush(true);},nativeTick:nativeTick,completed:completed,category:category};
})(window,document);
