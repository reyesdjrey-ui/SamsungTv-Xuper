/* Xuper Eclectic Media Gateway v2.0.19 */
(function (w) {
  'use strict';
  var client = null, connecting = null, refreshing = null, storagePrefix = 'cactus.direct.v1.';
  var audit = [];
  function isolatedStore() {
    var prefix = 'cactus.samsung.v101.device.';
    var temporary = Object.create(null);
    return {
      get: function (key) {
        try { return w.localStorage.getItem(prefix + key); }
        catch (e) { return temporary[key] || null; }
      },
      set: function (key, value) {
        try { w.localStorage.setItem(prefix + key, String(value)); }
        catch (e) { temporary[key] = String(value); }
      }
    };
  }
  function monitoredFetch(url, opts) {
    var entry = {status: null, problem: null};
    audit.push(entry);
    if (audit.length > 12) audit.shift();
    return w.fetch.call(w, url, opts).then(function (response) {
      entry.status = response.status;
      return response;
    }, function (err) {
      entry.problem = err && err.name ? String(err.name).slice(0, 32) : 'Error de red';
      throw err;
    });
  }
  function explainConnectionError(err) {
    var msg = String(err && err.message || err || 'Error desconocido');
    if (msg.indexOf('todos los hosts fallaron para') < 0) return err;
    var total = audit.length, received = 0, status = [], failed = 0;
    for (var i=0; i<audit.length; i++) {
      if (audit[i].status !== null) {received++; status.push(String(audit[i].status));}
      else failed++;
    }
    var detail = received
      ? ('Respuestas HTTP: ' + status.join(', ') + '; sin respuesta: ' + failed + '.')
      : ('No hubo respuesta HTTP legible (' + total + ' intentos). Posible CORS, TLS o red.');
    return new Error('Registro de sesión no completado. ' + detail + ' No se cambia la autorización.');
  }
  var jsonError = function(e) {
    var text = String(e && e.message || e || 'Fallo desconocido');
    return text.replace(/(userToken|snToken|session|password|secret|token)\s*[=:]\s*\S+/ig, '$1=[oculto]').slice(0, 240);
  };
  function read(k, fallback) { try { var v=w.localStorage.getItem(storagePrefix+k); return v ? JSON.parse(v) : fallback; } catch(e) { return fallback; } }
  function write(k,v) { try { w.localStorage.setItem(storagePrefix+k,JSON.stringify(v)); } catch(e) {} }
  function getClient() {
    if (client) return client;
    if (!w.XuperApi || !w.XuperDevice || !w.XuperSession || !w.XuperCatalog || !w.XuperLive)
      throw Error('Faltan los módulos de consulta del catálogo.');
    var device = new w.XuperDevice.Device({storage:isolatedStore()});
    var api = new w.XuperApi.Api({ timeout: 14000, minInterval: 100, fetch:monitoredFetch });
    api.device = device;
    var session = new w.XuperSession.Session(api, device);
    var refreshPromise = null;
    api.onSessionExpired = function() {
      if (!refreshPromise) {
        refreshPromise = session.refresh().then(function(newAuth) {
          if (client && client.catalog && client.catalog.clearCache) client.catalog.clearCache();
          if (client && client.stream) client.stream._slbCache = null;
          refreshPromise = null;
          return newAuth;
        }).catch(function(err) {
          refreshPromise = null;
          throw err;
        });
      }
      return refreshPromise;
    };
    client = {device:device, api:api, session:session};
    client.catalog = new w.XuperCatalog.Catalog(api,device);
    client.live = new w.XuperLive.Live(api,device);
    if (w.XuperStream && w.XuperStream.Stream) client.stream = new w.XuperStream.Stream(api,device);
    return client;
  }
  function connect() {
    var c;
    try {
      c = getClient();
    } catch (err) {
      return Promise.reject(err);
    }
    if (connecting) return connecting;
    if (c && c.device && c.device.userId && c.device.userToken) {
      if (c.device.isSessionStale && c.device.isSessionStale(28800000)) {
        connecting = c.session.refresh().then(function() {
          connecting = null;
          return c;
        }).catch(function() {
          connecting = null;
          return c;
        });
        return connecting;
      }
      c.session.ensure();
      return Promise.resolve(c);
    }
    audit.length = 0;
    connecting = c.session.ensure().then(function(auth) {
      if (!auth || !c.device.userId || !c.device.userToken) throw Error('La API no autorizó la sesión.');
      connecting=null;return c;
    },function(err) { connecting=null;throw explainConnectionError(err); });
    return connecting;
  }
  function localAction(name,args){
    if(w.CactusProgress && /^(progressGet|progressSave|progressClear|continueList)$/.test(name)) return w.CactusProgress.store(name,args);
    if(/^profile(List|Create|Rename)$/.test(name)){
      var profiles=read('profiles',[{id:'default',name:'Principal',color:0}]);
      if(!Array.isArray(profiles)||!profiles.some(function(p){return p.id==='default';}))profiles=[{id:'default',name:'Principal',color:0}];
      if(name==='profileList')return profiles;
      var profileName=String(args[name==='profileRename'?1:0]||'').trim().slice(0,24);
      if(!profileName)throw Error('Escribe un nombre para el perfil.');
      if(name==='profileCreate'){
        if(profiles.length>=8)throw Error('Ya tienes ocho perfiles.');
        profiles.push({id:'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,7),name:profileName,color:Math.max(0,Math.min(5,Number(args[1])||0))});
      }else{
        var selected=profiles.find(function(p){return p.id===args[0];});if(!selected)throw Error('Ese perfil no existe.');selected.name=profileName;
      }
      write('profiles',profiles);return {saved:true};
    }
    var a=args[0], favs=read('favorites',[]), progress=read('progress',{}), id;
    if (name==='runtimeStatus') return {downloads:false, backend:'browser-direct'};
    if (name==='favList') return favs;
    if (name==='favStatus') return {favorited:favs.some(function(v){return String(v.contentId)===String(a);})};
    if (name==='favToggle') {
      id=String(a && a.contentId || '');
      if (!id) throw Error('Título inválido');
      var i=favs.findIndex(function(v){return String(v.contentId)===id;});
      var enabled=i<0;
      if (enabled) favs.push(a); else favs.splice(i,1);
      write('favorites',favs);
      return {favorited:enabled};
    }
    if (name==='progressGet') return progress[String(a)] || null;
    if (name==='continueList') return Object.keys(progress).map(function(k){
      var p=progress[k];return p && p.item ? Object.assign({},p.item,{position:p.position,duration:p.duration,episode:p.episode}) : null;
    }).filter(Boolean);
    if (name==='progressSave') {
      if (a && a.item && a.item.contentId) { progress[String(a.item.contentId)]=a;write('progress',progress); }
      return {saved:true};
    }
    if (name==='progressClear') {delete progress[String(a)];write('progress',progress);return {saved:true};}
    if (name==='playStop') return {stopped:true};
    if (name==='downloadStart'||name==='downloadPlay') throw Error('Las descargas no están disponibles en Samsung.');
    if (name==='artwork' || name==='metadataLookup' || name==='artworkEpisodes' || name==='searchAlternates') return null;
    if (name==='artworkMany') return {};
    if (name==='diagnosticsNote') return {saved:false};
    if (name==='animeBrowse' || name==='animeSearch' || name==='animeVersions'||name==='animeSeasons'||name==='animeEpisodes'||name==='animeFilters') {
      if (name==='animeBrowse') throw Error('JKAnime no está conectado en esta versión directa. Utiliza Anime y animación del catálogo autorizado cuando la sesión esté disponible.');
      if (name==='animeSearch') return [];
      return name==='animeFilters' ? {} : [];
    }
    return undefined;
  }
  // Solo acepta URLs HTTPS normales suministradas explícitamente por la API autorizada.
  // No reconstruye URLs protegidas, no manipula licencias ni suplanta cabeceras HTTP.
  // Supports direct video endpoints with no extension only when the API explicitly
  // declares video MIME. Never copies authentication headers to AVPlay.
  function usableUrl(raw, mimeHint) {
    if (typeof raw !== 'string' || raw.length > 4096) return null;
    var text = raw.trim(), url;
    if (!/^https:\/\//i.test(text) || /[\r\n\t]/.test(text)) return null;
    try { url = new URL(text); } catch(e) { return null; }
    if (!/^https:$/.test(url.protocol) || url.username || url.password) return null;
    if (/^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2[0-9]|3[01])\.)/i.test(url.hostname)) return null;
    if (/\.(m3u8|mp4|mpd|m4v)$/i.test(url.pathname)) return url.href;
    if (/^(application\/(vnd\.apple\.mpegurl|x-mpegurl|dash\+xml)|video\/(mp4|x-m4v))$/i.test(String(mimeHint||'').trim())) return url.href;
    return null;
  }
  // No requests are made here; only booleans/counts are returned. Never show,
  // persist or log stream URLs, hosts, cookies, session keys, headers or licenses.
  function sourceDiagnostics(root) {
    var queue=[{value:root,depth:0}], visited=[], count=0;
    var out={ live:0, protected:false, plainHttps:0, http:0, opaque:0, noUrl:0, manifests:0 };
    while(queue.length && count<230) {
      var entry=queue.shift(), v=entry.value;count++;
      if (!v || typeof v!=='object' || visited.indexOf(v)>=0 || entry.depth>5) continue;
      visited.push(v);
      if (Array.isArray(v.liveAddressList)) out.live += v.liveAddressList.length;
      if ((v.headers && Object.keys(v.headers).length) ||
          (v.httpHeaders && Object.keys(v.httpHeaders).length) ||
          v.license || v.contentLicense || v.contentAuth || v.drm || v.drmInfo ||
          v['Content-License'] || v['Content-Auth'] ||
          (v.licenseList && v.licenseList.length)) out.protected=true;
      Object.keys(v).slice(0,54).forEach(function(k){
        var x=v[k];
        if (typeof x==='string' && /^(https?:\/\/)/i.test(x)) {
          if (/^https:\/\//i.test(x)) {if (/\.(m3u8|mp4|mpd|m4v)([?#]|$)/i.test(x)) out.plainHttps++; else out.opaque++;}
          else out.http++;
        }
        if (/^((manifest|hls|dash|stream|playlist|media).*|avformat|cdnType)$/i.test(k)) out.manifests++;
        if (/token|secret|license|password|auth|credential|cookie|session|userId/i.test(k)) return;
        if (x && typeof x==='object' && entry.depth<5) queue.push({value:x,depth:entry.depth+1});
      });
    }
    var details=[];
    if(out.live) details.push(out.live+' variante(s) de canal');
    if(out.protected) details.push('autorizacion/cabeceras indicadas');
    if(out.http) details.push('enlace HTTP (no HTTPS)');
    if(out.opaque) details.push('enlace sin extension reconocible');
    if(out.plainHttps) details.push('referencia HTTPS con extension multimedia');
    if(!details.length) details.push('sin referencia multimedia directa identificable');
    return details.join('; ')+'.';
  }
  function findPlainMedia(root) {
    var stack=[{value:root,depth:0,blocked:false}], seen=[], tested=0;
    var directKeys=['hlsUrl','mp4Url','dashUrl','mediaUrl','streamUrl','playUrl','playbackUrl','directUrl','manifestUrl','src'];
    while(stack.length && tested < 180) {
      var rec=stack.shift(), value=rec.value;tested++;
      if (!value || typeof value!=='object' || seen.indexOf(value)>=0 || rec.depth > 6) continue;
      seen.push(value);
      // Cuando la fuente exige licencia/cabeceras especiales, AVPlay no puede usarla
      // como un enlace abierto: NO enviamos licencias en rutas o query strings.
      var restricted=!!(value.headers || value.httpHeaders || value.drm || value.drmInfo || value.contentAuth || value.contentLicense || value['Content-License'] || value['Content-Auth'] || (value.licenseList && value.licenseList.length) || value.license);
      if (!restricted && !rec.blocked) {
        for(var i=0;i<directKeys.length;i++) {
          var field=value[directKeys[i]], candidate=usableUrl(field, value.mimeType||value.contentType);
          if (candidate) return candidate;
        }
        // Un campo genérico "url" solo cuenta cuando dice explícitamente que es VIDEO.
        var mediaHint=String(value.mimeType||value.contentType||value.format||value.type||'');
        if (/(video\/|mpegurl|dash\+xml|hls|\bmp4\b|\bmpd\b|\bm3u8\b)/i.test(mediaHint)) {
          var generic=usableUrl(value.url, value.mimeType||value.contentType);
          if (generic) return generic;
        }
      }
      if (rec.depth < 6) {
        Object.keys(value).slice(0,48).forEach(function(k) {
          if (/token|license|secret|password|auth|credential|cookie|headers|userId|session/i.test(k)) return;
          var child=value[k];
          if (child && typeof child==='object') stack.push({value:child,depth:rec.depth+1,blocked:rec.blocked||restricted});
        });
      }
    }
    return null;
  }
  function playableObject(url,live,sources) {return {url:url,kind:live?'live':'vod',playbackId:null,source:'direct-https',subtitles:w.CactusTracks?w.CactusTracks.collect.apply(null,sources||[]):[]};}
  function noDirect(live, payload) {
    return Error((live?'Canal':'Título')+': AVPlay no recibió una URL compatible. Fuente detectada: '+sourceDiagnostics(payload)+' Se necesita una forma de reproducción autorizada y compatible.');
  }
  function prepareDirectPlayback(item,c) {
    if (!item || typeof item!=='object') return Promise.reject(Error('Faltan datos del contenido seleccionado'));
    var live=Array.isArray(item.liveAddressList) && item.liveAddressList.length>0;
    var url=findPlainMedia(item);
    if (url) return Promise.resolve(playableObject(url,live,[item]));
    if (live) return Promise.reject(noDirect(true,item));
    if (!item.contentId) return Promise.reject(Error('Falta el identificador del contenido'));
    return c.catalog.getItemData(item.contentId,item.type).then(function(detail){
      var found=findPlainMedia(detail);
      if (found) return playableObject(found,false,[detail,item]);
      if (!c.stream) throw noDirect(false,detail);
      // La propia API autorizada ofrece información de disponibilidad de reproducción.
      // Se analiza únicamente si proporciona una URL HTTPS directa; no se reescriben
      // licencias ni se invoca el proxy propietario del paquete LG.
      var isSeries = String(item.type) === '0';
      var options = isSeries ? {
        type: '0',
        episode: Number(item.episode) || 1,
        seriesContentId: item.seriesContentId || item.contentId
      } : {
        type: '1',
        episode: 1
      };
      var rootPromise = isSeries ? c.catalog.getRootColumns().then(function(d){
        var children = d && d.childColumnList || [];
        var sCol = children.find(function(c){ return c.code === 'masnew_series' || /series/i.test(c.name); });
        options.columnId = sCol ? sCol.id : (item.columnId || 76178);
      }).catch(function(){
        options.columnId = item.columnId || 76178;
      }) : Promise.resolve();
      return rootPromise.then(function(){return c.stream.startPlayVOD(item.contentId,options);}).then(function(meta){
        var source=findPlainMedia(meta);
        if (!source) throw noDirect(false,meta);
        return playableObject(source,false,[meta,detail,item]);
      });
    });
  }
  function route(name,args,c) {
    var cat=c.catalog;
    switch(name){
      case 'init': return {connected:true};
      case 'play': return prepareDirectPlayback(args[0], c);
      case 'getSections': return cat.getRootColumns();
      case 'getSection': return cat.getColumnContents(args[0],args[1],args[2],args[3]);
      case 'getNextColumns': return cat.getNextColumns(args[0],args[1],args[2]);
      case 'getCategoryContents': return cat.getCategoryContents(args[0],args[1],args[2],args[3]);
      case 'getCategories': return cat.getCategories(args[0]);
      case 'getItem': return cat.getItemData(args[0],args[1]);
      case 'search': return cat.search(args[0],args[1],args[2],args[3] && args[3].type || '4');
      case 'filterOptions': return cat.filterOptions(args[0]);
      case 'filterContent': return cat.filterContent(args[0],args[1]);
      case 'getChannels': {
        if (args[0] && args[0].columnId) return c.live.getLiveData(args[0]);
        return cat.getColumnContents('masnew_live',1,100).then(function(r){
          var sub=(r&&r.childColumnList||[]).filter(function(v){return v&&v.id;});
          return Promise.all(sub.map(function(v){return c.live.getLiveData({columnId:v.id});}));
        });
      }
      default: throw Error('Función no disponible sin servidor local: '+name);
    }
  }
  function handle(name,args){
    args=Array.isArray(args)?args:[];
    var local=localAction(name,args);
    if (local!==undefined) return Promise.resolve(local);
    return connect().then(function(c){var initialSession=c.device.userToken;
      return Promise.resolve().then(function(){return route(name,args,c);}).catch(function(error){
        var expired=/^(aaa10002[78]|aaa10000[123]|aaa10008[0-9]|aaa10009[0-9]|10002[78]|10008[0-9]|401|403)$/i.test(String(error&&error.code||''))||/\b(aaa10002[78]|aaa10000[123]|aaa10008[0-9]|aaa10009[0-9]|token|session|expired|auth)\b/i.test(String(error&&error.message||''));
        if(!expired)throw error;
        if(c.device.userToken!==initialSession)return route(name,args,c);
        if(!refreshing)refreshing=c.session.refresh().then(function(){
          if(c.catalog&&c.catalog.clearCache)c.catalog.clearCache();
          if(c.stream)c.stream._slbCache=null;
          refreshing=null;
        },function(e){refreshing=null;throw e;});
        return refreshing.then(function(){return route(name,args,c);});
      });
    });
  }
  function http(name,args){
    return Promise.resolve().then(function(){return handle(name,args);}).then(function(data){
      return {ok:true,json:function(){return Promise.resolve({data:data});}};
    },function(error){
      return {ok:false,json:function(){return Promise.resolve({error:jsonError(error)});}};
    });
  }
  w.CactusDirect = {http:http,connect:connect,request:handle,version:'2.0.19'};
})(window);
