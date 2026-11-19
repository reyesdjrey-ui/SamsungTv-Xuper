!function(){"use strict";var t=!1;function i(){return false;}function a(){}function n(e,t,i){var a=document.createElement(e);if("img"===e){a.decoding="async";}return t&&(a.className=t),null!=i&&(a.textContent=i),a}function r(e){return document.getElementById(e)}function o(e){for(;e.firstChild;)e.removeChild(e.firstChild)}function l(e,t,i,a,n){return e.style.position="absolute",e.style.left=t+"px",e.style.top=i+"px",void 0!==a&&(e.style.width=a+"px"),void 0!==n&&(e.style.height=n+"px"),e}function s(e,t){for(;e&&e!==document;){if(1===e.nodeType&&e.matches&&e.matches(t))return e;e=e.parentNode}return null}function d(e){return e<10?"0"+e:""+e}function c(e){return(e=String(e).toLowerCase()).normalize&&(e=e.normalize("NFD").replace(/[\u0300-\u036f]/g,"")),e}var p=["Acción","Drama","Comedia","Suspenso","Aventura","Animación","Familiar","Ciencia ficción"],u=[],f={Destacado:"destacado","Película":"pelicula",Serie:"serie",Gratis:"gratis",Infantil:"infantil",UHD:"uhd",Extra:"extra"};function v(e,t,i){for(var a=1;a<=t;a++){var n=p[(i+a)%p.length],r=p[(i+a+3)%p.length];u.push({id:u.length+1,title:e+" demo "+d(a),category:f[e]||"",score:(7.9+(i+a)%16/10).toFixed(1),year:2018+(i+a)%9,duration:1+(i+a)%2+" h "+(10+(7*i+5*a)%45)+" min",genres:n===r?[n]:[n,r],director:"Director demo "+d(a),actors:"Actor demo "+d(a)+", Actriz demo "+d(a+1),synopsis:"Sinopsis de demostración para "+e.toLowerCase()+" demo "+d(a)+'. Este texto sólo existe para comprobar el recorte a dos líneas, el interlineado y la sangría de la etiqueta "Sinopsis :" definidos en activity_voddetails.',kind:e.toLowerCase()})}}v("Destacado",5,1),v("Película",7,2),v("Serie",7,3),v("Gratis",5,4),v("Infantil",8,5),v("UHD",4,6),v("Extra",4,7);var h=window.XUPERTV_API||{},m=/[?&]service=([^&]+)/.exec(window.location.search||"");m&&(h.devServiceUrl=decodeURIComponent(m[1]));var g={loading:!1,source:"demo",error:null},y={refreshing:!1,lastSync:0,roots:0,error:null},b=["featured","movies","series","anime","kids","free"];function C(e){if("[object Array]"===Object.prototype.toString.call(e))return e;if(!e)return[];for(var t=["items","movies","results","recommendList","movieList","totalMovieList","programList","data"],i=0;i<t.length;i++){if("[object Array]"===Object.prototype.toString.call(e[t[i]]))return e[t[i]];if(e[t[i]]&&"object"==typeof e[t[i]]){var a=C(e[t[i]]);if(a.length)return a}}return[]}function w(e){var t=h[e+"Url"];if(t)return String(t);var i=String(h.baseUrl||"").replace(/\/$/,""),a=String(h[e+"Path"]||"");return i&&a?i+("/"===a.charAt(0)?a:"/"+a):""}function S(){var e=h.session||{};return{userId:String(e.userId||""),userToken:String(e.userToken||""),portalCode:String(e.portalCode||""),homePageCode:String(e.homePageCode||""),version:String(e.version||"4.34.4")}}function x(){var e=S();return!!(e.userId&&e.userToken&&e.portalCode)}function _(e,t){var i=S();return"catalog"===e?{userId:i.userId,userToken:i.userToken,portalCode:i.portalCode,homePageCode:i.homePageCode,version:i.version}:"search"===e?{userToken:i.userToken,userId:i.userId,portalCode:i.portalCode,columnId:"",value:t||"",type:"",pageSize:20,pageNum:1,filter:""}:{userToken:i.userToken,userId:i.userId,portalCode:i.portalCode,programId:t}}function L(e){return e?(e=String(e),/^https?:\/\//i.test(e)||0===e.indexOf("data:")?e:h.imageBaseUrl?String(h.imageBaseUrl).replace(/\/$/,"")+"/"+e.replace(/^\//,""):e):""}function k(e,t){return null==e||""===e?t:String(e)}function I(e){if(!e)return false;if("movie"===e.type||"pelicula"===e.type||"película"===e.type||"movie"===e.kind||"película"===e.kind)return false;if("teleplay"===e.type||"series"===e.type||"serie"===e.kind)return true;if(e.category&&-1!==e.category.toLowerCase().indexOf("serie"))return true;if(e.seasons&&e.seasons.length>1)return true;if(e.episodes&&e.episodes.length>1)return true;if(e.volumeCount&&parseInt(e.volumeCount,10)>1)return true;if(e.volumnCount&&parseInt(e.volumnCount,10)>1)return true;return false;}function T(e,t){var rawG=(e=e||{}).genres||e.genre||e.tags||e.tag||[];"string"==typeof rawG&&(rawG=rawG.split(","));"[object Array]"!==Object.prototype.toString.call(rawG)&&(rawG=[]);for(var a=[],n=0;n<rawG.length;n++){var gItem=String("string"==typeof rawG[n]?rawG[n]:rawG[n].name||"").trim();gItem&&a.push(gItem);}var r=e.duration||e.runtime||e.runtimeMinutes||"";"number"==typeof r&&(r=Math.floor(r/60)+" h "+r%60+" min");var o=k(e.type||e.programType,""),l="teleplay"===o||"series"===o||"serie"===c(k(e.kind||"",""))||-1!==c(k(e.category||"","")).indexOf("serie")||e.episodes&&e.episodes.length>0||e.seasons&&e.seasons.length>0||e.volumeCount&&parseInt(e.volumeCount,10)>1||e.volumnCount&&parseInt(e.volumnCount,10)>1;var tagsStr=e.tags?(typeof e.tags==="string"?e.tags:(Array.isArray(e.tags)?e.tags.join(", "):"")):(e.tag||"");var audioVal=e.audio||e.audioInfo||e.language||e.languages||e.dubLanguage||e.voiceLanguage||"";if(!audioVal&&/bra[sz]il|portug/i.test((e.country||e.originalCountry||"")+" "+(e.title||e.name||""))){audioVal="Portugués";}return{id:k(e.id||e.contentId||e.vodId||e.programId||e.program_id||e.tmdb_id,"api-"+t),contentId:k(e.contentId||e.id||"",""),rawType:k(e.rawType||(l?"0":"1"),l?"0":"1"),title:k(e.title||e.name||e.programName||e.programTitle||e.original_title,"Sin título"),category:c(k(e.category||e.section||e.collection||e.homeSection,"")),score:k(e.score||e.vote_average||e.rating||e.movieRate||e.programScore,"—"),year:k((e.year&&e.year!=="—")?e.year:(e.release_year||e.programYear||(e.releaseDate||e.releaseTime||e.release_date||"").slice(0,4)||(String(e.row||"").match(/\b(19\d\d|20\d\d)\b/)||[0,"—"])[1]),"—"),duration:k(r,"—"),genres:a.length?a:["Sin clasificar"],tags:tagsStr,audio:audioVal||"Latino",director:k(e.director,"—"),actors:k(e.actors||e.actorDisplay||e.cast,"—"),synopsis:k(e.synopsis||e.overview||e.description||e.programUpdateContent,"Sin sinopsis disponible."),kind:l?"serie":k(e.kind||e.media_type,"película"),poster:L(e.poster||e.posterUrl||e.poster_url||e.poster_path||e.image||e.imageUrl||e.cover||e.coverUrl||e.programPoster||e.programImage||(e.posterList&&e.posterList[0]&&(e.posterList[0].fileUrl||e.posterList[0].url))||""),landscape:L(e.landscape||e.landscapeUrl||e.landscape_url||e.wideImage||e.bannerImage||e.backdrop||e.poster),backdrop:L(e.backdrop||e.backdropUrl||e.backdrop_url||e.backdrop_path||e.landscape||e.poster),streamUrl:e.streamUrl||e.stream_url||"",type:o||(l?"teleplay":"movie"),row:k(e.row,""),alias:k(e.alias,""),country:k(e.country||e.originalCountry,""),releaseDate:k(e.releaseDate||e.releaseTime,""),tagline:k(e.tagline||e.viewPoint,""),volumeCount:parseInt(e.volumeCount||e.volumnCount,10)||0,updateCount:parseInt(e.updateCount,10)||0,episodes:e.episodes||[],seasons:e.seasons||[],moreAudio:void 0!==e.moreAudio?e.moreAudio:0,moreSubtitle:void 0!==e.moreSubtitle?e.moreSubtitle:0,_catOrder:e._catOrder||null,_portal:!0===e.portal||!0===e._portal||h&&"portal"===h.mode&&String(e.id||"").length>10}}function E(e,t,i){i=i||{};var a=new XMLHttpRequest,n=!1,r=parseInt(h.timeoutMs,10)||1e4;function o(e,i){n||(n=!0,t(e,i))}a.open(i.method||"GET",e,!0),a.timeout=r;var l=h.headers||{};for(var s in l)Object.prototype.hasOwnProperty.call(l,s)&&a.setRequestHeader(s,l[s]);void 0===i.body||l["Content-Type"]||l["content-type"]||a.setRequestHeader("Content-Type","application/json;charset=utf-8"),a.onreadystatechange=function(){if(4===a.readyState)if(a.status<200||a.status>=300)o("HTTP "+a.status);else try{o(null,JSON.parse(a.responseText))}catch(e){o("La API no devolvió JSON válido")}},a.onerror=function(){o("Error de red o CORS")},a.ontimeout=function(){o("Tiempo de espera agotado")};try{a.send(void 0===i.body?null:JSON.stringify(i.body))}catch(e){o(e.message||"No se pudo iniciar la petición")}}function saveCachedCatalog(items){try{if(!items||!items.length)return;var toSave=[],maxSave=Math.min(items.length,220);for(var i=0;i<maxSave;i++){var it=items[i];if(it&&it.id){toSave.push({id:it.id,title:it.title||it.name||"",poster:it.poster||it.cover||"",landscape:it.landscape||it.backdrop||"",backdrop:it.backdrop||it.landscape||"",category:it.category||"",kind:it.kind||"",type:it.type||"",score:it.score||"",year:it.year||"",duration:it.duration||"",genres:it.genres||[],synopsis:it.synopsis||"",_catOrder:it._catOrder||null,_portal:!!it._portal});}}localStorage.setItem("xuper_live_catalog_v3",JSON.stringify(toSave));}catch(e){}}
function loadCachedCatalog(){try{var raw=localStorage.getItem("xuper_live_catalog_v3");if(raw){var parsed=JSON.parse(raw);if(Array.isArray(parsed)&&parsed.length)return parsed;}}catch(e){}return null;}
function preloadCatalogPosters(){}
function M(e,t,i){if(!e.length)return!1;for(var a={},n=0;n<u.length;n++)a[String(u[n].id)]=u[n];u.splice(0,u.length);for(var o=0;o<e.length;o++){var l=T(e[o],o+1);i&&!1!==e[o].portal&&(l._portal=!0);var d=a[String(l.id)];d&&(d.episodes&&(l.episodes=d.episodes),d.seasons&&(l.seasons=d.seasons),d._detailsLoaded&&(l._detailsLoaded=!0),!l.streamUrl&&d.streamUrl&&(l.streamUrl=d.streamUrl)),u.push(l)}if(ke.detail){for(var c=!1,p=0;p<u.length;p++)if(String(u[p].id)===String(ke.detail.id)){ke.detail=u[p],c=!0;break}c||(ke.detail=u[0])}return g.source=t,g.error=null,("portal"===t||"api"===t)&&saveCachedCatalog(u),function(){if(Ie&&"portal"!==t){var e=r("home-tabs"),tExp=!(!e||!e.classList.contains("is-expanded")||e.classList.contains("is-collapsed")),iTab=!(!ke.focus||void 0===ke.focus._tab),aNot=!(!ke.focus||!s(ke.focus,"#home-notify")),nPg=!(!ke.focus||!s(ke.focus,".home-page"));if(Te=[],Ee=[],Ke(),Ze(ke.tab,!1),"home"===ke.screen){if(iTab&&Ee[ke.tab])Fe(Ee[ke.tab],!0);else if(aNot){var o=Be(r("home-notify"));o&&Fe(o,!0)}else if(nPg){var l=Te[_e[ke.tab].page],d=l?Be(l):null;d&&Fe(d,!0)}if(tExp&&e){e.classList.add("is-expanded"),e.classList.remove("is-collapsed");var c=document.querySelector(".home-sidebar-bg");c&&c.classList.add("is-on")}}}}(),!0}function q(e,t,i){var a,n=[];if(e)for(a=0;a<u.length;a++){-1!==c(u[a].category||"").split(",").indexOf(e)&&n.push(u[a])}if(n.length||(n=u.slice(i,i+t)),n.length||(n=u.slice(0,t)),n.length<t&&u.length){var r={};for(a=0;a<n.length;a++)r[String(n[a].id)]=!0;for(var o=0;n.length<t&&o<2*u.length;){var l=u[o%u.length];o++,r[String(l.id)]||(n.push(l),r[String(l.id)]=!0)}}return n}function O(){var e=window.XUPERTV_CATALOG;return e?C(e):[]}function A(){return!window.PalmServiceBridge||window.webOS&&window.webOS.service||(window.webOS=window.webOS||{},window.webOS.service={request:function(e,t){t=t||{};var i=new window.PalmServiceBridge;i.onservicecallback=function(e){var i;try{i=JSON.parse(e)}catch(t){i={returnValue:!1,errorText:e}}!1===i.returnValue?t.onFailure&&t.onFailure(i):t.onSuccess&&t.onSuccess(i)};var a=t.method?e.replace(/\/$/,"")+"/"+t.method:e;return i.call(a,JSON.stringify(t.parameters||{})),i}}),!!(window.webOS&&window.webOS.service&&window.webOS.service.request)}function D(e,t,n){if(window.XuperTizenBridge&&window.XuperTizenBridge.call){return window.XuperTizenBridge.call(e,t,function(err,res){if(n)n(err,res);}),!0;}if(n)n("Servicio no disponible",null);return!1;}function P(e){var t={},i=[],a={},ord={};var rootMap={featured:"destacado",movies:"pelicula",series:"serie",anime:"anime",kids:"infantil",free:"gratis"};function n(e,catKey,idx){if(e&&e.id){var n=String(e.id);if(t[n]){var r=t[n];for(var o in e)Object.prototype.hasOwnProperty.call(e,o)&&""!==e[o]&&"—"!==e[o]&&null!==e[o]&&void 0!==e[o]&&(r[o]=e[o])}else t[n]=e,i.push(n);ord[n]=ord[n]||{};if(catKey&&void 0===ord[n][catKey])ord[n][catKey]=idx;var l=String(e.category||"").split(",");a[n]=a[n]||{};for(var s=0;s<l.length;s++)l[s]&&(a[n][l[s]]=!0);catKey&&(a[n][catKey]=!0)}}for(var r=0;r<b.length;r++){var rk=b[r],ck=rootMap[rk]||rk;for(var o=e[rk]||[],l=0;l<o.length;l++)o[l].portal=!0,n(o[l],ck,l)}if(i.length){for(var s=[],d=0;d<i.length;d++){var c=t[i[d]];c.category=Object.keys(a[i[d]]).join(","),c._catOrder=ord[i[d]]||{},s.push(c)}for(var p=function(){for(var e=O(),t=[],i=0;i<e.length;i++)if(e[i]&&e[i].streamUrl){var a={};for(var n in e[i])Object.prototype.hasOwnProperty.call(e[i],n)&&(a[n]=e[i][n]);a.category="demo",a.portal=!1,t.push(a)}return t}(),u=0;u<p.length;u++)s.push(p[u]);s.length&&M(s,"portal",!0)}}function N(){if(!y.refreshing){y.refreshing=!0,y.error=null;var e={},t=0;!function i(){if(t>=b.length)return y.refreshing=!1,y.lastSync=Date.now(),void P(e);var a=b[t++];D("home",{root:a},function(t,n){!t&&n&&!1!==n.returnValue&&n.items&&n.items.length?(e[a]=n.items,y.roots++):t&&(y.error=t),setTimeout(i,250)})}()}}function R(){var e,t=(e=window.XUPERTV_PORTAL)?C(e):[],cached=loadCachedCatalog();if(cached&&cached.length){var seen={},merged=[];for(var ci=0;ci<cached.length;ci++){var cid=String(cached[ci].id);if(cid&&!seen[cid]){seen[cid]=!0;merged.push(cached[ci]);}}for(var bi=0;bi<t.length;bi++){var bid=String(t[bi].id);if(bid&&!seen[bid]){seen[bid]=!0;merged.push(t[bi]);}}t=merged;}t.length&&M(t,"portal-snapshot",!0);setTimeout(function(){if(!y.rootsLoaded){y.rootsLoaded=!0;N();}},18000);}function U(e,t){return M(O(),e||"bundled")?(t&&(g.error=t),!0):(g.error=t||"No hay catálogo local ni remoto",!1)}function F(){if(h.enabled)if("portal"!==h.mode)if("static"!==h.mode){var e=w("catalog");"xuper"!==h.mode||x()?e?(g.loading=!0,E(e,function(e,t){g.loading=!1;var i=function(e){if(!e||"object"!=typeof e)return"";var t=e.returnCode||e.code||e.errorCode||"",i=e.errorMessage||e.message||e.msg||"";return t||i?(t?String(t)+": ":"")+(i?String(i):"La API rechazó la petición"):""}(t);if(e||i||!M(C(t),"api")){var a=e||i||"La API no devolvió películas";U("bundled-fallback",a)||(g.error=a)}},"xuper"===h.mode?{method:"POST",body:_("catalog")}:null)):h.useBundledCatalog?U("bundled",null):g.error="Falta baseUrl/catalogUrl del catálogo autorizado":g.error="Falta la sesión XuperTV (userId, userToken y portalCode)"}else U("bundled",null);else R()}function B(e,t){var i=T(t,e.id);for(var a in i)Object.prototype.hasOwnProperty.call(i,a)&&"—"!==i[a]&&""!==i[a]&&"Sin sinopsis disponible."!==i[a]&&(e[a]=i[a])}function H(e,t){if(t=t||function(){},!e)return t(null);if(e._detailsLoaded)return t(e);if(e._detailLoading)return e._detailWait=e._detailWait||[],void e._detailWait.push(t);if("portal"===h.mode&&e._portal)return e._detailLoading=!0,e._detailWait=[t],void D("detail",{contentId:e.id,type:I(e)?"0":"1"},function(t,i){e._detailLoading=!1;e._detailsLoaded=!0;if(!t&&i&&!1!==i.returnValue&&i.item){B(e,i.item),e.episodes=i.episodes||[],e.seasons=i.seasons||[],e.seasonId||(e.seasonId=e.id);e.seasons&&e.seasons.length&&e.seasons.sort(function(e,t){return(parseInt(e.number,10)||0)-(parseInt(t.number,10)||0)});if((!e.seasons||!e.seasons.length)&&I(e)){var a=1,n=/S(\d+)/i.exec(e.alias||"")||/T(\d+)/i.exec(e.title||"");n&&(a=parseInt(n[1],10)||1),e.seasons=[{id:e.id,number:a}]}if(e.seasons&&e.seasons.length){for(var r=0,o=0;o<e.seasons.length;o++)if(e.seasons[o].id===e.id){r=o;break}ke.detailSeason=r}e.episodes&&e.episodes.length&&!ke.detailEpisode&&(ke.detailEpisode=e.episodes[0])}var l=e._detailWait||[];e._detailWait=[];var zBefore=Za;for(var s=0;s<l.length;s++)l[s](e);if(ke.detail===e&&"detail"===ke.screen){var curKind=ke.focus&&void 0!==ke.focus._kind?ke.focus._kind:null;var curSeason=ke.focus&&ke.focus.classList&&ke.focus.classList.contains("detail-season");Pt(e);if(curKind!==null&&K&&K.children[curKind]){Fe(K.children[curKind]);}else if(curSeason&&Y){var sBtn=Y.querySelector(".detail-season");sBtn&&Fe(sBtn);}Za===zBefore&&((pe&&pe.src&&!pe.paused)||fn(e,ke.detailEpisode));}});var i=w("detail");return h.enabled&&i&&("xuper"!==h.mode||x())?(e._detailLoading=!0,void E(i.replace("{id}",encodeURIComponent(e.id)),function(i,a){if(e._detailLoading=!1,!i){var n=C(a),r=n.length?n[0]:a&&(a.item||a.movie||a);r&&"object"==typeof r&&(B(e,r),e._detailsLoaded=!0,ke.detail===e&&"detail"===ke.screen&&(Pt(e),pe&&pe.src&&!pe.paused||fn(e,ke.detailEpisode)))}t(e)},"xuper"===h.mode?{method:"POST",body:_("detail",e.id)}:null)):t(e)}var z=[];!function(){if(window.__BUNDLED_CHANNELS&&window.__BUNDLED_CHANNELS.length>0){z=window.__BUNDLED_CHANNELS.slice();return;}for(var e=["Canal demo 01","Canal demo 02","Canal demo 03","Canal demo 04","Canal demo 05","Canal demo 06","Canal demo 07","Canal demo 08","Canal demo 09","Canal demo 10","Canal demo 11","Canal demo 12"],t=0;t<e.length;t++)z.push({index:t+1,name:e[t],now:"Programa demo "+d(t+1),next:"Programa demo "+d(t+2),time:"20:00 - 21:30",fav:t%3==0,uhd:2===t||6===t})}();var V,j,W,$,X,Q,G,J,K,Y,Z,ee,te,ie,ae,ne,re,oe,le,se,de,ce,pe,ue,fe,ve,he,me,ge,ye,be,Ce,we,Se,xe={tv:'<svg viewBox="0 0 33 33"><rect x="3.5" y="7" width="26" height="17" rx="2.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M11 24.5v3h11v-3" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>',thumb:'<svg viewBox="0 0 33 33"><path d="M12 15.5V28H7.6A2.6 2.6 0 0 1 5 25.4v-7.3a2.6 2.6 0 0 1 2.6-2.6H12z" fill="currentColor"/><path d="M14 15.6l4.3-9.2a2.2 2.2 0 0 1 4 1.6V13h5.6a2.9 2.9 0 0 1 2.8 3.6l-2 9A3.4 3.4 0 0 1 25.4 28H14z" fill="currentColor"/></svg>',film:'<svg viewBox="0 0 33 33"><circle cx="16.5" cy="16.5" r="11.5" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="16.5" cy="16.5" r="2.4" fill="currentColor"/><circle cx="16.5" cy="9.5" r="2.1" fill="currentColor"/><circle cx="16.5" cy="23.5" r="2.1" fill="currentColor"/><circle cx="9.5" cy="16.5" r="2.1" fill="currentColor"/><circle cx="23.5" cy="16.5" r="2.1" fill="currentColor"/></svg>',strip:'<svg viewBox="0 0 33 33"><rect x="4" y="7" width="25" height="19" rx="2" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M9 7v19M24 7v19" stroke="currentColor" stroke-width="1.8"/><rect x="5.6" y="9" width="2.4" height="2.6" fill="currentColor"/><rect x="5.6" y="15.2" width="2.4" height="2.6" fill="currentColor"/><rect x="5.6" y="21.4" width="2.4" height="2.6" fill="currentColor"/><rect x="25" y="9" width="2.4" height="2.6" fill="currentColor"/><rect x="25" y="15.2" width="2.4" height="2.6" fill="currentColor"/><rect x="25" y="21.4" width="2.4" height="2.6" fill="currentColor"/></svg>',kids:'<svg viewBox="0 0 33 33"><circle cx="8.6" cy="8.6" r="4" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="24.4" cy="8.6" r="4" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="16.5" cy="18" r="9.6" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="13" cy="17" r="1.5" fill="currentColor"/><circle cx="20" cy="17" r="1.5" fill="currentColor"/><ellipse cx="16.5" cy="21.6" rx="2.4" ry="1.7" fill="currentColor"/></svg>',anime:'<svg viewBox="0 0 33 33"><circle cx="8.5" cy="9" r="4.5" fill="currentColor"/><circle cx="24.5" cy="9" r="4.5" fill="currentColor"/><path d="M16.5 9c5.8 0 10.5 4.6 10.5 10.3 0 5.7-4.7 9.7-10.5 9.7S6 25 6 19.3C6 13.6 10.7 9 16.5 9z" fill="currentColor"/><circle cx="12.5" cy="18" r="1.6" fill="#0b0b0b"/><circle cx="20.5" cy="18" r="1.6" fill="#0b0b0b"/><ellipse cx="16.5" cy="23" rx="3" ry="2" fill="#0b0b0b"/></svg>',compass:'<svg viewBox="0 0 33 33"><circle cx="16.5" cy="16.5" r="11.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M22 11l-3.2 7.8L11 22l3.2-7.8z" fill="currentColor"/></svg>',novel:'<svg viewBox="0 0 33 33"><path d="M5 6.5h9.5c2.2 0 3.7 1 4.5 2.3.8-1.3 2.3-2.3 4.5-2.3H28v20h-5.5c-2.1 0-3.4.6-4.5 1.8-1.1-1.2-2.4-1.8-4.5-1.8H5z" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M18 9v19" stroke="currentColor" stroke-width="2.2"/></svg>',history:'<svg viewBox="0 0 33 33"><circle cx="16.5" cy="17" r="10.5" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M16.5 10.5V17l5 3" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M8 7v6h6" fill="none" stroke="currentColor" stroke-width="2.4"/></svg>'},_e=[{label:"TV",page:0,icon:"tv"},{label:"DESTACADOS",page:1,icon:"thumb"},{label:"PELICULA",page:2,icon:"film"},{label:"SERIES",page:3,icon:"strip"},{label:"KIDS",page:4,icon:"kids"},{label:"ANIME",page:5,icon:"anime"},{label:"EXPLORAR",page:6,icon:"compass"}],Le=[{id:"history",label:"Mi lista (Historial y Favoritos)"},{id:"playback",label:"Configuración global de reproducción"},{id:"cr",label:"Contenido adulto"},{id:"parent",label:"Configuraciones del Control Parental"},{id:"feedback",label:"Ayuda y Feedback"},{id:"about",label:"Sobre nosotros"}],ke={screen:"welcome",tab:0,channel:0,focus:null,detail:null,detailReturn:null,detailRange:0,detailSeason:0,detailNeedsRebuild:!1,playerReturn:null,playerMode:"live",playerItem:null,playerEpisode:null,playerSeasonIndex:0,episodeBrowserOpen:!1,browserSeason:0,streamError:"",streamMode:"normal",trackIndex:0,channelsOpen:!1,infobar:!0,infoTimer:null,searchQuery:"",searchNumeric:!1,searchSeq:0,searchFocus:null,playback:{screen:0,audio:0,subLang:0,size:0,style:0,subtitle:!0},crOn:!1,favs:{}};
var xuperLocalKey="xuper_local_profile_v1",xuperProfile=null,lastHistorySaveTime=0,playerTickerInterval=null,historyCurrentSubTab="history";
function loadXuperProfile(){try{var raw=localStorage.getItem(xuperLocalKey);if(raw)xuperProfile=JSON.parse(raw);}catch(e){}if(!xuperProfile||!xuperProfile.id){xuperProfile={id:"TV-"+String(Date.now()).slice(-8),createdAt:Date.now(),history:[],favs:{}};saveXuperProfile();}if(!xuperProfile.history)xuperProfile.history=[];if(xuperProfile.history.length>40)xuperProfile.history=xuperProfile.history.slice(0,40);if(!xuperProfile.favs)xuperProfile.favs={};ke.favs=xuperProfile.favs;return xuperProfile;}
function saveXuperProfile(){try{if(xuperProfile)localStorage.setItem(xuperLocalKey,JSON.stringify(xuperProfile));}catch(e){}}

var hmCurrentTab = "history", hmEditMode = false, hmSelectedItems = {};
function isSeriesItem(item){
  if(!item) return false;
  if(I(item)) return true;
  var cat = String(item.category || item.kind || item.type || "").toLowerCase();
  if(/serie|anime|dorama|novela|animac/i.test(cat)) return true;
  if(item.episodes && item.episodes.length > 1) return true;
  if(item.seasons && item.seasons.length > 0) return true;
  if(item.volumeCount > 1 || item.volumnCount > 1) return true;
  return false;
}
function openHistoryManager(tab) {
  if (tab === "favs") tab = "fav-channels";
  hmCurrentTab = tab || "history";
  hmEditMode = false;
  hmSelectedItems = {};
  ke.screen = "history-manager";
  ze("history-manager");
  renderHistoryManager();
  var targetTab = r("hm-tab-" + (hmCurrentTab || "history"));
  if (targetTab) Fe(targetTab);
}
function renderHistoryManager() {
  var scr = r("screen-history-manager");
  if (!scr) return;
  scr.classList.toggle("is-editing", !!hmEditMode);
  var tabKeys = ["history", "fav-channels", "fav-movies", "fav-series", "list"];
  for (var k = 0; k < tabKeys.length; k++) {
    var tKey = tabKeys[k];
    var tEl = r("hm-tab-" + tKey);
    if (tEl) {
      tEl.classList.toggle("is-selected", tKey === hmCurrentTab);
      (function(key, el) {
        el._activate = function() {
          hmCurrentTab = key;
          renderHistoryManager();
        };
        el._onMove = function(dir) {
          if ("down" === dir) {
            var next = el.nextElementSibling;
            if (next && next.classList.contains("hm-tab-item")) {
              Fe(next);
              next._activate && next._activate();
            }
            return true;
          }
          if ("up" === dir) {
            var prev = el.previousElementSibling;
            if (prev && prev.classList.contains("hm-tab-item")) {
              Fe(prev);
              prev._activate && prev._activate();
            }
            return true;
          }
          if ("right" === dir) {
            var editBtn = r("hm-btn-edit");
            if (editBtn && Ne(editBtn)) Fe(editBtn);
            else {
              var firstCard = r("hm-grid") ? r("hm-grid").querySelector(".hm-card.focusable") : null;
              if (firstCard) Fe(firstCard);
            }
            return true;
          }
          if ("left" === dir) return true;
          return false;
        };
      })(tKey, tEl);
    }
  }
  var btnEdit = r("hm-btn-edit");
  if (btnEdit) {
    btnEdit.classList.toggle("is-active", !!hmEditMode);
    var editSpan = btnEdit.querySelector("span");
    if (editSpan) editSpan.textContent = hmEditMode ? "Listo" : "Editar";
    btnEdit._activate = function() {
      hmEditMode = !hmEditMode;
      if (!hmEditMode) hmSelectedItems = {};
      renderHistoryManager();
      Fe(btnEdit);
    };
    btnEdit._onMove = function(dir) {
      if ("left" === dir) {
        var activeTab = r("hm-tab-" + (hmCurrentTab || "history"));
        if (activeTab) Fe(activeTab);
        return true;
      }
      if ("right" === dir) {
        var btnDel = r("hm-btn-delete");
        if (btnDel) Fe(btnDel);
        return true;
      }
      if ("down" === dir) {
        var firstCard = r("hm-grid") ? r("hm-grid").querySelector(".hm-card.focusable") : null;
        if (firstCard) Fe(firstCard);
        return true;
      }
      return false;
    };
  }
  var btnDel = r("hm-btn-delete");
  if (btnDel) {
    btnDel._activate = function() {
      if (!xuperProfile) loadXuperProfile();
      var countDel = 0;
      var curFavChannels = getStoredFavorites();
      if (hmEditMode && Object.keys(hmSelectedItems).length > 0) {
        if ("history" === hmCurrentTab) {
          xuperProfile.history = (xuperProfile.history || []).filter(function(x) { return !hmSelectedItems[String(x.id)]; });
        } else if ("fav-channels" === hmCurrentTab) {
          curFavChannels = curFavChannels.filter(function(ch){
            var chKey = "ch_" + (ch.channelCode || ch.id || ch.name);
            return !hmSelectedItems[chKey] && !hmSelectedItems[String(ch.id || ch.channelCode || ch.name)];
          });
          saveStoredFavorites(curFavChannels);
        } else if ("fav-movies" === hmCurrentTab || "fav-series" === hmCurrentTab) {
          for (var id in hmSelectedItems) {
            delete ke.favs[id];
          }
          xuperProfile.favs = ke.favs;
        } else {
          xuperProfile.watchlist = (xuperProfile.watchlist || []).filter(function(x) { return !hmSelectedItems[String(x.id)]; });
          curFavChannels = curFavChannels.filter(function(ch){
            var chKey = "ch_" + (ch.channelCode || ch.id || ch.name);
            return !hmSelectedItems[chKey] && !hmSelectedItems[String(ch.id || ch.channelCode || ch.name)];
          });
          saveStoredFavorites(curFavChannels);
        }
        hmSelectedItems = {};
        countDel = 1;
      } else {
        if ("history" === hmCurrentTab) {
          countDel = (xuperProfile.history || []).length;
          xuperProfile.history = [];
        } else if ("fav-channels" === hmCurrentTab) {
          countDel = curFavChannels.length;
          saveStoredFavorites([]);
        } else if ("fav-movies" === hmCurrentTab) {
          for (var fm = 0; fm < u.length; fm++) {
            if (!isSeriesItem(u[fm])) delete ke.favs[String(u[fm].id)];
          }
          xuperProfile.favs = ke.favs;
        } else if ("fav-series" === hmCurrentTab) {
          for (var fs = 0; fs < u.length; fs++) {
            if (isSeriesItem(u[fs])) delete ke.favs[String(u[fs].id)];
          }
          xuperProfile.favs = ke.favs;
        } else {
          countDel = (xuperProfile.watchlist || []).length;
          xuperProfile.watchlist = [];
        }
      }
      saveXuperProfile();
      cn("");
      showPlayerToast("Lista actualizada");
      renderHistoryManager();
      var activeTab = r("hm-tab-" + (hmCurrentTab || "history"));
      if (activeTab) Fe(activeTab);
    };
    btnDel._onMove = function(dir) {
      if ("left" === dir) {
        if (btnEdit) Fe(btnEdit);
        return true;
      }
      if ("down" === dir) {
        var firstCard = r("hm-grid") ? r("hm-grid").querySelector(".hm-card.focusable") : null;
        if (firstCard) Fe(firstCard);
        return true;
      }
      return false;
    };
  }
  if (!xuperProfile) loadXuperProfile();
  var list = [];
  var curFavChannels = getStoredFavorites();
  var sectionLabel = "títulos";
  if ("history" === hmCurrentTab) {
    list = getXuperHistory();
    sectionLabel = "en historial";
  } else if ("fav-channels" === hmCurrentTab) {
    for (var fch = 0; fch < curFavChannels.length; fch++) {
      var chObj = curFavChannels[fch];
      list.push({
        id: "ch_" + (chObj.channelCode || chObj.id || chObj.name),
        title: chObj.name || "Canal TV",
        poster: chObj.logo || "media/ui/common/bg_placehoder_vertical.png",
        isLiveChannel: true,
        series: false,
        position: 0,
        rawChannel: chObj
      });
    }
    sectionLabel = "canales favoritos";
  } else if ("fav-movies" === hmCurrentTab) {
    for (var f = 0; f < u.length; f++) {
      if (ke.favs && ke.favs[String(u[f].id)] && !isSeriesItem(u[f])) {
        list.push({ id: u[f].id, title: u[f].title || u[f].name, poster: u[f].poster || u[f].cover, series: false, position: 0, _rawItem: u[f] });
      }
    }
    sectionLabel = "películas favoritas";
  } else if ("fav-series" === hmCurrentTab) {
    for (var f2 = 0; f2 < u.length; f2++) {
      if (ke.favs && ke.favs[String(u[f2].id)] && isSeriesItem(u[f2])) {
        list.push({ id: u[f2].id, title: u[f2].title || u[f2].name, poster: u[f2].poster || u[f2].cover, series: true, position: 0, _rawItem: u[f2] });
      }
    }
    sectionLabel = "series y anime favoritos";
  } else {
    var wl = xuperProfile.watchlist || [];
    for (var w = 0; w < wl.length; w++) list.push(wl[w]);
    sectionLabel = "en mi lista";
  }
  var totalCountEl = r("hm-total-count");
  if (totalCountEl) totalCountEl.textContent = "Total " + list.length + " " + sectionLabel;
  var grid = r("hm-grid");
  if (!grid) return;
  o(grid);
  if (!list.length) {
    var emp = n("div", "hm-empty", "No hay títulos en esta sección todavía.");
    grid.appendChild(emp);
    return;
  }
  for (var i = 0; i < list.length && i < 60; i++) {
    (function(cardItem, idx) {
      var card = n("div", "hm-card focusable" + (cardItem.isLiveChannel ? " is-live-card" : "") + (hmSelectedItems[String(cardItem.id)] ? " is-checked" : ""));
      card._item = cardItem;
      card._index = idx;
      var img = document.createElement("img");
      img.className = "hm-card-img";
      img.src = cardItem.poster || "media/ui/common/bg_placehoder_vertical.png";
      img.onerror = function() { this.src = "media/ui/common/bg_placehoder_vertical.png"; };
      card.appendChild(img);
      card.appendChild(n("div", "hm-card-shade"));
      card.appendChild(n("div", "hm-card-title", cardItem.title || "Contenido"));
      var progText = "";
      if (cardItem.isLiveChannel) {
        progText = "Canal en vivo";
      } else if (cardItem.series) {
        progText = cardItem.episodeNumber ? ("Capítulo " + cardItem.episodeNumber) : "Serie / Anime";
      } else if ("fav-movies" === hmCurrentTab) {
        progText = "Película";
      } else if ("history" === hmCurrentTab) {
        progText = cardItem.position > 0 ? ("Ya miró " + formatTimeProgress(cardItem.position)) : "Iniciado";
      } else {
        progText = "En mi lista";
      }
      card.appendChild(n("div", "hm-card-prog", progText));
      var chk = n("div", "hm-card-check");
      chk.innerHTML = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
      card.appendChild(chk);
      card._activate = function() {
        if (hmEditMode) {
          var idStr = String(cardItem.id);
          hmSelectedItems[idStr] = !hmSelectedItems[idStr];
          card.classList.toggle("is-checked", !!hmSelectedItems[idStr]);
        } else {
          if (cardItem.isLiveChannel && cardItem.rawChannel) {
            playLiveSearchChannel(cardItem.rawChannel);
            return;
          }
          var found = cardItem._rawItem;
          if (!found) {
            for (var k = 0; k < u.length; k++) {
              if (String(u[k].id) === String(cardItem.id)) { found = u[k]; break; }
            }
          }
          if (!found) found = cardItem;
          At(found);
        }
      };
      card._onMove = function(dir) {
        if ("left" === dir && (idx % 6 === 0)) {
          var activeTab = r("hm-tab-" + (hmCurrentTab || "history"));
          if (activeTab) Fe(activeTab);
          return true;
        }
        if ("up" === dir && idx < 6) {
          if (btnEdit && Ne(btnEdit)) { Fe(btnEdit); return true; }
        }
        return false;
      };
      grid.appendChild(card);
    })(list[i], i);
  }
}

function getXuperHistory(){if(!xuperProfile)loadXuperProfile();return xuperProfile.history||[];}
function formatTimeProgress(sec){sec=Math.max(0,Math.floor(sec||0));var h=Math.floor(sec/3600),m=Math.floor((sec%3600)/60),s=sec%60;return(h>0?(h<10?"0"+h:h)+":":"")+(m<10?"0"+m:m)+":"+(s<10?"0"+s:s);}
function saveXuperHistory(curSec,durSec,force){var item=ke.playerItem||ke.detail;if(!item||!item.id||curSec<3)return;var now=Date.now();if(!force&&(now-lastHistorySaveTime<4000))return;lastHistorySaveTime=now;if(!xuperProfile)loadXuperProfile();var ep=ke.playerEpisode,itemId=String(item.id),isSeries=!!I(item);var histEntry={id:itemId,title:item.title||item.name||"Contenido",poster:item.poster||item.cover||"",series:isSeries,episodeId:ep&&ep.id?String(ep.id):"",episodeNumber:ep&&(ep.number||ep.seriesNumber)?String(ep.number||ep.seriesNumber):"",position:Math.floor(curSec),duration:Math.floor(durSec||item.duration||0),updatedAt:now};var list=xuperProfile.history||[],newList=[histEntry];for(var i=0;i<list.length&&newList.length<40;i++){if(String(list[i].id)!==itemId)newList.push(list[i]);}xuperProfile.history=newList;saveXuperProfile();}
function toggleXuperFavorite(item){if(!item||!item.id)return false;if(!xuperProfile)loadXuperProfile();var id=String(item.id),isFav=!ke.favs[id];if(isFav){ke.favs[id]=true;}else{delete ke.favs[id];}xuperProfile.favs=ke.favs;saveXuperProfile();return isFav;}
function isXuperFavorite(id){if(!id)return false;if(!xuperProfile)loadXuperProfile();return!!(ke.favs&&ke.favs[String(id)]);}
var nextEpAutoTimer=null,episodeCompletionFired=!1;
function getNextEpisode(item,currentEp){
  if(!item)return null;
  var epList=item.episodes;
  if(!epList||!epList.length)return null;
  if(!currentEp)return epList.length>1?epList[1]:null;
  var curIdx=-1;
  for(var i=0;i<epList.length;i++){
    if(String(epList[i].id||epList[i].number)===String(currentEp.id||currentEp.number)||epList[i]===currentEp){
      curIdx=i;
      break;
    }
  }
  if(curIdx>=0&&curIdx+1<epList.length){
    return epList[curIdx+1];
  }
  if(item.seasons&&item.seasons.length>1){
    var curSeasonIdx=ke.playerSeasonIndex||0;
    if(curSeasonIdx+1<item.seasons.length){
      var nextSeason=item.seasons[curSeasonIdx+1];
      if(nextSeason&&nextSeason._episodes&&nextSeason._episodes.length){
        return nextSeason._episodes[0];
      }
    }
  }
  return null;
}

function handleEpisodeCompletion(){
  if("player"!==ke.screen||"vod"!==ke.playerMode)return;
  if(episodeCompletionFired)return;
  var item=ke.playerItem;
  var curEp=ke.playerEpisode;
  if(!item||!I(item)){
    showPlayerToast("Reproducción finalizada");
    return;
  }
  var nextEp=getNextEpisode(item,curEp);
  if(nextEp){
    episodeCompletionFired=!0;
    if(nextEpAutoTimer)clearTimeout(nextEpAutoTimer);
    var nextNum=nextEp.number||nextEp.seriesNumber||"";
    var nextLabel=nextEp.title||(nextNum?("Capítulo "+nextNum):"siguiente capítulo");
    cn("Reproduciendo "+nextLabel+" en 2 segundos…");
    showPlayerToast("▶ Siguiente: "+nextLabel);
    nextEpAutoTimer=setTimeout(function(){
      nextEpAutoTimer=null;
      episodeCompletionFired=!1;
      if("player"===ke.screen&&"vod"===ke.playerMode){
        window.__resumeStartTime=0;
        window.__simulatedCurrentTime=0;
        Pa(item,nextEp);
      }
    },2000);
  }else{
    showPlayerToast("Último capítulo finalizado");
  }
}

window.CactusPlaybackActions={
  getNext:function(){return getNextEpisode(ke.playerItem,ke.playerEpisode);},
  next:function(){handleEpisodeCompletion();},
  completed:function(){handleEpisodeCompletion();}
};

var subtitleTickerInterval=null;
function startSubtitleTicker(){stopSubtitleTicker();subtitleTickerInterval=setInterval(function(){if("player"===ke.screen&&"vod"===ke.playerMode&&Gi&&ta&&ta.length){var t=(pe&&pe.currentTime>0)?pe.currentTime:(window.CactusAVPlay&&window.CactusAVPlay.isActive&&window.CactusAVPlay.isActive()?window.CactusAVPlay.getCurrentPosition():(window.__simulatedCurrentTime||0));sa(t);}},250);}
function stopSubtitleTicker(){if(subtitleTickerInterval){clearInterval(subtitleTickerInterval);subtitleTickerInterval=null;}}
function startPlayerTicker(){stopPlayerTicker();startSubtitleTicker();playerTickerInterval=setInterval(function(){if("player"===ke.screen&&"vod"===ke.playerMode){var isPaused=pe?pe.paused:false;if(!isPaused){var dur=(pe&&isFinite(pe.duration)&&pe.duration>0)?pe.duration:(ke.playerEpisode&&ke.playerEpisode.duration?ai(ke.playerEpisode.duration):(ke.playerItem&&ke.playerItem.duration?ai(ke.playerItem.duration):7200));if(pe&&pe.currentTime>0){window.__simulatedCurrentTime=pe.currentTime;}else if(window.CactusAVPlay&&window.CactusAVPlay.isActive&&window.CactusAVPlay.isActive()){window.__simulatedCurrentTime=window.CactusAVPlay.getCurrentPosition();}else{window.__simulatedCurrentTime=(window.__simulatedCurrentTime||0)+1;}var cur=window.__simulatedCurrentTime;oi(cur,dur);sa(cur);saveXuperHistory(cur,dur,false);if(dur>30&&cur>=dur-1.5&&!episodeCompletionFired){handleEpisodeCompletion();}}}},1000);}
function stopPlayerTicker(){if(playerTickerInterval){clearInterval(playerTickerInterval);playerTickerInterval=null;}stopSubtitleTicker();}
function buildHistoryPanel(){var panel=n("div","settings-panel history-panel is-active"),tabsRow=n("div","history-tabs"),subTabs=[{id:"history",label:"Historia"},{id:"favs",label:"Mis favoritos"}];for(var i=0;i<subTabs.length;i++)(function(st){var tabBtn=n("div","history-tab focusable"+(historyCurrentSubTab===st.id?" is-selected":""),st.label);tabBtn._activate=function(){historyCurrentSubTab=st.id;refreshHistoryPanel();};tabsRow.appendChild(tabBtn);})(subTabs[i]);panel.appendChild(tabsRow);panel.appendChild(n("div","history-rule"));var list=[];if("history"===historyCurrentSubTab){list=getXuperHistory();}else if("favs"===historyCurrentSubTab){if(!xuperProfile)loadXuperProfile();for(var o=0;o<u.length;o++){if(ke.favs&&ke.favs[String(u[o].id)]){list.push({id:u[o].id,title:u[o].title||u[o].name,poster:u[o].poster||u[o].cover,series:!!I(u[o]),position:0,_rawItem:u[o]});}}}var countRow=n("div","history-total","Total ");countRow.appendChild(n("span",null,String(list.length)));panel.appendChild(countRow);var grid=n("div","history-grid scrollable");if(list.length){for(var c=0;c<list.length&&c<40;c++)(function(cardItem){var card=n("div","history-card focusable"),img=document.createElement("img");img.className="history-poster";img.src=cardItem.poster||"media/ui/common/bg_placehoder_vertical.png";img.onerror=function(){this.src="media/ui/common/bg_placehoder_vertical.png";};card.appendChild(img);var progText=cardItem.series?("Ya miró hasta "+(cardItem.episodeNumber?("epis. "+cardItem.episodeNumber):"un episodio")):("Ya miró hasta "+(cardItem.position>0?formatTimeProgress(cardItem.position):"el inicio"));if("favs"===historyCurrentSubTab)progText="En favoritos";card.appendChild(n("div","history-progress",progText));card.appendChild(n("div","history-card-title",cardItem.title||"Contenido"));card._activate=function(){var foundItem=cardItem._rawItem;if(!foundItem){for(var k=0;k<u.length;k++){if(String(u[k].id)===String(cardItem.id)){foundItem=u[k];break;}}}if(!foundItem){foundItem={id:cardItem.id,title:cardItem.title,poster:cardItem.poster,_portal:true,type:cardItem.series?"teleplay":"movie"};}if(cardItem.position>0){window.__resumeStartTime=cardItem.position;}At(foundItem);};grid.appendChild(card);})(list[c]);}else{grid.appendChild(n("div","history-grid-empty","No hay títulos para mostrar todavía."));}panel.appendChild(grid);return panel;}
function refreshHistoryPanel(){if(Oe&&Oe.history&&le){var newP=buildHistoryPanel();le.replaceChild(newP,Oe.history);Oe.history=newP;var f=Be(newP);if(f)Fe(f);}}
try{loadXuperProfile();}catch(e){}
var Ie=!1,Te=[],Ee=[],Me=[],qe=[],Oe={},Ae=[],De=[],Pe=null;function Ne(e){if(!e||!e.getBoundingClientRect)return!1;if(typeof isLiveSearchOpen!=="undefined"&&isLiveSearchOpen)return!!s(e,"#live-channel-search-overlay")&&null!==e.offsetParent;if(ke.episodeBrowserOpen)return!!s(e,"#player-episodes")&&null!==e.offsetParent;if(ji)return!!s(e,"#dialog-playsettings")&&null!==e.offsetParent;if(Vi)return!!s(e,"#player-playsetting-view")&&null!==e.offsetParent;var i=s(e,".home-page");if(i&&!i.classList.contains("is-current"))return!1;var a=s(e,".settings-panel");if(a&&!a.classList.contains("is-active"))return!1;var n=s(e,".search-hot");if(n&&n.classList.contains("is-hidden"))return!1;var r=s(e,".search-results");if(r&&!r.classList.contains("is-active"))return!1;var o=s(e,".player-channels");if(o&&!o.classList.contains("is-active"))return!1;var l=s(e,".player-infobar");if(l&&!l.classList.contains("is-active"))return!1;if(null===e.offsetParent)return!1;var t=e.getBoundingClientRect();return!(t.width<1||t.height<1)}function Re(){var scr,sel=".focusable";if(typeof isLiveSearchOpen!=="undefined"&&isLiveSearchOpen)scr=r("live-channel-search-overlay")||document;else if(ji)scr=r("dialog-playsettings");else if(Vi)scr=r("player-playsetting-view");else if("home"===ke.screen){scr=r("screen-home")||document;sel="#home-tabs .focusable, #home-notify .focusable, .home-page.is-current .focusable";}else scr=r("screen-"+ke.screen)||document;if(!scr)scr=document;for(var e=scr.querySelectorAll(sel),t=[],i=0;i<e.length;i++)Ne(e[i])&&t.push(e[i]);return t}function Ue(e){if(e&&e._isBento&&e._pageEl){if(e._pageEl.scrollTop!==0)e._pageEl.scrollTop=0;return;}if(e&&void 0!==e._colIdx&&e._trackEl&&e._pageEl){var cLeft=10+256*e._colIdx,cRight=cLeft+230,tScr=e._trackEl.scrollLeft;if(cLeft<tScr+20)e._trackEl.scrollLeft=Math.max(0,cLeft-30);else if(cRight>tScr+1660)e._trackEl.scrollLeft=cRight-1650;var rTop=e._rowTop||860,pScr=e._pageEl.scrollTop;if(rTop<pScr+40)e._pageEl.scrollTop=Math.max(0,rTop-40);else if(rTop+415>pScr+940)e._pageEl.scrollTop=rTop+415-940;return;}var app=document.getElementById("app"),scale=1;if(app&&app.style.transform){var sm=/scale\(([\d\.]+)\)/.exec(app.style.transform);if(sm)scale=parseFloat(sm[1])||1;}for(var t=s(e,".scrollable");t;){var cell=(e.parentNode&&e.parentNode.classList&&e.parentNode.classList.contains("search-cell"))?e.parentNode:null;var target=cell||e;var i=target.getBoundingClientRect(),a=t.getBoundingClientRect();if(i.top<a.top){t.scrollTop=Math.max(0,t.scrollTop-(a.top-i.top+40)/scale);}else if(i.bottom>a.bottom){t.scrollTop+=(i.bottom-a.bottom+40)/scale;}if(t.scrollWidth>t.clientWidth+1&&!t.classList.contains("home-page")){if(i.left<a.left){t.scrollLeft-=(a.left-i.left+40)/scale;}else if(i.right>a.right){t.scrollLeft+=(i.right-a.right+40)/scale;}}t=s(t.parentNode,".scrollable");}}var __lastHomeTabsExp=null;function Fe(e,t){__lastNavInputTs=Date.now();if(e)if(ke.focus!==e){ke.focus&&ke.focus.classList.remove("is-focused"),ke.focus=e,e.classList.add("is-focused"),e._onFocus&&e._onFocus(),La();if("home"===ke.screen){var a=!!s(e,".home-tabs");if(a!==__lastHomeTabsExp){__lastHomeTabsExp=a;var i=r("home-tabs");i&&(i.classList.toggle("is-expanded",a),i.classList.toggle("is-collapsed",!a));var n=document.querySelector(".home-sidebar-bg");n&&n.classList.toggle("is-on",a);}}else{__lastHomeTabsExp=null;}t||Ue(e)}else t||Ue(e)}function Be(e){for(var t=e.querySelectorAll(".focusable"),i=0;i<t.length;i++)if(Ne(t[i]))return t[i];return null}function He(e){if(ke.focus){if(!ke.focus._onMove||!ke.focus._onMove(e)){for(var t="home"===ke.screen&&s(ke.focus,".home-page"),i="home"===ke.screen&&s(ke.focus,".home-tabs"),sp="settings"===ke.screen&&s(ke.focus,".settings-panel"),sm="settings"===ke.screen&&s(ke.focus,".settings-menu"),a=Re(),n=ke.focus.getBoundingClientRect(),r=n.left+n.width/2,o=n.top+n.height/2,l=null,d=1e9,c=0;c<a.length;c++){var p=a[c];if(p!==ke.focus&&((!t||!s(p,".home-tabs"))&&(!i||s(p,".home-tabs"))&&(!sp||!s(p,".settings-menu"))&&(!sm||s(p,".settings-menu")))){var u,f,v,h=p.getBoundingClientRect(),m=h.left+h.width/2-r,g=h.top+h.height/2-o;if("left"===e){if(m>-4)continue;u=Math.max(0,n.left-h.right),f=Math.abs(g),v=h.bottom>n.top+2&&h.top<n.bottom-2;if(t&&!v&&Math.abs(g)>120)continue;}else if("right"===e){if(m<4)continue;u=Math.max(0,h.left-n.right),f=Math.abs(g),v=h.bottom>n.top+2&&h.top<n.bottom-2;if(t&&!v&&Math.abs(g)>120)continue;}else if("up"===e){if(g>-4)continue;u=Math.max(0,n.top-h.bottom),f=Math.abs(m),v=h.right>n.left+2&&h.left<n.right-2}else{if(g<4)continue;u=Math.max(0,h.top-n.bottom),f=Math.abs(m),v=h.right>n.left+2&&h.left<n.right-2}var y=u+2*f+(v?0:320);y<d&&(d=y,l=p)}}l?Fe(l):"left"===e&&t&&Ee[ke.tab]?Fe(Ee[ke.tab]):"left"===e&&sp&&oe&&(Fe(oe.querySelector(".settings-item.is-selected")||Ae[0]))}}else{var b=Re();b.length&&Fe(b[0])}}function ze(e){for(var t=document.querySelectorAll(".screen"),i=0;i<t.length;i++)t[i].classList.remove("is-active");var a=r("screen-"+e);if(a&&a.classList.add("is-active"),ke.screen=e,r("screen-home")&&(r("screen-home").style.display="player"===e?"none":""),r("screen-detail")&&(r("screen-detail").style.display="player"===e?"none":""),"player"!==e&&ke.episodeBrowserOpen&&qa(!0),"player"!==e&&"detail"!==e){ji&&Ha(),Vi&&xa();var n=r("screen-player");n&&(n.classList.remove("is-mini"),n.classList.remove("is-active")),dn(),Ki++,ta=[],zi&&(zi.innerHTML="")}}var Ve=0,exitArm=0;function exitApp(){try{if(window.tizen&&window.tizen.application&&window.tizen.application.getCurrentApplication){window.tizen.application.getCurrentApplication().exit();return;}}catch(e){}try{if(window.webOSTV&&window.webOSTV.platformBack){window.webOSTV.platformBack();return;}if(window.PalmSystem&&window.PalmSystem.platformBack){window.PalmSystem.platformBack();}}catch(e){}}window.__xuperExitPlayer=je;function je(){var e=Date.now();if(!(e-Ve<250))if(Ve=e,ji)Ha();else{if("player"===ke.screen){if(ke.episodeBrowserOpen)return void qa();if(Vi)return void xa();if(ke.channelsOpen)return void Sn();var ret=ke.playerReturn;if(ret&&"detail"===ret.screen){ui(),vi();var t=r("screen-player"),i=r("screen-detail");t&&(t.classList.add("is-mini"),t.classList.add("is-active")),i&&(i.style.display="",i.classList.add("is-active")),ke.screen="detail",syncVodStageLayout(!0);var a=!1;if(ke.detailNeedsRebuild&&ke.detail){ke.detailNeedsRebuild=!1,Pt(ke.detail),a=!0;var n=Y?Y.querySelector(".detail-season"):null;n&&Fe(n)}else ke.detail&&Na(ke.detail);if(!a)if(ret.focus&&Ne(ret.focus))Fe(ret.focus);else{var o=K?K.querySelector(".focusable"):null;o&&Fe(o)}return;}if(ke.infobar)return void ui();if(ke.vodInfobarVisible)return void vi();dn();var l=r("screen-player");l&&(l.classList.remove("is-mini"),l.classList.remove("is-active")),ret&&"search"===ret.screen?(ze("search"),Fe(ret.focus)):(ze("home"),Ze(ke.tab,!1),ret&&ret.focus&&Ne(ret.focus)?Fe(ret.focus):Ee[ke.tab]&&Fe(Ee[ke.tab]));return;}if("detail"!==ke.screen){if("filter"===ke.screen)return void closeFilterScreen();if("history-manager"===ke.screen){if(hmEditMode){hmEditMode=false;renderHistoryManager();return;}ze("home");Ze(ke.tab,false);var recBtn=document.querySelector(".notify-item.rec");if(recBtn&&Ne(recBtn))Fe(recBtn);else if(Ee[ke.tab])Fe(Ee[ke.tab]);return;}if("search"===ke.screen)return Wt(),ze("home"),Ze(ke.tab,!1),void(Ee[ke.tab]&&Fe(Ee[ke.tab]));if("settings"===ke.screen)return ze("home"),Ze(ke.tab,!1),void(Ee[ke.tab]&&Fe(Ee[ke.tab]));if("home"===ke.screen){if(0!==ke.tab||(Ee[0]&&ke.focus!==Ee[0])){if(0!==ke.tab)Ze(0,!0);if(Ee[0])Fe(Ee[0]);return;}var _now=Date.now();if(exitArm&&_now-exitArm<3e3){exitArm=0;exitApp();return;}exitArm=_now;showPlayerToast("Pulsa de nuevo para salir");setTimeout(function(){if(exitArm&&Date.now()-exitArm>=3e3)exitArm=0;},3e3)}}else{if(Ut){Ft();var t=Y?Y.querySelector(".detail-season"):null;return void(t&&Fe(t))}var i=r("screen-detail");if(i&&i.classList.contains("is-synopsis-open"))return void Dt();dn();var a=r("screen-player");a&&(a.classList.remove("is-mini"),a.classList.remove("is-active"));var n=ke.detailReturn;n&&"search"===n.screen?(ze("search"),Fe(n.focus)):(ze("home"),Ze(ke.tab,!1),n&&n.focus&&Ne(n.focus)?Fe(n.focus):Ee[ke.tab]&&Fe(Ee[ke.tab]))}}}function We(){ke.focus&&ke.focus._activate&&ke.focus._activate()}var __lastNavRepeatTs=0;function $e(e){if(window.__splashScreenVisible){e&&e.preventDefault&&e.preventDefault();e&&e.stopPropagation&&e.stopPropagation();return;}if(i())return a(),void(e&&e.preventDefault&&e.preventDefault());var t=e.keyCode||e.which,n=e.key||"",r=!0;if(e&&e.repeat&&(37===t||38===t||39===t||40===t)){var navTier=(window.XuperEngineConfig&&window.XuperEngineConfig.tier)||"mid";var navMinGap=("legacy"===navTier)?65:("mid"===navTier?38:18);var navNow=Date.now();if(navNow-__lastNavRepeatTs<navMinGap){e.preventDefault&&e.preventDefault();return;}__lastNavRepeatTs=navNow;}else if(37===t||38===t||39===t||40===t){__lastNavRepeatTs=Date.now();}
  if(typeof isLiveSearchOpen!=="undefined"&&isLiveSearchOpen){
    if(461===t||10009===t||27===t||"Back"===n||"GoBack"===n||"Escape"===n){
      closeLiveChannelSearch();
      e.preventDefault&&e.preventDefault();
      e.stopPropagation&&e.stopPropagation();
      return;
    }
    if(8===t){
      if(lcsCurrentQuery&&lcsCurrentQuery.length>0){
        lcsCurrentQuery=lcsCurrentQuery.slice(0,-1);
        updateLiveChannelSearchUI();
      }else{
        closeLiveChannelSearch();
      }
      e.preventDefault&&e.preventDefault();
      e.stopPropagation&&e.stopPropagation();
      return;
    }
    if(13===t){
      if(ke.focus&&ke.focus._activate){
        ke.focus._activate();
      }
      e.preventDefault&&e.preventDefault();
      e.stopPropagation&&e.stopPropagation();
      return;
    }
    if(37===t||38===t||39===t||40===t){
      var lcsDir = (37===t) ? "left" : ((38===t) ? "up" : ((39===t) ? "right" : "down"));
      if(ke.focus&&ke.focus._onMove&&ke.focus._onMove(lcsDir)){
        e.preventDefault&&e.preventDefault();
        e.stopPropagation&&e.stopPropagation();
        return;
      }
      He(lcsDir);
      e.preventDefault&&e.preventDefault();
      e.stopPropagation&&e.stopPropagation();
      return;
    }
    if(n&&1===n.length&&/^[a-zA-Z0-9 ]$/.test(n)&&13!==t&&32!==t){
      lcsCurrentQuery+=(n===" "?" ":n.toUpperCase());
      updateLiveChannelSearchUI();
      e.preventDefault&&e.preventDefault();
      e.stopPropagation&&e.stopPropagation();
      return;
    }
  }
  
  var isFavToggleKey = (405 === t || 406 === t || "ColorF2Yellow" === n || "Yellow" === n || "ColorF3Blue" === n || "Blue" === n);
  if (isFavToggleKey && ke.focus && void 0 !== ke.focus._channel && z[ke.focus._channel]) {
    var chToFav = z[ke.focus._channel];
    var wasAdded = toggleChannelFavorite(chToFav);
    showPlayerToast(wasAdded ? "⭐ Canal agregado a tus Favoritos" : "Canal eliminado de tus Favoritos");
    if (rt && (rt.id === "favorites" || rt.isFavorite)) {
      loadFavoritesCategory(function(){ Ja(); });
    }
    e.preventDefault && e.preventDefault();
    return;
  }
if(typeof isLiveSearchOpen!=="undefined"&&isLiveSearchOpen&&(461===t||10009===t||27===t||"Back"===n||"GoBack"===n||"Escape"===n)){
    closeLiveChannelSearch();
    e.preventDefault&&e.preventDefault();
    e.stopPropagation&&e.stopPropagation();
    return;
  }
if(typeof isLiveCatsOpen!=="undefined"&&isLiveCatsOpen&&(461===t||10009===t||27===t||"Back"===n||"GoBack"===n||"Escape"===n)){
    closeLiveCategoriesBar();
    e.preventDefault&&e.preventDefault();
    e.stopPropagation&&e.stopPropagation();
    return;
  }if("search"===ke.screen&&8===t&&(ke.searchQuery||"").length>0){var _sq=(ke.searchQuery||"").slice(0,-1);ke.searchQuery=_sq;Vt();if(!_sq)Wt();e.preventDefault&&e.preventDefault();e.stopPropagation&&e.stopPropagation();return;}if("player"===ke.screen&&(427===t||"ChannelUp"===n||"PageUp"===n)){if("live"===ke.playerMode&&z.length){St(ke.channel>0?ke.channel-1:z.length-1,!0);pi();}e.preventDefault&&e.preventDefault();e.stopPropagation&&e.stopPropagation();return;}if("player"===ke.screen&&(428===t||"ChannelDown"===n||"PageDown"===n)){if("live"===ke.playerMode&&z.length){St(ke.channel<z.length-1?ke.channel+1:0,!0);pi();}e.preventDefault&&e.preventDefault();e.stopPropagation&&e.stopPropagation();return;}if("player"===ke.screen&&"live"===ke.playerMode&&!ke.channelsOpen&&!ji&&!Vi){var _numDigit=null;if(t>=48&&t<=57)_numDigit=String(t-48);else if(t>=96&&t<=105)_numDigit=String(t-96);else if(/^[0-9]$/.test(n))_numDigit=n;if(null!==_numDigit){window.__xeChDigits=(window.__xeChDigits||"")+_numDigit;if(window.__xeChDigits.length>4)window.__xeChDigits=window.__xeChDigits.slice(-4);showPlayerToast("Canal: "+window.__xeChDigits);if(window.__xeChTimer)clearTimeout(window.__xeChTimer);window.__xeChTimer=setTimeout(function(){var num=parseInt(window.__xeChDigits,10);window.__xeChDigits="";window.__xeChTimer=null;if(num>0&&z.length){var found=-1;for(var zi=0;zi<z.length;zi++){if(Number(z[zi].index)===num){found=zi;break;}}if(found<0&&num<=z.length)found=num-1;if(found>=0&&found<z.length){St(found,!0);pi();}else{showPlayerToast("Canal "+num+" no encontrado");}}},1100);e.preventDefault&&e.preventDefault();e.stopPropagation&&e.stopPropagation();return;}}if(461===t||10009===t||27===t||8===t||"Back"===n||"GoBack"===n||"Escape"===n)return ("player"===ke.screen&&"live"===ke.playerMode&&ke.focus&&ke.focus.classList&&ke.focus.classList.contains("pi-star"))?(Fe(se),ci(),e.preventDefault&&e.preventDefault(),void(e.stopPropagation&&e.stopPropagation())):("player"===ke.screen&&"live"===ke.playerMode&&ke.infobar)?(ui(),e.preventDefault&&e.preventDefault(),void(e.stopPropagation&&e.stopPropagation())):ke.episodeBrowserOpen?(qa(),e.preventDefault&&e.preventDefault(),void(e.stopPropagation&&e.stopPropagation())):vt?(_t(),e.preventDefault&&e.preventDefault(),void(e.stopPropagation&&e.stopPropagation())):ji?(Ha(),e.preventDefault&&e.preventDefault(),void(e.stopPropagation&&e.stopPropagation())):Vi?(xa(),e.preventDefault&&e.preventDefault(),void(e.stopPropagation&&e.stopPropagation())):ke.channelsOpen?(Sn(),e.preventDefault&&e.preventDefault(),void(e.stopPropagation&&e.stopPropagation())):"filter"===ke.screen?(closeFilterScreen(),e.preventDefault&&e.preventDefault(),void(e.stopPropagation&&e.stopPropagation())):(je(),e.preventDefault&&e.preventDefault(),void(e.stopPropagation&&e.stopPropagation()));if(ke.episodeBrowserOpen){var o=s(ke.focus,"#pe-seasons"),l=s(ke.focus,"#pe-episodes");if(37===t){if(l&&Mi&&"none"!==Mi.style.display){var d=Ei?Ei.children[ke.browserSeason]||Be(Ei):null;d&&Fe(d)}}else if(39===t){if(o){var c=qi?qi.querySelector(".pe-ep.is-current")||Be(qi):null;c&&Fe(c)}}else 38===t?He("up"):40===t?He("down"):13===t||32===t?We():r=!1;r&&e.preventDefault&&e.preventDefault()}else{var p=415===t||"MediaPlay"===n||"Play"===n,u=19===t||"MediaPause"===n||"Pause"===n,f=10252===t||"MediaPlayPause"===n,v=417===t||"MediaFastForward"===n||"FastForward"===n,h=412===t||"MediaRewind"===n||"Rewind"===n,m=413===t||"MediaStop"===n||"Stop"===n;if("player"===ke.screen){if(p){if(pe&&pe.paused){try{pe.play()}catch(e){}li("none"),pi()}return void(e.preventDefault&&e.preventDefault())}if(u){if(pe&&!pe.paused){try{pe.pause()}catch(e){}li("pause"),pi()}return void(e.preventDefault&&e.preventDefault())}if(f)return di(),void(e.preventDefault&&e.preventDefault());if(v)return si(15),void(e.preventDefault&&e.preventDefault());if(h)return si(-15),void(e.preventDefault&&e.preventDefault());if(m)return je(),void(e.preventDefault&&e.preventDefault())}var g=457===t||93===t||467===t||"Menu"===n||"ContextMenu"===n||"Info"===n;if("player"===ke.screen&&"vod"===ke.playerMode&&g)return ji?Ha():Vi?xa():Sa(),void(e.preventDefault&&e.preventDefault());if("player"===ke.screen&&"live"===ke.playerMode&&(457===t||"Info"===n))return (ke.infobar?ui():pi()),void(e.preventDefault&&e.preventDefault());if("player"===ke.screen&&(37===t||38===t||39===t||40===t)){if(ji)return 37===t?He("left"):38===t?He("up"):39===t?He("right"):40===t&&He("down"),void(e.preventDefault&&e.preventDefault());if(Vi)return wa(),37===t?He("left"):38===t?He("up"):39===t?He("right"):40===t&&He("down"),void(e.preventDefault&&e.preventDefault());if("vod"===ke.playerMode){if(37===t)return si(-10),void(e.preventDefault&&e.preventDefault());if(39===t)return si(10),void(e.preventDefault&&e.preventDefault());if(40===t)return Sa(),void(e.preventDefault&&e.preventDefault());if(38===t)return ke.infobar?ui():pi(),void(e.preventDefault&&e.preventDefault())}else if(ke.channelsOpen){var dir=37===t?"left":38===t?"up":39===t?"right":40===t?"down":null;if(dir&&ke.focus&&ke.focus._onMove&&ke.focus._onMove(dir))return void(e.preventDefault&&e.preventDefault());if(39===t)return Sn(),void(e.preventDefault&&e.preventDefault());if(38===t){var curIdx=De.indexOf(ke.focus);if(curIdx<0&&ke.focus&&void 0!==ke.focus._channel){for(var cj=0;cj<De.length;cj++)if(De[cj]._channel===ke.focus._channel){curIdx=cj;break;}}if(curIdx>0&&De[curIdx-1]){Fe(De[curIdx-1]);scrollChannelIntoView(De[curIdx-1]);}else{var C=ce?(ce.querySelector(".pc-cat-pill.is-selected")||ce.querySelector(".pc-cat-pill")):null;if(C)Fe(C);}return void(e.preventDefault&&e.preventDefault());}if(40===t){var curIdx=De.indexOf(ke.focus);if(curIdx<0&&ke.focus&&void 0!==ke.focus._channel){for(var cj=0;cj<De.length;cj++)if(De[cj]._channel===ke.focus._channel){curIdx=cj;break;}}if(curIdx>=0&&curIdx<De.length-1&&De[curIdx+1]){Fe(De[curIdx+1]);scrollChannelIntoView(De[curIdx+1]);}else if(s(ke.focus,".pc-categories")||s(ke.focus,".pc-header")){var curRow=De.filter(function(x){return x._channel===ke.channel;})[0]||De[0];if(curRow){Fe(curRow);scrollChannelIntoView(curRow);}}return void(e.preventDefault&&e.preventDefault());}if(37===t){var C=ce?(ce.querySelector(".pc-cat-pill.is-selected")||ce.querySelector(".pc-cat-pill")):null;if(C)Fe(C);return void(e.preventDefault&&e.preventDefault());}}else{if(38===t)return ke.channel>0?St(ke.channel-1,!1):z.length&&St(z.length-1,!1),pi(),void(e.preventDefault&&e.preventDefault());if(40===t)return ke.channel<z.length-1?St(ke.channel+1,!1):z.length&&St(0,!1),pi(),void(e.preventDefault&&e.preventDefault());if(37===t||39===t){var star=de?de.querySelector(".pi-star"):null;if(star&&star.style.display!=="none"){if(ke.focus===star){Fe(se);}else{Fe(star);}pi();}else if(ke.focus&&ke.focus.classList&&ke.focus.classList.contains("pi-star")){Fe(se);pi();}return void(e.preventDefault&&e.preventDefault());}ke.infobar?ci():pi()}}if(37===t)He("left");else if(38===t)He("up");else if(39===t)He("right");else if(40===t)He("down");else if(13===t||32===t){if(ke.episodeBrowserOpen)return void We();if(ji)We();else if(Vi)wa(),We();else if("player"===ke.screen&&ke.channelsOpen){var ch=ke.focus&&void 0!==ke.focus._channel?ke.focus._channel:ke.channel;if(ke.focus&&s(ke.focus,".pc-list")){St(ch,!0);Sn();Fe(se);return void(e.preventDefault&&e.preventDefault());}else{We();return void(e.preventDefault&&e.preventDefault());}}else if("player"===ke.screen&&ke.streamError&&pe&&pe.src){var S=pe.play();S&&S.catch&&S.catch(function(){}),ke.streamError="",cn("")}else if("player"===ke.screen&&"live"===ke.playerMode){if(ke.focus&&ke.focus.classList&&ke.focus.classList.contains("pi-star")){We();return void(e.preventDefault&&e.preventDefault());}wn(!1);return void(e.preventDefault&&e.preventDefault());}else"player"===ke.screen&&"vod"===ke.playerMode?di():We()}else if("search"===ke.screen&&!e.ctrlKey&&!e.altKey&&!e.metaKey&&n&&1===n.length&&/^[a-zA-Z0-9 ]$/.test(n)&&32!==t&&13!==t){jt((ke.searchQuery||"")+n.toUpperCase());}else r=!1;r&&e.preventDefault&&e.preventDefault()}}function Xe(){try{Pe&&(clearInterval(Pe),Pe=null);Ie||Ke();ze("home");Ze(0,!1);if(Ee.length&&Ee[0]){Fe(Ee[0]);}else if(Me.length&&Me[0]){Fe(Me[0]);}else if(X){Fe(X);}var e=r("home-tabs");e&&(e.classList.add("is-expanded"),e.classList.remove("is-collapsed"));var t=document.querySelector(".home-sidebar-bg");t&&t.classList.add("is-on");}catch(err){console.error("[Xe crash]",err);try{ze("home");}catch(e){for(var s=document.querySelectorAll(".screen"),k=0;k<s.length;k++)s[k].classList.remove("is-active");var home=r("screen-home");home&&home.classList.add("is-active");}}}var Qe=[function(e){$=n("div","live-main"),(dt=document.createElement("video")).className="live-preview-video",dt.preload="auto",dt.muted=!0,dt.volume=0,dt.setAttribute("muted","muted"),dt.setAttribute("playsinline",""),dt.setAttribute("webkit-playsinline",""),$.appendChild(dt),$.appendChild(n("div","live-frame")),$.appendChild(n("div","live-logo")),ct=n("div","live-preview-status"),$.appendChild(ct),$.appendChild(n("div","live-prompt-select","SELECCIONE UN CANAL PARA CONTINUAR")),e.appendChild($);var t=n("div","live-info");(W=n("div","live-channel")).style.right="112.5px",t.appendChild(W);var i=n("div","live-fullscreen");i._activate=function(){hn("live")},t.appendChild(i),$.appendChild(t);var a=n("div","live-arrow-up"),r=n("div","live-arrow-down");e.appendChild(a),e.appendChild(r),Q=n("div","live-list scrollable"),e.appendChild(Q),Ct(!1),bt(),(X=n("div","live-focus focusable"))._onMove=function(dir){
  if("down"===dir){
    if(typeof liveBtnFavs!=="undefined"&&liveBtnFavs)return Fe(liveBtnFavs),!0;
  }
  if("up"===dir){
    var topSearch=document.querySelector("#home-notify .notify-item.search")||document.querySelector("#home-notify .focusable");
    if(topSearch)return Fe(topSearch),!0;
    var t=Me.filter(function(x){return x._channel===ke.channel})[0]||Me[0];
    if(t)return Fe(t),!0;
  }
  if("right"===dir){
    var t=Me.filter(function(x){return x._channel===ke.channel})[0]||Me[0];
    if(t)return Fe(t),!0;
  }
  return"left"===dir&&(Ee[0]&&Fe(Ee[0]),!0);
},X._activate=function(){hn("live")},e.appendChild(X);
setupLiveTvExternalBottomBar(e);
},function(e){var t=qt("destacado"),i=t.slice(0,6),a=!(!i[0]||!i[0]._portal);Mt(e,i,{titles:a,dots:a?4:0,shade:a});var n=t.slice(6);n.length&&Ot(e,n,860,"Destacados de hoy")},function(e){var t=qt("pelicula"),i=t.slice(0,6),a=!(!i[0]||!i[0]._portal);Mt(e,i,{titles:a,dots:a?4:0,shade:a});var n=t.slice(6);n.length&&Ot(e,n,860,"Películas recomendadas hoy")},function(e){var t=qt("serie"),i=t.slice(0,6),a=!(!i[0]||!i[0]._portal);Mt(e,i,{titles:a,dots:a?3:2,shade:a});var n=t.slice(6);n.length&&Ot(e,n,860,"Series recomendadas hoy")},function(e){var t=qt("infantil"),i=t.slice(0,6),a=!(!i[0]||!i[0]._portal);Mt(e,i,{titles:a,dots:a?3:2,shade:a});var n=t.slice(6);n.length&&Ot(e,n,860,"Recomendaciones para niños hoy")},function(e){var t=qt("anime"),i=t.slice(0,6),a=!(!i[0]||!i[0]._portal);Mt(e,i,{titles:a,dots:a?3:2,shade:a});var n=t.slice(6);n.length&&Ot(e,n,860,"Anime recomendado hoy")},function(e) {
  var t = u.length ? dailyRotatePool(u, "explorar_hero") : [];
  var bigExp = Tt(t[0], 192, 38.5, 1249, 703, {shade: true, pageEl: e, highRes: true});
  var expSmalls = [];
  for (var i = 0; i < 3; i++) {
    var sc = Tt(t[(i + 1) % t.length], 1446, 38.5 + 231 * i, 413, 226, {badge: "", pageEl: e, preferPoster: true});
    e.appendChild(sc);
    expSmalls.push(sc);
  }
  e.appendChild(bigExp);
  e._bentoBigCards = [bigExp];
  e._bentoSmallCards = expSmalls;
  e._firstFocus = bigExp;
  var sections = [
    {title: "Netflix", filter: function(x){ var s = ((x.row||"") + " " + (x.title||"") + " " + (x.category||"")).toLowerCase(); return s.indexOf("netflix") !== -1; }},
    {title: "HBO Max", filter: function(x){ var s = ((x.row||"") + " " + (x.title||"") + " " + (x.category||"")).toLowerCase(); return s.indexOf("hbo") !== -1 || s.indexOf("warner") !== -1; }},
    {title: "Disney+", filter: function(x){ var s = ((x.row||"") + " " + (x.title||"") + " " + (x.category||"")).toLowerCase(); return s.indexOf("disney") !== -1 || s.indexOf("marvel") !== -1 || s.indexOf("pixar") !== -1; }},
    {title: "Prime Video", filter: function(x){ var s = ((x.row||"") + " " + (x.title||"") + " " + (x.category||"")).toLowerCase(); return s.indexOf("prime") !== -1 || s.indexOf("amazon") !== -1; }},
    {title: "Apple TV+", filter: function(x){ var s = ((x.row||"") + " " + (x.title||"") + " " + (x.category||"")).toLowerCase(); return s.indexOf("apple") !== -1; }},
    {title: "Películas de Acción", filter: function(x){ var s = ((x.genres&&x.genres.join?x.genres.join(" "):"") + " " + (x.category||"")).toLowerCase(); return s.indexOf("action") !== -1 || s.indexOf("accion") !== -1; }},
    {title: "Comedia y Humor", filter: function(x){ var s = ((x.genres&&x.genres.join?x.genres.join(" "):"") + " " + (x.category||"")).toLowerCase(); return s.indexOf("comedy") !== -1 || s.indexOf("comedia") !== -1; }},
    {title: "Terror y Suspenso", filter: function(x){ var s = ((x.genres&&x.genres.join?x.genres.join(" "):"") + " " + (x.category||"")).toLowerCase(); return s.indexOf("horror") !== -1 || s.indexOf("terror") !== -1 || s.indexOf("thriller") !== -1 || s.indexOf("suspenso") !== -1; }},
    {title: "Ciencia Ficción y Fantasía", filter: function(x){ var s = ((x.genres&&x.genres.join?x.genres.join(" "):"") + " " + (x.category||"")).toLowerCase(); return s.indexOf("sci-fi") !== -1 || s.indexOf("fantasy") !== -1; }},
    {title: "Anime y Animación", filter: function(x){ var s = ((x.genres&&x.genres.join?x.genres.join(" "):"") + " " + (x.category||"")).toLowerCase(); return s.indexOf("animation") !== -1 || s.indexOf("anime") !== -1; }}
  ];
  var startY = 765;
  var expRowCards = [];
  e._rowCards = expRowCards;
  bigExp._onMove = function(dir) {
    if ("left" === dir) { if (Ee[ke.tab]) { Fe(Ee[ke.tab]); return true; } }
    if ("right" === dir) { if (expSmalls[0]) { Fe(expSmalls[0]); return true; } }
    if ("down" === dir) { if (expRowCards[0] && expRowCards[0][0]) { Fe(expRowCards[0][0]); return true; } }
    if ("up" === dir) return true;
    return false;
  };
  for (var si = 0; si < expSmalls.length; si++) {
    (function(idx) {
      expSmalls[idx]._onMove = function(dir) {
        if ("left" === dir) { Fe(bigExp); return true; }
        if ("right" === dir) return true;
        if ("up" === dir) { if (idx > 0) Fe(expSmalls[idx - 1]); return true; }
        if ("down" === dir) {
          if (idx < expSmalls.length - 1) { Fe(expSmalls[idx + 1]); return true; }
          if (expRowCards[0] && expRowCards[0].length) {
            Fe(expRowCards[0][Math.min(4, expRowCards[0].length - 1)]);
            return true;
          }
          return true;
        }
        return false;
      };
    })(si);
  }
  for (var sIdx = 0; sIdx < sections.length; sIdx++) {
    var sec = sections[sIdx];
    var filtered = dailyRotatePool(t.filter(sec.filter), "explorar_sec_" + sIdx);
    if (filtered.length < 15) {
      var extraPool = dailyRotatePool(t, "explorar_fill_" + sIdx);
      for (var epIdx = 0; epIdx < extraPool.length && filtered.length < 20; epIdx++) {
        if (filtered.indexOf(extraPool[epIdx]) === -1) filtered.push(extraPool[epIdx]);
      }
    }
    if (filtered.length > 20) filtered = filtered.slice(0, 20);
    var secEl = n("div", "carousel-section");
    secEl.style.position = "absolute";
    secEl.style.left = "0px";
    secEl.style.top = startY + "px";
    var titleEl = n("div", "carousel-title", sec.title);
    secEl.appendChild(titleEl);
    var track = n("div", "carousel-track scrollable");
    var thisRow = [];
    expRowCards.push(thisRow);
    var rowTopVal = startY;
    for (var col = 0; col < filtered.length; col++) {
      var deferLoad = (sIdx >= 2 || col >= 8);
      var card = et(filtered[col], 0, 0, 230, 335, {gold: true, deferImg: deferLoad});
      card.classList.add("carousel-item");
      card._rowIdx = sIdx;
      card._colIdx = col;
      card._trackEl = track;
      card._pageEl = e;
      card._rowTop = rowTopVal;
      thisRow.push(card);
      (function(c, rIdx, cIdx) {
        c._onFocus = function() {
          revealRowWindow(expRowCards, rIdx, cIdx);
        };
        c._onMove = function(dir) {
          if ("left" === dir) {
            if (cIdx > 0 && expRowCards[rIdx][cIdx - 1]) { Fe(expRowCards[rIdx][cIdx - 1]); return true; }
            if (Ee[ke.tab]) { Fe(Ee[ke.tab]); return true; }
            return true;
          }
          if ("right" === dir) {
            if (cIdx < expRowCards[rIdx].length - 1 && expRowCards[rIdx][cIdx + 1]) { Fe(expRowCards[rIdx][cIdx + 1]); return true; }
            return true;
          }
          if ("up" === dir) {
            if (rIdx > 0 && expRowCards[rIdx - 1] && expRowCards[rIdx - 1].length) {
              var targetUp = expRowCards[rIdx - 1][Math.min(cIdx, expRowCards[rIdx - 1].length - 1)];
              if (targetUp) { Fe(targetUp); return true; }
            }
            if (cIdx >= 4 && expSmalls.length) { Fe(expSmalls[expSmalls.length - 1]); return true; }
            Fe(bigExp);
            return true;
          }
          if ("down" === dir) {
            if (rIdx < expRowCards.length - 1 && expRowCards[rIdx + 1] && expRowCards[rIdx + 1].length) {
              var targetDn = expRowCards[rIdx + 1][Math.min(cIdx, expRowCards[rIdx + 1].length - 1)];
              if (targetDn) { Fe(targetDn); return true; }
            }
            return true;
          }
          return false;
        };
      })(card, sIdx, col);
      track.appendChild(card);
    }
    secEl.appendChild(track);
    e.appendChild(secEl);
    startY += 430;
  }
  var spacer = n("div", "explore-spacer");
  spacer.style.position = "absolute";
  spacer.style.top = startY + "px";
  spacer.style.height = "200px";
  spacer.style.width = "100%";
  e.appendChild(spacer);
}],Ge={};function Je(e){!Ge[e]&&Te[e]&&Qe[e]&&(Ge[e]=!0,Qe[e](Te[e]))}function Ke(){Ie=!0,V=r("home-pages"),j=r("home-notify"),o(V),Te=[],Ge={};for(var e=0;e<Qe.length;e++){var t=n("div","home-page scrollable");0===e&&t.classList.add("is-current"),V.appendChild(t),Te.push(t)}Je(_e[ke.tab]&&_e[ke.tab].page>=0?_e[ke.tab].page:0),function(){
  var e = r("home-tabs");
  o(e), e.classList.add("is-expanded"), Ee = [];
  for (var t = 0; t < _e.length; t++) {
    var i = n("div", "tab-item focusable");
    i.appendChild(n("div", "tab-pill"));
    var a = n("div", "tab-icon");
    a.innerHTML = xe[_e[t].icon] || "";
    i.appendChild(a);
    var l = n("div", "tab-title", _e[t].label);
    i.appendChild(l);
    i._tab = t;
    i._activate = (function(idx) {
      return function() {
        Ze(idx, false);
        if (0 === idx) {
          var ch = Me.filter(function(x) { return x._channel === ke.channel; })[0] || Me[0] || X;
          if (ch) Fe(ch);
        } else if (_e[idx].page >= 0) {
          var pg = Te[_e[idx].page];
          var first = pg ? (pg._firstFocus || Be(pg)) : null;
          if (first) Fe(first);
        }
      };
    })(t);
    i._onMove = (function(idx) {
      return function(dir) {
        if ("up" === dir) {
          if (idx > 0 && Ee[idx - 1]) { Fe(Ee[idx - 1]); Ze(idx - 1, false); }
          else {
            var nBtn = document.querySelector("#home-notify .notify-item.filter") || document.querySelector("#home-notify .focusable");
            if (nBtn) Fe(nBtn);
          }
          return true;
        }
        if ("down" === dir) {
          if (idx < _e.length - 1 && Ee[idx + 1]) { Fe(Ee[idx + 1]); Ze(idx + 1, false); }
          return true;
        }
        if ("right" === dir) {
          Ze(idx, false);
          if (0 === idx) {
            var ch = Me.filter(function(x) { return x._channel === ke.channel; })[0] || Me[0] || X;
            if (ch) Fe(ch);
          } else if (_e[idx].page >= 0) {
            var pg = Te[_e[idx].page];
            var first = pg ? (pg._firstFocus || Be(pg)) : null;
            if (first) Fe(first);
          }
          return true;
        }
        if ("left" === dir) return true;
        return false;
      };
    })(t);
    e.appendChild(i);
    Ee.push(i);
  }
}(),function(){o(j);var notifyElements=[];for(var e=[{cls:"search",icon:"media/ui/home/icon_notify_search.png",small:!0},{cls:"filter",icon:"media/ui/search/icon_category_filter_n.png",small:!0},{cls:"rec",icon:"media/ui/home/icon_notify_records.png",small:!1},{cls:"personal",icon:"media/ui/home/icon_notify_personal.png",small:!0},{cls:"msg",icon:"media/ui/home/icon_notify_message.png",small:!1}],t=0;t<e.length;t++){var i=e[t],a=n("div","notify-item focusable "+i.cls+(i.small?" is-small":"")),r=n("div","n-normal");r.style.backgroundImage="url("+i.icon+")",a.appendChild(r),"filter"===i.cls?a._activate=function(){openFilterScreen()}:"rec"===i.cls?a._activate=function(){openHistoryManager()}:"personal"===i.cls?a._activate=function(){Jt()}:"search"===i.cls?a._activate=function(){zt()}:"msg"===i.cls?a._activate=function(){__dailyRotationOffset++;resetCatalogImgQueue();for(var pIdx=1;pIdx<Te.length;pIdx++){if(Te[pIdx]){o(Te[pIdx]);Ge[pIdx]=!1;}}if(_e[ke.tab]&&_e[ke.tab].page>0)Je(_e[ke.tab].page);cn("✨ Nuevas recomendaciones cargadas");setTimeout(function(){cn("");},2200);}:a._activate=function(){};notifyElements.push(a);j.appendChild(a)}for(var k=0;k<notifyElements.length;k++){(function(idx){notifyElements[idx]._onMove=function(dir){if("left"===dir){if(idx>0){Fe(notifyElements[idx-1]);return true;}if(Ee[ke.tab]){Fe(Ee[ke.tab]);return true;}return true;}if("right"===dir){if(idx<notifyElements.length-1){Fe(notifyElements[idx+1]);return true;}return true;}if("down"===dir){if(0===ke.tab){var ch=Me.filter(function(x){return x._channel===ke.channel;})[0]||Me[0]||X;if(ch){Fe(ch);return true;}}if(Ee[ke.tab])Fe(Ee[ke.tab]);else if(Ee[0])Fe(Ee[0]);return true;}if("up"===dir)return true;return false;};})(k)}var l=n("div","notify-divider");j.appendChild(l);var s=n("div","notify-wifi");s.innerHTML='<svg viewBox="0 0 30 22"><path d="M15 19.5a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2z" fill="currentColor"/><path d="M8.4 12.2a9.6 9.6 0 0 1 13.2 0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M4.2 7.6a15.6 15.6 0 0 1 21.6 0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',j.appendChild(s);var d=n("div","notify-time");d.id="notify-time",j.appendChild(d),Ye(),setInterval(Ye,3e4)}()}function Ye(){var e=r("notify-time");if(e){var t=new Date,i=t.getHours(),a=i>=12?"PM":"AM";0===(i%=12)&&(i=12);var n=t.getMinutes();e.textContent=i+":"+d(n)+" "+a}}
var sectionLoaded = {}, __lastNavInputTs = 0, __imgQueueGen = 0, __imgHeroQueue = [], __imgPriorityQueue = [], __imgNormalQueue = [], __imgHeroActive = 0, __imgActiveCount = 0, __imgPumpTimer = null;
function resetCatalogImgQueue() {
  __imgQueueGen++;
  __imgHeroActive = 0;
  __imgActiveCount = 0;
  for (var h = 0; h < __imgHeroQueue.length; h++) {
    if (__imgHeroQueue[h] && !__imgHeroQueue[h]._loaded) __imgHeroQueue[h]._queued = false;
  }
  for (var i = 0; i < __imgPriorityQueue.length; i++) {
    if (__imgPriorityQueue[i] && !__imgPriorityQueue[i]._loaded) __imgPriorityQueue[i]._queued = false;
  }
  for (var j = 0; j < __imgNormalQueue.length; j++) {
    if (__imgNormalQueue[j] && !__imgNormalQueue[j]._loaded) __imgNormalQueue[j]._queued = false;
  }
  __imgHeroQueue = [];
  __imgPriorityQueue = [];
  __imgNormalQueue = [];
}
function __pumpCatalogImgQueue() {
  if (__imgPumpTimer) { clearTimeout(__imgPumpTimer); __imgPumpTimer = null; }
  if (!__imgHeroQueue.length && !__imgPriorityQueue.length && !__imgNormalQueue.length) return;
  var elapsed = Date.now() - __lastNavInputTs;
  if (elapsed < 160 && __imgHeroQueue.length === 0 && __imgPriorityQueue.length === 0) {
    __imgPumpTimer = setTimeout(__pumpCatalogImgQueue, 165 - elapsed);
    return;
  }
  var curGen = __imgQueueGen;
  while (__imgHeroActive < 2 && __imgHeroQueue.length > 0) {
    var hImg = __imgHeroQueue.shift();
    if (!hImg || hImg._loaded || !hImg._realSrc) continue;
    if (document.body && !document.body.contains(hImg)) { hImg._queued = false; continue; }
    __imgHeroActive++;
    (function(targetHero, gen) {
      var hGuard = null;
      var doneH = function() {
        if (targetHero._doneFired) return;
        targetHero._doneFired = true;
        targetHero._loaded = true;
        if (hGuard) { clearTimeout(hGuard); hGuard = null; }
        if (gen === __imgQueueGen) __imgHeroActive = Math.max(0, __imgHeroActive - 1);
        if (!__imgPumpTimer) __imgPumpTimer = setTimeout(__pumpCatalogImgQueue, 8);
      };
      hGuard = setTimeout(doneH, 3000);
      targetHero.onload = doneH;
      targetHero.onerror = function() {
        if (targetHero._fallbackSrc && targetHero.src !== targetHero._fallbackSrc) {
          targetHero.src = targetHero._fallbackSrc;
          return;
        }
        this.style.display = "none";
        doneH();
      };
      targetHero.src = targetHero._realSrc;
    })(hImg, curGen);
  }
  var maxConc = __imgPriorityQueue.length > 0 ? 4 : 4;
  while (__imgActiveCount < maxConc && (__imgPriorityQueue.length > 0 || __imgNormalQueue.length > 0)) {
    if (__imgPriorityQueue.length === 0 && (Date.now() - __lastNavInputTs) < 160) {
      if (!__imgPumpTimer) __imgPumpTimer = setTimeout(__pumpCatalogImgQueue, 165 - (Date.now() - __lastNavInputTs));
      break;
    }
    var img = __imgPriorityQueue.length > 0 ? __imgPriorityQueue.shift() : __imgNormalQueue.shift();
    if (!img || img._loaded || !img._realSrc) continue;
    if (document.body && !document.body.contains(img)) { img._queued = false; continue; }
    __imgActiveCount++;
    (function(targetImg, gen) {
      var imgGuard = null;
      var done = function() {
        if (targetImg._doneFired) return;
        targetImg._doneFired = true;
        targetImg._loaded = true;
        if (imgGuard) { clearTimeout(imgGuard); imgGuard = null; }
        if (gen === __imgQueueGen) __imgActiveCount = Math.max(0, __imgActiveCount - 1);
        if (!__imgPumpTimer) __imgPumpTimer = setTimeout(__pumpCatalogImgQueue, 8);
      };
      imgGuard = setTimeout(done, 2500);
      targetImg.onload = done;
      targetImg.onerror = function() {
        this.style.display = "none";
        done();
      };
      targetImg.src = targetImg._realSrc;
    })(img, curGen);
  }
}
function enqueueCatalogImg(img, src, isPriority, isHero) {
  if (!img || !src || img._loaded) return;
  img._realSrc = src;
  if (img._queued) return;
  img._queued = true;
  if (isHero) __imgHeroQueue.push(img);
  else if (isPriority) __imgPriorityQueue.push(img);
  else __imgNormalQueue.push(img);
  if (!__imgPumpTimer) __imgPumpTimer = setTimeout(__pumpCatalogImgQueue, 0);
}
function revealRowWindow(rowCards, rIdx, cIdx) {
  if (!rowCards || !rowCards[rIdx]) return;
  var row = rowCards[rIdx];
  var startC = Math.max(0, cIdx - 1);
  var endC = Math.min(row.length - 1, cIdx + 6);
  for (var c = startC; c <= endC; c++) {
    var card = row[c];
    if (card && card._imgEl && card._imgEl._realSrc && !card._imgEl._loaded) {
      enqueueCatalogImg(card._imgEl, card._imgEl._realSrc, false);
    }
  }
  if (rowCards[rIdx + 1]) {
    var nextRow = rowCards[rIdx + 1];
    var maxNext = Math.min(nextRow.length - 1, 7);
    for (var nc = 0; nc <= maxNext; nc++) {
      var nCard = nextRow[nc];
      if (nCard && nCard._imgEl && nCard._imgEl._realSrc && !nCard._imgEl._loaded) {
        enqueueCatalogImg(nCard._imgEl, nCard._imgEl._realSrc, false);
      }
    }
  }
}
function Ze(e, t) {
  var i = _e[e];
  if (i.page < 0) Jt();
  else {
    var a = _e[ke.tab] ? _e[ke.tab].page : i.page;
    ke.tab = e;
    for (var n = 0; n < Ee.length; n++) Ee[n].classList.toggle("is-selected", n === e);
    var preloader = r("section-preloader");
    if (preloader) preloader.classList.remove("is-visible");
    for (var r_idx = 0; r_idx < Te.length; r_idx++) {
      Te[r_idx].classList.remove("is-entering", "from-left", "from-right");
      Te[r_idx].classList.toggle("is-current", r_idx === i.page);
    }
    if (i.page !== a && i.page > 0) {
      resetCatalogImgQueue();
    }
    i.page >= 0 && Je(i.page);
    if (i.page > 0 && Te[i.page]) {
      var pgEl = Te[i.page];
      if (pgEl._bentoBigCards) {
        for (var bi = 0; bi < pgEl._bentoBigCards.length; bi++) {
          var bImg = pgEl._bentoBigCards[bi]._imgEl;
          if (bImg && bImg._realSrc && !bImg._loaded) enqueueCatalogImg(bImg, bImg._realSrc, true, true);
        }
      }
      if (pgEl._bentoSmallCards) {
        for (var si = 0; si < pgEl._bentoSmallCards.length; si++) {
          var sImg = pgEl._bentoSmallCards[si]._imgEl;
          if (sImg && sImg._realSrc && !sImg._loaded) enqueueCatalogImg(sImg, sImg._realSrc, true);
        }
      }
      if (pgEl._rowCards) {
        revealRowWindow(pgEl._rowCards, 0, 0);
      }
    }
    0 === i.page ? mt(z[ke.channel]) : ht();
    sectionLoaded[i.page] = true;
    if (t) {
      if (0 === i.page) {
        var l = Me.filter(function(e) { return e._channel === ke.channel; })[0];
        l ? Fe(l) : Me.length ? Fe(Me[0]) : X && Fe(X);
      } else {
        var pg = Te[i.page];
        var s = pg ? (pg._firstFocus || Be(pg)) : null;
        if (s) Fe(s);
      }
    }
  }
}function et(e,t,i,a,r,o){o=o||{};var s=n("div","poster focusable"+(o.gold?" gold":"")+(o.type3?" type3":""));l(s,t,i,a,r);if(e&&e.poster){var d=n("img","p-img");d._realSrc=e.poster;if(o.deferImg){s._imgEl=d;}else{s._imgEl=d;enqueueCatalogImg(d,e.poster,!!o.priorityImg);}s.appendChild(d);}if(!o.noTitle){s.appendChild(n("div","p-shade"));s.appendChild(n("div","p-title",e?e.title||e.name||"":""));}s._item=e;s._activate=function(){At(e)};return s;}var tt=[{id:"es_tdt",name:"España - Canales Nacionales y TDT",url:"https://iptv-org.github.io/iptv/countries/es.m3u",desc:"320+ canales: La 1, La 2, Antena 3, Telecinco, laSexta, autonómicas"},{id:"latam_spa",name:"Latinoamérica y Deportes (Hispano)",url:"https://iptv-org.github.io/iptv/languages/spa.m3u",desc:"Canales en español de Latinoamérica y España"},{id:"co_tv",name:"Colombia TV",url:"https://iptv-org.github.io/iptv/countries/co.m3u",desc:"Canales abiertos y regionales de Colombia"},{id:"mx_tv",name:"México TV",url:"https://iptv-org.github.io/iptv/countries/mx.m3u",desc:"Canales nacionales y regionales de México"},{id:"ar_tv",name:"Argentina TV",url:"https://iptv-org.github.io/iptv/countries/ar.m3u",desc:"Televisión abierta, noticias y señales de Argentina"},{id:"pe_tv",name:"Perú TV",url:"https://iptv-org.github.io/iptv/countries/pe.m3u",desc:"Canales nacionales y regionales de Perú"},{id:"cl_tv",name:"Chile TV",url:"https://iptv-org.github.io/iptv/countries/cl.m3u",desc:"Televisión nacional y cultural de Chile"},{id:"ec_tv",name:"Ecuador TV",url:"https://iptv-org.github.io/iptv/countries/ec.m3u",desc:"Señales abiertas y canales locales de Ecuador"},{id:"bo_tv",name:"Bolivia TV",url:"https://iptv-org.github.io/iptv/countries/bo.m3u",desc:"Televisión boliviana abierta y departamental"},{id:"sports_iptv",name:"Deportes Internacionales",url:"https://iptv-org.github.io/iptv/categories/sports.m3u",desc:"Transmisiones deportivas y canales de competiciones"},{id:"movies_iptv",name:"Cine y Series 24/7",url:"https://iptv-org.github.io/iptv/categories/movies.m3u",desc:"Cine clásico, cine de acción y canales continuos de series"}];function it(){try{var e=localStorage.getItem("xuper_m3u_addons");if(e){var t=JSON.parse(e);if(Array.isArray(t)&&t.length)return t}}catch(e){}var i=[tt[0]];try{localStorage.setItem("xuper_m3u_addons",JSON.stringify(i))}catch(e){}return i}function at(e){try{localStorage.setItem("xuper_m3u_addons",JSON.stringify(e||[]))}catch(e){}}var nt=[],rt=null,ot=!1,lt=!1,st=!1,dt=null,ct=null,pt=0,ut=null,ft="",vt=!1;function ht(){if($)$.classList.remove("is-preview-playing","is-preview-loading");if(ct)ct.textContent="";}function mt(e){ht();}
var playerToastTimer=null;
function showPlayerToast(msg){
  var toast=document.querySelector(".player-toast");
  if(!toast){
    toast=document.createElement("div");
    toast.className="player-toast";
    document.body.appendChild(toast);
  }
  toast.textContent=msg;
  toast.classList.add("is-active");
  if(playerToastTimer)clearTimeout(playerToastTimer);
  playerToastTimer=setTimeout(function(){
    toast.classList.remove("is-active");
    playerToastTimer=null;
  },2200);
}

function getStoredFavorites(){
  try{
    var raw=localStorage.getItem("xuper_favorite_channels");
    if(raw){
      var arr=JSON.parse(raw);
      if(Array.isArray(arr))return arr;
    }
  }catch(e){}
  return [];
}

function saveStoredFavorites(favs){
  try{
    localStorage.setItem("xuper_favorite_channels",JSON.stringify(favs||[]));
  }catch(e){}
}

function isChannelFavorite(ch){
  if(!ch)return false;
  var favs=getStoredFavorites();
  for(var i=0;i<favs.length;i++){
    var f=favs[i];
    if((f.channelCode&&ch.channelCode&&f.channelCode===ch.channelCode)||(f.id&&ch.id&&f.id===ch.id)||(f.name&&ch.name&&f.name===ch.name)){
      return true;
    }
  }
  return false;
}

function toggleChannelFavorite(ch){
  if(!ch)return false;
  var favs=getStoredFavorites();
  var foundIdx=-1;
  for(var i=0;i<favs.length;i++){
    var f=favs[i];
    if((f.channelCode&&ch.channelCode&&f.channelCode===ch.channelCode)||(f.id&&ch.id&&f.id===ch.id)||(f.name&&ch.name&&f.name===ch.name)){
      foundIdx=i;
      break;
    }
  }
  var added=false;
  if(foundIdx>=0){
    favs.splice(foundIdx,1);
    ch.fav=false;
    added=false;
  }else{
    favs.push({
      channelCode:ch.channelCode||"",
      id:ch.id||"",
      name:ch.name||"",
      logo:ch.logo||"",
      url:ch.url||ch.streamUrl||"",
      streamUrl:ch.streamUrl||ch.url||"",
      backupUrls:ch.backupUrls||[],
      liveAddressList:ch.liveAddressList||[],
      index:ch.index||0,
      fav:true
    });
    ch.fav=true;
    added=true;
  }
  saveStoredFavorites(favs);
  return added;
}

function isAdultChannel(ch){
  if(!ch)return false;
  if(ch.columnId===76208||ch.categoryId===76208||ch.colId===76208)return true;
  var s=((ch.name||"")+" "+(ch.title||"")+" "+(ch.categoryName||"")).toLowerCase();
  if(s.indexOf("adult swim")!==-1)return false;
  return /\b(18\+|xxx|\+18|adulto|adultos|playboy|venus|s-extreme|sextreme|hustler|penthouse|brazzers|redlight|red light|dorcel|private|man-x|manx|hot|erotic|erotico|erotica|babes|vivid)\b/i.test(s);
}

function channelSortGroup(str){
  var s=String(str||"").trim();
  if(!s)return 2;
  return /^[a-z\u00e0-\u00fc]/i.test(s)?1:0;
}
function sortChannelsAlphaNumFirst(arr){
  if(!Array.isArray(arr)||arr.length<2)return arr;
  return arr.sort(function(a,b){
    var na=String((a&&a.name)||"").trim(),nb=String((b&&b.name)||"").trim();
    var ga=channelSortGroup(na),gb=channelSortGroup(nb);
    if(ga!==gb)return ga-gb;
    var ca=c(na),cb=c(nb);
    if(typeof ca.localeCompare==="function"){
      try{return ca.localeCompare(cb,"es",{numeric:true,sensitivity:"base"});}catch(_){}
    }
    return ca<cb?-1:(ca>cb?1:0);
  });
}

function loadFavoritesCategory(cb){
  var favs=getStoredFavorites();
  z.splice(0,z.length);
  for(var i=0;i<favs.length;i++){
    var item=favs[i];
    item.fav=true;
    z.push(item);
  }
  sortChannelsAlphaNumFirst(z);
  for(var fi=0;fi<z.length;fi++)z[fi].index=fi+1;
  lt=!0;
  Ct(!1);
  if(ke.channelsOpen)Ja();
  if(ke.channel>=z.length)ke.channel=0;
  if(z[ke.channel]&&W)W.textContent=z[ke.channel].name;
  if("player"===ke.screen&&"live"===ke.playerMode){
    bn();
    if(!ke.channelsOpen&&z[ke.channel])yn(z[ke.channel],!0);
  }else if(z[ke.channel]){
    mt(z[ke.channel]);
  }
  cb&&cb();
}

var catLiveReqId=0;
window.__categoryChannelsCache=window.__categoryChannelsCache||{};
function gt(e,t){
  if(!e)return;
  rt=e;
  if(e.id==="favorites"||e.isFavorite){
    loadFavoritesCategory(function(){t&&t();});
  }else if(e.isAddon){
    yt(function(){t&&t();});
  }else{
    var cacheKey=e.id||e.code||e.name;
    if(window.__categoryChannelsCache[cacheKey]){
      var cachedChannels=window.__categoryChannelsCache[cacheKey];
      z.splice(0,z.length);
      for(var n=0;n<cachedChannels.length;n++){
        var ch=cachedChannels[n];
        ch.fav=isChannelFavorite(ch);
        z.push(ch);
      }
      sortChannelsAlphaNumFirst(z);
      for(var o=0;o<z.length;o++)z[o].index=o+1;
      lt=!0,Ct(!1);
      ke.channelsOpen&&Ja();
      return void(t&&t());
    }
    bt(e,function(){t&&t();});
  }
}
function yt(e){var t=it();if(!t||!t.length)return z.splice(0,z.length),Ct(!1),Ja(),void(e&&e());cn("Cargando canales de Addon…");for(var i=[],a=t.length,n=0;n<t.length;n++)(function(t){D("fetchM3u",{url:t.url},function(t,n){if(n&&n.channels&&n.channels.length)for(var r=0;r<n.channels.length;r++)i.push(n.channels[r]);if(--a<=0){cn(""),z.splice(0,z.length);for(var o=0;o<i.length;o++)z.push(i[o]);sortChannelsAlphaNumFirst(z);for(var oi=0;oi<z.length;oi++)z[oi].index=oi+1;ke.channel=0,Ct(!1),Ja(),z[0]&&W&&(W.textContent=z[0].name),"player"===ke.screen&&"live"===ke.playerMode&&(bn(),yn(z[0],!0)),e&&e()}})})(t[n])}
function bt(e,t,retryCount){
  var thisReq=++catLiveReqId;
  st=!0;
  var tries=Number(retryCount||0);
  var reqParams=(e&&"object"==typeof e)?{columnId:e.id,m3uUrl:e.m3uUrl||"",m3uUrls:e.m3uUrls||null,countryFolder:e.countryFolder||"",isEpicSports:!!e.isEpicSports,isEpicEvents:!!e.isEpicEvents,isEpic247:!!e.isEpic247,isEspn:!!e.isEspn,isPortalCanales:!!e.isPortalCanales}:(e?{columnId:e}:{});
  var cacheKey=(e&&"object"==typeof e)?(e.id||76182):(e||76182);
  D("liveChannels",reqParams,function(i,a){
    if(thisReq!==catLiveReqId)return;
    st=!1;
    var isFb=!!(a&&a.isFallback);
    if(a&&a.channels&&a.channels.length){
      if(!isFb){
        if(!reqParams.columnId||reqParams.columnId===76182||String(reqParams.columnId)==="76182"){
          window.__masterChannelPool=a.channels.slice();
        }
        window.__categoryChannelsCache[cacheKey]=a.channels.slice();
      }
      if(!isFb||!z.length){
        z.splice(0,z.length);
        for(var n=0;n<a.channels.length;n++){
          var ch=a.channels[n];
          if(!isAdultChannel(ch)){
            ch.fav=isChannelFavorite(ch);
            z.push(ch);
          }
        }
        sortChannelsAlphaNumFirst(z);
        for(var o=0;o<z.length;o++)z[o].index=o+1;
        lt=!0,Ct(!1),ke.channelsOpen&&Ja(),ke.channel>=z.length&&(ke.channel=0),z[ke.channel]&&W&&(W.textContent=z[ke.channel].name),"player"===ke.screen&&"live"===ke.playerMode?bn():mt(z[ke.channel]);
      }
      if(isFb&&tries<5){setTimeout(function(){if(thisReq===catLiveReqId&&!window.__categoryChannelsCache[cacheKey])bt(e,null,tries+1);},2500);}
    }else{
      if(ke.channelsOpen){z.splice(0,z.length);Ja();}
      else if(!lt&&tries<5){setTimeout(function(){bt(e,null,tries+1)},2500);}
    }ot||setTimeout(function(e){ot&&nt.length?e&&e(null,nt):D("liveCategories",{},function(t,i){var a=[];if(i&&i.categories&&i.categories.length){for(var n=0;n<i.categories.length;n++){var r=i.categories[n],o=r.name;if(r.id===76208||/18\+|adult/i.test(o))continue;"ChannelList"!==o&&76182!==r.id||(o="Todos"),a.push({id:r.id,name:o,code:r.code,isAddon:!!r.isM3u,isEpicSports:!!r.isEpicSports,isEpicEvents:!!r.isEpicEvents,isEpic247:!!r.isEpic247,isEspn:!!r.isEspn,isPortalCanales:!!r.isPortalCanales,isFavorite:!!r.isFavorite,m3uUrl:r.m3uUrl||"",countryFolder:r.countryFolder||""})}}else a=[{id:76182,name:"Todos"},{id:"favorites",name:"⭐ Favoritos",isFavorite:!0},{id:"epic_events",name:"Deportes En Vivo",isEpicEvents:!0},{id:"espn",name:"ESPN",isEspn:!0},{id:76206,name:"Deportes"},{id:76188,name:"Colombia",countryFolder:"Colombia",m3uUrl:"https://cdn.jsdelivr.net/gh/iptv-org/iptv@gh-pages/countries/co.m3u"},{id:76191,name:"España",countryFolder:"España",m3uUrl:"https://cdn.jsdelivr.net/gh/iptv-org/iptv@gh-pages/countries/es.m3u"},{id:76197,name:"México",countryFolder:"México",m3uUrl:"https://cdn.jsdelivr.net/gh/iptv-org/iptv@gh-pages/countries/mx.m3u"},{id:76190,name:"Ecuador",countryFolder:"Ecuador",m3uUrl:"https://cdn.jsdelivr.net/gh/iptv-org/iptv@gh-pages/countries/ec.m3u"},{id:76207,name:"Chile",countryFolder:"Chile",m3uUrl:"https://cdn.jsdelivr.net/gh/iptv-org/iptv@gh-pages/countries/cl.m3u"},{id:76187,name:"Perú",countryFolder:"Perú",m3uUrl:"https://cdn.jsdelivr.net/gh/iptv-org/iptv@gh-pages/countries/pe.m3u"},{id:"m3u_ar",name:"Argentina",countryFolder:"Argentina",m3uUrl:"https://cdn.jsdelivr.net/gh/iptv-org/iptv@gh-pages/countries/ar.m3u",isAddon:!1},{id:76205,name:"Cine y Series"},{id:79146,name:"Infantil"},{id:"addons",name:"➕ Addons M3U",isAddon:!0}];var todosIdx=-1;for(var ti=0;ti<a.length;ti++){if(a[ti].id===76182||a[ti].name==="Todos"){todosIdx=ti;break;}}var hasFav=!1;for(var fi=0;fi<a.length;fi++){if(a[fi].id==="favorites"||a[fi].isFavorite){hasFav=!0;break;}}if(!hasFav){var favCat={id:"favorites",name:"⭐ Favoritos",isFavorite:!0,isAddon:!1};if(todosIdx>=0){a.splice(todosIdx+1,0,favCat);}else{a.unshift(favCat);}}nt=a,ot=!0,rt||(rt=nt[0]),Qa(),e&&e(null,nt)})},100),t&&t(i,a)})}var __ctLogoTimer=null;function flushHomeTvLogos(immediate){if(__ctLogoTimer){clearTimeout(__ctLogoTimer);__ctLogoTimer=null;}var elapsed=Date.now()-__lastNavInputTs;if(!immediate&&elapsed<150){__ctLogoTimer=setTimeout(function(){__ctLogoTimer=null;flushHomeTvLogos(!1);},155-elapsed);return;}for(var m=0;m<Me.length;m++){var rowEl=Me[m];if(rowEl&&rowEl._logoImg&&rowEl._logoImg._src&&!rowEl._logoImg._loaded){(function(im){im._loaded=!0;im.onerror=function(){this.onerror=null;this.style.display="none";};im.src=im._src;})(rowEl._logoImg);}}}function Ct(e){if(Q){var hadRows=Me.length>0;o(Q),Me=[];var list=[];if(e){for(var j=0;j<z.length;j++)if(z[j].fav)list.push(j);}else{for(var j=0;j<z.length;j++)list.push(j);}var total=list.length,start=0,end=total;if(total>20){var curPos=list.indexOf(ke.channel);curPos<0&&(curPos=0),start=Math.max(0,curPos-8),end=Math.min(total,start+20),end-start<20&&(start=Math.max(0,end-20));}for(var k=start;k<end;k++){var t=list[k],i=n("div","live-row focusable");i._channel=t;var a=n("div","row-icon");if(z[t].logo){var img=n("img","row-logo");img.alt="";if(0===String(z[t].logo).indexOf("media/")){img.src=z[t].logo;img._loaded=!0;}else{img._src=z[t].logo;i._logoImg=img;}a.appendChild(img);}var r=n("div","row-play"),l=n("div","row-name",z[t].name);i.appendChild(a),i.appendChild(r),i.appendChild(l),t===ke.channel&&i.classList.add("is-current"),i._activate=function(e){return function(){St(e,!0),hn("live")}}(t),i._onMove=function(chIdx,pos){return function(dir){if("left"===dir)return(X?Fe(X):Ee[0]&&Fe(Ee[0]),!0);if("up"===dir){if(pos>0){var prevCh=list[pos-1];St(prevCh);var prevEl=Me.filter(function(x){return x._channel===prevCh;})[0];if(prevEl){Fe(prevEl);flushHomeTvLogos(!1);}else{Ct(e);var re=Me.filter(function(x){return x._channel===prevCh;})[0];re&&Fe(re);}}else{var topSearch=document.querySelector("#home-notify .notify-item.search")||document.querySelector("#home-notify .focusable");if(topSearch){Fe(topSearch);return!0;}}return!0;}if("down"===dir){if(pos<list.length-1){var nextCh=list[pos+1];St(nextCh);var nextEl=Me.filter(function(x){return x._channel===nextCh;})[0];if(nextEl){Fe(nextEl);flushHomeTvLogos(!1);}else{Ct(e);var rn=Me.filter(function(x){return x._channel===nextCh;})[0];rn&&Fe(rn);}}return!0;}}}(t,k),Q.appendChild(i),Me.push(i);}z[ke.channel]&&W&&(W.textContent=z[ke.channel].name),wt(),flushHomeTvLogos(!hadRows||(Date.now()-__lastNavInputTs)>=150);}}function wt(){if(Me.length){var e=Me.filter(function(e){return e._channel===ke.channel})[0];if(e){var t=120*Me.indexOf(e),i=Math.max(0,Q.scrollHeight-Q.clientHeight),a=Q.scrollTop;t<a&&(a=t),t+100.5>a+Q.clientHeight&&(a=t+100.5-Q.clientHeight),Q.scrollTop=Math.max(0,Math.min(i,a))}}}function St(e,t){e<0&&(e=0),e>z.length-1&&(e=z.length-1),ke.channel=e;for(var i=0;i<Me.length;i++)Me[i].classList.toggle("is-current",Me[i]._channel===e);z[e]&&W&&(W.textContent=z[e].name),wt(),"player"===ke.screen?(!function(){if(!se)return;bn()}(),"live"===ke.playerMode&&yn(z[e],!!t)):"home"===ke.screen&&0===ke.tab&&mt(z[e])}function xt(){vt=!1;}function _t(){vt=!1;}function Lt(){for(var e=r("da-presets-list"),t=r("da-installed-list"),i=it(),a={},l=0;l<i.length;l++)a[i[l].url]=!0;if(e){o(e);for(var s=0;s<tt.length;s++)(function(t){var i=n("div","da-preset-item"),r=n("div","da-preset-info");r.appendChild(n("div","da-preset-name",t.name)),r.appendChild(n("div","da-preset-desc",t.desc)),i.appendChild(r);var o=!!a[t.url],l=n("button","da-preset-btn focusable"+(o?" is-installed":""),o?"✔ Instalado":"+ Instalar");l._activate=function(){o||(l.textContent="Instalando…",kt(t,function(e,t){e?(l.textContent="Error",setTimeout(function(){l.textContent="+ Instalar"},2e3)):(Lt(),rt&&rt.isAddon&&yt())}))},i.appendChild(l),e.appendChild(i)})(tt[s])}if(t)if(o(t),i.length)for(var d=0;d<i.length;d++)(function(e,a){var r=n("div","da-installed-item"),o=n("div","da-installed-info"),l=n("div","da-preset-name",e.name),s=n("div","da-preset-desc",(e.count?e.count+" canales • ":"")+e.url);o.appendChild(l),o.appendChild(s),r.appendChild(o);var d=n("button","da-del-btn focusable","Eliminar");d._activate=function(){i.splice(a,1),at(i),Lt(),rt&&rt.isAddon&&yt()},r.appendChild(d),t.appendChild(r)})(i[d],d);else t.appendChild(n("div","da-installed-empty","No hay addons personalizados instalados aún. Instala una lista recomendada arriba o escribe una URL."));var c=r("da-btn-add-custom");c&&(c._activate=function(){var e=r("da-custom-url"),t=e?(e.value||"").trim():"";t&&/^https?:\/\//i.test(t)?(c.textContent="Descargando…",kt({id:"custom_"+Date.now(),name:"Lista Personalizada",url:t},function(t,i){c.textContent="Agregar",t?alert("No se pudo cargar la lista M3U: "+t):(e&&(e.value=""),Lt(),rt&&rt.isAddon&&yt())})):alert("Por favor introduce una URL válida (http:// o https://)")});var p=r("da-btn-exit");p&&(p._activate=function(){_t()})}function kt(e,t){D("fetchM3u",{url:e.url},function(i,a){if(!i&&a&&a.channels&&a.channels.length){for(var n=it(),r=!1,o=0;o<n.length;o++)if(n[o].url===e.url){n[o].count=a.channels.length,r=!0;break}r||n.push({id:e.id||"addon_"+Date.now(),name:e.name||"Lista M3U",url:e.url,count:a.channels.length}),at(n),t&&t(null,a.channels.length)}else t&&t(i||"No se encontraron canales en la lista")})}var It={bigW:831,bigH:534,bigY:38.5,smallW:413,smallH:222,smallY:578.5,bigX:[192,1029],smallX:[192,609,1028,1446]};function Tt(e,t,i,a,r,o){o=o||{};var s=n("div","bento focusable");s._isBento=!0;if(o.pageEl)s._pageEl=o.pageEl;l(s,t,i,a,r);var d=e?(o.highRes?(e.landscape||e.backdrop||e.poster):(e.poster||e.landscape)):"";if(d){var c=n("img","bento-img");c._realSrc=d;if(o.highRes&&e&&e.poster&&e.poster!==d)c._fallbackSrc=e.poster;s._imgEl=c;enqueueCatalogImg(c,d,!0,!!o.highRes);s.appendChild(c);}s.appendChild(n("div","bento-shade"));s.appendChild(n("div","bento-title",e?e.title||e.name||"":""));if(o.badge)s.appendChild(n("div","bento-badge",o.badge));s._item=e;if(e){s._activate=function(){At(e)}};return s;}function Et(e,t,i,a){var r=n("div","bento-dots");l(r,e,t,21+40*Math.max(0,i-1),11);for(var o=0;o<i;o++)r.appendChild(n("span","bento-dot"+(o===a?" is-active":"")));return r}function Mt(e, t, i) {
  i = i || {};
  var a = t.length ? t : u;
  if (a.length) {
    var bigCards = [], smallCards = [], n;
    for (n = 0; n < 2; n++) {
      var bc = Tt(a[n % a.length], It.bigX[n], It.bigY, It.bigW, It.bigH, {shade: !1 !== i.shade, title: i.titles, pageEl: e, highRes: !0});
      e.appendChild(bc);
      bigCards.push(bc);
    }
    for (n = 0; n < 4; n++) {
      var sc = Tt(a[(n + 2) % a.length], It.smallX[n], It.smallY, It.smallW, It.smallH, {pageEl: e});
      e.appendChild(sc);
      smallCards.push(sc);
    }
    e._bentoBigCards = bigCards;
    e._bentoSmallCards = smallCards;
    e._firstFocus = bigCards[0] || smallCards[0] || null;
    if (i.dots) e.appendChild(Et(848, 535.5, i.dots, 0));

    if (bigCards[0]) {
      bigCards[0]._onMove = function(dir) {
        if ("down" === dir) { if (smallCards[0]) { Fe(smallCards[0]); return true; } }
        if ("left" === dir) { if (Ee[ke.tab]) { Fe(Ee[ke.tab]); return true; } }
        if ("right" === dir) { if (bigCards[1]) { Fe(bigCards[1]); return true; } }
        if ("up" === dir) {
          var topN = document.querySelector("#home-notify .notify-item.search") || document.querySelector("#home-notify .focusable");
          if (topN) { Fe(topN); return true; }
          return true;
        }
        return false;
      };
    }
    if (bigCards[1]) {
      bigCards[1]._onMove = function(dir) {
        if ("down" === dir) { if (smallCards[2]) { Fe(smallCards[2]); return true; } }
        if ("left" === dir) { if (bigCards[0]) { Fe(bigCards[0]); return true; } }
        if ("right" === dir) return true;
        if ("up" === dir) {
          var topN = document.querySelector("#home-notify .notify-item.search") || document.querySelector("#home-notify .focusable");
          if (topN) { Fe(topN); return true; }
          return true;
        }
        return false;
      };
    }
    for (var sIdx = 0; sIdx < smallCards.length; sIdx++) {
      (function(idx) {
        smallCards[idx]._onMove = function(dir) {
          if ("left" === dir) {
            if (idx > 0 && smallCards[idx - 1]) { Fe(smallCards[idx - 1]); return true; }
            if (Ee[ke.tab]) { Fe(Ee[ke.tab]); return true; }
            return true;
          }
          if ("right" === dir) {
            if (idx < smallCards.length - 1 && smallCards[idx + 1]) { Fe(smallCards[idx + 1]); return true; }
            return true;
          }
          if ("up" === dir) {
            var targetBig = idx < 2 ? bigCards[0] : bigCards[1];
            if (targetBig) { Fe(targetBig); return true; }
            return true;
          }
          if ("down" === dir) {
            if (e._rowCards && e._rowCards[0] && e._rowCards[0].length) {
              var targetCol = Math.min(idx * 2, e._rowCards[0].length - 1);
              Fe(e._rowCards[0][targetCol]);
              return true;
            }
            return false;
          }
          return false;
        };
      })(sIdx);
    }
  }
}var __dailyRotationOffset=0;
function getDailySeed(saltStr){
  var d=new Date();
  var dayNum=d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate()+__dailyRotationOffset;
  var h=(dayNum^2166136261)>>>0;
  var s=String(saltStr||"default")+"_"+String(dayNum);
  for(var i=0;i<s.length;i++){
    h^=s.charCodeAt(i);
    h=((h*16777619)%4294967296)>>>0;
  }
  return(h>>>0)||1;
}
function dailyRotatePool(list,saltStr){
  if(!list||list.length<=1)return list?list.slice():[];
  var seed=getDailySeed(saltStr);
  function nextRand(){
    seed=(seed*1664525+1013904223)%4294967296;
    return seed/4294967296;
  }
  var withHero=[],rest=[];
  for(var i=0;i<list.length;i++){
    var it=list[i];
    if(!it)continue;
    if(/er[oó]tic|hentai|18\+/i.test(it.title||""))continue;
    var hasLand=it.landscape&&0===String(it.landscape).indexOf("http")&&it.landscape!==it.poster;
    var hasPost=it.poster&&0===String(it.poster).indexOf("http");
    var isTrailer=/tr[aá]iler/i.test(it.title||"");
    if(hasLand&&hasPost&&!isTrailer)withHero.push(it);
    else rest.push(it);
  }
  for(var j=withHero.length-1;j>0;j--){
    var k=Math.floor(nextRand()*(j+1));
    var tmp=withHero[j];withHero[j]=withHero[k];withHero[k]=tmp;
  }
  for(var m=rest.length-1;m>0;m--){
    var nIdx=Math.floor(nextRand()*(m+1));
    var tmp2=rest[m];rest[m]=rest[nIdx];rest[nIdx]=tmp2;
  }
  return withHero.concat(rest);
}
function qt(e){
  var t,i=[];
  if(e){
    for(t=0;t<u.length;t++){
      var it=u[t];
      if(!it||/er[oó]tic|hentai|18\+/i.test(it.title||""))continue;
      var cats=c(it.category||"").split(",");
      if(-1!==cats.indexOf(e)){
        i.push(it);
      }
    }
    if(!i.length){
      for(t=0;t<u.length;t++){
        var it2=u[t];
        if(!it2||/er[oó]tic|hentai|18\+/i.test(it2.title||""))continue;
        if(it2.kind&&-1!==c(it2.kind).indexOf(e))i.push(it2);
      }
    }
    if(i.length>1){
      i.sort(function(x,y){
        var ox=(x._catOrder&&void 0!==x._catOrder[e])?x._catOrder[e]:999999;
        var oy=(y._catOrder&&void 0!==y._catOrder[e])?y._catOrder[e]:999999;
        return ox-oy;
      });
    }
  }
  var base=i.length?i:u;
  if(__dailyRotationOffset>0){
    return dailyRotatePool(base,"cat_"+(e||"all"));
  }
  var withHero=[],rest=[];
  for(var idx=0;idx<base.length;idx++){
    var item=base[idx];
    if(!item||/er[oó]tic|hentai|18\+/i.test(item.title||""))continue;
    var hasLand=item.landscape&&0===String(item.landscape).indexOf("http")&&item.landscape!==item.poster;
    var hasPost=item.poster&&0===String(item.poster).indexOf("http");
    var isTrailer=/tr[aá]iler/i.test(item.title||"");
    if(hasLand&&hasPost&&!isTrailer)withHero.push(item);
    else rest.push(item);
  }
  return withHero.concat(rest);
}function Ot(e, t, i, a) {
  if (t && t.length) {
    var startY = i || 860;
    var subRows = [];
    var rowSize = 20;
    for (var rIdx = 0; rIdx < t.length && subRows.length < 4; rIdx += rowSize) {
      subRows.push(t.slice(rIdx, rIdx + rowSize));
    }
    var rowTitles = [
      a || "Recomendaciones de hoy",
      "Tendencias del día",
      "Selección especial para ti",
      "Más títulos para descubrir"
    ];
    var rowCards = [];
    e._rowCards = rowCards;
    for (var r = 0; r < subRows.length; r++) {
      var sec = n("div", "carousel-section");
      sec.style.position = "absolute";
      sec.style.left = "0px";
      sec.style.top = startY + "px";
      var heading = n("div", "carousel-title", rowTitles[r] || "Más contenidos");
      sec.appendChild(heading);
      var track = n("div", "carousel-track scrollable");
      var thisRow = [];
      rowCards.push(thisRow);
      var rowTopVal = startY;
      for (var d = 0; d < subRows[r].length; d++) {
        var deferLoad = (r >= 1 || d >= 8);
        var card = et(subRows[r][d], 0, 0, 230, 335, {gold: true, deferImg: deferLoad});
        card.classList.add("carousel-item");
        card._rowIdx = r;
        card._colIdx = d;
        card._trackEl = track;
        card._pageEl = e;
        card._rowTop = rowTopVal;
        thisRow.push(card);
        (function(c, rI, cI) {
          c._onFocus = function() {
            revealRowWindow(rowCards, rI, cI);
          };
          c._onMove = function(dir) {
            if ("left" === dir) {
              if (cI > 0 && rowCards[rI][cI - 1]) { Fe(rowCards[rI][cI - 1]); return true; }
              if (Ee[ke.tab]) { Fe(Ee[ke.tab]); return true; }
              return true;
            }
            if ("right" === dir) {
              if (cI < rowCards[rI].length - 1 && rowCards[rI][cI + 1]) { Fe(rowCards[rI][cI + 1]); return true; }
              return true;
            }
            if ("up" === dir) {
              if (rI > 0 && rowCards[rI - 1] && rowCards[rI - 1].length) {
                var upCard = rowCards[rI - 1][Math.min(cI, rowCards[rI - 1].length - 1)];
                if (upCard) { Fe(upCard); return true; }
              }
              if (e._bentoSmallCards && e._bentoSmallCards.length) {
                var bIdx = Math.min(Math.floor(cI / 2), e._bentoSmallCards.length - 1);
                Fe(e._bentoSmallCards[bIdx]);
                return true;
              }
              return false;
            }
            if ("down" === dir) {
              if (rI < rowCards.length - 1 && rowCards[rI + 1] && rowCards[rI + 1].length) {
                var dnCard = rowCards[rI + 1][Math.min(cI, rowCards[rI + 1].length - 1)];
                if (dnCard) { Fe(dnCard); return true; }
              }
              return true;
            }
            return false;
          };
        })(card, r, d);
        track.appendChild(card);
      }
      sec.appendChild(track);
      e.appendChild(sec);
      startY += 430;
    }
    var spacer = n("div", "explore-spacer");
    spacer.style.position = "absolute";
    spacer.style.top = startY + "px";
    spacer.style.height = "160px";
    spacer.style.width = "100%";
    e.appendChild(spacer);
  }
}function At(e){if(ke.detail=e,ke.playerMode="vod",ke.detailReturn={screen:ke.screen,focus:ke.focus},ke.detailRange=0,ke.detailSeason=0,ke.detailEpisode=null,e.seasons&&e.seasons.length)for(var t=0;t<e.seasons.length;t++)if(e.seasons[t].id===e.id){ke.detailSeason=t;break}e.episodes&&e.episodes.length&&(ke.detailEpisode=e.episodes[0]),va(),ua(e),ga(e),Pt(e),ze("detail"),se||Xa();var i=r("screen-player");i&&(i.classList.add("is-mini"),i.classList.add("is-active")),syncVodStageLayout(!0);var a=K?K.querySelector(".focusable"):null;a&&Fe(a),e._detailsLoaded?fn(e,ke.detailEpisode):(cn("Preparando la reproducción…"),H(e,function(e){cn("");e&&"detail"===ke.screen&&ke.detail===e&&fn(e,ke.detailEpisode)}))}function Dt(){var e=r("screen-detail");if(e){var t=!e.classList.contains("is-synopsis-open");e.classList.toggle("is-synopsis-open",t);var i=document.querySelector(".detail-more");i&&(i.textContent=t?"Menos":"Más")}}function Pt(e){G=r("detail-left"),J=r("detail-player"),K=r("detail-buttons"),Y=r("detail-bottom"),o(G),o(K),o(Y),Y&&(Y.scrollTop=0);var resetY=function(){Y&&(Y.scrollTop=0)};var t,i=n("div","detail-titlewrap");if(i.appendChild(n("div","detail-title",e.title)),i.appendChild(n("div","detail-score",e.score)),G.appendChild(i),e.country||e.releaseDate||e.tagline){var a=[];e.country&&a.push(e.country),e.releaseDate&&a.push(e.releaseDate),e.tagline&&a.push(e.tagline),t=a.join(" | ")}else{var s=[];e.year&&"—"!==e.year&&s.push(e.year),e.duration&&"—"!==e.duration&&s.push(e.duration),s.push("HD"),t=s.join("  ·  ")}if(G.appendChild(n("div","detail-meta",t)),I(e)){var d=0,c=/S(\d+)/i.exec(e.alias||"")||/T(\d+)/i.exec(e.title||"");if(c&&(d=parseInt(c[1],10)||0),!d&&e.seasons&&e.seasons.length){var p=e.seasons[ke.detailSeason]||e.seasons[0];d=p&&p.number||1}d||(d=1);var f=e.updateCount||e.volumeCount||(e.episodes?e.episodes.length:0);f&&G.appendChild(n("div","detail-update","T"+d+" - E"+f))}var v=n("div","detail-genres");v.appendChild(n("span","label","Género : "));for(var h=0;h<e.genres.length;h++){var m=n("div","chip focusable",e.genres[h]);m._activate=function(){},m._onFocus=resetY,v.appendChild(m)}G.appendChild(v);var g=n("div","detail-row");g.appendChild(document.createTextNode("Director : "));var y=n("span","val focusable",e.director);y._activate=function(){},y._onFocus=resetY,g.appendChild(y),G.appendChild(g);var b=n("div","detail-row");b.appendChild(document.createTextNode("Actors : "));var C=n("span","val focusable",e.actors);C._activate=function(){},C._onFocus=resetY,b.appendChild(C),G.appendChild(b);var w=n("div","detail-synopsis");w.appendChild(n("span","label","Sinopsis : ")),w.appendChild(n("div","text",e.synopsis));var S=n("div","detail-more focusable","Más");S._activate=Dt,S._onFocus=resetY,w.appendChild(S),G.appendChild(w),o(J),J.classList.add("focusable"),J._onFocus=resetY,J._activate=function(){vn(e,ke.detailEpisode)},J._onMove=function(){return!1};var histItem=null,hList=getXuperHistory();for(var h=0;h<hList.length;h++){if(String(hList[h].id)===String(e.id)){histItem=hList[h];break;}}var x=[];if(histItem&&histItem.position>15){x.push({icon:"icon_detail_fullscreen.png",label:"Reanudar ("+formatTimeProgress(histItem.position)+")",kind:"resume",position:histItem.position,episodeId:histItem.episodeId});}x.push({icon:"icon_detail_fullscreen.png",label:"Pantalla completa",kind:"fullscreen"});x.push({icon:"icon_detail_subtitle_audio.png",label:"Idioma",kind:"language"});x.push({icon:"icon_detail_quality.png",label:"Resolución",kind:"quality"});x.push({icon:"icon_detail_favorite.png",label:isXuperFavorite(e.id)?"En favoritos":"Favorito",kind:"favorite",isSelected:isXuperFavorite(e.id)});if(I(e)){x.push({icon:"icon_detail_subscribe.png",label:"Notificaciones",kind:"subscribe"});}for(var _=0;_<x.length;_++){var L=n("div","detail-btn focusable"+("resume"===x[_].kind?" is-resume":"")+(x[_].isSelected?" is-selected":"")),k=n("img");k.src="media/ui/vod/"+x[_].icon;k.alt="";L.appendChild(k);L.appendChild(n("span",null,x[_].label));L._kind=x[_].kind;L._btnData=x[_];L._activate=(function(btnInfo,targetItem){return function(){if("resume"===btnInfo.kind){if(btnInfo.episodeId&&targetItem.episodes){for(var epIdx=0;epIdx<targetItem.episodes.length;epIdx++){if(String(targetItem.episodes[epIdx].id)===String(btnInfo.episodeId)){ke.detailEpisode=targetItem.episodes[epIdx];break;}}}window.__resumeStartTime=btnInfo.position||0;window.__simulatedCurrentTime=btnInfo.position||0;vn(targetItem,ke.detailEpisode);}else if("fullscreen"===btnInfo.kind){window.__resumeStartTime=0;window.__simulatedCurrentTime=0;vn(targetItem,ke.detailEpisode);}else if("language"===btnInfo.kind){Ba(targetItem);}else if("favorite"===btnInfo.kind){var fav=toggleXuperFavorite(targetItem);this.classList.toggle("is-selected",fav);var sp=this.querySelector("span");if(sp)sp.textContent=fav?"En favoritos":"Favorito";cn("");showPlayerToast(fav?"⭐ Añadido a favoritos":"Eliminado de favoritos");}else if("subscribe"===btnInfo.kind){var imgEl=this.querySelector("img"),isSub=-1===imgEl.src.indexOf("subscribed");imgEl.src="media/ui/vod/icon_detail_"+(isSub?"subscribed":"subscribe")+".png";}};})(x[_],e);L._onFocus=resetY;L._onMove=(function(idx,isSeries){return function(dir){if("right"===dir){if(K&&idx<K.children.length-1){Fe(K.children[idx+1]);return!0;}return!0;}if("left"===dir){if(K&&idx>0){Fe(K.children[idx-1]);return!0;}return!0;}if("down"===dir){if(isSeries){var s=Y?Y.querySelector(".detail-season"):null;if(s){Fe(s);return!0;}var ep=Y?Y.querySelector(".detail-episode"):null;if(ep){Fe(ep);return!0;}}var c=Y?Y.querySelector(".cell .poster"):null;if(c){Fe(c);return!0;}return!0;}if("up"===dir&&J){Fe(J);return!0;}return!1;};})(_,I(e));K.appendChild(L);}!function(e){var t=I(e)&&e.episodes?e.episodes:[],i=t.length>0,a=Nt(t.length);ke.detailRange>=a.length&&(ke.detailRange=0);if(I(e)){var r=n("div","detail-season focusable");l(r,80,42,280,53),r.appendChild(n("span","season-text",function(e){var t=0;if(e.seasons&&e.seasons.length>0){var i=e.seasons[ke.detailSeason]||e.seasons[0];t=i&&i.number?i.number:ke.detailSeason+1}if(!t){var a=/S(\d+)/i.exec(e.alias||"")||/T(\d+)/i.exec(e.title||"");a&&(t=parseInt(a[1],10)||0)}return"Temporada "+(t||1)}(e)));var o=n("img","season-arrow");o.src="media/ui/vod/ic_down_icon.png",o.alt="▼",r.appendChild(o),r._onFocus=resetY,r._onMove=function(dir){if("up"===dir){if(K&&K.children.length){Fe(K.children[0]);return!0}}if("down"===dir){var ep=Y?Y.querySelector(".detail-episode"):null;if(ep){Fe(ep);return!0}var c=Y?Y.querySelector(".cell .poster"):null;if(c){Fe(c);return!0}return!0}if("right"===dir){var rng=Y?Y.querySelector(".detail-range"):null;if(rng){Fe(rng);return!0}var ep2=Y?Y.querySelector(".detail-episode"):null;if(ep2){Fe(ep2);return!0}}return!1},r._activate=function(){!e.seasons||e.seasons.length<2||function(e,t){if(Ut)return void Ft();if(!t.seasons||t.seasons.length<2)return;var i=e.querySelector(".season-arrow");i&&i.classList.add("is-open");l(Ut=n("div","season-popup"),80,100,280,Math.min(320,54*t.seasons.length));for(var a=0;a<t.seasons.length;a++)(function(e){var i=t.seasons[e],a=n("div","season-popup-item focusable"+(e===ke.detailSeason?" is-selected":"")),r="Temporada "+(i.number||e+1);a.appendChild(n("span","season-item-text",r));var o=n("img","season-item-check");o.src="media/ui/vod/icon_nation_selected.png",o.alt="",a.appendChild(o),a._activate=function(){if(Ft(),ke.detailSeason!==e){ke.detailSeason=e,ke.detailRange=0,ke.detailEpisode=null;var i=t.seasons[e];i&&i.id&&(cn("Cargando temporada…"),D("detail",{contentId:i.id},function(e,a){cn("");!e&&a&&!1!==a.returnValue&&(a.item&&B(t,a.item),t.episodes=a.episodes||[],t.seasonId=i.id,ke.detailEpisode=t.episodes[0]||null),Pt(t),ke.detailEpisode&&fn(t,ke.detailEpisode);var n=Y?Y.querySelector(".detail-season"):null;n&&Fe(n)}))}else{var a=Y?Y.querySelector(".detail-season"):null;a&&Fe(a)}},Ut.appendChild(a)})(a);Y.appendChild(Ut);var r=Ut.children[ke.detailSeason]||Ut.children[0];r&&Fe(r)}(r,e)},Y.appendChild(r)}if(i&&t.length>20){var s=n("div","detail-ranges scrollable");l(s,398,51,1522,46);s.style.overflowX="auto";s.style.overflowY="hidden";s.style.whiteSpace="nowrap";for(var d=0;d<a.length;d++)(function(tIdx){var i=n("div","detail-range focusable"+(tIdx===ke.detailRange?" is-selected":""),a[tIdx].start+1+"-"+a[tIdx].end);l(i,160*tIdx,0,150,46);i._rangeIdx=tIdx;i._onFocus=function(){resetY(),s.scrollLeft=Math.max(0,160*tIdx-480)};i._activate=function(){Rt(tIdx,e)};i._onMove=function(dir){if("left"===dir){if(tIdx>0){var prev=s.children[tIdx-1];if(prev){Fe(prev);return!0}}else{var sn=Y?Y.querySelector(".detail-season"):null;if(sn){Fe(sn);return!0}}return!0}if("right"===dir){if(tIdx<a.length-1){var next=s.children[tIdx+1];if(next){Fe(next);return!0}}return!0}if("up"===dir&&K&&K.children.length){Fe(K.children[0]);return!0}if("down"===dir){var ep=Y?Y.querySelector(".detail-episode"):null;if(ep){Fe(ep);return!0}return!0}return!1};s.appendChild(i)})(d);Y.appendChild(s);setTimeout(function(){s.scrollLeft=Math.max(0,160*ke.detailRange-480)},0)}if(i){var c=a[ke.detailRange]||{start:0,end:t.length},p=n("div","detail-episodes scrollable"),epCount=c.end-c.start;l(p,80,149,1840,65);p.style.overflowX="auto";p.style.overflowY="hidden";p.style.whiteSpace="nowrap";for(var f=c.start;f<c.end;f++)(function(epObj,localIdx,globalIdx){var epEl=n("div","detail-episode focusable"+(ke.detailEpisode&&(ke.detailEpisode.id===epObj.id||ke.detailEpisode===epObj)?" is-playing":""));l(epEl,160*localIdx,0,150,65);var numText=void 0!==epObj.number&&null!==epObj.number?String(epObj.number):String(globalIdx+1);epEl.appendChild(n("span","ep-num",numText));epEl._ep=epObj;epEl._onFocus=function(){resetY(),p.scrollLeft=Math.max(0,160*localIdx-480)};epEl._onMove=function(dir){if("left"===dir){if(localIdx>0){var prev=p.children[localIdx-1];if(prev){Fe(prev);return!0}}else if(ke.detailRange>0){ke.detailRange--;Pt(e);var prevEpisodes=Y?Y.querySelectorAll(".detail-episode"):null;if(prevEpisodes&&prevEpisodes.length){Fe(prevEpisodes[prevEpisodes.length-1])}return!0}return!0}if("right"===dir){if(localIdx<epCount-1){var next=p.children[localIdx+1];if(next){Fe(next);return!0}}else if(ke.detailRange<a.length-1){ke.detailRange++;Pt(e);var nextEpisodes=Y?Y.querySelectorAll(".detail-episode"):null;if(nextEpisodes&&nextEpisodes.length){Fe(nextEpisodes[0])}return!0}return!0}if("up"===dir){var rng=Y?Y.querySelector(".detail-range.is-selected")||Y.querySelector(".detail-range"):null;if(rng){Fe(rng);return!0}var sBtn=Y?Y.querySelector(".detail-season"):null;if(sBtn){Fe(sBtn);return!0}if(K&&K.children.length){Fe(K.children[0]);return!0}return!0}if("down"===dir){var card=Y?Y.querySelector(".cell .poster"):null;if(card){Fe(card);return!0}return!0}return!1};epEl._activate=function(){Pa(e,epObj)};p.appendChild(epEl)})(t[f],f-c.start,f);Y.appendChild(p);setTimeout(function(){p.scrollLeft=0},0)}var hasSeason=I(e);var v=i?240:(hasSeason?120:25),h=i?290:(hasSeason?170:91),m=n("div","detail-related","Quizás te guste");l(m,80,v,400,44),Y.appendChild(m);var relScroll=i||hasSeason?Math.max(0,v-22):0;var g=n("div","detail-grid scrollable");l(g,62,h-24,1786,356);var relPool=dailyRotatePool(qt(hasSeason?"serie":"pelicula"),"rel_"+String(e.id||e.title||""));var addedRel=0;for(var w=0;w<relPool.length&&addedRel<8;w++){var S=relPool[w];if(S&&String(S.id)!==String(e.id)){var x=n("div","cell"),pCard=et(S,0,0,210,308,{gold:!0});pCard._onFocus=function(){Y&&(Y.scrollTop=relScroll)};pCard._onMove=(function(cIdx){return function(dir){if("left"===dir){if(cIdx>0){var prevCard=g.children[cIdx-1]&&g.children[cIdx-1].querySelector(".poster");prevCard&&Fe(prevCard)}return!0}if("right"===dir){if(cIdx<g.children.length-1){var nextCard=g.children[cIdx+1]&&g.children[cIdx+1].querySelector(".poster");nextCard&&Fe(nextCard)}return!0}if("up"===dir){var epUp=Y?(Y.querySelector(".detail-episode.is-playing")||Y.querySelector(".detail-episode")):null;if(epUp){Fe(epUp);return!0}var snUp=Y?Y.querySelector(".detail-season"):null;if(snUp){Fe(snUp);return!0}if(K&&K.children.length){Fe(K.children[0]);return!0}return!0}return"down"===dir}})(addedRel);x.appendChild(pCard),g.appendChild(x);addedRel++}}Y.appendChild(g);if(i||hasSeason){var sp=n("div","detail-spacer");l(sp,0,h-24+356,10,80),Y.appendChild(sp)}}(e)}function Nt(e){for(var t=[],i=0;i<e;i+=20)t.push({start:i,end:Math.min(e,i+20)});return t}function Rt(e,t){ke.detailRange=e,Pt(t);var i=Y.querySelector(".detail-range.is-selected");i&&Fe(i)}var Ut=null;function Ft(){Ut&&Ut.parentNode&&(Ut.parentNode.removeChild(Ut),Ut=null);var e=Y?Y.querySelector(".season-arrow"):null;e&&e.classList.remove("is-open")}function Bt(){Z=r("search-keyboard"),ee=r("search-hot"),te=r("search-results"),ie=r("search-empty"),ae=r("search-hot-grid"),ne=r("search-result-grid"),o(Z),o(ae),o(ne),(re=n("div","kb-edit focusable"))._activate=function(){ejecutarBusqueda();},Z.appendChild(re);for(var e=n("div","kb-actions"),t=[{cls:"switch",w:100.5},{cls:"clear",w:100.5},{cls:"del",w:100.5},{cls:"go",w:120}],i=0;i<t.length;i++){var a=n("div","kb-action focusable "+t[i].cls);a.style.width=t[i].w+"px","go"===t[i].cls?a.textContent="Busca":a.appendChild(n("div","ico")),a._kind=t[i].cls,a._activate=function(k){return function(){if("switch"===k)Qt();else if("clear"===k)Wt();else if("del"===k){var q=(ke.searchQuery||"").slice(0,-1);ke.searchQuery=q;Vt();if(!q)Wt();}else{ejecutarBusqueda();}}}(t[i].cls),e.appendChild(a)}Z.appendChild(e),qe=[];for(var l=[["A","Á","B","C","D","E","É"],["F","G","H","I","Í","J","K"],["L","M","N","Ñ","O","Ó","P"],["Q","R","S","T","U","Ú","Ü"],["V","W","X","Y","Z"," "]],s=0;s<l.length;s++){var d=n("div","kb-row");d.style.top=264+88.5*s+"px";for(var c=0;c<l[s].length;c++){var p=n("div","kb-key focusable"+(" "===l[s][c]?" space":"")," "===l[s][c]?"":l[s][c]);p._char=l[s][c],p._activate=function(e){return function(){jt(ke.searchQuery+e)}}(l[s][c]),d.appendChild(p),qe.push(p)}Z.appendChild(d)}var uBtn=n("div","kb-feedback focusable","Feedback");uBtn._activate=function(){},Z.appendChild(uBtn);var f=dailyRotatePool(qt("destacado"),"hot_search").slice(0,10);f.length||(f=q("busqueda",10,0));ae.scrollTop=0;ae.style.minHeight="";for(var v=0;v<f.length;v++)ae.appendChild(Ht(f[v],v));if(f.length){var hotRows=Math.ceil(f.length/4);var hotSpacer=n("div","search-spacer");hotSpacer.style.position="absolute";hotSpacer.style.left="0px";hotSpacer.style.top=(hotRows*446)+"px";hotSpacer.style.width="100%";hotSpacer.style.height="60px";hotSpacer.style.pointerEvents="none";ae.appendChild(hotSpacer);}te.classList.remove("is-active"),ie.classList.remove("is-active"),ee.classList.remove("is-hidden"),Vt()}function normStr(s){if(!s)return"";try{return String(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/ñ/g,"n").trim();}catch(e){return String(s).toLowerCase().trim();}}
function stripStr(s){return normStr(s).replace(/[^a-z0-9]/g,"");}
function searchCatalogAndChannels(rawQuery){
  var q=normStr(rawQuery);
  var qStrip=stripStr(rawQuery);
  if(!q&&!qStrip)return[];
  var tokens=q.split(/\s+/).filter(Boolean);
  var results=[],seen={};
  for(var a=0;a<u.length;a++){
    var item=u[a];
    if(!item)continue;
    var id=String(item.id||a);
    var tN=normStr(item.title||item.name||"");
    var aN=normStr(item.alias||"");
    var actN=normStr(item.actors||"");
    var dirN=normStr(item.director||"");
    var genN=normStr(Array.isArray(item.genres)?item.genres.join(" "):(item.genres||""));
    var catN=normStr(item.category||"");
    var rowN=normStr(item.row||"");
    var synN=normStr(item.synopsis||"");
    var tStrip=stripStr(item.title||item.name||"");
    var aStrip=stripStr(item.alias||"");
    var score=0;
    if(tN===q||(qStrip.length>2&&tStrip===qStrip))score+=1000;
    else if(tN.indexOf(q)===0||(qStrip.length>2&&tStrip.indexOf(qStrip)===0))score+=500;
    else if(tN.indexOf(q)!==-1||(qStrip.length>2&&tStrip.indexOf(qStrip)!==-1))score+=300;
    else if(aN.indexOf(q)!==-1||(qStrip.length>2&&aStrip.indexOf(qStrip)!==-1))score+=200;
    else if(actN.indexOf(q)!==-1)score+=150;
    else if(dirN.indexOf(q)!==-1)score+=130;
    else if(genN.indexOf(q)!==-1)score+=110;
    else if(catN.indexOf(q)!==-1||rowN.indexOf(q)!==-1)score+=90;
    else if(synN.indexOf(q)!==-1)score+=50;
    if(tokens.length>1){
      var allMatch=!0;
      var full=tN+" "+aN+" "+actN+" "+dirN+" "+genN+" "+catN+" "+rowN;
      for(var k=0;k<tokens.length;k++){
        if(full.indexOf(tokens[k])===-1){allMatch=!1;break;}
      }
      if(allMatch&&score===0)score+=160;
    }
    if(score>0&&!seen[id]){
      seen[id]=!0;
      results.push({item:item,score:score});
    }
  }
  if(typeof z!=="undefined"&&Array.isArray(z)){
    for(var chIdx=0;chIdx<z.length;chIdx++){
      var ch=z[chIdx];
      if(!ch||!ch.name)continue;
      var chN=normStr(ch.name);
      var chStrip=stripStr(ch.name);
      var chScore=0;
      if(chN===q||(qStrip.length>2&&chStrip===qStrip))chScore+=400;
      else if(chN.indexOf(q)===0||(qStrip.length>2&&chStrip.indexOf(qStrip)===0))chScore+=250;
      else if(chN.indexOf(q)!==-1||(qStrip.length>2&&chStrip.indexOf(qStrip)!==-1))chScore+=180;
      if(chScore>0){
        var chId="ch_"+chIdx;
        if(!seen[chId]){
          seen[chId]=!0;
          results.push({
            item:{
              id:chId,
              title:ch.name,
              name:ch.name,
              poster:ch.logo||"",
              logo:ch.logo||"",
              score:ch.uhd?"4K":"HD",
              year:"TV",
              isChannel:!0,
              _channel:chIdx
            },
            score:chScore
          });
        }
      }
    }
  }
  results.sort(function(a,b){return b.score-a.score;});
  return results.map(function(r){return r.item;});
}
function Ht(e,t){
  var col = t % 4;
  var row = Math.floor(t / 4);
  var i = n("div", "search-cell");
  l(i, col * 316, row * 446, 290, 420);
  var card = et(e, 0, 0, 290, 420, { gold: !0 });
  if (e.isChannel) {
    card._activate = function() {
      St(e._channel, !0);
      hn("live");
    };
  }
  i.appendChild(card);
  return i;
}
function showSearchPreloader(msg) {
  var pl = r("search-preloader");
  if (pl) {
    var txt = pl.querySelector(".sp-text");
    if (txt) txt.textContent = msg || "Buscando en el catálogo...";
    pl.classList.add("is-visible");
  }
}

function hideSearchPreloader() {
  var pl = r("search-preloader");
  if (pl) {
    pl.classList.remove("is-visible");
  }
}

function zt(){
  ze("search");
  Z || Bt();
  hideSearchPreloader();
  if (ae) {
    var hotImgs = ae.querySelectorAll("img.p-img");
    for (var hi = 0; hi < hotImgs.length; hi++) {
      var hEl = hotImgs[hi];
      if (hEl && hEl._realSrc && !hEl._loaded) {
        enqueueCatalogImg(hEl, hEl._realSrc, false);
      }
    }
  }
  Fe(re);
}

function Vt(){
  re && (ke.searchQuery ? (re.textContent = ke.searchQuery, re.classList.remove("is-placeholder")) : (re.textContent = "Buscar películas, series, directores y actores.", re.classList.add("is-placeholder")));
}

function jt(e){
  ke.searchQuery = e;
  Vt();
}

function scoreSearchMatch(item, qNorm, qStrip) {
  if (!item) return 0;
  var tN = normStr(item.title || item.name || "");
  var tStrip = stripStr(item.title || item.name || "");
  var aN = normStr(item.alias || "");
  var aStrip = stripStr(item.alias || "");
  var s = 0;
  if (tN === qNorm || (qStrip.length > 1 && tStrip === qStrip)) {
    s += 10000;
  } else if (tN.indexOf(qNorm) === 0 || (qStrip.length > 1 && tStrip.indexOf(qStrip) === 0)) {
    s += 5000;
  } else if (tN.indexOf(qNorm) !== -1 || (qStrip.length > 1 && tStrip.indexOf(qStrip) !== -1)) {
    s += 2500;
  } else if (aN.indexOf(qNorm) !== -1 || (qStrip.length > 1 && aStrip.indexOf(qStrip) !== -1)) {
    s += 1500;
  } else {
    var full = tN + " " + aN + " " + normStr(item.actors || "") + " " + normStr(item.director || "") + " " + normStr(item.synopsis || "");
    if (full.indexOf(qNorm) !== -1) s += 500;
  }
  if (item._portal || item.portal) s += 400;
  return s;
}

function Wt(){
  ke.searchTimer && (clearTimeout(ke.searchTimer), ke.searchTimer = null);
  ke.searchQuery = "";
  ke.hasRemoteSearch = false;
  Vt();
  hideSearchPreloader();
  ne && o(ne);
  te && te.classList.remove("is-active");
  ie && ie.classList.remove("is-active");
  ee && ee.classList.remove("is-hidden");
  var c = r("search-result-total");
  if (c) c.innerHTML = "Total: <span>0</span>";
}

function ejecutarBusqueda() {
  var raw = (ke.searchQuery || "").trim();
  if (!raw) {
    Wt();
    return;
  }

  showSearchPreloader("Buscando «" + raw + "»...");
  ee && ee.classList.add("is-hidden");
  te && te.classList.add("is-active");
  ie && ie.classList.remove("is-active");
  ne && o(ne);
  var countEl = r("search-result-total");
  if (countEl) countEl.innerHTML = "Buscando...";

  var oSeq = ++ke.searchSeq;
  var localResults = searchCatalogAndChannels(raw);

  if ("portal" === h.mode) {
    D("search", { value: raw }, function(err, resp) {
      if (oSeq !== ke.searchSeq) return;
      hideSearchPreloader();
      var seen = {}, combined = [];
      if (!err && resp && !1 !== resp.returnValue && resp.items && resp.items.length) {
        for (var l = 0; l < resp.items.length; l++) {
          var s = T(resp.items[l], combined.length + 1);
          if (s && !seen[String(s.id)]) {
            seen[String(s.id)] = true;
            combined.push(s);
          }
        }
      }
      for (var rIdx = 0; rIdx < localResults.length; rIdx++) {
        var loc = localResults[rIdx];
        if (loc && !seen[String(loc.id)]) {
          seen[String(loc.id)] = true;
          combined.push(loc);
        }
      }
      var qNorm = normStr(raw), qStrip = stripStr(raw);
      combined.sort(function(a, b) {
        return scoreSearchMatch(b, qNorm, qStrip) - scoreSearchMatch(a, qNorm, qStrip);
      });
      Xt(combined);
      if (combined.length > 0) {
        var first = Be(ne);
        if (first) Fe(first);
      }
    });
  } else {
    hideSearchPreloader();
    var qNorm = normStr(raw), qStrip = stripStr(raw);
    localResults.sort(function(a, b) {
      return scoreSearchMatch(b, qNorm, qStrip) - scoreSearchMatch(a, qNorm, qStrip);
    });
    Xt(localResults);
    if (localResults.length > 0) {
      var first = Be(ne);
      if (first) Fe(first);
    }
  }
}

/* =============================================================================
   CATALOG FILTER SYSTEM (v2.0.16)
   - 6 posters per row (1800px width / 6 cols = 280px cards + 24px gap)
   - 2026 year added to Año options
   - Expanded genres with complete Spanish & English keyword coverage
   - Multi-criteria filtering (Tipo, Género, Año, Audio, Ordenar)
   - Smooth carousel pill scroll with auto-centering
   - Loading screen overlay on filter change
   - Progressive pagination / waves of posters on navigation & scroll
   ============================================================================= */
var filterState = {
  type: "all",
  genre: "all",
  year: "all",
  audio: "all",
  order: "rel"
};
var filterCells = [];
var filterInitialized = false;
var filterCurrentList = [];
var filterRenderedCount = 0;
var filterLoadingTimer = null;
var FILTER_PAGE_SIZE = 24; // 4 filas de 6 posters por ola

var FILTER_CONFIG = {
  type: [
    { id: "all", name: "Todos" },
    { id: "movie", name: "Películas" },
    { id: "series", name: "Series" },
    { id: "anime", name: "Anime" },
    { id: "kids", name: "Infantil / Kids" }
  ],
  genre: [
    { id: "all", name: "Todos" },
    { id: "accion", name: "Acción" },
    { id: "aventura", name: "Aventura" },
    { id: "animacion", name: "Animación" },
    { id: "comedia", name: "Comedia" },
    { id: "crimen", name: "Crimen / Policial" },
    { id: "documental", name: "Documental" },
    { id: "drama", name: "Drama" },
    { id: "familiar", name: "Familiar" },
    { id: "fantasia", name: "Fantasía" },
    { id: "historia", name: "Historia" },
    { id: "terror", name: "Terror" },
    { id: "musica", name: "Música" },
    { id: "misterio", name: "Misterio" },
    { id: "romance", name: "Romance" },
    { id: "scifi", name: "Ciencia Ficción" },
    { id: "suspenso", name: "Suspenso / Thriller" },
    { id: "guerra", name: "Bélica / Guerra" },
    { id: "western", name: "Western" }
  ],
  year: [
    { id: "all", name: "Todos" },
    { id: "2026", name: "2026" },
    { id: "2025", name: "2025" },
    { id: "2024", name: "2024" },
    { id: "2023", name: "2023" },
    { id: "2022", name: "2022" },
    { id: "2021", name: "2021" },
    { id: "2020", name: "2020" },
    { id: "2010s", name: "2010 - 2019" },
    { id: "2000s", name: "2000 - 2009" },
    { id: "clasicos", name: "Clásicos (< 2000)" }
  ],
  audio: [
    { id: "all", name: "Todos" },
    { id: "lat", name: "Español Latino" },
    { id: "esp", name: "Español España" },
    { id: "eng", name: "Inglés" },
    { id: "por", name: "Portugués" }
  ],
  order: [
    { id: "rel", name: "Relevantes" },
    { id: "recent", name: "Más recientes" },
    { id: "rating", name: "Mejor valorados" },
    { id: "title", name: "Título (A - Z)" }
  ]
};

function openFilterScreen(){
  if(!u || u.length <= 40){
    if(window.XUPERTV_PORTAL && window.XUPERTV_PORTAL.items && window.XUPERTV_PORTAL.items.length){
      R();
    }
  }
  ke.filterReturn = { screen: ke.screen, focus: ke.focus };
  initFilterScreen();
  ze("filter");
  var firstPill = document.querySelector("#filter-pills-type .filter-pill");
  if(firstPill) Fe(firstPill);
}

function closeFilterScreen(){
  var retScreen = (ke.filterReturn && ke.filterReturn.screen) || "home";
  var retFocus = ke.filterReturn && ke.filterReturn.focus;
  ze(retScreen);
  if(retFocus && Ne(retFocus)){
    Fe(retFocus);
  } else {
    var fBtn = document.querySelector(".notify-item.filter");
    if(fBtn && Ne(fBtn)) Fe(fBtn);
    else if(Ee[ke.tab]) Fe(Ee[ke.tab]);
  }
}

function initFilterScreen(){
  if(filterInitialized){
    applyCatalogFilters();
    return;
  }
  filterInitialized = true;

  var resetBtn = document.getElementById("filter-btn-reset");
  if(resetBtn){
    resetBtn._activate = function(){
      filterState = { type: "all", genre: "all", year: "all", audio: "all", order: "rel" };
      updateFilterPillSelection();
      var rKeys = ["type", "genre", "year", "audio", "order"];
      rKeys.forEach(function(rk){
        var cont = document.getElementById("filter-pills-" + rk);
        if(cont) cont.scrollLeft = 0;
      });
      applyCatalogFilters();
    };
    resetBtn._onMove = function(dir){
      if("down" === dir){
        var p = document.querySelector("#filter-pills-type .filter-pill.is-selected") || document.querySelector("#filter-pills-type .filter-pill");
        if(p){ Fe(p); return true; }
      }
      return false;
    };
  }

  var rowKeys = ["type", "genre", "year", "audio", "order"];
  rowKeys.forEach(function(rowKey, rowIndex){
    var container = document.getElementById("filter-pills-" + rowKey);
    if(!container) return;
    o(container);
    var options = FILTER_CONFIG[rowKey] || [];
    var pillEls = [];
    options.forEach(function(opt, optIndex){
      var btn = n("button", "filter-pill focusable", opt.name);
      btn.dataset.key = rowKey;
      btn.dataset.val = opt.id;
      if(filterState[rowKey] === opt.id) btn.classList.add("is-selected");

      btn._activate = function(){
        if(filterState[rowKey] === opt.id) return;
        filterState[rowKey] = opt.id;
        for(var k = 0; k < pillEls.length; k++){
          pillEls[k].classList.toggle("is-selected", pillEls[k].dataset.val === opt.id);
        }
        applyCatalogFilters();
      };

      btn._onMove = function(dir){
        if("left" === dir){
          if(optIndex > 0 && pillEls[optIndex - 1]){
            Fe(pillEls[optIndex - 1]);
            scrollPillIntoView(container, pillEls[optIndex - 1]);
            return true;
          }
          return true;
        }
        if("right" === dir){
          if(optIndex < pillEls.length - 1 && pillEls[optIndex + 1]){
            Fe(pillEls[optIndex + 1]);
            scrollPillIntoView(container, pillEls[optIndex + 1]);
            return true;
          }
          return true;
        }
        if("up" === dir){
          if(rowIndex > 0){
            var prevKey = rowKeys[rowIndex - 1];
            var target = document.querySelector("#filter-pills-" + prevKey + " .filter-pill.is-selected") || document.querySelector("#filter-pills-" + prevKey + " .filter-pill");
            if(target){
              Fe(target);
              var prevCont = document.getElementById("filter-pills-" + prevKey);
              scrollPillIntoView(prevCont, target);
              return true;
            }
          } else {
            if(resetBtn){ Fe(resetBtn); return true; }
          }
          return true;
        }
        if("down" === dir){
          if(rowIndex < rowKeys.length - 1){
            var nextKey = rowKeys[rowIndex + 1];
            var target = document.querySelector("#filter-pills-" + nextKey + " .filter-pill.is-selected") || document.querySelector("#filter-pills-" + nextKey + " .filter-pill");
            if(target){
              Fe(target);
              var nextCont = document.getElementById("filter-pills-" + nextKey);
              scrollPillIntoView(nextCont, target);
              return true;
            }
          } else {
            if(filterCells && filterCells.length){
              var targetCol = Math.min(optIndex, 5);
              var targetCard = (filterCells[targetCol] && filterCells[targetCol].querySelector(".poster")) || (filterCells[0] && filterCells[0].querySelector(".poster"));
              if(targetCard){
                Fe(targetCard);
                scrollFilterCellIntoView(filterCells[targetCol] || filterCells[0]);
                return true;
              }
            }
          }
          return true;
        }
        return false;
      };

      container.appendChild(btn);
      pillEls.push(btn);
    });
  });

  var resCont = document.getElementById("filter-results-container");
  if(resCont && !resCont._scrollBound){
    resCont._scrollBound = true;
    resCont.addEventListener("scroll", function(){
      if(filterRenderedCount < filterCurrentList.length){
        if(resCont.scrollTop + resCont.clientHeight >= resCont.scrollHeight - 600){
          renderFilterWave();
        }
      }
    });
  }

  applyCatalogFilters();
}

function updateFilterPillSelection(){
  var rowKeys = ["type", "genre", "year", "audio", "order"];
  rowKeys.forEach(function(rowKey){
    var container = document.getElementById("filter-pills-" + rowKey);
    if(!container) return;
    var pills = container.querySelectorAll(".filter-pill");
    for(var i = 0; i < pills.length; i++){
      var isSel = (pills[i].dataset.val === filterState[rowKey]);
      pills[i].classList.toggle("is-selected", isSel);
      if(isSel) scrollPillIntoView(container, pills[i]);
    }
  });
}

function scrollPillIntoView(container, pill){
  if(!container || !pill) return;
  var cWidth = container.clientWidth;
  var pLeft = pill.offsetLeft, pWidth = pill.offsetWidth;
  var targetScroll = pLeft - (cWidth / 2) + (pWidth / 2);
  if(targetScroll < 0) targetScroll = 0;
  if(container.scrollTo){
    try{
      container.scrollTo({ left: targetScroll, behavior: "smooth" });
      return;
    }catch(e){}
  }
  container.scrollLeft = targetScroll;
}

function applyCatalogFilters(){
  var grid = document.getElementById("filter-results-grid");
  var empty = document.getElementById("filter-empty");
  var countEl = document.getElementById("filter-count");
  var loadingEl = document.getElementById("filter-loading");
  if(!grid) return;

  if(loadingEl) loadingEl.style.display = "flex";
  if(empty) empty.style.display = "none";
  o(grid);
  grid.style.height = "0px";
  filterCells = [];
  filterCurrentList = [];
  filterRenderedCount = 0;

  if(filterLoadingTimer){
    clearTimeout(filterLoadingTimer);
    filterLoadingTimer = null;
  }

  filterLoadingTimer = setTimeout(function(){
    filterLoadingTimer = null;
    var sourcePool = (u && u.length > 40) ? u : (window.XUPERTV_PORTAL && window.XUPERTV_PORTAL.items && window.XUPERTV_PORTAL.items.length ? window.XUPERTV_PORTAL.items : (u || []));
    var items = sourcePool.map(function(it, idx){
      return (it && it._portal) ? it : T(it, idx + 1);
    });

    // 1. TIPO
    if(filterState.type !== "all"){
      items = items.filter(function(it){
        var gText = (Array.isArray(it.genres) ? it.genres.join(" ") : (it.genres || "")) + " " + (it.tags || "");
        var catText = (it.category || "") + " " + (it.row || "") + " " + (it.title || "");
        var isSer = I(it) || it.kind === "serie" || it.type === "teleplay" || it.category === "serie" || /serie|telenovela|season|temporada|\bT\d+\b/i.test(catText);
        var isAni = it.category === "anime" || /anime|animaci[oó]n|animation|cartoon/i.test(gText) || /anime/i.test(catText);
        var isKid = it.category === "infantil" || it.category === "kids" || /familiar|family|niñ[oa]s|kids|infantil/i.test(gText) || /infantil|kids|niñ[oa]s|mickey|paw patrol/i.test(catText);
        if(filterState.type === "movie") return !isSer && !isAni && !isKid;
        if(filterState.type === "series") return isSer && !isAni;
        if(filterState.type === "anime") return isAni;
        if(filterState.type === "kids") return isKid;
        return true;
      });
    }

    // 2. GÉNERO
    if(filterState.genre !== "all"){
      var genreMap = {
        accion: /acci[oó]n|action/i,
        aventura: /aventura|adventure|aventuras/i,
        animacion: /animaci[oó]n|animation|anime|dibujos|cartoon/i,
        comedia: /comedia|comedy/i,
        crimen: /crimen|crime|polic[ií]a|policial|detective/i,
        documental: /documental|documentary|docu/i,
        drama: /drama|dram[aá]tico/i,
        familiar: /familiar|family|familia|niñ[oa]s|kids|infantil/i,
        fantasia: /fantas[ií]a|fantasy|fant[aá]stico|fantastico/i,
        historia: /historia|history|hist[oó]ric[oa]|biograf[ií]a|biography/i,
        terror: /terror|horror|miedo/i,
        musica: /m[uú]sica|music|musical/i,
        misterio: /misterio|mystery/i,
        romance: /romance|romantic|rom[aá]ntic[oa]|romantico/i,
        scifi: /ciencia\s*ficci[oó]n|sci-fi|scifi|science\s*fiction/i,
        suspenso: /suspenso|suspense|thriller/i,
        guerra: /b[eé]lica|belica|guerra|war|militar/i,
        western: /western|oeste|vaqueros|occidental/i
      };
      var regex = genreMap[filterState.genre];
      if(regex){
        items = items.filter(function(it){
          var gStr = (Array.isArray(it.genres) ? it.genres.join(" ") : (it.genres || "")) + " " +
                     (it.tags || "") + " " +
                     (it.category || "") + " " +
                     (it.row || "") + " " +
                     (it.alias || "") + " " +
                     (it.synopsis || it.description || "") + " " +
                     (it.title || "");
          return regex.test(gStr);
        });
      }
    }

    // 3. AÑO (Soporta 2026, 2025, 2024, 2023, 2022...)
    if(filterState.year !== "all"){
      items = items.filter(function(it){
        var rawY = String(it.year || it.releaseDate || it.releaseTime || it.release_year || it.programYear || "");
        var m = rawY.match(/\b(19\d\d|20\d\d)\b/) ||
                String(it.row || "").match(/\b(19\d\d|20\d\d)\b/) ||
                String(it.title || "").match(/\b(19\d\d|20\d\d)\b/) ||
                String(it.alias || "").match(/\b(19\d\d|20\d\d)\b/);
        var y = m ? parseInt(m[1], 10) : (parseInt(rawY, 10) || 0);
        if(!y || y < 1900 || y > 2100){
          var s = String(it.id || it.title || "");
          var h = 0;
          for(var j = 0; j < s.length; j++) h = (h * 31 + s.charCodeAt(j)) & 0x7fffffff;
          y = 2020 + (h % 7);
        }
        if(filterState.year === "2010s") return y >= 2010 && y <= 2019;
        if(filterState.year === "2000s") return y >= 2000 && y <= 2009;
        if(filterState.year === "clasicos") return y > 0 && y < 2000;
        var targetY = parseInt(filterState.year, 10);
        return y === targetY;
      });
    }

    // 4. AUDIO / IDIOMA
    if(filterState.audio !== "all"){
      items = items.filter(function(it){
        var aStr = ((it.audio || "") + " " + (it.streamAudioInfo || "") + " " + (it.language || "") + " " + (it.dubLanguage || "") + " " + (it.country || "") + " " + (it.title || "") + " " + (it.synopsis || "")).toLowerCase();
        if(filterState.audio === "por"){
          return /portug|bra[sz]il|\bpt\b|pt[-_]?(br|pt)|dublado|legendado/i.test(aStr);
        } else if(filterState.audio === "lat"){
          if(!it.audio || /latino|es-419|\blat\b|español\s*\(latino\)|m[eé]xico|colombia|argentina|chile|per[uú]/i.test(aStr)) return true;
          return (/español|spanish/i.test(aStr) && !/españa|spain|castellano|es-es/i.test(aStr));
        } else if(filterState.audio === "esp"){
          return /españa|spain|castellano|es-es|español\s*\(españa\)/i.test(aStr);
        } else if(filterState.audio === "eng"){
          return /ingl[eé]s|english|\beng\b|\ben\b|estados\s*unidos|united\s*states|\busa\b|\buk\b/i.test(aStr);
        }
        return true;
      });
    }

    // 5. ORDENAR
    if(filterState.order === "recent"){
      items.sort(function(a, b){
        var yA = parseInt((String(a.year || a.releaseDate || "").match(/\b(19\d\d|20\d\d)\b/) || [0, 0])[1] || 0, 10);
        var yB = parseInt((String(b.year || b.releaseDate || "").match(/\b(19\d\d|20\d\d)\b/) || [0, 0])[1] || 0, 10);
        return yB - yA;
      });
    } else if(filterState.order === "rating"){
      items.sort(function(a, b){
        var sA = parseFloat(String(a.score || a.rating || 0).replace(",", ".")) || 0;
        var sB = parseFloat(String(b.score || b.rating || 0).replace(",", ".")) || 0;
        return sB - sA;
      });
    } else if(filterState.order === "title"){
      items.sort(function(a, b){
        return (a.title || a.name || "").localeCompare(b.title || b.name || "");
      });
    }

    filterCurrentList = items;
    if(countEl) countEl.textContent = items.length + (items.length === 1 ? " título" : " títulos");

    if(!items.length){
      if(loadingEl) loadingEl.style.display = "none";
      if(empty) empty.style.display = "flex";
      return;
    }
    if(empty) empty.style.display = "none";

    var COLS = 6;
    var cardHeight = 405, rowGap = 24;
    var totalRows = Math.ceil(items.length / COLS);
    grid.style.height = (totalRows * (cardHeight + rowGap)) + "px";

    // Carga primera ola de posters
    renderFilterWave();

    if(loadingEl) loadingEl.style.display = "none";
  }, 40);
}

function renderFilterWave(){
  var grid = document.getElementById("filter-results-grid");
  if(!grid || !filterCurrentList || !filterCurrentList.length) return;
  if(filterRenderedCount >= filterCurrentList.length) return;

  var COLS = 6;
  var cardWidth = 280, cardHeight = 405;
  var colGap = 24, rowGap = 24;
  var nextEnd = Math.min(filterRenderedCount + FILTER_PAGE_SIZE, filterCurrentList.length);

  for(var idx = filterRenderedCount; idx < nextEnd; idx++){
    (function(item, itemIndex){
      var col = itemIndex % COLS;
      var row = Math.floor(itemIndex / COLS);
      var cell = n("div", "filter-cell");
      l(cell, col * (cardWidth + colGap), row * (cardHeight + rowGap), cardWidth, cardHeight);

      var card = et(item, 0, 0, cardWidth, cardHeight, { gold: !0 });
      card._item = item;
      card._index = itemIndex;
      card._activate = function(){ At(item); };

      card._onMove = function(dir){
        if("left" === dir){
          if(col > 0 && filterCells[itemIndex - 1]){
            var prevPoster = filterCells[itemIndex - 1].querySelector(".poster");
            if(prevPoster){ Fe(prevPoster); scrollFilterCellIntoView(filterCells[itemIndex - 1]); return true; }
          }
          return true;
        }
        if("right" === dir){
          if(col < COLS - 1 && filterCells[itemIndex + 1]){
            var nextPoster = filterCells[itemIndex + 1].querySelector(".poster");
            if(nextPoster){ Fe(nextPoster); scrollFilterCellIntoView(filterCells[itemIndex + 1]); return true; }
          }
          return true;
        }
        if("up" === dir){
          if(row > 0 && filterCells[itemIndex - COLS]){
            var upPoster = filterCells[itemIndex - COLS].querySelector(".poster");
            if(upPoster){ Fe(upPoster); scrollFilterCellIntoView(filterCells[itemIndex - COLS]); return true; }
          } else {
            var orderPill = document.querySelector("#filter-pills-order .filter-pill.is-selected") || document.querySelector("#filter-pills-order .filter-pill");
            if(orderPill){ Fe(orderPill); return true; }
          }
          return true;
        }
        if("down" === dir){
          var targetIndex = itemIndex + COLS;
          if(targetIndex >= filterCells.length && filterCells.length < filterCurrentList.length){
            renderFilterWave();
          }
          if(filterCells[targetIndex]){
            var downPoster = filterCells[targetIndex].querySelector(".poster");
            if(downPoster){ Fe(downPoster); scrollFilterCellIntoView(filterCells[targetIndex]); return true; }
          }
          return true;
        }
        return false;
      };

      cell.appendChild(card);
      grid.appendChild(cell);
      filterCells.push(cell);
    })(filterCurrentList[idx], idx);
  }

  filterRenderedCount = nextEnd;
}

function scrollFilterCellIntoView(cell){
  if(!cell) return;
  var container = document.getElementById("filter-results-container");
  if(!container) return;
  var cTop = container.scrollTop, cHeight = container.clientHeight;
  var top = cell.offsetTop, height = cell.offsetHeight;
  if(top < cTop + 40){
    container.scrollTop = Math.max(0, top - 40);
  } else if(top + height > cTop + cHeight - 40){
    container.scrollTop = top + height - cHeight + 40;
  }
}

function $t(forceImmediate){
  ejecutarBusqueda();
}
function Xt(e){
  ee.classList.add("is-hidden"),te.classList.add("is-active"),o(ne);
  ne.scrollTop = 0;
  ne.style.minHeight = "";
  if(e && e.length > 20) e = e.slice(0, 20);
  var countEl=r("search-result-total");
  if(countEl)countEl.innerHTML="Total: <span>"+e.length+"</span>";
  if(0!==e.length){
    ie.classList.remove("is-active");
    var maxShow=Math.min(e.length,20);
    for(var t=0;t<maxShow;t++)ne.appendChild(Ht(T(e[t],t+1),t));
    var totalRows=Math.ceil(maxShow/4);
    var spacer=n("div","search-spacer");
    spacer.style.position="absolute";
    spacer.style.left="0px";
    spacer.style.top=(totalRows*446)+"px";
    spacer.style.width="100%";
    spacer.style.height="60px";
    spacer.style.pointerEvents="none";
    ne.appendChild(spacer);
    if("search"===ke.screen&&s(ke.focus,".search-hot")){
      var i=Be(ne);
      i&&Fe(i);
    }
  }else{
    ie.classList.add("is-active");
  }
}function Qt(){ke.searchNumeric=!ke.searchNumeric;var e=Z.querySelector(".kb-action.switch .ico");e&&(e.style.backgroundImage="url(media/ui/search/"+(ke.searchNumeric?"ic_vod_search_abc.png":"ic_vod_search_123.png")+")");var t=Z.querySelectorAll(".kb-row:not(.kb-row-num)");if(ke.searchNumeric){for(var i=0;i<t.length;i++)t[i].classList.add("hidden");if(!Z.querySelector(".kb-row-num"))for(var a=[["1","2","3","4","5","6","7"],["8","9","0"," "]],r=0;r<a.length;r++){var o=n("div","kb-row kb-row-num");o.style.top=264+88.5*r+"px";for(var l=0;l<a[r].length;l++){var s=n("div","kb-key focusable"+(" "===a[r][l]?" space":"")," "===a[r][l]?"":a[r][l]);s._activate=function(e){return function(){jt(ke.searchQuery+e)}}(a[r][l]),o.appendChild(s)}Z.appendChild(o)}for(var d=Z.querySelectorAll(".kb-row-num"),c=0;c<d.length;c++)d[c].classList.remove("hidden")}else{for(var p=0;p<t.length;p++)t[p].classList.remove("hidden");qe.forEach(function(e){e.classList.remove("hidden")});for(var u=Z.querySelectorAll(".kb-row-num"),f=0;f<u.length;f++)u[f].classList.add("hidden")}}function Gt(){oe=r("settings-menu"),le=r("settings-right"),o(oe),o(le),Ae=[];for(var e=0;e<Le.length;e++){var t=n("div","settings-item focusable",Le[e].label);t._index=e,t._onFocus=function(e){return function(){Kt(e,!1)}}(e),t._activate=function(e){return function(){Kt(e,!0)}}(e),t._onMove=function(e){if("right"===e){var t=Be(le.querySelector(".settings-panel.is-active"));return t&&Fe(t),!0}return!1},oe.appendChild(t),Ae.push(t)}Oe={};Oe.history=buildHistoryPanel();le.appendChild(Oe.history);for(var i in Oe.playback=function(){var e=function(e){var t=n("div","settings-panel");return t.appendChild(n("div","sp-title",e)),t}("Configuración global de reproducción");e.appendChild(n("div","sp-hr")),Yt(e,227,"Formato de pantalla",["Pantalla completa","Normal","16:9","4:3"],"screen",ke.playback.screen),Yt(e,374,"Audio",["Español Latino","Español España","Inglés","Portugués"],"audio",ke.playback.audio),e.appendChild(l(n("div","sp-hr"),0,536,1498,1)),e.appendChild(n("div","sp-subtitle-h","Subtitulos"));var t=n("div","sp-switch focusable "+(ke.playback.subtitle?"on":"off"));return t._activate=function(){ke.playback.subtitle=!ke.playback.subtitle,t.className="sp-switch focusable "+(ke.playback.subtitle?"on":"off"),Fe(t)},e.appendChild(t),Yt(e,682,"Idioma",["Español","Portugués","Inglés"],"subLang",ke.playback.subLang),Yt(e,803,"Tamaño",["Normal","Grande","Pequeño"],"size",ke.playback.size),function(e,t){var i=n("div","pb-row");i.style.top=t+"px",i.appendChild(n("div","pb-label","Estilo"));for(var a=["#ffffff","#f6e33f","#ffffff"],r=0;r<3;r++){var o=n("div","pb-opt focusable"+(r===ke.playback.style?" is-checked":""));o.style.marginLeft=(0===r?0:28)+"px",o.appendChild(n("div","radio"));var l=n("span",null,"Aa");l.style.color=a[r],2===r&&(l.style.background="#000000",l.style.display="inline-block",l.style.width="94px",l.style.height="50px",l.style.lineHeight="50px",l.style.fontSize="28px"),o.appendChild(l),o._group="style",o._index=r,o._activate=function(){ke.playback.style=this._index;for(var t=e.querySelectorAll(".pb-opt"),i=0;i<t.length;i++)"style"===t[i]._group&&t[i].classList.toggle("is-checked",t[i]._index===this._index)},i.appendChild(o)}e.appendChild(i)}(e,924),e}(),Oe.cr=function(){var e=n("div","settings-panel"),t=n("div","cr-head");t.appendChild(n("span","t","Contenido adulto"));var i=n("div","sw focusable "+(ke.crOn?"on":"off"));i._activate=function(){ke.crOn=!ke.crOn,i.className="sw focusable "+(ke.crOn?"on":"off"),Fe(i)},t.appendChild(i),e.appendChild(t),e.appendChild(n("div","cr-tip","(LIVE-18+，Explorar-Adult)"));var a=n("div","cr-btn focusable","Cambiar contraseña de control parental");return a._activate=function(){},e.appendChild(a),e.appendChild(n("div","cr-warn","Establecer contraseña para activar contenidos para adultos")),e}(),Oe.parent=function(){var e=n("div","settings-panel");e.appendChild(n("div","pl-title","Configuraciones del Control Parental")),e.appendChild(n("div","pl-tip","Ingrese la contraseña de cuatro dígitos e ingrese viendo el programa de bloqueo.")),e.appendChild(n("div","pl-label","Contraseña inicial:"));for(var t=n("div","pl-boxes"),i=0;i<4;i++){var a=n("div","pl-box focusable");a._activate=function(){},t.appendChild(a),i<3&&t.appendChild(n("div","pl-sep"))}e.appendChild(t),e.appendChild(n("div","pl-note",""));var r=n("div","pl-ok focusable","OK");return r._activate=function(){},e.appendChild(r),e}(),Oe.feedback=function(){var e=n("div","settings-panel");e.appendChild(n("div","fb-title","Ayuda, Actualizaciones y Comunidad")),e.appendChild(n("div","fb-hr")),e.appendChild(n("div","fb-contact","Si tienes problemas con la app, quieres recibir actualizaciones o deseas apoyar el proyecto, escanea los códigos QR:"));var grid=n("div","fb-cards-grid");var c1=n("div","fb-card yt-card focusable");c1.appendChild(n("div","fb-badge yt","CANAL OFICIAL · ACTUALIZACIONES"));c1.appendChild(n("div","fb-card-title","YouTube · EclexTv"));c1.appendChild(n("div","fb-card-desc","Si tienes problemas o quieres recibir actualizaciones de la app, sigue el canal oficial:"));var q1=n("div","fb-qr-box"),img1=n("img");img1.src="media/ui/settings/qr_youtube.png";img1.alt="QR YouTube";q1.appendChild(img1);c1.appendChild(q1);c1.appendChild(n("div","fb-url-pill yt","youtube.com/@eclex-m4f"));c1._activate=function(){showPlayerToast("YouTube: youtube.com/@eclex-m4f");};grid.appendChild(c1);var c2=n("div","fb-card kofi-card focusable");c2.appendChild(n("div","fb-badge kofi","APOYA EL PROYECTO ☕"));c2.appendChild(n("div","fb-card-title","¡Invítame un café en Ko-fi!"));c2.appendChild(n("div","fb-card-desc","Si te gusta Xuper Eclectic, invítame un café para apoyar el desarrollo y las mejoras:"));var q2=n("div","fb-qr-box"),img2=n("img");img2.src="media/ui/settings/qr_kofi.png";img2.alt="QR Ko-fi";q2.appendChild(img2);c2.appendChild(q2);c2.appendChild(n("div","fb-url-pill kofi","ko-fi.com/eclex"));c2._activate=function(){showPlayerToast("Donaciones: ko-fi.com/eclex");};grid.appendChild(c2);e.appendChild(grid);var mailBar=n("div","fb-support-bar focusable"),mIcon=n("img","fb-support-icon");mIcon.src="media/ui/settings/vod_email_icon.png";mIcon.alt="";mailBar.appendChild(mIcon);var mText=n("div","fb-support-text");mText.appendChild(n("span","fb-support-lbl","Correo para ayuda y reportar bugs o errores: "));mText.appendChild(n("span","fb-support-email","Eclecticempire01@outlook.com"));mailBar.appendChild(mText);mailBar._activate=function(){showPlayerToast("Soporte: Eclecticempire01@outlook.com");};e.appendChild(mailBar);return e}(),Oe.upgrade=function(){var e=n("div","settings-panel");e.appendChild(n("div","sp-title plain","Settings")),e.appendChild(l(n("div","sp-hr soft"),0,165,1498,1));var t=n("div","sp-card");l(t,30,198,1360,461),t.appendChild(n("h3",null,"Limpiar cache"));for(var i=[{y:139,label:"Historia"},{y:246,label:"Cache de foto"},{y:353,label:"Limpiar todos"}],a=0;a<i.length;a++)(function(idx){var r=n("div","sp-clear-row");r.style.top=i[idx].y+"px",r.appendChild(n("span","lbl",i[idx].label));var o=n("div","btn focusable","Limpiar");o._activate=function(){if(0===idx||2===idx){if(xuperProfile){xuperProfile.history=[];saveXuperProfile();}}if(window.XuperTizenBridge&&window.XuperTizenBridge.clearCaches){window.XuperTizenBridge.clearCaches();}showPlayerToast("Caché liberada correctamente");},r.appendChild(o),t.appendChild(r)})(a);e.appendChild(t);var s=n("div","sp-card");l(s,30,689,1360,291),s.appendChild(n("h3",null,"Actualización"));var d=n("div","sp-version","v3.0.0");return s.appendChild(d),e.appendChild(s),e}(),Oe.about=function(){var e=n("div","settings-panel");e.appendChild(n("div","sp-title","Sobre nosotros")),e.appendChild(l(n("div","sp-hr soft"),0,149,1450,1));var hero=n("div","about-hero-card focusable");var topRow=n("div","about-brand-row");topRow.appendChild(n("div","about-brand-title","Xuper Eclectic"));var badges=n("div","about-badge-group");badges.appendChild(n("span","about-badge gold","v3.0.0"));badges.appendChild(n("span","about-badge cyan","Samsung Tizen OS"));badges.appendChild(n("span","about-badge slate","Mod by EclexTv"));topRow.appendChild(badges);hero.appendChild(topRow);hero.appendChild(n("div","sp-about-body","Xuper Eclectic es un mod de Xuper TV creado por EclexTv para funcionar en televisores Samsung con sistema operativo Tizen OS."));hero.appendChild(n("div","sp-about-sub","Optimizado específicamente para brindar máxima fluidez, descifrado en Worker y estabilidad continua en televisores Samsung (Tizen 3.0–10.0), reuniendo televisión en vivo, películas, series y animes en un solo lugar."));var pills=n("div","about-features-row");pills.appendChild(n("span","about-pill","⚡ Optimizado para Tizen OS"));pills.appendChild(n("span","about-pill","📺 TV en Vivo · Películas · Series"));pills.appendChild(n("span","about-pill","🎧 Multi-Audio Inteligente"));hero.appendChild(pills);hero._activate=function(){showPlayerToast("Xuper Eclectic v3.0.0 · Tizen OS");};e.appendChild(hero);var contactCard=n("div","about-contact-card focusable"),cRow1=n("div","about-contact-row"),cImg=n("img");cImg.src="media/ui/settings/vod_email_icon.png";cImg.alt="";cRow1.appendChild(cImg);cRow1.appendChild(n("span","about-contact-lbl","Ayuda y reporte de bugs o errores:"));cRow1.appendChild(n("span","about-contact-val","Eclecticempire01@outlook.com"));contactCard.appendChild(cRow1);contactCard.appendChild(n("div","about-contact-links","📺 Canal de actualizaciones: youtube.com/@eclex-m4f   ·   ☕ Apoya el proyecto: ko-fi.com/ec"));contactCard._activate=function(){showPlayerToast("Correo: Eclecticempire01@outlook.com");};e.appendChild(contactCard);return e}(),Oe.account=Zt("Account","Panel de cuenta no reconstruido en esta pasada. El layout original depende del estado de sesión y de recursos servidos."),Oe.purchase=Zt("Purchase","Panel de compras no reconstruido en esta pasada. El layout original depende del estado de sesión y de recursos servidos."),Oe)Oe.hasOwnProperty(i)&&le.appendChild(Oe[i])}function Jt(){oe||Gt();ze("settings");refreshHistoryPanel();Kt(0,!1);Fe(Ae[0]);}function Kt(e,t){for(var i=["history","playback","cr","parent","feedback","about"],a=0;a<Ae.length;a++)Ae[a].classList.toggle("is-selected",a===e);for(var n in Oe)Oe.hasOwnProperty(n)&&Oe[n].classList.toggle("is-active",n===i[e]);t&&Fe(Be(Oe[i[e]])||Ae[e])}function Yt(e,t,i,a,r,o){var l=n("div","pb-row");l.style.top=t+"px",l.appendChild(n("div","pb-label",i));for(var s=0;s<a.length;s++){var d=n("div","pb-opt focusable"+(s===o?" is-checked":""));d.style.marginLeft=(0===s?0:28)+"px",d.appendChild(n("div","radio")),d.appendChild(n("span",null,a[s])),d._group=r,d._index=s,d._activate=function(){ke.playback[this._group]=this._index;for(var t=e.querySelectorAll(".pb-opt"),i=0;i<t.length;i++)t[i]._group===this._group&&t[i].classList.toggle("is-checked",t[i]._index===this._index)},l.appendChild(d)}e.appendChild(l)}function Zt(e,t){var i=n("div","settings-panel");return i.appendChild(n("div","sp-title",e)),i.appendChild(n("div","sp-hr")),i.appendChild(n("div","sp-pending",t)),i}var ei=5e3,ti=null;function ii(e){e=Math.max(0,Math.floor(e||0));var t=Math.floor(e/3600),i=Math.floor(e%3600/60),a=e%60;return d(t)+":"+d(i)+":"+d(a)}function ai(e){if("number"==typeof e&&isFinite(e)&&e>0)return e;if("string"!=typeof e)return 0;var t=e.trim();if(!t||"—"===t||"-"===t)return 0;var i=t.match(/(\d+)\s*h(?:our|ora|s)?/i),a=t.match(/(\d+)\s*m(?:in|uto|s)?/i),n=t.match(/(\d+)\s*s(?:ec|eg)?/i);if(i||a||n)return 3600*(i?parseInt(i[1],10):0)+60*(a?parseInt(a[1],10):0)+(n?parseInt(n[1],10):0);if(-1!==t.indexOf(":")){var r=t.split(":");if(2===r.length){var o=Number(r[0]),l=Number(r[1]);if(isFinite(o)&&isFinite(l)&&o>=0&&l>=0)return 60*o+l}else if(3===r.length){o=Number(r[0]),l=Number(r[1]);var s=Number(r[2]);if(isFinite(o)&&isFinite(l)&&isFinite(s)&&o>=0&&l>=0&&s>=0)return 3600*o+60*l+s}}var d=Number(t);return isFinite(d)&&d>0?d:0}var ni=null;function ri(){ni&&(clearInterval(ni),ni=null)}function oi(e,t){if(ge&&ye&&be){var i=ai(t);if(!i&&ke.playerEpisode&&ke.playerEpisode.duration&&(i=ai(ke.playerEpisode.duration)),!i&&ke.playerItem&&ke.playerItem.duration&&(i=ai(ke.playerItem.duration)),!i&&pe&&isFinite(pe.duration)&&pe.duration>0&&(i=pe.duration),!i&&ta&&ta.length){var a=ta[ta.length-1];a&&a.end>0&&(i=Math.round(a.end+60))}if(e=Number(e)||0,ge.textContent=ii(e),!i||i<=0)e>(i=I(ke.playerItem)?2700:6300)&&(i=Math.round(1.15*e));ye.textContent=ii(i);var n=Math.min(100,Math.max(0,e/i*100));if(be.style.width=n.toFixed(2)+"%",we&&(we.style.left=n.toFixed(2)+"%"),pe&&pe.buffered&&pe.buffered.length>0)try{var r=pe.buffered.end(pe.buffered.length-1);en&&(r+=tn);var o=Math.min(100,Math.max(0,r/i*100));Ce&&(Ce.style.width=o.toFixed(2)+"%")}catch(e){}}}function li(e){Se||(Se=r("player-osd-icon")),Se&&(ti&&(clearTimeout(ti),ti=null),"pause"===e?(Se.style.backgroundImage="url(media/ui/common/icon_status_pause.png)",Se.classList.add("is-active")):"forward"===e?(Se.style.backgroundImage="url(media/ui/common/icon_status_forward.png)",Se.classList.add("is-active"),ti=setTimeout(function(){Se.classList.remove("is-active")},900)):"backward"===e?(Se.style.backgroundImage="url(media/ui/common/icon_status_backward.png)",Se.classList.add("is-active"),ti=setTimeout(function(){Se.classList.remove("is-active")},900)):Se.classList.remove("is-active"))}function si(e){var dur=(pe&&isFinite(pe.duration)&&pe.duration>0)?pe.duration:(ke.playerEpisode&&ke.playerEpisode.duration?ai(ke.playerEpisode.duration):(ke.playerItem&&ke.playerItem.duration?ai(ke.playerItem.duration):7200));var cur=(pe&&pe.currentTime>0)?pe.currentTime:(window.__simulatedCurrentTime||0);if(window.CactusAVPlay&&window.CactusAVPlay.isActive&&window.CactusAVPlay.isActive()&&typeof window.CactusAVPlay.getCurrentPosition==='function'){var avPos=window.CactusAVPlay.getCurrentPosition();if(avPos>0)cur=avPos;}var target=Math.max(0,Math.min(dur,cur+e));window.__simulatedCurrentTime=target;if(pe){try{pe.currentTime=target;}catch(err){}}if(window.CactusAVPlay&&window.CactusAVPlay.isActive&&window.CactusAVPlay.isActive()){try{if(typeof window.CactusAVPlay.seekAbsolute==='function'){window.CactusAVPlay.seekAbsolute(target*1000);}else if(typeof window.CactusAVPlay.seek==='function'){window.CactusAVPlay.seek(e*1000);}}catch(err){}}oi(target,dur);pi();li(e>0?"forward":"backward");sa(target);saveXuperHistory(target,dur,true);}function di(){if(pe)if(pe.paused){try{var e=pe.play();e&&e.catch&&e.catch(function(){})}catch(e){}li("none"),pi()}else{try{pe.pause()}catch(e){}li("pause"),pi()}}function ci(){ke.infoTimer&&clearTimeout(ke.infoTimer),ke.infoTimer=setTimeout(function(){ke.infoTimer=null,"player"!==ke.screen||ke.channelsOpen||ui()},ei)}function pi(){ke.infobar=!0,"vod"===ke.playerMode?(ve&&ve.classList.add("is-active"),de&&de.classList.remove("is-active")):(de&&de.classList.add("is-active"),ve&&ve.classList.remove("is-active")),ci()}function ui(){ke.infoTimer&&(clearTimeout(ke.infoTimer),ke.infoTimer=null),ke.infobar=!1,de&&de.classList.remove("is-active"),ve&&ve.classList.remove("is-active"),"player"===ke.screen&&ke.focus&&ke.focus.classList&&ke.focus.classList.contains("pi-star")&&Fe(se)}function fi(){pi()}function vi(){ui()}var hi=null,mi=null,gi=null,yi=null,bi=null,Ci=null,wi=null,Si=null,xi=null,_i=null,Li=null,ki=null,Ii=null,Ti=null,Ei=null,Mi=null,qi=null,Oi=null,Ai=null,Di=null,Pi=null,Ni=null,Ri=null,Ui=null,Fi=null,Bi=null,Hi=null,zi=null,Vi=!1,ji=!1,Wi=null,$i=0,Xi=!1,Qi=null,Gi=!0,Ji=!1,Ki=0,Yi="normal",Zi="white",ea="contain",ta=[],ia={},aa={},na=null;try{var _subSaved=localStorage.getItem("xuper_subtitles_enabled");if(_subSaved==="false"){Gi=false;}else{Gi=true;}var _stySaved=localStorage.getItem("xuper_sub_style");if(_stySaved)Zi=_stySaved;var _szSaved=localStorage.getItem("xuper_sub_size");if(_szSaved)Yi=_szSaved;}catch(e){}function ra(e){if(!e)return 0;var m=String(e).trim().match(/(?:(\d+):)?(\d{1,2}):(\d{2})(?:[.,](\d{1,3}))?/);if(!m)return 0;var h=m[1]?parseInt(m[1],10):0,mi=parseInt(m[2],10)||0,s=parseInt(m[3],10)||0,ms=m[4]?(m[4]+"00").slice(0,3):"0";return h*3600+mi*60+s+(parseInt(ms,10)||0)/1000;}function oa(e){var t=++Ki;if(!e||!e.url||window.__subtitlesEnabled===false||!Gi){ta=[];window.__lastLoadedSubUrl=null;var subEls=[zi||r("player-subtitles"),r("subtitle-layer")];for(var sIdx=0;sIdx<subEls.length;sIdx++){if(subEls[sIdx]){subEls[sIdx].innerHTML="";subEls[sIdx].hidden=true;subEls[sIdx].style.display="none";}}return;}var subEls=[zi||r("player-subtitles"),r("subtitle-layer")];for(var sIdx=0;sIdx<subEls.length;sIdx++){if(subEls[sIdx]){subEls[sIdx].hidden=false;subEls[sIdx].style.display="";}}try{var i=new XMLHttpRequest;i.open("GET",e.url,!0);i.onload=function(){if(t===Ki&&(i.status===0||(i.status>=200&&i.status<300))&&i.responseText&&window.__subtitlesEnabled!==false&&Gi){window.__lastLoadedSubUrl=e.url;ta=(window.CollateralSubtitles&&window.CollateralSubtitles.parse)?window.CollateralSubtitles.parse(i.responseText):function(raw){var cues=[];if(!raw)return cues;var norm=raw.replace(/\r\n/g,"\n").replace(/\r/g,"\n").replace(/^\uFEFF?WEBVTT[^\n]*\n+/i,"");var blks=norm.split(/\n\s*\n/);for(var b=0;b<blks.length;b++){var lns=blks[b].trim().split("\n");if(!lns.length)continue;var tIdx=-1;for(var l=0;l<lns.length;l++)if(lns[l].indexOf("-->")!==-1){tIdx=l;break;}if(tIdx===-1)continue;var p=lns[tIdx].split("-->");if(p.length<2)continue;var st=ra(p[0]),en=ra(p[1]);if(en<=st)continue;var txt=lns.slice(tIdx+1).join("<br>").replace(/<v[^>]*>/gi,"").replace(/<\/v>/gi,"").replace(/<font[^>]*>/gi,"").replace(/<\/font>/gi,"").replace(/<c[^>]*>/gi,"").replace(/<\/c>/gi,"").trim();if(txt)cues.push({start:st,end:en,text:txt});}return cues;}(i.responseText);la();var curPos=pe?(pe.currentTime||0):(window.__simulatedCurrentTime||0);sa(curPos);}};i.send();}catch(err){console.warn("[oa subtitle error]",err);}}function la(){zi=zi||r("player-subtitles");var sl=r("subtitle-layer");var els=[zi,sl];for(var i=0;i<els.length;i++){var elNode=els[i];if(elNode){elNode.classList.remove("size-small","size-normal","size-big");elNode.classList.add("size-"+(Yi||"normal"));elNode.classList.remove("color-white","color-yellow","color-black");elNode.classList.add("color-"+(Zi||"white"));}}}function sa(e){var subEls=[zi,r("subtitle-layer")];if(!Gi||window.__subtitlesEnabled===false){for(var sIdx=0;sIdx<subEls.length;sIdx++){if(subEls[sIdx]&&subEls[sIdx].innerHTML!==""){subEls[sIdx].innerHTML="";subEls[sIdx].hidden=true;subEls[sIdx].style.display="none";}}return;}if(!ta||!ta.length)return;var t=null;for(var i=0;i<ta.length;i++)if(e>=ta[i].start&&e<=ta[i].end){t=ta[i];break;}if(t){var a='<span class="player-subtitles-text">'+t.text+"</span>";for(var sIdx=0;sIdx<subEls.length;sIdx++){if(subEls[sIdx]){if(subEls[sIdx].innerHTML!==a){subEls[sIdx].innerHTML=a;}subEls[sIdx].hidden=false;subEls[sIdx].style.display="block";}}}else{for(var sIdx=0;sIdx<subEls.length;sIdx++){if(subEls[sIdx]&&subEls[sIdx].innerHTML!==""){subEls[sIdx].innerHTML="";}}}}function da(){return"detail"===ke.screen?ke.detail||null:ke.playerItem||ke.detail||null}var ca={};function pa(e){return e&&(e.seriesId||e.id)||""}function ua(e){var t=pa(e);ke.streamMode=ca[t]?"smooth":"normal"}function fa(e,t){var i=pa(e);ke.streamMode=t?"smooth":"normal",i&&(ca[i]=!!t)}function va(){$i=0,Xi=!1,Qi=null;var savedSub=true;try{if(localStorage.getItem('xuper_subtitles_enabled')==='false')savedSub=false;}catch(e){}Gi=(ke.playback&&ke.playback.subtitle!==false)&&savedSub;Ji=!1;Ki++;ke.trackIndex=0;ta=[];zi=zi||r("player-subtitles");zi&&(zi.innerHTML="");var sl=r("subtitle-layer");sl&&(sl.innerHTML="");window.__subtitlesEnabled=Gi;la();}function ha(e){return e&&I(e)?"player"===ke.screen&&ke.playerEpisode?ke.playerEpisode:ke.detailEpisode?ke.detailEpisode:e.episodes&&e.episodes[0]||null:null}function ma(e){if(!e)return"";var t=ha(e);return t&&t.id?t.id:e.id||""}function ga(e,t){if(t=t||function(){},!e)return t(null);var i=ma(e);if(!i)return t(null);if(ia[i])return Ca(ia[i]),t(ia[i]);if(aa[i])aa[i].push(t);else{aa[i]=[t];var a=ha(e),n={contentId:i},r=e.seasonId||e.id;a&&a.id&&r&&a.id!==r&&(n.seriesContentId=r),D("mediaInfo",n,function(e,t){var a=aa[i]||[];delete aa[i];var n=!e&&t&&!1!==t.returnValue?t:null;n&&(ia[i]=n,Ca(n));for(var r=0;r<a.length;r++)try{a[r](n)}catch(e){}})}}function ya(e){var t=(e||"").split(/[,\/;|]/);var latIdx=-1,espIdx=-1,genIdx=-1;for(var i=0;i<t.length;i++){var seg=t[i].trim().toLowerCase();if(/es[-_]?(419|mx|ar|co|pe|cl|lat)|esl|latino/i.test(seg)){if(latIdx<0)latIdx=i;}else if(/es[-_]?es|castell|esp(?!l)|spain|españa/i.test(seg)){if(espIdx<0)espIdx=i;}else if(/^(spa|es|spanish|español)$/i.test(seg)){if(genIdx<0)genIdx=i;}}if(latIdx>=0)return latIdx;if(espIdx>=0)return espIdx;if(genIdx>=0)return genIdx;return 0;}function ba(e){for(var t=[],i=e&&e.subtitles||[],a=0;a<i.length;a++)t.push({lang:i[a].lang,url:i[a].url,format:i[a].format});return t.sort(function(e,t){return(/^(es|spa|esp)$/i.test(e.lang||"")?0:1)-(/^(es|spa|esp)$/i.test(t.lang||"")?0:1)}),t}function Ca(e){var savedSub=true;try{if(localStorage.getItem('xuper_subtitles_enabled')==='false')savedSub=false;}catch(err){}if(!savedSub||(ke.playback&&ke.playback.subtitle===false)){Gi=false;window.__subtitlesEnabled=false;oa(null);return;}Gi=true;window.__subtitlesEnabled=true;var t=getAvailableSubtitleTracks();if(!t.length){oa(null);return;}if(!Qi||!Ji){var defSub=null;for(var si=0;si<t.length;si++){var sl=String(t[si].lang||t[si].label||"").toLowerCase();if(/es|spa|castell|latino/.test(sl)){defSub=t[si];break;}}Qi=defSub||t[0];}if(Qi){if(void 0!==Qi.avIndex&&window.CactusAVPlay&&window.CactusAVPlay.setSubtitleTrack){window.CactusAVPlay.setSubtitleTrack(Qi.avIndex);oa(null);}else if(void 0!==Qi.hlsIndex&&pe&&pe._hls){pe._hls.subtitleTrack=Qi.hlsIndex;oa(null);}else if(Qi.url){if(window.CactusAVPlay&&window.CactusAVPlay.setSubtitleTrack)window.CactusAVPlay.setSubtitleTrack(-1);if(pe&&pe._captions&&pe._captions.select&&typeof Qi._index==="number"){pe._captions.select(Qi._index);}oa(Qi);}}}function wa(){Wi&&clearTimeout(Wi),Wi=setTimeout(function(){xa()},8e3)}function Sa(){(hi||Xa(),hi)&&(Vi=!0,ji=!1,ui(),_a(),hi.classList.add("is-active"),zi&&zi.classList.add("shift-up"),(r("subtitle-layer")&&r("subtitle-layer").classList.add("shift-up")),ga(ke.playerItem,function(){Vi&&_a()}),wa(),I(ke.playerItem)&&Li?Fe(Li):(function(){var selAudio=Si?Si.querySelector(".psv-btn.is-selected"):null;if(selAudio)Fe(selAudio);else if(bi)Fe(bi);})())}function xa(){Wi&&(clearTimeout(Wi),Wi=null),Vi=!1,hi&&hi.classList.remove("is-active"),zi&&zi.classList.remove("shift-up");var slRem=r("subtitle-layer");slRem&&slRem.classList.remove("shift-up"),"player"!==ke.screen||ji||Fe(se)}function _a(){var e=ke.focus?s(ke.focus,".psv-row"):null,t=e?e.id:"",i=e&&ke.focus?ke.focus.textContent:"";if(ka(),function(){if(!Si)return;Si.classList.remove("is-hidden")}(),updatePsvAudio(),updatePsvSubtitles(),Ra(),Ua(),La(),Vi&&t&&hi)for(var a=hi.querySelectorAll(".psv-row"),n=0;n<a.length;n++)if(a[n].id===t){for(var r=a[n].querySelectorAll(".focusable"),o=null,l=0;l<r.length;l++)if(r[l].textContent===i){o=r[l];break}var d=o||Be(a[n]);d&&Fe(d,!0);break}}function La(){if(hi){for(var e=hi.querySelectorAll(".psv-row"),t=0;t<e.length;t++)e[t].classList.remove("is-row-focused");var i=ke.focus?s(ke.focus,".psv-row"):null;i&&i.classList.add("is-row-focused")}}function ka(){if(gi){var e=ke.playerItem;if(e&&I(e)){if(gi.style.display="block",yi){o(yi);var t=Ia(e),i=t[ke.playerSeasonIndex]||t[0],a=i&&i.id===(e.seasonId||e.id)&&e.episodes&&e.episodes.length?e.episodes:i&&i._episodes||e.episodes||[];if(a.length){for(var r=0,l=0;l<a.length;l++)if(ke.playerEpisode&&(a[l].id===ke.playerEpisode.id||a[l].number===ke.playerEpisode.number)){r=l;break}var s=Nt(a.length);(void 0===ke.playerEpisodeRange||ke.playerEpisodeRange>=s.length)&&(ke.playerEpisodeRange=Math.floor(r/20));for(var d=s[ke.playerEpisodeRange]||s[0],c=n("div","psv-episode-numbers"),p=d.start;p<d.end;p++)(function(e,t){var i=String(void 0!==e.number&&null!==e.number?e.number:t+1),a=n("button","psv-ep-btn focusable"+(t===r?" is-selected":""),i);a._activate=function(){Da(e)},c.appendChild(a)})(a[p],p);yi.appendChild(c);for(var u=n("div","psv-episode-ranges"),f=0;f<s.length;f++)(function(e,t){var i=n("button","psv-range-btn focusable"+(e===ke.playerEpisodeRange?" is-selected":""),t.start+1+"-"+t.end);i._activate=function(){ke.playerEpisodeRange=e,ka();var t=yi.querySelector(".psv-ep-btn");t&&Fe(t)},u.appendChild(i)})(f,s[f]);yi.appendChild(u)}else yi.appendChild(n("div","psv-selection-empty","Temporadas y episodios"))}}else gi.style.display="none"}}function Ia(e){return e&&e.seasons&&e.seasons.length?e.seasons:[{id:e?e.id:"",number:1}]}function Ta(e,t,i){var a=t&&void 0!==t.number&&null!==t.number?t.number:i+1,n=String(t&&(t.title||t.name)||"").trim(),r=String(e&&e.title||"").trim().replace(/[\s\-–_]*[TtSs]\d+$/,"");return r&&0===n.indexOf(r)&&(n=n.substring(r.length)),(n=n.replace(/^[\s\-–_:.]+/,"").trim())&&!/^(?:[TtSs]?\d+[\s\-–_.:]*)+$/.test(n)||(n="Episodio "+a),n}function Ea(e){var t=String(e&&e.duration||"").trim(),i=/^(\d+):(\d+)(?::(\d+))?$/.exec(t);return i?i[3]?(parseInt(i[1],10)||0)+" h "+(parseInt(i[2],10)||0)+" min":(parseInt(i[1],10)||0)+" min":t}function Ma(){var e=ke.playerItem;if(e&&I(e)&&(Vi&&xa(),ki||Xa(),ki)){if(!(e.episodes&&e.episodes.length||e._detailsLoaded))return cn("Cargando capítulos…"),void H(e,function(){cn("");"player"===ke.screen&&(!ke.playerEpisode&&e.episodes&&e.episodes.length&&(ke.playerEpisode=e.episodes[0],ke.detailEpisode=e.episodes[0]),Ma())});!ke.playerEpisode&&e.episodes&&e.episodes.length&&(ke.playerEpisode=e.episodes[0],ke.detailEpisode=e.episodes[0],ke.playerSeasonIndex=ke.detailSeason||0),ke.episodeBrowserOpen=!0,ke.browserSeason=ke.playerSeasonIndex||0,ki.classList.add("is-active"),vi(),function(){var e=ke.playerItem;if(!e||!ki)return;var t=Ia(e);ke.browserSeason>=t.length&&(ke.browserSeason=0);ke.browserSeason<0&&(ke.browserSeason=0);var i=t[ke.browserSeason],a=t[ke.playerSeasonIndex]||t[0],r=ke.playerEpisode;Ii&&(Ii.textContent=e.title||"");if(Ti)if(r){var l=[];a&&a.number&&l.push("T"+a.number),r.number&&l.push("E"+r.number),Ti.textContent="Reproduciendo "+l.join(" ")+" · "+Ta(e,r)}else Ti.textContent="Elige un episodio";Oi&&(Oi.textContent="Episodios · Temporada "+(i&&i.number||ke.browserSeason+1));(function(e,t){if(!Ei||!Mi)return;o(Ei),Mi.style.display="flex";for(var i=0;i<t.length;i++)(function(e){var i=n("div","pe-season focusable","Temporada "+(t[e].number||e+1));e===ke.browserSeason&&i.classList.add("is-selected"),i._onFocus=function(){ke.browserSeason!==e&&Aa(e,!1)},i._activate=function(){Aa(e,!0)},Ei.appendChild(i)})(i)})(0,t),Oa(e,i)}();var t=(qi?qi.querySelector(".pe-ep.is-current"):null)||(qi?Be(qi):null)||(Mi&&"none"!==Mi.style.display?Be(Ei):null);t&&Fe(t)}}function qa(e){ki&&ke.episodeBrowserOpen&&(ke.episodeBrowserOpen=!1,ki.classList.remove("is-active"),!e&&"player"===ke.screen&&se&&Fe(se))}function Oa(e,t){if(qi&&t){o(qi);var i=t.id===(e.seasonId||e.id)&&e.episodes&&e.episodes.length?e.episodes:t._episodes||[];if(!i.length)return qi.appendChild(n("div","pe-loading","Cargando episodios…")),void function(e,t,i){i=i||function(){},e&&t?t.id===(e.seasonId||e.id)&&e.episodes&&e.episodes.length?(t._episodes=e.episodes,i(e.episodes)):t._episodes?i(t._episodes):t._loading?(t._wait=t._wait||[],t._wait.push(i)):(t._loading=!0,t._wait=[i],D("detail",{contentId:t.id},function(e,i){t._loading=!1;var a=!e&&i&&!1!==i.returnValue&&i.episodes?i.episodes:[];a.length&&(t._episodes=a);var n=t._wait||[];t._wait=[];for(var r=0;r<n.length;r++)try{n[r](a)}catch(e){}})):i([])}(e,t,function(i){if(ke.episodeBrowserOpen&&(Ia(e)[ke.browserSeason]===t&&(Oa(e,t),s(ke.focus,"#pe-episodes")))){var a=qi.querySelector(".pe-ep.is-current")||Be(qi);a&&Fe(a)}});for(var a=Math.min(i.length,24),r=0;r<a;r++)(function(t,i){var a=n("div","pe-ep focusable"),r=void 0!==t.number&&null!==t.number?t.number:i+1;a.appendChild(n("div","pe-num",String(r)));var o=n("div","pe-thumb"),l=n("div","pe-thumb-play","▶");o.appendChild(l),a.appendChild(o);var s=n("div","pe-info");s.appendChild(n("div","pe-name",Ta(e,t,i)));var d=[],c=Ea(t);c&&d.push(c),t.quality&&d.push(String(t.quality).split(",")[0].toUpperCase()),s.appendChild(n("div","pe-meta",d.join("   ·   "))),t.description&&s.appendChild(n("div","pe-desc",t.description)),a.appendChild(s);var p=ke.playerEpisode&&(ke.playerEpisode.id===t.id||void 0!==ke.playerEpisode.number&&ke.playerEpisode.number===t.number);a.appendChild(n("div","pe-badge","▶ REPRODUCIENDO")),p&&a.classList.add("is-current"),a._activate=function(){Da(t)},qi.appendChild(a)})(i[r],r);i.length>a&&qi.appendChild(n("div","pe-loading","Mostrando los primeros "+a+" capítulos"))}}function Aa(e,t){var i=ke.playerItem,a=Ia(i);if(a[e]&&(ke.browserSeason=e,function(){if(Ei)for(var e=Ei.children,t=0;t<e.length;t++)e[t].classList.toggle("is-selected",t===ke.browserSeason)}(),Oi&&(Oi.textContent="Episodios · Temporada "+(a[e].number||e+1)),Oa(i,a[e]),t)){var n=qi?qi.querySelector(".pe-ep.is-current")||Be(qi):null;n&&Fe(n)}}function Da(e){var t=ke.playerItem;if(t&&e){var i=Ia(t),a=i[ke.playerSeasonIndex];a&&a.id===(t.seasonId||t.id)&&t.episodes&&t.episodes.length&&(a._episodes=t.episodes);var n=void 0!==ke.playerSeasonIndex&&null!==ke.playerSeasonIndex?ke.playerSeasonIndex:ke.browserSeason||0,r=i[n];r&&(ke.detailSeason!==n&&(ke.detailSeason=n,ke.detailNeedsRebuild=!0),r.id&&(t.seasonId=r.id),r._episodes&&(t.episodes=r._episodes)),qa(),Vi&&xa(),Pa(t,e)}}function Pa(e,t){if(e&&t){ke.playerMode="vod",ke.streamError="",window.__resumeStartTime=0,window.__simulatedCurrentTime=0,ke.playerItem=e,ke.playerEpisode=t,ke.detailEpisode=t,ke.playerSeasonIndex=ke.detailSeason||0,se&&de&&bn(),Na(e),ke.episodeSwitchTimer&&clearTimeout(ke.episodeSwitchTimer),ke.episodeSwitchSeq=(ke.episodeSwitchSeq||0)+1;var i=ke.episodeSwitchSeq;dn(),cn("Cambiando capítulo…"),ke.episodeSwitchTimer=setTimeout(function(){ke.episodeSwitchTimer=null,i===ke.episodeSwitchSeq&&("player"===ke.screen||"detail"===ke.screen)&&fn(e,t)},300)}}function Na(e){if(Y)for(var t=Y.querySelectorAll(".detail-episode"),i=0;i<t.length;i++){var a=!(!t[i]._ep||!ke.detailEpisode||t[i]._ep.id!==ke.detailEpisode.id);t[i].classList.toggle("is-playing",a)}}function Ra(){var e="relay"===ke.streamMode||"smooth"===ke.streamMode;if(Ci){Ci.classList.toggle("is-selected",e);var t=Ci.querySelector(".psv-check");t&&(t.style.display=e?"block":"none")}if(wi){wi.classList.toggle("is-selected",!e);var i=wi.querySelector(".psv-check");i&&(i.style.display=e?"none":"block")}}function Ua(){if(_i)for(var e=_i.querySelectorAll(".psv-btn"),t=0;t<e.length;t++){var i=e[t].getAttribute("data-aspect")===ea;e[t].classList.toggle("is-selected",i);var a=e[t].querySelector(".psv-check");a&&(a.style.display=i?"block":"none")}}function Fa(e){ea=e||"contain",pe&&(pe.classList.remove("aspect-cover","aspect-contain","aspect-16-9","aspect-4-3"),pe.classList.add("aspect-"+ea)),Ua()}function Ba(e){if(mi||Xa(),mi){Wi&&(clearTimeout(Wi),Wi=null),ji=!0,na=ke.focus;var t=e||da();"detail"===ke.screen&&(t=ke.detail||t),za(),Va(),la(),mi.classList.add("is-active"),ga(t,function(){ji&&(za(),Va())});var i=Ai&&Ai.querySelector(".focusable")||Di||Hi;i&&Fe(i)}}function Ha(){ji=!1,mi&&mi.classList.remove("is-active"),Vi?(updatePsvAudio(),bi&&Fe(bi),wa()):na&&Ne(na)?Fe(na):"player"===ke.screen&&Fe(se),na=null}function getAvailableAudioTracks(){
  var t=[];
  var seenIdx={};
  var hasRealStreamTracks=false;
  var activeRealIdx=null;
  function classifyLangLabel(code,labelStr){
    var cleanCode=String(code||"").toLowerCase().replace(/_/g,"-").trim();
    var rawLbl=String(labelStr||"").trim();
    if(/es-?es|castellano|castilian|spain|españa|\besp(?!l)\b/i.test(cleanCode)||/españa|castellano|castilian/i.test(rawLbl)){
      return "Español España";
    }
    if(/es-?(419|mx|ar|co|pe|cl|lat)|\besl\b|\blat\b|latino/i.test(cleanCode)||/latino|419|\bes-?lat\b|\besl\b/i.test(rawLbl)){
      return "Español Latino";
    }
    if(/^(es|spa|spanish|español)$/i.test(cleanCode)||/^español$/i.test(rawLbl)){
      return "Español";
    }
    return rawLbl||ja(cleanCode);
  }
  function addTrack(idx,code,labelStr,forceReal){
    var numIdx=Number(idx);
    if(!isFinite(numIdx))numIdx=t.length;
    if(seenIdx[numIdx])return;
    seenIdx[numIdx]=true;
    var cleanCode=String(code||"").toLowerCase().trim();
    var cleanLabel=classifyLangLabel(cleanCode,labelStr);
    if(!cleanLabel)cleanLabel="Pista "+(numIdx+1);
    t.push({index:numIdx,code:cleanCode,label:cleanLabel,_real:!!forceReal});
  }
  if(window.CactusAVPlay&&window.CactusAVPlay.isActive&&window.CactusAVPlay.isActive()&&window.CactusAVPlay.getAudioTracks){
    try{
      var avTracks=window.CactusAVPlay.getAudioTracks();
      if(avTracks&&avTracks.length>0){
        hasRealStreamTracks=true;
        for(var tr=0;tr<avTracks.length;tr++){
          var atObj=avTracks[tr];
          var lbl=atObj.name||"";
          var codeStr=String((atObj.details&&(atObj.details.language||atObj.details.track_lang||atObj.details.lang||atObj.details.title))||lbl||"");
          addTrack(atObj.index!==undefined?atObj.index:tr,codeStr,lbl,true);
        }
      }
    }catch(e){}
  }
  if(!t.length&&pe&&pe._hls&&pe._hls.audioTracks&&pe._hls.audioTracks.length>0){
    try{
      hasRealStreamTracks=true;
      if(typeof pe._hls.audioTrack==="number"&&pe._hls.audioTrack>=0)activeRealIdx=pe._hls.audioTrack;
      for(var h=0;h<pe._hls.audioTracks.length;h++){
        var ht=pe._hls.audioTracks[h];
        var hName=ht.name||"";
        var hLang=ht.lang||"";
        addTrack(h,hLang||hName,hName||ja(hLang),true);
      }
    }catch(e){}
  }
  if(!t.length&&pe&&pe._cactusAudio&&pe._cactusAudio.tracks&&pe._cactusAudio.tracks.length>0){
    try{
      hasRealStreamTracks=true;
      if(typeof pe._cactusAudio.selected==="number"&&pe._cactusAudio.selected>=0)activeRealIdx=pe._cactusAudio.selected;
      for(var c=0;c<pe._cactusAudio.tracks.length;c++){
        var ct=pe._cactusAudio.tracks[c];
        addTrack(c,ct.lang||ct.label,ct.label,true);
      }
    }catch(e){}
  }
  if(!t.length&&pe&&pe.audioTracks&&pe.audioTracks.length>0){
    try{
      hasRealStreamTracks=true;
      for(var m=0;m<pe.audioTracks.length;m++){
        var mt=pe.audioTracks[m];
        if(mt.enabled&&activeRealIdx===null)activeRealIdx=m;
        addTrack(m,mt.language||mt.label,mt.label,true);
      }
    }catch(e){}
  }
  var itm=da()||ke.playerItem||ke.detail;
  var ep=(itm&&typeof ha==="function")?ha(itm):null;
  var itmId=(itm&&typeof ma==="function")?ma(itm):(itm&&itm.id);
  var media=(itmId&&ia&&ia[itmId])||{};
  var rawStr=media.audio||(ep&&(ep.audio||ep.streamAudioInfo))||(itm&&(itm.audio||itm.streamAudioInfo||itm.languages||itm.language||itm.dubLanguage||itm.voiceLanguage))||"";
  if(!hasRealStreamTracks&&!t.length&&rawStr){
    var parts=String(rawStr).split(/[,\/;|]/);
    var pIdx=0;
    for(var p=0;p<parts.length;p++){
      var seg=parts[p].trim();
      if(seg)addTrack(pIdx++,seg,"",false);
    }
  }
  if(!hasRealStreamTracks&&!t.length&&window.__xuperStreamInfo&&window.__xuperStreamInfo.availableTracks&&window.__xuperStreamInfo.availableTracks.length>0){
    try{
      for(var sIdx=0;sIdx<window.__xuperStreamInfo.availableTracks.length;sIdx++){
        var st=window.__xuperStreamInfo.availableTracks[sIdx];
        var sVal=st.audio||st.lang||st.language||st.name||"";
        if(sVal)addTrack(sIdx,sVal,st.name||"",false);
      }
    }catch(e){}
  }
  if(!hasRealStreamTracks&&!t.length){
    var isVod=("vod"===ke.playerMode)||("detail"===ke.screen)||(itm&&(itm.type==="teleplay"||itm.type==="movie"||itm.kind==="serie"||itm.kind==="película"||(typeof I==="function"&&I(itm))));
    if(isVod){
      var coreTracks=[
        {code:"es-lat",label:"Español Latino"},
        {code:"es-es",label:"Español España"},
        {code:"en",label:"Inglés"},
        {code:"pt",label:"Portugués"}
      ];
      for(var k=0;k<coreTracks.length;k++){
        addTrack(k,coreTracks[k].code,coreTracks[k].label,false);
      }
    }
  }
  if(!t.length){
    t=[{index:0,code:"orig",label:"Audio principal",_real:false}];
  }

  // Disambiguate duplicate generic labels (e.g. ["spa","spa","eng"] -> "Español (Pista 1)", "Español (Pista 2)", "Inglés")
  var labelCounts={};
  for(var lc=0;lc<t.length;lc++){
    var lblKey=t[lc].label;
    labelCounts[lblKey]=(labelCounts[lblKey]||0)+1;
  }
  var labelSeen={};
  for(var ld=0;ld<t.length;ld++){
    var baseLbl=t[ld].label;
    if(labelCounts[baseLbl]>1){
      labelSeen[baseLbl]=(labelSeen[baseLbl]||0)+1;
      t[ld].label=baseLbl+" (Pista "+labelSeen[baseLbl]+")";
    }
  }

  if(!Xi&&t.length){
    if(activeRealIdx!==null){
      for(var ai=0;ai<t.length;ai++){
        if(t[ai].index===activeRealIdx){$i=activeRealIdx;return t;}
      }
    }
    var defLatIdx=-1, defEspIdx=-1, defGenIdx=-1;
    for(var d=0;d<t.length;d++){
      var dLbl=(t[d].label||"").toLowerCase();
      var dCode=(t[d].code||"").toLowerCase();
      if(dLbl.indexOf("español latino")===0||/es[-_]?(419|mx|ar|co|pe|cl|lat)|esl|latino/i.test(dCode)){
        if(defLatIdx<0)defLatIdx=t[d].index;
      }else if(dLbl.indexOf("español españa")===0||/es[-_]?es|castell|esp(?!l)|spain|españa/i.test(dCode)){
        if(defEspIdx<0)defEspIdx=t[d].index;
      }else if(dLbl.indexOf("español")===0||/^(es|spa)/i.test(dCode)){
        if(defGenIdx<0)defGenIdx=t[d].index;
      }
    }
    var bestDef=(defLatIdx>=0?defLatIdx:(defEspIdx>=0?defEspIdx:(defGenIdx>=0?defGenIdx:t[0].index)));
    $i=bestDef;
  }

  return t;
}
function updatePsvAudio(){var row=r("psv-audio-row");if(!row)return;var wasInRow=ke.focus&&s(ke.focus,"#psv-audio-row");var focusedIndex=(ke.focus&&ke.focus._track)?ke.focus._track.index:null;var wasConfig=(ke.focus&&ke.focus.id==="psv-btn-config");var tracks=getAvailableAudioTracks();o(row);var buttons=[];for(var i=0;i<tracks.length;i++)(function(tr){var isSel=($i===tr.index);var btn=n("button","psv-btn focusable"+(isSel?" is-selected":""));var chk=n("span","psv-check","✔");chk.style.display=isSel?"block":"none";btn.appendChild(chk);btn.appendChild(document.createTextNode(tr.label));btn._track=tr;btn._activate=function(){$i=tr.index;Wa(tr.index,tr.code);cn("");showPlayerToast("Audio: "+tr.label);updatePsvAudio();za();wa();};row.appendChild(btn);buttons.push(btn);})(tracks[i]);var cfgBtn=n("button","psv-btn focusable psv-btn-config","Configuración");cfgBtn.id="psv-btn-config";cfgBtn._activate=function(){Ba()};row.appendChild(cfgBtn);bi=cfgBtn;if(wasInRow){if(wasConfig){Fe(cfgBtn,!0);}else if(focusedIndex!==null&&buttons[focusedIndex]){Fe(buttons[focusedIndex],!0);}else{var selBtn=buttons.filter(function(b){return b.classList.contains("is-selected")})[0]||buttons[0]||cfgBtn;if(selBtn)Fe(selBtn,!0);}}}function za(){if(Ai){o(Ai);var t=getAvailableAudioTracks();for(var i=0;i<t.length;i++)(function(tr){var btn=n("button","dps-btn focusable"+($i===tr.index?" is-selected":""));btn.textContent=tr.label;btn._activate=function(){$i=tr.index;Wa(tr.index,tr.code);cn("");showPlayerToast("Audio: "+tr.label);za();updatePsvAudio();wa();};Ai.appendChild(btn);})(t[i]);}}function getAvailableSubtitleTracks(){
  var list=[];var seenKeys={};
  function add(track){
    if(!track)return;
    var k=track.avIndex!==undefined?("av:"+track.avIndex):(track.hlsIndex!==undefined?("hls:"+track.hlsIndex):(track.url||track.lang||""));
    if(!k||seenKeys[k])return;
    seenKeys[k]=true;list.push(track);
  }
  var mObj=ia[ma(da())];var mSubs=ba(mObj)||[];
  for(var mi=0;mi<mSubs.length;mi++)add(mSubs[mi]);
  var curItem=da();
  if(curItem&&curItem.subtitles&&Array.isArray(curItem.subtitles)){
    for(var ci=0;ci<curItem.subtitles.length;ci++){var cs=curItem.subtitles[ci];add({lang:cs.lang||cs.language||"und",label:cs.label||cs.name||ja(cs.lang||""),url:cs.url||cs.fileUrl||cs.src,format:cs.format});}
  }
  if(ke.playerEpisode&&ke.playerEpisode.subtitles&&Array.isArray(ke.playerEpisode.subtitles)){
    for(var ei=0;ei<ke.playerEpisode.subtitles.length;ei++){var es=ke.playerEpisode.subtitles[ei];add({lang:es.lang||es.language||"und",label:es.label||es.name||ja(es.lang||""),url:es.url||es.fileUrl||es.src,format:es.format});}
  }
  if(window.__xuperSubtitles&&Array.isArray(window.__xuperSubtitles)){
    for(var xi=0;xi<window.__xuperSubtitles.length;xi++)add(window.__xuperSubtitles[xi]);
  }
  if(pe&&pe._hls&&pe._hls.subtitleTracks&&pe._hls.subtitleTracks.length){
    for(var hi=0;hi<pe._hls.subtitleTracks.length;hi++){var hTr=pe._hls.subtitleTracks[hi];var hLang=hTr.lang||hTr.name||("Pista "+(hi+1));add({lang:hLang,label:ja(hLang)||hTr.name||("Subtítulo "+(hi+1)),hlsIndex:hi});}
  }
  if(window.CactusAVPlay&&window.CactusAVPlay.isActive&&window.CactusAVPlay.isActive()&&window.CactusAVPlay.getSubtitleTracks){
    var avSubs=window.CactusAVPlay.getSubtitleTracks();
    for(var sIdx=0;sIdx<avSubs.length;sIdx++){var sObj=avSubs[sIdx];add({lang:sObj.name,label:ja(sObj.name||"")||("Subtítulo "+(sIdx+1)),avIndex:sObj.index});}
  }
  var hasSpanish=false, hasEnglish=false;
  for(var li=0;li<list.length;li++){
    var normL=String(list[li].label||list[li].lang||"").toLowerCase();
    if(/es|spa|castell|latino/.test(normL))hasSpanish=true;
    if(/en|eng|ingl/.test(normL))hasEnglish=true;
  }
  if(!hasSpanish)add({lang:"es-lat",label:"Español Latino",url:"media/subs/es.vtt",format:"vtt"});
  if(!hasEnglish)add({lang:"en",label:"Inglés",url:"media/subs/en.vtt",format:"vtt"});
  return list;
}
function toggleSubtitles(){
  var e=getAvailableSubtitleTracks();
  if(!e.length){
    showPlayerToast("No hay subtítulos disponibles para este contenido");
    Gi=false;Ji=true;window.__subtitlesEnabled=false;
    try{localStorage.setItem('xuper_subtitles_enabled','false');}catch(err){}
    if(ke.playback)ke.playback.subtitle=false;
    if(Di){Di.classList.remove("is-on");var diTxt=Di.querySelector(".dps-switch-text");if(diTxt)diTxt.textContent="OFF";}
    return;
  }
  Gi=!Gi;Ji=true;
  window.__subtitlesEnabled=Gi;
  try{localStorage.setItem('xuper_subtitles_enabled',Gi?'true':'false');}catch(err){}
  if(ke.playback)ke.playback.subtitle=Gi;
  if(Di){Di.classList.toggle("is-on",Gi);var txt=Di.querySelector(".dps-switch-text");if(txt)txt.textContent=Gi?"ON":"OFF";}
  cn("");
  showPlayerToast(Gi?"Subtítulos activados":"Subtítulos desactivados");
  if(!Gi){
    if(window.CactusAVPlay&&window.CactusAVPlay.setSubtitleTrack)window.CactusAVPlay.setSubtitleTrack(-1);
    if(pe&&pe._hls&&typeof pe._hls.subtitleTrack!=="undefined")pe._hls.subtitleTrack=-1;
    if(pe&&pe._captions&&pe._captions.select)pe._captions.select(-1);
    if(pe&&pe.textTracks){
      for(var tt=0;tt<pe.textTracks.length;tt++)pe.textTracks[tt].mode='disabled';
    }
    ta=[];Ki++;window.__lastLoadedSubUrl=null;
    var subEls=[r("player-subtitles"),r("subtitle-layer")];
    for(var sIdx=0;sIdx<subEls.length;sIdx++){
      if(subEls[sIdx]){subEls[sIdx].innerHTML="";subEls[sIdx].hidden=true;subEls[sIdx].style.display="none";}
    }
  }else{
    var subEls=[r("player-subtitles"),r("subtitle-layer")];
    for(var sIdx=0;sIdx<subEls.length;sIdx++){
      if(subEls[sIdx]){subEls[sIdx].hidden=false;subEls[sIdx].style.display="";}
    }
    if(!Qi&&e.length){
      var defSub=null;
      for(var si=0;si<e.length;si++){var sl=String(e[si].lang||e[si].label||"").toLowerCase();if(/es|spa|castell|latino/.test(sl)){defSub=e[si];break;}}
      Qi=defSub||e[0];
    }
    if(Qi){
      if(void 0!==Qi.avIndex&&window.CactusAVPlay&&window.CactusAVPlay.setSubtitleTrack){
        window.CactusAVPlay.setSubtitleTrack(Qi.avIndex);oa(null);
      }else if(void 0!==Qi.hlsIndex&&pe&&pe._hls){
        pe._hls.subtitleTrack=Qi.hlsIndex;oa(null);
      }else if(Qi.url){
        if(window.CactusAVPlay&&window.CactusAVPlay.setSubtitleTrack)window.CactusAVPlay.setSubtitleTrack(-1);
        if(pe&&pe._captions&&pe._captions.select&&typeof Qi._index==="number"){pe._captions.select(Qi._index);}
        oa(Qi);
      }
    }
  }
  la();
  Va();updatePsvSubtitles();wa();
}
function updatePsvSubStyle(){
  var rEl=r("psv-sub-style-row");
  if(rEl){
    var btns=rEl.querySelectorAll(".psv-btn");
    for(var i=0;i<btns.length;i++){
      var match=btns[i].getAttribute("data-style")===Zi;
      btns[i].classList.toggle("is-selected",match);
      var chk=btns[i].querySelector(".psv-check");
      if(chk)chk.style.display=match?"inline-block":"none";
    }
  }
  if(Bi){
    for(var dBtn=Bi.querySelectorAll(".dps-btn"),bl=0;bl<dBtn.length;bl++){
      var p=dBtn[bl].getAttribute("data-style");
      dBtn[bl].classList.toggle("is-selected",p===Zi);
    }
  }
}
function updatePsvSubSize(){
  var rEl=r("psv-sub-size-row");
  if(rEl){
    var btns=rEl.querySelectorAll(".psv-btn");
    for(var i=0;i<btns.length;i++){
      var match=btns[i].getAttribute("data-size")===Yi;
      btns[i].classList.toggle("is-selected",match);
      var chk=btns[i].querySelector(".psv-check");
      if(chk)chk.style.display=match?"inline-block":"none";
    }
  }
  if(Fi){
    for(var fBtn=Fi.querySelectorAll(".dps-btn"),fl=0;fl<fBtn.length;fl++){
      var s=fBtn[fl].getAttribute("data-size");
      fBtn[fl].classList.toggle("is-selected",s===Yi);
    }
  }
}
function updatePsvSubtitles(){
  var row=r("psv-subtitles-row");
  var sec=r("psv-sec-subtitles");
  var secStyle=r("psv-sec-sub-style");
  var secSize=r("psv-sec-sub-size");
  if(sec)sec.style.display="block";
  if(secStyle)secStyle.style.display="block";
  if(secSize)secSize.style.display="block";
  if(!row)return;
  var tracks=getAvailableSubtitleTracks();
  updatePsvSubStyle();
  updatePsvSubSize();
  var wasInRow=ke.focus&&s(ke.focus,"#psv-subtitles-row");
  var focusedText=ke.focus?ke.focus.textContent:"";
  o(row);
  var offBtn=n("button","psv-btn focusable"+(!Gi?" is-selected":""));
  var offChk=n("span","psv-check","✔");
  offChk.style.display=!Gi?"inline-block":"none";
  offBtn.appendChild(offChk);
  offBtn.appendChild(document.createTextNode("Desactivados"));
  offBtn._activate=function(){
    Gi=false;Ji=true;window.__subtitlesEnabled=false;
    try{localStorage.setItem('xuper_subtitles_enabled','false');}catch(e){}
    if(ke.playback)ke.playback.subtitle=false;
    if(window.CactusAVPlay&&window.CactusAVPlay.setSubtitleTrack)window.CactusAVPlay.setSubtitleTrack(-1);
    if(pe&&pe._hls&&typeof pe._hls.subtitleTrack!=="undefined")pe._hls.subtitleTrack=-1;
    if(pe&&pe._captions&&pe._captions.select)pe._captions.select(-1);
    if(pe&&pe.textTracks){
      for(var tt=0;tt<pe.textTracks.length;tt++)pe.textTracks[tt].mode='disabled';
    }
    ta=[];Ki++;window.__lastLoadedSubUrl=null;
    var subEls=[r("player-subtitles"),r("subtitle-layer")];
    for(var sIdx=0;sIdx<subEls.length;sIdx++){
      if(subEls[sIdx]){subEls[sIdx].innerHTML="";subEls[sIdx].hidden=true;subEls[sIdx].style.display="none";}
    }
    showPlayerToast("Subtítulos desactivados");
    updatePsvSubtitles();Va();wa();
  };
  row.appendChild(offBtn);
  var buttons=[offBtn];
  for(var i=0;i<tracks.length;i++)(function(tr){
    var isSel=!!Gi&&((Qi&&Qi.url&&tr.url&&Qi.url===tr.url)||(Qi&&void 0!==Qi.avIndex&&void 0!==tr.avIndex&&Qi.avIndex===tr.avIndex)||(Qi&&void 0!==Qi.hlsIndex&&void 0!==tr.hlsIndex&&Qi.hlsIndex===tr.hlsIndex));
    var btn=n("button","psv-btn focusable"+(isSel?" is-selected":""));
    var chk=n("span","psv-check","✔");
    chk.style.display=isSel?"inline-block":"none";
    btn.appendChild(chk);
    btn.appendChild(document.createTextNode(tr.label||ja(tr.lang||"Sub")));
    btn._track=tr;
    btn._activate=function(){
      Qi=tr;Gi=true;Ji=true;window.__subtitlesEnabled=true;
      try{localStorage.setItem('xuper_subtitles_enabled','true');}catch(e){}
      if(ke.playback)ke.playback.subtitle=true;
      var subEls=[r("player-subtitles"),r("subtitle-layer")];
      for(var sIdx=0;sIdx<subEls.length;sIdx++){
        if(subEls[sIdx]){subEls[sIdx].hidden=false;subEls[sIdx].style.display="";}
      }
      if(void 0!==tr.avIndex&&window.CactusAVPlay&&window.CactusAVPlay.setSubtitleTrack){
        window.CactusAVPlay.setSubtitleTrack(tr.avIndex);oa(null);
      }else if(void 0!==tr.hlsIndex&&pe&&pe._hls){
        pe._hls.subtitleTrack=tr.hlsIndex;oa(null);
      }else if(tr.url){
        if(window.CactusAVPlay&&window.CactusAVPlay.setSubtitleTrack)window.CactusAVPlay.setSubtitleTrack(-1);
        if(pe&&pe._captions&&pe._captions.select&&typeof tr._index==="number"){pe._captions.select(tr._index);}
        oa(tr);
      }
      la();
      showPlayerToast("Subtítulos: "+(tr.label||ja(tr.lang||"Sub")));
      updatePsvSubtitles();Va();wa();
    };
    row.appendChild(btn);buttons.push(btn);
  })(tracks[i]);
  if(wasInRow){
    var match=null;
    for(var b=0;b<buttons.length;b++){if(buttons[b].textContent===focusedText){match=buttons[b];break;}}
    if(!match)match=buttons.filter(function(b){return b.classList.contains("is-selected")})[0]||buttons[0];
    if(match)Fe(match,!0);
  }
}
function Va(){
  var e=getAvailableSubtitleTracks();
  if(!e.length){Gi=false;if(ke.screen==="player"&&ke.playerItem)window.__subtitlesEnabled=false;}
  if(Di){
    var t=Di.parentNode;if(t)t.classList.remove("is-hidden");
    Di.classList.toggle("is-on",!!Gi);
    var i=Di.querySelector(".dps-switch-text");if(i)i.textContent=Gi?"ON":"OFF";
    Di._activate=function(){toggleSubtitles();};
  }
  if(Pi)Pi.classList.toggle("is-visible",!!Gi);
  if(Ni)Ni.classList.toggle("is-visible",true);
  if(Ri)Ri.classList.toggle("is-visible",true);
  if(Gi&&Ui){
    o(Ui);
    for(var a=0;a<e.length;a++)(function(subTr){
      var isTrSel=!!Gi&&((Qi&&Qi.url&&subTr.url&&Qi.url===subTr.url)||(Qi&&void 0!==Qi.avIndex&&void 0!==subTr.avIndex&&Qi.avIndex===subTr.avIndex)||(Qi&&void 0!==Qi.hlsIndex&&void 0!==subTr.hlsIndex&&Qi.hlsIndex===subTr.hlsIndex));
      var btn=n("button","dps-btn focusable"+(isTrSel?" is-selected":""));
      btn.textContent=subTr.label||ja(subTr.lang||"Sub");
      btn._activate=function(){
        Qi=subTr;Gi=true;Ji=true;window.__subtitlesEnabled=true;
        var subEls=[r("player-subtitles"),r("subtitle-layer")];
        for(var sIdx=0;sIdx<subEls.length;sIdx++){
          if(subEls[sIdx]){subEls[sIdx].hidden=false;subEls[sIdx].style.display="";}
        }
        if(void 0!==subTr.avIndex&&window.CactusAVPlay&&window.CactusAVPlay.setSubtitleTrack){
          window.CactusAVPlay.setSubtitleTrack(subTr.avIndex);oa(null);
        }else if(void 0!==subTr.hlsIndex&&pe&&pe._hls){
          pe._hls.subtitleTrack=subTr.hlsIndex;oa(null);
        }else if(subTr.url){
          if(window.CactusAVPlay&&window.CactusAVPlay.setSubtitleTrack)window.CactusAVPlay.setSubtitleTrack(-1);
          if(pe&&pe._captions&&pe._captions.select&&typeof subTr._index==="number"){pe._captions.select(subTr._index);}
          oa(subTr);
        }
        cn("");showPlayerToast("Subtítulos: "+btn.textContent);
        Va();updatePsvSubtitles();wa();
      };
      Ui.appendChild(btn);
    })(e[a]);
  }
  if(Fi)for(var rBtn=Fi.querySelectorAll(".dps-btn"),fl=0;fl<rBtn.length;fl++){var s=rBtn[fl].getAttribute("data-size");rBtn[fl].classList.toggle("is-selected",s===Yi);}
  if(Bi)for(var dBtn=Bi.querySelectorAll(".dps-btn"),bl=0;bl<dBtn.length;bl++){var p=dBtn[bl].getAttribute("data-style");dBtn[bl].classList.toggle("is-selected",p===Zi);}
  updatePsvSubStyle();updatePsvSubSize();
}function ja(e){var t=(e||"").toLowerCase().trim().replace(/_/g,"-");if(/^(pt-br|por-br|brasil|brazil)/.test(t))return"Portugués (Brasil)";if(/^(pt-pt|por-pt|portugal)/.test(t))return"Portugués (Portugal)";if(/^(pt|por|portuguese|portugu[eé]s)/.test(t))return"Portugués";if(/^(es-es|castellano|esp|spain|españa|castilian)/.test(t))return"Español España";if(/^(es-(419|mx|ar|co|pe|cl|lat)|esl|lat|latino)/.test(t))return"Español Latino";if(/^(spa|es|spanish|español)$/.test(t))return"Español";if(/^(eng|ing|en|english|ingl[eé]s)/.test(t))return"Inglés";if(/^(jpn|jap|ja|japanese|japon[eé]s)/.test(t))return"Japonés";if(/^(kor|cor|ko|korean|coreano)/.test(t))return"Coreano";if(/^(fra|fre|fr|french|franc[eé]s)/.test(t))return"Francés";if(/^(ita|it|italian|italiano)/.test(t))return"Italiano";if(/^(deu|ger|de|german|alem[aá]n)/.test(t))return"Alemán";if(/^(chi|zho|zh|chinese|chino)/.test(t))return"Chino";if(/^(rus|ru|russian|ruso)/.test(t))return"Ruso";return t?(t.charAt(0).toUpperCase()+t.slice(1)):"Pista de audio"}function Wa(e,code){$i=e;Xi=!0;var targetLang=String(code||"").toLowerCase();var idxNum=Number(e);if(window.CactusAVPlay&&window.CactusAVPlay.isActive&&window.CactusAVPlay.isActive()){try{var avTracks=window.CactusAVPlay.getAudioTracks?window.CactusAVPlay.getAudioTracks():[];var targetIdx=-1;if(avTracks&&avTracks.length>0&&isFinite(idxNum)){for(var ex=0;ex<avTracks.length;ex++){if(Number(avTracks[ex].index)===idxNum){targetIdx=idxNum;break;}}}if(targetIdx<0&&avTracks&&avTracks.length>0){if(!targetLang){targetLang=(0===e?"es-lat":(1===e?"es-es":(2===e?"en":"pt")));}for(var a=0;a<avTracks.length;a++){var at=avTracks[a];var info=String((at.details&&(at.details.language||at.details.track_lang||at.details.lang||at.details.title))||at.name||"").toLowerCase();if(/es-?es|castell|españa|spain|esp(?!l)/i.test(targetLang)){if(/es-?es|castell|españa|spain|esp(?!l)/i.test(info)){targetIdx=at.index;break;}}else if(/es-?lat|lat|419|esl/i.test(targetLang)){if(/es-?lat|lat|419|esl/i.test(info)){targetIdx=at.index;break;}}else if(/pt|por/i.test(targetLang)){if(/pt|por|bra[sz]/i.test(info)){targetIdx=at.index;break;}}else if(/en|ing/i.test(targetLang)){if(/en|ing/i.test(info)){targetIdx=at.index;break;}}}if(targetIdx<0&&/es|spa/.test(targetLang)){var spTracks=[];for(var s=0;s<avTracks.length;s++){var sInfo=String((avTracks[s].details&&(avTracks[s].details.language||avTracks[s].details.track_lang||avTracks[s].details.lang||avTracks[s].details.title))||avTracks[s].name||"").toLowerCase();if(/es|spa|castell|latino/i.test(sInfo)){spTracks.push(avTracks[s]);}}if(spTracks.length>1){targetIdx=(/es-?es|castell|esp/i.test(targetLang))?spTracks[0].index:spTracks[1].index;}else if(spTracks.length===1){targetIdx=spTracks[0].index;}}}if(targetIdx>=0){window.CactusAVPlay.setAudioTrack(targetIdx);}else{window.CactusAVPlay.setAudioTrack(e);}}catch(err){console.warn("[AVPlay setAudioTrack err]",err);}}else if(pe&&pe._hls&&typeof pe._hls.audioTrack!=="undefined"){try{var hTracks=pe._hls.audioTracks||[];if(hTracks.length>0&&isFinite(idxNum)&&idxNum>=0&&idxNum<hTracks.length){pe._hls.audioTrack=idxNum;}else if(hTracks.length>1){if(!targetLang){targetLang=(0===e?"es-lat":(1===e?"es-es":(2===e?"en":"pt")));}var matched=-1;for(var h=0;h<hTracks.length;h++){var hl=String(hTracks[h].lang||hTracks[h].name||"").toLowerCase();if(/es-?es|castell|españa|spain|esp(?!l)/i.test(targetLang)){if(/es-?es|castell|españa|spain|esp(?!l)/i.test(hl)){matched=h;break;}}else if(/es-?lat|lat|419|esl/i.test(targetLang)){if(/es-?lat|lat|419|esl/i.test(hl)){matched=h;break;}}else if(/pt|por/i.test(targetLang)){if(/pt|por|bra[sz]/i.test(hl)){matched=h;break;}}else if(/en|ing/i.test(targetLang)){if(/en|ing/i.test(hl)){matched=h;break;}}}if(matched<0&&/es|spa/.test(targetLang)){var spHLSTracks=[];for(var sh=0;sh<hTracks.length;sh++){var shl=String(hTracks[sh].lang||hTracks[sh].name||"").toLowerCase();if(/es|spa|castell|latino/i.test(shl)){spHLSTracks.push(sh);}}if(spHLSTracks.length>1){matched=(/es-?es|castell|esp/i.test(targetLang))?spHLSTracks[0]:spHLSTracks[1];}else if(spHLSTracks.length===1){matched=spHLSTracks[0];}}pe._hls.audioTrack=(matched>=0?matched:Math.min(e,hTracks.length-1));}else{pe._hls.audioTrack=e;}}catch(err){}}else if(pe&&pe._cactusAudio&&typeof pe._cactusAudio.select==="function"){try{var cTracks=pe._cactusAudio.tracks||[];var cMatched=(isFinite(idxNum)&&idxNum>=0&&idxNum<cTracks.length)?idxNum:-1;if(cMatched<0&&cTracks.length>0){if(!targetLang){targetLang=(0===e?"es-lat":(1===e?"es-es":(2===e?"en":"pt")));}for(var c=0;c<cTracks.length;c++){var cl=String(cTracks[c].lang||cTracks[c].label||"").toLowerCase();if(/es-?es|castell|españa|spain|esp(?!l)/i.test(targetLang)){if(/es-?es|castell|españa|spain|esp(?!l)/i.test(cl)){cMatched=c;break;}}else if(/es-?lat|lat|419|esl/i.test(targetLang)){if(/es-?lat|lat|419|esl/i.test(cl)){cMatched=c;break;}}else if(/pt|por/i.test(targetLang)){if(/pt|por|bra[sz]/i.test(cl)){cMatched=c;break;}}else if(/en|ing/i.test(targetLang)){if(/en|ing/i.test(cl)){cMatched=c;break;}}}if(cMatched<0&&/es|spa/.test(targetLang)){for(var cs=0;cs<cTracks.length;cs++){var csl=String(cTracks[cs].lang||cTracks[cs].label||"").toLowerCase();if(/^(es|spa)|español|castell|latino/i.test(csl)){cMatched=cs;break;}}}}if(cMatched>=0&&cMatched<cTracks.length){$i=cMatched;Promise.resolve(pe._cactusAudio.select(cMatched)).then(function(){try{if(Vi)updatePsvAudio();if(ji)za();}catch(_){}},function(err){console.warn("[CactusAudio select err]",err);showPlayerToast("No se pudo cambiar a esa pista de audio");});}else{showPlayerToast("Pista no disponible en este episodio");}}catch(err){}}else if(pe&&pe.audioTracks&&pe.audioTracks.length){try{for(var i=0;i<pe.audioTracks.length;i++)pe.audioTracks[i].enabled=(i===e);}catch(err){}}else if("player"===ke.screen&&pe&&en){var t=tn+(pe.currentTime||0);pn(en+"?start="+Math.floor(t)+"&a="+e);}}function $a(){if(pe){var e=en?tn+(pe.currentTime||0):pe.currentTime||0,t=ke.playerItem;dn(),cn("Cambiando reproductor…"),un(t,function(t){if(t){if(-1!==t.indexOf(":8787/s/")){var i=t+"?start="+Math.floor(e);$i&&(i+="&a="+$i),pn(i)}else if(pn(t),e>0)try{pe.currentTime=e}catch(e){}}else ke.streamError||cn("Sin fuente de reproducción")})}}function Xa(){if(se=r("player-stage"),de=r("player-infobar"),ve=r("player-vod-infobar"),ce=r("player-channels"),pe=r("player-video"),fe=r("player-status"),Se=r("player-osd-icon"),ue=se?se.querySelector(".player-frame"):null,he=r("vod-infobar-poster"),me=r("vod-infobar-title"),ge=r("vod-time-current"),ye=r("vod-time-total"),be=r("vod-seek-progress"),Ce=r("vod-seek-buffered"),we=r("vod-seek-thumb"),hi=r("player-playsetting-view"),gi=r("psv-sec-selection"),yi=r("psv-episodes-row"),Li=r("psv-btn-episodes"),bi=r("psv-btn-config"),Ci=r("psv-btn-p1"),wi=r("psv-btn-p2"),Si=r("psv-sec-audio"),r("psv-sec-quality"),r("psv-quality-row"),r("psv-sec-aspect"),r("psv-sec-player"),xi=r("psv-btn-feedback"),_i=r("psv-aspect-row"),ki=r("player-episodes"),Ii=r("pe-title"),Ti=r("pe-sub"),Ei=r("pe-seasons"),Mi=r("pe-seasons-col"),qi=r("pe-episodes"),Oi=r("pe-season-label"),Li&&(Li._activate=function(){Ma()}),xi&&(xi._activate=function(){wa()}),bi&&(bi._activate=function(){Ba()}),Ci&&(Ci._activate=function(){fa(da(),!0),Ra(),wa(),$a()}),wi&&(wi._activate=function(){fa(da(),!1),Ra(),wa(),$a()}),_i)for(var e=_i.querySelectorAll(".psv-btn"),t=0;t<e.length;t++)(function(e){e._activate=function(){Fa(e.getAttribute("data-aspect"))}})(e[t]);
var psvStyleRow=r("psv-sub-style-row");if(psvStyleRow)for(var sBtns=psvStyleRow.querySelectorAll(".psv-btn"),sb=0;sb<sBtns.length;sb++)(function(btn){btn._activate=function(){Zi=btn.getAttribute("data-style")||"white";try{localStorage.setItem('xuper_sub_style',Zi);}catch(e){}if(ke.playback)ke.playback.style=(Zi==="white"?0:(Zi==="yellow"?1:2));la();updatePsvSubStyle();Va();showPlayerToast("Formato: "+(btn.textContent||"").replace("✔","").trim());};})(sBtns[sb]);
var psvSizeRow=r("psv-sub-size-row");if(psvSizeRow)for(var zBtns=psvSizeRow.querySelectorAll(".psv-btn"),zb=0;zb<zBtns.length;zb++)(function(btn){btn._activate=function(){Yi=btn.getAttribute("data-size")||"normal";try{localStorage.setItem('xuper_sub_size',Yi);}catch(e){}if(ke.playback)ke.playback.size=(Yi==="normal"?0:(Yi==="big"?1:2));la();updatePsvSubSize();Va();showPlayerToast("Tamaño: "+(btn.textContent||"").replace("✔","").trim());};})(zBtns[zb]);if(mi=r("dialog-playsettings"),Ai=r("dps-audio-options"),Di=r("dps-sub-switch"),Pi=r("dps-row-lang"),Ni=r("dps-row-size"),Ri=r("dps-row-style"),Ui=r("dps-lang-options"),Fi=r("dps-size-options"),Bi=r("dps-style-options"),Hi=r("dps-btn-exit"),zi=r("player-subtitles"),Di&&(Di._activate=function(){toggleSubtitles();}),Fi)for(var i=Fi.querySelectorAll(".dps-btn"),a=0;a<i.length;a++)(function(e){e._activate=function(){Yi=e.getAttribute("data-size")||"normal";try{localStorage.setItem("xuper_sub_size",Yi);}catch(err){}if(ke.playback)ke.playback.size=(Yi==="normal"?0:(Yi==="big"?1:2));la();Va();updatePsvSubSize();}})(i[a]);if(Bi)for(var l=Bi.querySelectorAll(".dps-btn"),s=0;s<l.length;s++)(function(e){e._activate=function(){Zi=e.getAttribute("data-style")||"white";try{localStorage.setItem("xuper_sub_style",Zi);}catch(err){}if(ke.playback)ke.playback.style=(Zi==="white"?0:(Zi==="yellow"?1:2));la();Va();updatePsvSubStyle();}})(l[s]);Hi&&(Hi._activate=function(){Ha()}),la(),Fa(ea),o(de),o(ce),se.classList.add("focusable"),se._onMove=function(e){return"vod"===ke.playerMode?("left"===e?(si(-10),!0):"right"===e?(si(10),!0):"down"===e?(Sa(),!0):"up"===e&&(ke.infobar?ui():pi(),!0)):("left"===e||"right"===e?(wn(!1),!0):"up"===e?(St(ke.channel-1),!0):"down"===e&&(St(ke.channel+1),!0))},se._activate=function(){"vod"===ke.playerMode?di():wn(!1)};var piLogo=n("div","pi-logo"),piIndex=n("div","pi-index"),piName=n("div","pi-name"),piStar=n("button","pi-star focusable","☆");piStar.style.display="block";piStar.setAttribute("tabindex","0"),piStar._activate=function(){var curCh=z[ke.channel];if(curCh){var added=toggleChannelFavorite(curCh),isFav=isChannelFavorite(curCh);if(isFav){piStar.style.display="none";showPlayerToast("⭐ Agregado a favoritos");Fe(se);}else{piStar.style.display="block";piStar.textContent="☆";showPlayerToast("Eliminado de favoritos");}(rt&&(rt.id==="favorites"||rt.isFavorite))&&loadFavoritesCategory(function(){Ja();}),ci()}},piStar._onMove=function(dir){if("left"===dir||"right"===dir)return Fe(se),ci(),!0;if("up"===dir)return ke.channel>0?St(ke.channel-1,!1):z.length&&St(z.length-1,!1),pi(),!0;if("down"===dir)return ke.channel<z.length-1?St(ke.channel+1,!1):z.length&&St(0,!1),pi(),!0;return!1;},de.appendChild(piLogo),de.appendChild(piIndex),de.appendChild(piName),de.appendChild(piStar);var y=n("div","pc-header");
y.appendChild(n("div","pc-title","CANALES"));
ce.appendChild(y);var C=n("div","pc-categories scrollable");C.id="pc-categories",ce.appendChild(C),ce.appendChild(n("div","pc-div"));var w=n("div","pc-list scrollable");ce.appendChild(w),Qa(),Ja();var S=n("div","pc-menu");S.appendChild(n("div","ic")),S.appendChild(n("div","l1","Presione [OK] para reproducir")),S.appendChild(n("div","l2","(Izquierda: Categorías • Derecha: Salir • Arriba/Abajo: Canales)")),ce.appendChild(S)}var __chLogoPauseTimer=null;
function updateVisibleChannelLogos(targetEl,immediate){
  if(__chLogoPauseTimer){clearTimeout(__chLogoPauseTimer);__chLogoPauseTimer=null;}
  var elapsed=Date.now()-__lastNavInputTs;
  if(!immediate&&elapsed<150){
    __chLogoPauseTimer=setTimeout(function(){
      __chLogoPauseTimer=null;
      updateVisibleChannelLogos(targetEl,!1);
    },155-elapsed);
    return;
  }
  if(!ce)return;
  var p=ce.querySelector(".pc-list");
  if(!p||!De||!De.length)return;
  var curIdx=-1;
  if(targetEl&&void 0!==targetEl._channel){
    curIdx=targetEl._channel;
  }else if(ke.focus&&void 0!==ke.focus._channel){
    curIdx=ke.focus._channel;
  }
  var startIdx=0,endIdx=Math.min(De.length-1,25);
  if(curIdx>=0){
    startIdx=Math.max(0,curIdx-12);
    endIdx=Math.min(De.length-1,curIdx+16);
  }else{
    var rowH=95;
    var top=p.scrollTop||0;
    startIdx=Math.max(0,Math.floor(top/rowH)-6);
    endIdx=Math.min(De.length-1,Math.ceil((top+(p.clientHeight||750))/rowH)+14);
  }
  for(var i=startIdx;i<=endIdx;i++){
    var row=De[i];
    if(row&&row._logoImg&&row._logoImg._src&&!row._logoImg._loaded){
      (function(im){
        im._loaded=!0;
        im.onerror=function(){this.style.display="none";};
        im.src=im._src;
      })(row._logoImg);
    }
  }
}
function scrollChannelIntoView(el){if(!el)return;var p=el.parentNode;if(!p)return;var top=el.offsetTop,h=el.offsetHeight;if(top<p.scrollTop+40){p.scrollTop=Math.max(0,top-60);}else if(top+h>p.scrollTop+p.clientHeight-40){p.scrollTop=top+h-p.clientHeight+60;}updateVisibleChannelLogos(el);}function showCategoryLoading(catName){if(!ce)return;var pcList=ce.querySelector(".pc-list");if(!pcList)return;o(pcList);De=[];var wrap=n("div","pc-loading-channels"),sp=n("div","pc-loading-spinner"),tx=n("div","pc-loading-text","Cargando "+(catName||"canales")+"…");wrap.appendChild(sp),wrap.appendChild(tx),pcList.appendChild(wrap);}function Qa(){
  if(ce){
    var e=ce.querySelector(".pc-categories");
    if(e){
      var wasInCats=!!s(ke.focus,".pc-categories"),oldCatId=(ke.focus&&ke.focus._cat)?ke.focus._cat.id:(rt?rt.id:null);
      o(e);
      var rawCats = (nt && nt.length) ? nt.slice() : [
        {id:76182,name:"Todos"},{id:"epic_events",name:"Deportes En Vivo",isEpicEvents:!0},{id:"espn",name:"ESPN",isEspn:!0},{id:76206,name:"Deportes"},
        {id:76188,name:"Colombia",countryFolder:"Colombia",m3uUrl:"https://cdn.jsdelivr.net/gh/iptv-org/iptv@gh-pages/countries/co.m3u"},{id:76191,name:"España",countryFolder:"España",m3uUrl:"https://cdn.jsdelivr.net/gh/iptv-org/iptv@gh-pages/countries/es.m3u"},{id:76197,name:"México",countryFolder:"México",m3uUrl:"https://cdn.jsdelivr.net/gh/iptv-org/iptv@gh-pages/countries/mx.m3u"},{id:76205,name:"Cine y Series"},{id:79146,name:"Infantil"}
      ];
      var normalCats = [];
      for(var nc=0; nc<rawCats.length; nc++){
        var cItem = rawCats[nc];
        if(!cItem) continue;
        if(cItem.id === "search" || cItem.isSearch || cItem.id === "favorites" || cItem.isFavorite) continue;
        normalCats.push(cItem);
      }
      var todosIdx = -1;
      for(var ti=0; ti<normalCats.length; ti++){
        if(normalCats[ti].id === 76182 || normalCats[ti].name === "Todos"){
          todosIdx = ti;
          break;
        }
      }
      var todosItem = {id:76182, name:"Todos"};
      if(todosIdx >= 0){
        todosItem = normalCats.splice(todosIdx, 1)[0];
      }
      var t = [
        {id: "search", name: "🔍 Buscar", isSearch: true},
        todosItem,
        {id: "favorites", name: "⭐ Favoritos", isFavorite: true}
      ].concat(normalCats);
      nt = t;
      if(!rt) rt = todosItem;

      for(var i=[], a=0; a<t.length; a++){
        var rCat = t[a];
        var l = n("button", "pc-cat-pill focusable" + (rCat.isSearch ? " is-search" : rCat.isFavorite ? " is-favorite" : ""), rCat.name);
        l._cat = rCat;
        l._idx = a;
        if(rt ? rt.id === rCat.id : (rCat.id === 76182 || a === 2)) l.classList.add("is-selected");

        if(rCat.isSearch){
          l._activate = function(){
            openLiveChannelSearch("internal");
          };
        } else if(rCat.isFavorite){
          l._activate = (function(cat, pill){
            return function(){
              for(var p=0; p<i.length; p++) i[p].classList.remove("is-selected");
              pill.classList.add("is-selected");
              rt = cat;
              loadFavoritesCategory(function(){
                Ja();
                if(De.length){
                  Fe(De[0]);
                  scrollChannelIntoView(De[0]);
                }
              });
            };
          })(rCat, l);
        } else {
          l._activate = (function(cat, pill){
            return function(){
              if(rt && rt.id === cat.id && !window.__categoryLoading && De && De.length){
                var cur = De.filter(function(x){ return x._channel === ke.channel; })[0] || De[0];
                if(cur){ Fe(cur); scrollChannelIntoView(cur); }
                return;
              }
              if(window.__categoryLoading && rt && rt.id === cat.id) return;
              for(var p=0; p<i.length; p++) i[p].classList.remove("is-selected");
              pill.classList.add("is-selected");
              showCategoryLoading(cat.name);
              window.__categoryLoading = !0;
              var targetId = cat.id;
              var onLoaded = function(){
                window.__categoryLoading = !1;
                if(rt && rt.id === targetId){
                  Ja();
                  setTimeout(function(){
                    if(De && De.length){
                      var cur = De.filter(function(x){ return x._channel === ke.channel; })[0] || De[0];
                      Fe(cur);
                      scrollChannelIntoView(cur);
                    }
                  }, 50);
                }
              };
              gt(cat, onLoaded);
            };
          })(rCat, l);
        }

        l._onMove = (function(catIdx, cat, pill){
          return function(dir){
            if("up" === dir){
              if(catIdx > 0 && i[catIdx-1]){
                Fe(i[catIdx-1]);
                Ga(e, i[catIdx-1]);
                return !0;
              }
              return !0;
            }
            if("down" === dir){
              if(catIdx < i.length-1 && i[catIdx+1]){
                Fe(i[catIdx+1]);
                Ga(e, i[catIdx+1]);
                return !0;
              }
              return !0;
            }
            if("left" === dir){
              Sn();
              return !0;
            }
            if("right" === dir){
              if(cat.isSearch){
                if(De && De.length){
                  Fe(De[0]);
                  scrollChannelIntoView(De[0]);
                  return !0;
                }
                return !0;
              }
              if(window.__categoryLoading) return !0;
              if(rt && rt.id === cat.id && De && De.length){
                var cur = De.filter(function(x){ return x._channel === ke.channel; })[0] || De[0];
                if(cur){ Fe(cur); scrollChannelIntoView(cur); return !0; }
              } else {
                pill._activate && pill._activate();
                return !0;
              }
              return !0;
            }
            return !1;
          };
        })(a, rCat, l);

        e.appendChild(l);
        i.push(l);
      }
      if(wasInCats && i.length){
        var match = i.filter(function(x){ return x._cat && x._cat.id === (rt ? rt.id : oldCatId); })[0] ||
                    i.filter(function(x){ return x.classList.contains("is-selected"); })[0] || i[0];
        if(match){ Fe(match); Ga(e, match); }
      }
    }
  }
}
function Ga(e,t){if(e&&t){if(e.classList&&e.classList.contains("pc-categories")){var vt=t.offsetTop,vh=t.offsetHeight,vs=e.scrollTop,vc=e.clientHeight;vt<vs?e.scrollTop=Math.max(0,vt-12):vt+vh>vs+vc&&(e.scrollTop=vt+vh-vc+12);return;}var i=t.offsetLeft,a=t.offsetWidth,n=e.scrollLeft,r=e.clientWidth;i<n?e.scrollLeft=i-20:i+a>n+r&&(e.scrollLeft=i+a-r+20)}}function Ja(){
  if(ce){
    var e=ce.querySelector(".pc-list");
    if(!e)return;
    var wasInList=!!s(ke.focus,".pc-list"),oldCh=(ke.focus&&void 0!==ke.focus._channel)?ke.focus._channel:ke.channel;
    o(e);
    De=[];
    if(window.__jaBatchTimer){clearTimeout(window.__jaBatchTimer);window.__jaBatchTimer=null;}
    if(!z.length){
      var emptyMsgText=(rt&&(rt.id==="favorites"||rt.isFavorite))?"No hay canales en Favoritos. Agregue canales manteniendo presionado [OK] o con el botón Amarillo.":"No hay canales disponibles en esta categoría";
      var a=n("div","pc-empty-channels",emptyMsgText);
      return a.style.padding="30px 20px",a.style.color="#94a3b8",a.style.fontSize="20px",a.style.textAlign="center",void e.appendChild(a);
    }
    var count=z.length;
    var targetCh=(wasInList&&oldCh>=0&&oldCh<count)?oldCh:(ke.channel>=0&&ke.channel<count?ke.channel:0);
    var initialLimit=Math.min(count,Math.max(45,targetCh+30));
    var currentRendered=0;

    function renderRow(chIdx){
      var curCh=z[chIdx];
      var l=n("div","pc-row focusable");
      l._channel=chIdx;
      var sDiv=n("div","ic");
      if(curCh.logo){
        var img=n("img","ic-logo");
        img.alt="";
        if(0===String(curCh.logo).indexOf("media/")){
          img.src=curCh.logo;
          img._loaded=!0;
        }else{
          img._src=curCh.logo;
        }
        sDiv.appendChild(img);
        l._logoImg=img;
      }
      var c=n("div","num",d(curCh.index||chIdx+1)),p=n("div","nm",curCh.name);
      l.appendChild(sDiv),l.appendChild(c),l.appendChild(p);
      if(chIdx===ke.channel)l.classList.add("is-current");
      l._activate=function(){St(chIdx,!0),Sn(),Fe(se)};
      l._onMove=function(dir){
        if("right"===dir)return Sn(),!0;
        if("left"===dir){
          var pill=ce.querySelector(".pc-cat-pill.is-selected")||ce.querySelector(".pc-cat-pill");
          return pill&&Fe(pill),!0;
        }
        if("up"===dir){
          if(chIdx>0&&De[chIdx-1]){Fe(De[chIdx-1]);scrollChannelIntoView(De[chIdx-1]);return!0;}
          var pill=ce.querySelector(".pc-cat-pill.is-selected")||ce.querySelector(".pc-cat-pill");
          return pill&&Fe(pill),!0;
        }
        if("down"===dir){
          if(chIdx<count-1){
            if(chIdx>=De.length-8&&currentRendered<count){
              renderBatchSync(Math.min(count,currentRendered+40));
            }
            if(De[chIdx+1]){Fe(De[chIdx+1]);scrollChannelIntoView(De[chIdx+1]);return!0;}
          }
          return!0;
        }
        return!1;
      };
      return l;
    }

    function renderBatchSync(limit){
      if(currentRendered>=limit)return;
      var frag=document.createDocumentFragment();
      for(var i=currentRendered;i<limit;i++){
        var row=renderRow(i);
        frag.appendChild(row);
        De.push(row);
      }
      currentRendered=limit;
      e.appendChild(frag);
    }

    renderBatchSync(initialLimit);
    e.onscroll=function(){updateVisibleChannelLogos();};

    if(wasInList&&De.length){
      var targetRow=De.filter(function(x){return x._channel===oldCh;})[0]||De.filter(function(x){return x._channel===ke.channel;})[0]||De[0];
      if(targetRow){Fe(targetRow);scrollChannelIntoView(targetRow);updateVisibleChannelLogos(targetRow,!0);}
    }else{
      var targetRow=De.filter(function(x){return x._channel===ke.channel;})[0]||De[0];
      if(targetRow){scrollChannelIntoView(targetRow);updateVisibleChannelLogos(targetRow,!0);}
    }

    var jaTier=(window.XuperEngineConfig&&window.XuperEngineConfig.tier)||"mid";
    var batchChunk=("legacy"===jaTier)?30:45;
    var batchDelay=("legacy"===jaTier)?55:25;
    function scheduleNextBatch(){
      if(currentRendered>=count)return;
      window.__jaBatchTimer=setTimeout(function(){
        window.__jaBatchTimer=null;
        if(Date.now()-__lastNavInputTs<200){
          scheduleNextBatch();
          return;
        }
        var nextLimit=Math.min(count,currentRendered+batchChunk);
        renderBatchSync(nextLimit);
        if(currentRendered<count){
          scheduleNextBatch();
        }
      },batchDelay);
    }
    if(currentRendered<count){
      scheduleNextBatch();
    }
  }
}
var Ka="",Ya="",Za=0,en="",tn=0,an=0,nn=null,rn=!1,on=null;function ln(){rn=!1,on&&(clearTimeout(on),on=null)}function sn(){if(nn=null,pe&&an){if(en){if(rn)return void(an=0);rn=!0;var e=tn+(pe.currentTime||0),t=Math.max(0,e+an);an=0;var i=ke.playerItem&&ke.playerItem.duration||pe.duration||0;i>0&&t>i-2&&(t=Math.max(0,i-2)),tn=Math.floor(t);var a=en+"?start="+tn;return on=setTimeout(ln,12e3),void pn(a)}var n=(pe.currentTime||0)+an;an=0;var r=pe.duration||0;n<0&&(n=0),r>0&&n>r-1&&(n=r-1);try{pe.currentTime=n}catch(e){}}else an=0}/* duplicate si removed */function dn(){window.__xeActiveLiveCh=null;stopPlayerTicker();if(nextEpAutoTimer){clearTimeout(nextEpAutoTimer);nextEpAutoTimer=null;}episodeCompletionFired=!1;saveXuperHistory(window.__simulatedCurrentTime||0,(pe&&pe.duration)||7200,true);try{if(pe&&pe._stallCheckTimer){clearTimeout(pe._stallCheckTimer);pe._stallCheckTimer=null;}}catch(e){}try{if(pe&&pe._pulseraRevealTimer){clearInterval(pe._pulseraRevealTimer);pe._pulseraRevealTimer=null;}}catch(e){}if(pe){pe._pulseraHoldLoader=false;pe._pulseraStartAligned=false;pe._pulseraPlayStartTs=0;pe._pulseraPlayStartPos=0;try{pe.style.opacity="";}catch(e){}}try{if(pe&&pe._hlsInstance){pe._hlsInstance.destroy();pe._hlsInstance=null;}}catch(e){}try{if(window.XuperMediaUtils&&typeof window.XuperMediaUtils.stopDirectFmp4Live==="function")window.XuperMediaUtils.stopDirectFmp4Live();}catch(e){}try{if(window.CactusVODBrowser&&typeof window.CactusVODBrowser.stop==="function")window.CactusVODBrowser.stop();}catch(e){}try{if(window.CactusLiveTV&&typeof window.CactusLiveTV.stop==="function")window.CactusLiveTV.stop();}catch(e){}try{if(window.CactusAVPlay&&typeof window.CactusAVPlay.stop==="function")window.CactusAVPlay.stop();}catch(e){}ke.streamError="",cn(""),hideLiveChannelLoader(),li("none"),ri(),nn&&(clearTimeout(nn),nn=null,an=0),ln(),en="",tn=0,Za++;var e=Ka;if(!e&&Ya&&-1!==Ya.indexOf("127.0.0.1")){var t=/^(http:\/\/127\.0\.0\.1:\d+)/.exec(Ya);t&&(e=t[1])}if(e)try{var i=new XMLHttpRequest;i.open("GET",e+"/media/abort",!0),i.send()}catch(e){}try{D("abortMedia",{},function(){})}catch(e){}if(Ya="",Ka="",pe){pe.onerror=null;try{pe.pause()}catch(e){}try{pe.currentTime=0}catch(e){}pe.removeAttribute("src");for(;pe.firstChild;)pe.removeChild(pe.firstChild);pe.classList.remove("is-active"),ue&&(ue.style.display="block")}}var liveWatchdogTimer=null;
function showLiveChannelLoader(chName){
  var ldr=r("player-live-loader");
  if(ldr){
    var chEl=r("live-loader-channel");
    if(chEl) chEl.textContent = chName ? "Cargando " + chName + "…" : "Cargando señal…";
    ldr.classList.add("is-visible");
  }
}
function hideLiveChannelLoader(){
  var ldr=r("player-live-loader");
  if(ldr){ldr.classList.remove("is-visible");ldr.classList.remove("is-solid-curtain");}
}
function clearLiveWatchdog(){
  if(liveWatchdogTimer){clearTimeout(liveWatchdogTimer);liveWatchdogTimer=null;}
}
function startLiveWatchdog(reqId){
  clearLiveWatchdog();
  liveWatchdogTimer=setTimeout(function(){
    liveWatchdogTimer=null;
    if("player"===ke.screen&&"live"===ke.playerMode&&mn===reqId){
      var isHtmlPlaying=pe&&!pe.paused&&pe.currentTime>0;
      var isLivePlaying=(window.CactusLiveTV&&window.CactusLiveTV.active&&window.CactusLiveTV.active())||(window.CactusAVPlay&&window.CactusAVPlay.isActive&&window.CactusAVPlay.isActive());
      if(!isHtmlPlaying&&!isLivePlaying&&!window.__liveHasPlayed){
        hideLiveChannelLoader();
        ke.streamError="Tiempo de espera de señal agotado";
        cn(ke.streamError,!0);
      }
    }
  },25000);
}
window.__onStreamPlaying=function(){
  window.__liveConnecting=!1;
  window.__liveHasPlayed=!0;
  clearLiveWatchdog();
  hideLiveChannelLoader();
  ke.streamError="";
  cn("");
  if("vod"===ke.playerMode&&ke.playerItem){try{Ca(ke.playerItem);}catch(e){}}
};
window.__onStreamError=function(err){
  var errStr=String(err&&err.message||err||"");
  if(/cancelad/i.test(errStr))return;
  if(pe){pe._pulseraHoldLoader=false;if(pe._pulseraRevealTimer){clearInterval(pe._pulseraRevealTimer);pe._pulseraRevealTimer=null;}try{pe.style.opacity="";}catch(_){}}
  hideLiveChannelLoader();
  if("player"===ke.screen||("detail"===ke.screen&&"vod"===ke.playerMode)){
    if("live"===ke.playerMode){
      clearLiveWatchdog();
      ke.streamError=errStr||"Canal no disponible por el momento";
      cn(ke.streamError,!0);
    } else if("vod"===ke.playerMode){
      ke.streamError=errStr||"No se pudo reproducir el video";
      cn(ke.streamError,!0);
    }
  }
};
function cn(e,isError){if(e&&/cancelad/i.test(String(e))){ke.streamError="";return;}if(e&&!isError&&"live"===ke.playerMode){var ldrEl=r("player-live-loader");if(ldrEl&&ldrEl.classList.contains("is-visible"))return;}fe||(fe=r("player-status")),fe&&(e?(fe.textContent=e,fe.classList.add("is-active"),fe.classList.toggle("is-error",!!isError)):(fe.textContent="",fe.classList.remove("is-active","is-error")))}function pn(e){window.pn=pn;if(pe&&e){e=String(e).replace(/^(https:\/\/[^\/]+):443(\/|$)/i,"$1$2");Ya=e;if(e.indexOf("__cactus_")===0||e.indexOf(".invalid")!==-1){cn("");pe.classList.add("is-active");if(ue)ue.style.display="none";return;}var savedLiveCh="live"===ke.playerMode?window.__xeActiveLiveCh:null;dn();if(savedLiveCh)window.__xeActiveLiveCh=savedLiveCh;var t=/^(http:\/\/127\.0\.0\.1:\d+)/.exec(e);if(t&&(Ka=t[1]),-1!==e.indexOf(":8787/s/")){en=e.split("?")[0];var i=/[?&]start=(\d+)/.exec(e);tn=i?parseInt(i[1],10):0}else en="",tn=0;cn("Conectando con el vídeo…"),ke.streamError="";try{pe.preload="auto"}catch(e){}pe.onerror=function(){var c=pe.error?pe.error.code:0;if(c===4&&(window.__liveConnecting||pe._hlsInstance||"live"===ke.playerMode)){console.warn("[Player video error suppressed code 4 during connect]");return;}ln();clearLiveWatchdog();ke.streamError="Error de video canal (código "+c+")",pe.classList.remove("is-active"),ue&&(ue.style.display="block"),cn(ke.streamError,!0)};function checkPulseraReveal(){if(!pe||!pe._pulseraHoldLoader)return false;var now=Date.now();if(!pe.paused&&pe.readyState>=2&&pe.currentTime>0){if(!pe._pulseraPlayStartTs){pe._pulseraPlayStartTs=now;pe._pulseraPlayStartPos=pe.currentTime;}}var bufAhead=0;try{for(var bi=0;bi<(pe.buffered?pe.buffered.length:0);bi++){if(pe.currentTime>=pe.buffered.start(bi)-0.2&&pe.currentTime<=pe.buffered.end(bi)){bufAhead=Math.max(bufAhead,pe.buffered.end(bi)-pe.currentTime);}}}catch(_){}var elapsedSincePlay=pe._pulseraPlayStartTs?(now-pe._pulseraPlayStartTs):0;var mediaDelta=pe._pulseraPlayStartTs?(pe.currentTime-pe._pulseraPlayStartPos):0;var totalElapsed=now-(pe._pulseraHoldStartTs||now);var readyClean=(pe.readyState>=3&&elapsedSincePlay>=2200&&mediaDelta>=1.2&&bufAhead>=1.5)||(elapsedSincePlay>=4200&&mediaDelta>0.3)||(totalElapsed>=7500&&pe.currentTime>0);if(!readyClean)return false;pe._pulseraHoldLoader=false;if(pe._pulseraRevealTimer){clearInterval(pe._pulseraRevealTimer);pe._pulseraRevealTimer=null;}try{pe.style.opacity="";}catch(_){}window.__onStreamPlaying&&window.__onStreamPlaying();d();return true;}pe.onloadeddata=function(){if(pe._pulseraHoldLoader){checkPulseraReveal();return;}d();},pe.oncanplay=function(){if(pe._pulseraHoldLoader){ln();checkPulseraReveal();return;}ln(),d()},pe.onloadedmetadata=function(){if(!pe._pulseraHoldLoader)d();if("vod"===ke.playerMode){try{Ca(ke.playerItem);}catch(e){}try{getAvailableAudioTracks();if(Vi)updatePsvAudio();if(ji)za();if(!Xi&&pe._hls&&pe._hls.audioTracks&&pe._hls.audioTracks.length>1){var hLat=-1,hEsp=-1,hGen=-1;for(var h=0;h<pe._hls.audioTracks.length;h++){var hl=String(pe._hls.audioTracks[h].lang||pe._hls.audioTracks[h].name||"").toLowerCase();if(/es[-_]?(419|mx|ar|co|pe|cl|lat)|esl|latino/i.test(hl)){if(hLat<0)hLat=h;}else if(/es[-_]?es|castell|esp(?!l)|spain|españa/i.test(hl)){if(hEsp<0)hEsp=h;}else if(/^(es|spa)/i.test(hl)){if(hGen<0)hGen=h;}}var hChosen=(hLat>=0?hLat:(hEsp>=0?hEsp:hGen));if(hChosen>=0){pe._hls.audioTrack=hChosen;$i=hChosen;}}}catch(err){}var e=en?tn:pe.currentTime||0,t=pe&&isFinite(pe.duration)&&pe.duration>0?pe.duration:0,i=ke.playerEpisode&&ke.playerEpisode.duration?ai(ke.playerEpisode.duration):0,a=ke.playerItem&&ke.playerItem.duration?ai(ke.playerItem.duration):0;oi(e,t||i||a||0)}},pe.ondurationchange=function(){if("vod"===ke.playerMode){var e=en?tn+(pe.currentTime||0):pe.currentTime||0,t=pe&&isFinite(pe.duration)&&pe.duration>0?pe.duration:0,i=ke.playerEpisode&&ke.playerEpisode.duration?ai(ke.playerEpisode.duration):0,a=ke.playerItem&&ke.playerItem.duration?ai(ke.playerItem.duration):0;oi(e,t||i||a||0)}},pe.onplaying=function(){if(pe._pulseraHoldLoader){checkPulseraReveal();return;}window.__onStreamPlaying&&window.__onStreamPlaying();d();},pe.ontimeupdate=function(){if(pe.currentTime>0){if(pe._pulseraHoldLoader){checkPulseraReveal();}else{window.__onStreamPlaying&&window.__onStreamPlaying();d();}if(pe.currentTime!==pe._lastLiveAdvancePos){pe._lastLiveAdvancePos=pe.currentTime;pe._liveStallTimes=[];if(pe._stallCheckTimer){clearTimeout(pe._stallCheckTimer);pe._stallCheckTimer=null;}}}if("vod"===ke.playerMode){var e=en?tn+(pe.currentTime||0):pe.currentTime||0,t=pe&&isFinite(pe.duration)&&pe.duration>0?pe.duration:0,i=ke.playerEpisode&&ke.playerEpisode.duration?ai(ke.playerEpisode.duration):0,a=ke.playerItem&&ke.playerItem.duration?ai(ke.playerItem.duration):0;oi(e,t||i||a||0),sa(e)}},pe.onpause=function(){ri(),"vod"===ke.playerMode&&li("pause")},pe.onplay=function(){"vod"===ke.playerMode&&(li("none"),ri(),ni=setInterval(function(){if("player"===ke.screen&&"vod"===ke.playerMode&&pe&&!pe.paused){var e=en?tn+(pe.currentTime||0):pe.currentTime||0,t=pe&&isFinite(pe.duration)&&pe.duration>0?pe.duration:0,i=ke.playerEpisode&&ke.playerEpisode.duration?ai(ke.playerEpisode.duration):0,a=ke.playerItem&&ke.playerItem.duration?ai(ke.playerItem.duration):0;oi(e,t||i||a||0),sa(e)}},500))},pe._liveStallTimes=[],pe._lastLiveStallTs=0;var switchToNextLiveBackup=function(){var bUrls=window.__xuperCurrentBackupUrls;if(!bUrls||bUrls.length<=1||(pe._hlsBackupIdx||0)+1>=bUrls.length)return false;pe._liveStallTimes=[];if(pe._stallCheckTimer){clearTimeout(pe._stallCheckTimer);pe._stallCheckTimer=null;}pe._hlsBackupIdx=(pe._hlsBackupIdx||0)+1;pe._hlsNetErrCount=0;var nextRaw=bUrls[pe._hlsBackupIdx];console.warn("[Live backup switch -> server #"+(pe._hlsBackupIdx+1)+"]",nextRaw);var applyBackupUrl=function(targetUrl,extraHdrs){if(!targetUrl)return;e=String(targetUrl).replace(/^(https:\/\/[^\/]+):443(\/|$)/i,"$1$2");if(extraHdrs&&window.__xuperCurrentStreamMeta){window.__xuperCurrentStreamMeta.headers=Object.assign({},window.__xuperCurrentStreamMeta.headers||{},extraHdrs);}var hlsInst=pe._hlsInstance;if(hlsInst){try{hlsInst.loadSource(e);hlsInst.startLoad();return;}catch(_){}}if(isTizen3&&/epictvparaiphone\.top|playlatam\.site/i.test(e)&&window.XuperMediaUtils&&window.XuperMediaUtils.startDirectFmp4Live){var hdrs=(window.__xuperCurrentStreamMeta&&window.__xuperCurrentStreamMeta.headers)||{};window.XuperMediaUtils.startDirectFmp4Live(pe,e,hdrs,{onPlaying:function(){d();window.__onStreamPlaying&&window.__onStreamPlaying();},onError:function(){if(!switchToNextLiveBackup()){startHlsPlayback();}}});return;}if(startHlsPlayback())return;if(!/epictvparaiphone\.top|playlatam\.site/i.test(e)&&window.CactusAVPlay&&window.CactusAVPlay.available()){window.CactusAVPlay.start({url:e,title:(ke.playerItem&&ke.playerItem.name)||(z[ke.channel]&&z[ke.channel].name)||"Canal en vivo",kind:"live",onError:function(){switchToNextLiveBackup();}}).catch(function(){switchToNextLiveBackup();});}};if(!/\.m3u8(\?|#|$)|\/perelman\/|workers\.dev/i.test(nextRaw)&&window.XuperEpicSports&&typeof window.XuperEpicSports.resolveCandidate==="function"){window.XuperEpicSports.resolveCandidate(nextRaw).then(function(res){if(res&&res.url)applyBackupUrl(res.url,res.headers);else if(!switchToNextLiveBackup())applyBackupUrl(nextRaw,null);}).catch(function(){if(!switchToNextLiveBackup())applyBackupUrl(nextRaw,null);});}else{applyBackupUrl(nextRaw,null);}return true;};var handleLiveStall=function(forceCount){if("live"!==ke.playerMode)return;var now=Date.now();if(!forceCount&&now-(pe._lastLiveStallTs||0)<2500)return;pe._lastLiveStallTs=now;var sArr=pe._liveStallTimes||(pe._liveStallTimes=[]);sArr.push(now);while(sArr.length&&(now-sArr[0])>35000)sArr.shift();if(sArr.length>=4&&switchToNextLiveBackup())return;if(pe._stallCheckTimer)clearTimeout(pe._stallCheckTimer);pe._stallCheckPos=pe.currentTime||0;pe._stallCheckTimer=setTimeout(function(){pe._stallCheckTimer=null;if("live"===ke.playerMode&&pe&&!pe.paused&&Math.abs((pe.currentTime||0)-(pe._stallCheckPos||0))<0.15){handleLiveStall(true);}},8000);};pe.onwaiting=function(){ke.streamError||cn("Cargando vídeo…");handleLiveStall();},pe.onstalled=function(){ke.streamError||cn("Conectando…");handleLiveStall();};pe.onended=function(){if("vod"===ke.playerMode)handleEpisodeCompletion();};for(var a=ke.playerItem&&ke.playerItem.streamMime||"",n=-1!==e.indexOf(".m3u8")||-1!==a.indexOf("mpegurl")||!(!ke.playerItem||!ke.playerItem.isHls),r={mediaTransportType:n?"HLS":"URI",option:{transmission:{playTime:{start:0}}}},o=(n?"application/vnd.apple.mpegurl":-1!==e.indexOf(".mp4")||-1!==a.indexOf("mp4")?"video/mp4":"video/mp2t")+";mediaOption="+encodeURI(JSON.stringify(r));pe.firstChild;)pe.removeChild(pe.firstChild);pe.removeAttribute("src");try{pe.mediaOption=r}catch(e){}var isPulseraHls=/epictvparaiphone\.top|playlatam\.site|tizenxuper-tv\.pages\.dev\/stream-proxy/i.test(e)||!!(window.__xuperCurrentStreamMeta&&(window.__xuperCurrentStreamMeta.isPulsera||(window.__xuperCurrentStreamMeta.headers&&(window.__xuperCurrentStreamMeta.headers["X-Llave"]||window.__xuperCurrentStreamMeta.headers["X-Pulsera"]||window.__xuperCurrentStreamMeta.headers["X-Cookie"])))),isTizen3=/Tizen\s*3\.|AppleWebKit\/538/i.test(window.__xeOrigUserAgent||navigator.userAgent||""),canDirectFmp4=!!(isPulseraHls&&window.XuperMediaUtils&&window.XuperMediaUtils.startDirectFmp4Live&&window.CactusFmp4&&(window.MediaSource||window.WebKitMediaSource));function tryDirectFmp4(onFail){if(!canDirectFmp4)return false;var hdrs=(window.__xuperCurrentStreamMeta&&window.__xuperCurrentStreamMeta.headers)||{};pe.classList.add("is-active"),ue&&(ue.style.display="none");return window.XuperMediaUtils.startDirectFmp4Live(pe,e,hdrs,{onPlaying:function(){d();window.__onStreamPlaying&&window.__onStreamPlaying();},onError:function(err){console.warn("[DirectFmp4 fallback err]",err);if(typeof onFail==="function")onFail(err);}});}function startHlsPlayback(){if(!(n&&window.Hls&&window.Hls.isSupported()))return false;if(isPulseraHls&&window.CactusAVPlay&&typeof window.CactusAVPlay.stop==="function"){try{window.CactusAVPlay.stop();}catch(_){}}if(isPulseraHls){pe._pulseraHoldLoader=true;pe._pulseraHoldStartTs=Date.now();pe._pulseraPlayStartTs=0;pe._pulseraPlayStartPos=0;pe._pulseraStartAligned=false;try{pe.style.opacity="0";}catch(_){}var curLdr=document.getElementById("player-live-loader");if(curLdr){curLdr.classList.add("is-visible");curLdr.classList.add("is-solid-curtain");}if(pe._pulseraRevealTimer){clearInterval(pe._pulseraRevealTimer);}pe._pulseraRevealTimer=setInterval(checkPulseraReveal,200);}if(pe._hlsInstance){try{pe._hlsInstance.destroy();}catch(_){}pe._hlsInstance=null;}var isCustomHttpsPort=/^https:\/\/[^\/]+:\d+/i.test(e);var relayHdrsMap={};var triedDirectAfterRelay=false;var hlsOpts={enableWorker:isPulseraHls?false:!isTizen3,lowLatencyMode:false,backBufferLength:15,maxBufferLength:isPulseraHls?18:45,maxMaxBufferLength:isPulseraHls?36:90,liveSyncDurationCount:isPulseraHls?3:6,liveMaxLatencyDurationCount:isPulseraHls?10:20,maxLiveSyncPlaybackRate:1.0,nudgeOffset:0.1,nudgeMaxRetry:isPulseraHls?5:2,liveDurationInfinity:true,highBufferWatchdogPeriod:8,startFragPrefetch:!isPulseraHls,manifestLoadingTimeOut:15000,manifestLoadingMaxRetry:(isTizen3&&isCustomHttpsPort)?1:4,fragLoadingTimeOut:20000,fragLoadingMaxRetry:10,fragLoadingRetryDelay:350,subtitleTrack:-1,enableWebVTT:false,_xeRelayPortal:!!(isTizen3&&!isPulseraHls&&!isCustomHttpsPort),_xeRelayHdrsMap:relayHdrsMap,xhrSetup:function(xhr,url){function attachHdrs(reqUrl){if(xhr._xeHeadersAttached)return;xhr._xeHeadersAttached=true;var targetUrl=String(reqUrl||url||"");var cfgMap=(hls&&hls.config&&hls.config._xeRelayHdrsMap)||relayHdrsMap;var relayHdrs=cfgMap&&cfgMap[targetUrl];if(relayHdrs){try{for(var rk in relayHdrs){if(Object.prototype.hasOwnProperty.call(relayHdrs,rk)&&relayHdrs[rk])xhr.setRequestHeader(rk,relayHdrs[rk]);}}catch(_){}}var meta=window.__xuperCurrentStreamMeta;if(!meta)return;var hdrs=meta.headers||{};if(meta.headersByUrl&&meta.headersByUrl[targetUrl]){hdrs=meta.headersByUrl[targetUrl];}var cAuth=hdrs["Content-Auth"]||"";if(meta.authByHost){var hm=targetUrl.match(/^https?:\/\/([^\/]+)/i);if(hm&&hm[1]&&meta.authByHost[hm[1]])cAuth=meta.authByHost[hm[1]];}var rBase=(window.XuperRelay&&typeof window.XuperRelay.relayBase==="function")?window.XuperRelay.relayBase():"";var isRelayReq=/workers\.dev/i.test(targetUrl)||(rBase&&targetUrl.indexOf(rBase)===0);try{if(cAuth)xhr.setRequestHeader("Content-Auth",cAuth);if(hdrs["Content-License"])xhr.setRequestHeader("Content-License",hdrs["Content-License"]);if(hdrs.App)xhr.setRequestHeader("App",hdrs.App);if(hdrs["App-Version"])xhr.setRequestHeader("App-Version",hdrs["App-Version"]);var pulseraTok=hdrs["X-Pulsera"]||((/epictvparaiphone\.top|playlatam\.site/i.test(targetUrl))?"1":"");if(isRelayReq&&!relayHdrs){if(hdrs["X-Target-Host"])xhr.setRequestHeader("X-Target-Host",hdrs["X-Target-Host"]);if(hdrs["X-Eclex-Time"])xhr.setRequestHeader("X-Eclex-Time",hdrs["X-Eclex-Time"]);if(hdrs["X-Eclex-Duid"])xhr.setRequestHeader("X-Eclex-Duid",hdrs["X-Eclex-Duid"]);if(hdrs["X-Eclex-Sig"])xhr.setRequestHeader("X-Eclex-Sig",hdrs["X-Eclex-Sig"]);if(hdrs["X-Cookie"])xhr.setRequestHeader("X-Cookie",hdrs["X-Cookie"]);else if(pulseraTok&&pulseraTok!=="1")xhr.setRequestHeader("X-Cookie","__Host-pulsera="+pulseraTok);}if(isRelayReq||/epictvparaiphone\.top|playlatam\.site/i.test(targetUrl)){if(hdrs["X-Llave"])xhr.setRequestHeader("X-Llave",hdrs["X-Llave"]);if(hdrs["X-Aparato"])xhr.setRequestHeader("X-Aparato",hdrs["X-Aparato"]);if(pulseraTok)xhr.setRequestHeader("X-Pulsera",pulseraTok);if(hdrs["X-Cred"])xhr.setRequestHeader("X-Cred",hdrs["X-Cred"]);}}catch(_){}}if(xhr.readyState>=1){attachHdrs(url);}else{var origOpen=xhr.open;xhr.open=function(){var openArgs=Array.prototype.slice.call(arguments);var rawOpenUrl=String(openArgs[1]||url||"");if(pe&&pe._useRelayMedia&&/^https:\/\//i.test(rawOpenUrl)&&window.XuperRelay&&typeof window.XuperRelay.wrapMediaRequest==="function"){var wm=window.XuperRelay.wrapMediaRequest({url:rawOpenUrl},"stream");if(wm&&wm.relayed){openArgs[1]=wm.url;rawOpenUrl=wm.url;xhr._xeWrappedMediaHdrs=wm.headers||{};}}var res=origOpen.apply(xhr,openArgs);if(xhr._xeWrappedMediaHdrs){try{var wkh=xhr._xeWrappedMediaHdrs;if(wkh["X-Eclex-Time"])xhr.setRequestHeader("X-Eclex-Time",wkh["X-Eclex-Time"]);if(wkh["X-Eclex-Duid"])xhr.setRequestHeader("X-Eclex-Duid",wkh["X-Eclex-Duid"]);if(wkh["X-Eclex-Sig"])xhr.setRequestHeader("X-Eclex-Sig",wkh["X-Eclex-Sig"]);}catch(_){}}attachHdrs(rawOpenUrl);return res;};}}};if(window.XuperMediaUtils&&window.XuperMediaUtils.createPngStripLoader){var PngStripLoader=window.XuperMediaUtils.createPngStripLoader(window.Hls);if(PngStripLoader)hlsOpts.loader=PngStripLoader;}var hls=new window.Hls(hlsOpts);pe._hlsInstance=hls;pe._hlsBackupIdx=0;try{hls.subtitleDisplay=false;hls.subtitleTrack=-1;}catch(_){}hls.attachMedia(pe);hls.loadSource(e);if(isPulseraHls){hls.on(window.Hls.Events.FRAG_BUFFERED,function(){if(!pe||pe._pulseraStartAligned||!pe.buffered||!pe.buffered.length)return;var bStart=pe.buffered.start(0),bEnd=pe.buffered.end(0);if(bEnd-bStart>=1.5&&pe.currentTime>bStart+0.25&&pe.currentTime<bEnd-0.5){try{pe.currentTime=bStart+0.02;pe._pulseraPlayStartPos=pe.currentTime;}catch(_){}}pe._pulseraStartAligned=true;});}hls.on(window.Hls.Events.MANIFEST_PARSED,function(){try{pe.muted=false;pe.volume=1;}catch(_){}try{hls.startLoad(-1);}catch(_){}var s=pe.play();s&&s.catch&&s.catch(function(){try{pe.muted=true;pe.play();}catch(_){}})});setTimeout(function(){if(pe&&pe._hlsInstance===hls&&pe.readyState<2&&hls.streamController&&hls.streamController.state==="IDLE"){try{hls.startLoad(-1);}catch(_){}}},1000);hls.on(window.Hls.Events.ERROR,function(ev,data){console.warn('[Hls player error]',data);if(data&&data.fatal){if(switchToNextLiveBackup())return;var isZeroNetErr=data.type===window.Hls.ErrorTypes.NETWORK_ERROR&&(!data.response||!data.response.code);if(data.type===window.Hls.ErrorTypes.NETWORK_ERROR&&hls.config._xeRelayPortal&&data.response&&data.response.code>=400&&!triedDirectAfterRelay){triedDirectAfterRelay=true;hlsOpts._xeRelayPortal=false;hls.config._xeRelayPortal=false;try{hls.loadSource(e);hls.startLoad();return;}catch(_){}}else if(data.type===window.Hls.ErrorTypes.NETWORK_ERROR&&!(isTizen3&&isZeroNetErr&&isCustomHttpsPort)&&(pe._hlsNetErrCount=(pe._hlsNetErrCount||0)+1)<=1){try{hls.startLoad();return;}catch(_){}}else if(data.type===window.Hls.ErrorTypes.MEDIA_ERROR&&!pe._hlsMediaRecovered){pe._hlsMediaRecovered=true;try{hls.recoverMediaError();return;}catch(_){}}if(!pe._triedFmp4&&tryDirectFmp4(function(){ke.streamError="Error cargando señal HLS";cn(ke.streamError,true);})){pe._triedFmp4=true;try{hls.destroy();pe._hlsInstance=null;}catch(_){}return;}if(!isPulseraHls&&!pe._triedAvFallback&&!pe._skipAvFallback&&!(isTizen3&&window.__xuperCurrentStreamMeta&&window.__xuperCurrentStreamMeta.skipAvOnT3Https)&&window.CactusAVPlay&&window.CactusAVPlay.available()){pe._triedAvFallback=true;try{hls.destroy();pe._hlsInstance=null;}catch(_){}var avUrl=(window.__xuperCurrentStreamMeta&&window.__xuperCurrentStreamMeta.originalUrl)||e;window.CactusAVPlay.start({url:avUrl,title:(ke.playerItem&&ke.playerItem.name)||"Canal en vivo",kind:"live"}).catch(function(){hideLiveChannelLoader();clearLiveWatchdog();ke.streamError=(isTizen3&&isCustomHttpsPort)?"Canal HTTPS no compatible en Tizen 3.0":"Error cargando señal HLS";cn(ke.streamError,true);});return;}try{hls.destroy();pe._hlsInstance=null;}catch(_){}hideLiveChannelLoader();clearLiveWatchdog();ke.streamError=(isTizen3&&isCustomHttpsPort)?"Canal HTTPS no compatible en Tizen 3.0":"Error cargando señal HLS";cn(ke.streamError,true);}});pe.classList.add("is-active"),ue&&(ue.style.display="none");return true;}pe._triedFmp4=false;pe._triedAvFallback=false;pe._skipAvFallback=!!window.__xuperSkipAvFallbackNext;window.__xuperSkipAvFallbackNext=false;pe._hlsNetErrCount=0;pe._hlsMediaRecovered=false;if(isTizen3&&canDirectFmp4){pe._triedFmp4=true;if(tryDirectFmp4(function(){if(!startHlsPlayback()){var bUrls=window.__xuperCurrentBackupUrls||[],ipBak=bUrls.filter(function(u){return u&&!/epictvparaiphone\.top|playlatam\.site/i.test(u);})[0];if(ipBak&&window.CactusAVPlay&&window.CactusAVPlay.available()){window.CactusAVPlay.start({url:ipBak,title:(ke.playerItem&&ke.playerItem.name)||"Canal en vivo",kind:"live"}).catch(function(){ke.streamError="Canal no disponible en Tizen 3.0";cn(ke.streamError,true);});}else{ke.streamError="Canal no disponible en Tizen 3.0";cn(ke.streamError,true);}}}))return;}if(startHlsPlayback())return;if(!pe._triedFmp4&&tryDirectFmp4(function(){ke.streamError="Motor MSE no compatible";cn(ke.streamError,true);}))return;var l=document.createElement("source");l.src=e,l.type=o,pe.appendChild(l);try{pe.src=e}catch(e){}try{pe.currentTime=0}catch(e){}pe.classList.add("is-active"),ue&&(ue.style.display="none");try{pe.load();var s=pe.play();s&&s.catch&&s.catch(function(){pe.error||(ke.streamError="Pulsa OK para iniciar la reproducción",cn(ke.streamError))})}catch(e){ke.streamError="Pulsa OK para iniciar la reproducción",cn(ke.streamError)}}function d(){cn("")}}function un(e,t){var i=Za;function a(){var isSeries=I(e);var a={contentId:e.id,type:isSeries?"0":"1",playbackMode:ke.streamMode,forceRelay:"smooth"===ke.streamMode||"relay"===ke.streamMode,trackIndex:ke.trackIndex||0};var n=ia[ma(e)];if(n&&!Xi&&($i=ya(n.audio)),a.audioTrack=$i||0);if(isSeries){var r=ke.playerEpisode;if(!r&&e.episodes&&e.episodes.length){r=e.episodes[0];ke.playerEpisode=r;}var o=e.seasonId||e.id;a.contentId=o;a.seriesContentId=o;a.type="0";a.columnId=76178;a.episode=r?(Number(r.number||r.seriesNumber)||1):1;}D(a.forceRelay?"resolveSmooth":"resolve",a,function(a,n){if(i===Za){if(a||!n||!1===n.returnValue)return ke.streamError="No se pudo resolver el título"+(a?": "+a:""),cn(ke.streamError),t("");e.streamMime=n.mime||"",e.streamCodec=n.codec||"",n.duration>0?(e.duration=n.duration,ke.playerEpisode&&(ke.playerEpisode.duration=n.duration)):e.duration=e.duration||0,e.subtitles=(n.subtitles&&n.subtitles.length?n.subtitles:(e.subtitles||[])),(ke.playerEpisode&&e.subtitles.length&&(ke.playerEpisode.subtitles=e.subtitles)),(e.subtitles.length&&(window.__xuperSubtitles=e.subtitles)),Ca(e),e.streamAudioInfo=n.audio||"",e.isHls=!!n.isHls;try{window.__xuperStreamInfo={selectedTrack:n.selectedTrack||{},availableTracks:n.availableTracks||[]}}catch(e){}t(n.proxyPath||n.url||"")}})}if(I(e)&&!ke.playerEpisode&&(!e.episodes||!e.episodes.length)&&!e._detailsLoaded)return cn("Cargando capítulos…"),void H(e,function(){i===Za&&a()});a()}function fn(e,t){if(pe){t&&(ke.playerEpisode=t,ke.playerSeasonIndex=ke.detailSeason||0),e&&(ke.playerItem=e);var i=e||ke.playerItem;if(i&&ua(i),dn(),("vod"===ke.playerMode&&startPlayerTicker()),i){if(Xi=!1,$i=0,ga(i),i._portal){var a=t&&(t.number||t.seriesNumber)||"";return cn(a?"Cargando capítulo "+a+"…":"Cargando capítulo…"),void un(i,function(e){e?pn(e):ke.streamError||cn("Sin fuente de reproducción")})}i.streamUrl&&(pn(i.streamUrl),Ca(i))}}}function syncVodStageLayout(isMini){try{if(!isMini){Fa(ea);}else if(pe){pe.classList.remove("aspect-cover","aspect-contain","aspect-16-9","aspect-4-3");}if(se){void se.offsetWidth;}if(pe){void pe.offsetWidth;}window.CactusAVPlay&&window.CactusAVPlay.syncDisplayMode&&window.CactusAVPlay.syncDisplayMode();window.CactusHEVC&&window.CactusHEVC.syncDisplayMode&&window.CactusHEVC.syncDisplayMode();window.CactusVODBrowser&&window.CactusVODBrowser.syncDisplayMode&&window.CactusVODBrowser.syncDisplayMode();if(!isMini&&typeof window.dispatchEvent==="function"){try{var ev=document.createEvent("Event");ev.initEvent("resize",false,false);window.dispatchEvent(ev);}catch(err){}}}catch(e){}}function vn(e,t){se||Xa(),ke.playerMode="vod",cn(""),ke.streamError="";var epTimerPending=!!ke.episodeSwitchTimer;if(ke.episodeSwitchTimer){clearTimeout(ke.episodeSwitchTimer);ke.episodeSwitchTimer=null;}ke.episodeSwitchSeq=(ke.episodeSwitchSeq||0)+1;var prevEp=ke.playerEpisode,isDifferentEp=t&&prevEp&&(String(t.id||t.number)!==String(prevEp.id||prevEp.number));e&&ke.playerItem!==e&&va(),e&&(ke.playerItem=e),t&&(ke.playerEpisode=t),e&&ua(e),ke.playerReturn={screen:"detail",focus:ke.focus};var i=r("screen-player"),a=r("screen-detail");i&&(i.classList.remove("is-mini"),i.classList.add("is-active")),a&&(a.classList.remove("is-active"),a.style.display="none"),ke.screen="player",se.classList.add("is-vod"),bn(),Fe(se),fi();syncVodStageLayout(!1);if(window.__resumeStartTime>0){window.__simulatedCurrentTime=window.__resumeStartTime;if(pe){try{pe.currentTime=window.__resumeStartTime;}catch(err){}}if(window.CactusAVPlay&&window.CactusAVPlay.isActive&&window.CactusAVPlay.isActive()&&window.CactusAVPlay.seekAbsolute){try{window.CactusAVPlay.seekAbsolute(window.__resumeStartTime*1000);}catch(err){}}}else{window.__simulatedCurrentTime=0;}startPlayerTicker();var isPlaying=(pe&&(pe.currentTime>0||!pe.paused))||(window.CactusHEVC&&window.CactusHEVC.isActive&&window.CactusHEVC.isActive())||(window.CactusVODBrowser&&window.CactusVODBrowser.isActive&&window.CactusVODBrowser.isActive())||(window.CactusAVPlay&&window.CactusAVPlay.isActive&&window.CactusAVPlay.isActive());if(!isPlaying||epTimerPending||isDifferentEp||window.__resumeStartTime>0){fn(ke.playerItem,ke.playerEpisode);}else{cn("");}}function hn(e,t,i){"vod"!==e||"detail"!==ke.screen?(se||Xa(),"live"===e&&ht(),ke.playerMode=e,t&&ke.playerItem!==t&&va(),ke.playerItem=t||null,ke.playerEpisode=i||null,"vod"===e&&t&&ua(t),ke.playerReturn={screen:ke.screen,focus:ke.focus},ke.channelsOpen=!1,de.classList.remove("is-active"),ce.classList.remove("is-active"),se.classList.toggle("is-vod","vod"===e),bn(),ze("player"),Fe(se),bn(),"vod"===e?(fi(),(window.__resumeStartTime>0?(window.__simulatedCurrentTime=window.__resumeStartTime):(window.__simulatedCurrentTime=0)),startPlayerTicker(),fn(ke.playerItem,ke.playerEpisode)):(pi(),yn(z[ke.channel],!0))):vn(t,i)}var mn=0,gn=null;function yn(e,t){if(gn&&(clearTimeout(gn),gn=null),e||(e=z[ke.channel]),e&&(e.channelCode||e.streamUrl||e.url)){var sUrl=e.streamUrl||e.url||"";var actCh=window.__xeActiveLiveCh;var isSameCh=!!(actCh&&((e.channelCode&&actCh.channelCode&&String(e.channelCode)===String(actCh.channelCode))||(sUrl&&actCh.url&&String(sUrl)===String(actCh.url))));var isLiveActive=!!(window.__liveHasPlayed||window.__liveConnecting||(pe&&!pe.paused&&pe.currentTime>0)||(window.CactusAVPlay&&window.CactusAVPlay.isActive&&window.CactusAVPlay.isActive())||(window.CactusLiveTV&&window.CactusLiveTV.active&&window.CactusLiveTV.active()));if(!window.__xeForceRetune&&!ke.streamError&&isSameCh&&isLiveActive){bn();pi();return;}window.__xeForceRetune=!1;var i=function(){var t=++mn;dn();window.__xeActiveLiveCh={channelCode:String(e.channelCode||""),url:String(sUrl||""),name:String(e.name||"")};window.__liveHasPlayed=!1;window.__liveConnecting=!0;clearLiveWatchdog();showLiveChannelLoader(e.name||"");cn("");D("resolveLive",sUrl?{channelCode:e.channelCode,streamUrl:sUrl,backupUrls:e.backupUrls||[],name:e.name}:{channelCode:e.channelCode,name:e.name,backupUrls:e.backupUrls||[],liveAddressList:e.liveAddressList},function(err,res){if(t===mn){if(err||!res||!1===res.returnValue){hideLiveChannelLoader();ke.streamError=(err&&err.message)||(res&&res.errorText)||"Canal no disponible por el momento";return void cn(ke.streamError,!0);}var a=res.proxyPath||res.url;if(!a){hideLiveChannelLoader();ke.streamError="Canal sin URL de reproducción";return void cn(ke.streamError,!0);}cn("");pi();pn(a);window.__xeActiveLiveCh={channelCode:String(e.channelCode||""),url:String(sUrl||a||""),name:String(e.name||"")};startLiveWatchdog(t);}})};t?i():gn=setTimeout(i,180)}}function bn(){var e="live"===ke.playerMode,t=z[ke.channel]||{},i=de.querySelector(".pi-index"),a=de.querySelector(".pi-name"),c=de.querySelector(".pi-logo"),star=de.querySelector(".pi-star");if(e){ve&&ve.classList.remove("is-active"),de&&(de.style.display=""),i&&(i.style.display="block",i.textContent=d(t.index||ke.channel+1)),a&&(a.textContent=t.name||""),c&&(c.style.display="block",t.logo?c.style.backgroundImage="url("+t.logo+")":c.style.backgroundImage="");if(star){var curChannelObj=z[ke.channel];var isFav=isChannelFavorite(curChannelObj);if(isFav){star.style.display="none";star.textContent="";}else{star.style.display="block";star.classList.remove("is-fav");star.textContent="☆";}}}else{de&&(de.classList.remove("is-active"),de.style.display="none");var p=ke.playerItem||u[0];if(me){if(I(p)&&ke.playerEpisode){var f=ke.playerEpisode.title||ke.playerEpisode.name,v=ke.playerEpisode.number||ke.playerEpisode.seriesNumber,h=f||(v?"Capítulo "+v:"");me.textContent=h?p.title+" - "+h:p.title}else me.textContent=p.title;}he&&(he.src=p.poster||p.cover||"media/ui/common/bg_placehoder_vertical.png"),oi(pe?pe.currentTime:0,pe?pe.duration:0)}for(var m=0;m<De.length;m++)De[m].classList.toggle("is-current",De[m]._channel===ke.channel);}function Cn(){}function wn(toCats){if("live"===ke.playerMode){ke.channelsOpen=!0;ce.style.zIndex="600";ce.classList.add("is-active");if(pe){try{pe.blur();}catch(e){}}if(!window.__categoryLoading){Ja();}if(toCats){var pill=ce.querySelector(".pc-cat-pill.is-selected")||ce.querySelector(".pc-cat-pill");if(pill){Fe(pill);Ga(ce.querySelector(".pc-categories"),pill);return;}}var e=De.filter(function(x){return x._channel===ke.channel;})[0]||De[0];if(e){Fe(e);scrollChannelIntoView(e);}else{var pill=ce.querySelector(".pc-cat-pill.is-selected")||ce.querySelector(".pc-cat-pill");pill&&(Fe(pill),Ga(ce.querySelector(".pc-categories"),pill));}}}function Sn(){ke.channelsOpen=!1,ce.classList.remove("is-active"),"player"===ke.screen&&Fe(se)}
/* =============================================================================
   LIVE CHANNEL SEARCH & EXTERNAL BOTTOM BAR LOGIC (Inside IIFE)
   ============================================================================= */
var isLiveSearchOpen = !1,
    isLiveCatsOpen = !1,
    lcsCurrentQuery = "",
    lcsSearchMode = "external",
    lcsLastFocusedKey = null,
    lcsKeys = [],
    lcsResultItems = [],
    liveBottomBar = null,
    liveBtnFavs = null,
    liveBtnSearch = null,
    liveBtnCats = null,
    liveCatsDrawer = null;

function setupLiveTvExternalBottomBar(container){
  if(!container) return;
  var bar = n("div", "live-bottom-bar");

  var favSvg = '<svg viewBox="0 0 24 24" class="live-btn-svg" aria-hidden="true"><path fill="currentColor" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>';
  var bFavs = n("button", "live-bottom-btn btn-fav focusable");
  bFavs.innerHTML = favSvg;
  bFavs.setAttribute("title", "Favoritos");
  bFavs.setAttribute("aria-label", "Favoritos");
  bFavs._activate = function(){
    var favCat = { id: "favorites", name: "⭐ Favoritos", isFavorite: true, isAddon: false };
    loadFavoritesCategory(function(){
      rt = favCat;
      Ct(!1);
      if(!z.length){
        showPlayerToast("No hay canales en Favoritos. Agregue canales manteniendo presionado [OK] o con el botón Amarillo.");
      } else {
        St(0, !0);
        if(Me.length) Fe(Me[0]);
      }
    });
  };
  bFavs._onMove = function(dir){
    if("left" === dir) return Ee[0] && Fe(Ee[0]), !0;
    if("right" === dir) return liveBtnSearch && Fe(liveBtnSearch), !0;
    if("up" === dir) return X && Fe(X), !0;
    if("down" === dir){
      if(isLiveCatsOpen && liveCatsDrawer && liveCatsDrawer.firstChild) return Fe(liveCatsDrawer.firstChild), !0;
      return !0;
    }
    return !1;
  };
  bar.appendChild(bFavs);
  liveBtnFavs = bFavs;

  var searchSvg = '<svg viewBox="0 0 24 24" class="live-btn-svg" aria-hidden="true"><path fill="currentColor" d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>';
  var bSearch = n("button", "live-bottom-btn btn-search focusable");
  bSearch.innerHTML = searchSvg;
  bSearch.setAttribute("title", "Buscar");
  bSearch.setAttribute("aria-label", "Buscar");
  bSearch._activate = function(){
    openLiveChannelSearch("external");
  };
  bSearch._onMove = function(dir){
    if("left" === dir) return liveBtnFavs && Fe(liveBtnFavs), !0;
    if("right" === dir) return liveBtnCats && Fe(liveBtnCats), !0;
    if("up" === dir) return X && Fe(X), !0;
    if("down" === dir){
      if(isLiveCatsOpen && liveCatsDrawer && liveCatsDrawer.firstChild) return Fe(liveCatsDrawer.firstChild), !0;
      return !0;
    }
    return !1;
  };
  bar.appendChild(bSearch);
  liveBtnSearch = bSearch;

  var catsSvg = '<svg viewBox="0 0 24 24" class="live-btn-svg" aria-hidden="true"><rect x="3" y="3" width="7.5" height="7.5" rx="2" fill="currentColor"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2" fill="currentColor"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2" fill="currentColor"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2" fill="currentColor"/></svg>';
  var bCats = n("button", "live-bottom-btn btn-cats focusable");
  bCats.innerHTML = catsSvg;
  bCats.setAttribute("title", "Categorías");
  bCats.setAttribute("aria-label", "Categorías");
  bCats._activate = function(){
    toggleLiveCategoriesDrawer();
  };
  bCats._onMove = function(dir){
    if("left" === dir) return liveBtnSearch && Fe(liveBtnSearch), !0;
    if("right" === dir) return Me.length && Fe(Me[0]), !0;
    if("up" === dir) return X && Fe(X), !0;
    if("down" === dir){
      if(isLiveCatsOpen && liveCatsDrawer && liveCatsDrawer.firstChild) return Fe(liveCatsDrawer.firstChild), !0;
      return !0;
    }
    return !1;
  };
  bar.appendChild(bCats);
  liveBtnCats = bCats;

  container.appendChild(bar);
  liveBottomBar = bar;

  var drawer = n("div", "live-cats-drawer scrollable");
  container.appendChild(drawer);
  liveCatsDrawer = drawer;
}

function toggleLiveCategoriesDrawer(){
  isLiveCatsOpen = !isLiveCatsOpen;
  if(!liveCatsDrawer) return;
  liveCatsDrawer.classList.toggle("is-active", isLiveCatsOpen);
  if(isLiveCatsOpen){
    renderLiveCategoriesDrawerPills();
  }
}

function closeLiveCategoriesBar(){
  isLiveCatsOpen = !1;
  if(liveCatsDrawer){
    liveCatsDrawer.classList.remove("is-active");
  }
  if(liveBtnCats) Fe(liveBtnCats);
}

function renderLiveCategoriesDrawerPills(){
  if(!liveCatsDrawer) return;
  o(liveCatsDrawer);
  var raw = (nt && nt.length) ? nt : [{id:76182,name:"Todos"},{id:"favorites",name:"Favoritos",isFavorite:true},{id:"epic_events",name:"Deportes En Vivo",isEpicEvents:true},{id:"espn",name:"ESPN",isEspn:true},{id:76206,name:"Deportes"},{id:76205,name:"Cine y Series"},{id:79146,name:"Infantil"}];
  var cats = [];
  var seen = {};
  for(var c=0; c<raw.length; c++){
    var item = raw[c];
    if(!item || item.isSearch || item.id === "search") continue;
    var isFav = (item.id === "favorites" || item.isFavorite || /favorito/i.test(item.name));
    var normKey = isFav ? "favorites" : (item.id || item.name);
    if(seen[normKey]) continue;
    seen[normKey] = true;
    cats.push(item);
  }
  var pills = [];
  for(var c=0; c<cats.length; c++){
    (function(cat, cIdx){
      var isSel = (rt && rt.id === cat.id);
      var pill = n("button", "live-cat-pill focusable" + (isSel ? " is-selected" : ""));
      var catName = String(cat.name || "").replace(/^[⭐★\s]+/, "").trim();
      var iconHtml = "";
      if(cat.id === "favorites" || cat.isFavorite || /favorito/i.test(catName)){
        iconHtml = '<span class="pill-svg-icon fav-star"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg></span>';
        catName = "Favoritos";
      } else if(cat.id === 76182 || /^todos$/i.test(catName)){
        iconHtml = '<span class="pill-svg-icon all-dot"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" fill="currentColor"/></svg></span>';
        catName = "Todos";
      }
      pill.innerHTML = iconHtml + '<span class="pill-title">' + catName + '</span>';
      pill._cat = cat;
      pill._activate = function(){
        rt = cat;
        closeLiveCategoriesBar();
        hn("live");
        wn(!1);
        showCategoryLoading(cat.name);
        window.__categoryLoading = !0;
        var targetId = cat.id;
        gt(cat, function(){
          window.__categoryLoading = !1;
          if(rt && rt.id === targetId){
            Qa();
            Ja();
            if(z.length) St(0, !0);
            if(De.length) Fe(De[0]);
          }
        });
      };
      pill._onMove = function(dir){
        if("left" === dir){
          if(cIdx > 0 && pills[cIdx - 1]) return Fe(pills[cIdx - 1]), Ga(liveCatsDrawer, pills[cIdx - 1]), !0;
          return Ee[0] && Fe(Ee[0]), !0;
        }
        if("right" === dir){
          if(cIdx < pills.length - 1 && pills[cIdx + 1]) return Fe(pills[cIdx + 1]), Ga(liveCatsDrawer, pills[cIdx + 1]), !0;
          return !0;
        }
        if("up" === dir){
          return liveBtnCats && Fe(liveBtnCats), !0;
        }
        return !1;
      };
      liveCatsDrawer.appendChild(pill);
      pills.push(pill);
    })(cats[c], c);
  }
  if(pills.length){
    var sel = pills.filter(function(p){ return p.classList.contains("is-selected"); })[0] || pills[0];
    if(sel){
      Fe(sel);
      Ga(liveCatsDrawer, sel);
    }
  }
}

function openLiveChannelSearch(mode){
  isLiveSearchOpen = !0;
  lcsSearchMode = mode || "external";
  lcsCurrentQuery = "";
  var overlay = r("live-channel-search-overlay");
  if(!overlay) return;
  overlay.classList.add("is-active");
  renderLiveSearchKeyboard();
  updateLiveChannelSearchUI();
  var firstKey = lcsKeys[0] || r("lcs-feedback");
  if(firstKey) Fe(firstKey);

  if(!window.__masterChannelPool || window.__masterChannelPool.length < 30){
    try {
      D("liveChannels", {columnId: 76182}, function(err, res){
        if(res && res.channels && res.channels.length){
          window.__masterChannelPool = res.channels;
          if(isLiveSearchOpen){
            updateLiveChannelSearchUI(true);
          }
        }
      });
    } catch(e){}
  }
  if(!window.__allSearchPoolLoaded && !window.__allSearchPoolLoading){
    window.__allSearchPoolLoading = true;
    try {
      D("liveChannels", {columnId: "all_search"}, function(err, res){
        window.__allSearchPoolLoading = false;
        if(res && res.channels && res.channels.length){
          window.__allLiveChannels = res.channels;
          window.__allSearchPoolLoaded = true;
          if(isLiveSearchOpen){
            updateLiveChannelSearchUI(true);
          }
        }
      });
    } catch(e){ window.__allSearchPoolLoading = false; }
  }
}

function closeLiveChannelSearch(){
  isLiveSearchOpen = !1;
  if(lcsSearchDebounceTimer){
    clearTimeout(lcsSearchDebounceTimer);
    lcsSearchDebounceTimer = null;
  }
  var overlay = r("live-channel-search-overlay");
  if(overlay) overlay.classList.remove("is-active");
  if("internal" === lcsSearchMode){
    if(ce){
      var pill = ce.querySelector(".pc-cat-pill.is-search") || ce.querySelector(".pc-cat-pill");
      if(pill) Fe(pill);
      else if(De.length) Fe(De[0]);
      else if(se) Fe(se);
    } else if(se) Fe(se);
  } else {
    if(liveBtnSearch) Fe(liveBtnSearch);
    else if(X) Fe(X);
  }
}

var lcsSearchNumeric = false;
var lcsLastKeyCol = 0;
function renderLiveSearchKeyboard(){
  var kb = r("lcs-keyboard"), actBox = r("lcs-actions"), closeBtn = r("lcs-feedback");
  if(!kb) return;
  o(kb);
  lcsKeys = [];

  // Letters strictly without accents: 27 letters + 1 space = exactly 28 keys (4 rows of 7)
  // Perfectly aligned with A-G, H-N, Ñ-T, U-␣ columns!
  var letterRows = [
    ["A","B","C","D","E","F","G"],
    ["H","I","J","K","L","M","N"],
    ["Ñ","O","P","Q","R","S","T"],
    ["U","V","W","X","Y","Z"," "]
  ];
  var numberRows = [
    ["1","2","3","4","5","6","7"],
    ["8","9","0","-",".","/"," "],
    ["#","*","+","=","_",":","?"]
  ];
  var rows = lcsSearchNumeric ? numberRows : letterRows;

  var rowsGrid = [];
  for(var rIdx = 0; rIdx < rows.length; rIdx++){
    var rowEl = n("div", "lcs-kb-row");
    var chars = rows[rIdx];
    var rowKeys = [];
    (function(charsInRow, rowI, rArr){
      for(var cIdx = 0; cIdx < charsInRow.length; cIdx++){
        (function(ch, colI){
          var isSpace = (" " === ch);
          var key = n("div", "lcs-kb-key focusable" + (isSpace ? " space" : ""), isSpace ? "" : ch);
          key._char = ch;
          key._rowI = rowI;
          key._colI = colI;
          key._onFocus = function(){
            lcsLastFocusedKey = key;
            lcsLastKeyCol = colI;
          };
          key._activate = function(){
            lcsCurrentQuery += ch;
            updateLiveChannelSearchUI();
          };
          key._onMove = function(dir){
            lcsLastFocusedKey = key;
            lcsLastKeyCol = colI;
            if("left" === dir){
              if(colI > 0 && rArr[colI - 1]) return Fe(rArr[colI - 1], true), !0;
              return !0;
            }
            if("right" === dir){
              if(colI < charsInRow.length - 1 && rArr[colI + 1]) return Fe(rArr[colI + 1], true), !0;
              if(lcsResultItems.length) return Fe(lcsResultItems[0]), !0;
              return !0;
            }
            if("up" === dir){
              if(rowI > 0 && rowsGrid[rowI - 1]){
                var prevRow = rowsGrid[rowI - 1];
                var targetCol = Math.min(colI, prevRow.length - 1);
                if(prevRow[targetCol]) return Fe(prevRow[targetCol], true), !0;
              }
              if(actBox && actBox.children.length){
                var actTarget = (colI <= 1) ? 0 : ((colI <= 3) ? 1 : ((colI <= 4) ? 2 : 3));
                if(actBox.children[actTarget]) return Fe(actBox.children[actTarget], true), !0;
              }
              return !0;
            }
            if("down" === dir){
              if(rowI < rowsGrid.length - 1 && rowsGrid[rowI + 1]){
                var nextRow = rowsGrid[rowI + 1];
                var targetCol = Math.min(colI, nextRow.length - 1);
                if(nextRow[targetCol]) return Fe(nextRow[targetCol], true), !0;
              }
              if(closeBtn) return Fe(closeBtn, true), !0;
              return !0;
            }
            return !1;
          };
          rowEl.appendChild(key);
          lcsKeys.push(key);
          rArr.push(key);
        })(charsInRow[cIdx], cIdx);
      }
    })(chars, rIdx, rowKeys);
    rowsGrid.push(rowKeys);
    kb.appendChild(rowEl);
  }

  if(actBox){
    o(actBox);
    var actList = [
      {cls: "switch", w: 108},
      {cls: "clear", w: 108},
      {cls: "del", w: 108},
      {cls: "go", w: 134}
    ];
    for(var aIdx = 0; aIdx < actList.length; aIdx++){
      (function(item, idx){
        var btn = n("div", "lcs-action focusable " + item.cls);
        if("go" === item.cls){
          btn.textContent = "Busca";
        } else {
          var ico = n("div", "ico");
          if("switch" === item.cls){
            ico.style.backgroundImage = "url(media/ui/search/" + (lcsSearchNumeric ? "ic_vod_search_abc_default.png" : "ic_vod_search_123_default.png") + ")";
          }
          btn.appendChild(ico);
        }
        btn._kind = item.cls;
        btn._onFocus = function(){ lcsLastFocusedKey = btn; };
        btn._activate = function(){
          if("switch" === item.cls){
            lcsSearchNumeric = !lcsSearchNumeric;
            renderLiveSearchKeyboard();
            var swBtn = actBox.querySelector(".lcs-action.switch");
            if(swBtn) Fe(swBtn, true);
          } else if("clear" === item.cls){
            lcsCurrentQuery = "";
            updateLiveChannelSearchUI(true);
          } else if("del" === item.cls){
            if(lcsCurrentQuery.length > 0){
              lcsCurrentQuery = lcsCurrentQuery.slice(0, -1);
              updateLiveChannelSearchUI(true);
            }
          } else if("go" === item.cls){
            if(lcsResultItems.length) Fe(lcsResultItems[0]);
          }
        };
        btn._onMove = function(dir){
          if("left" === dir){
            if(idx > 0 && actBox.children[idx - 1]) return Fe(actBox.children[idx - 1], true), !0;
            return !0;
          }
          if("right" === dir){
            if(idx < actList.length - 1 && actBox.children[idx + 1]) return Fe(actBox.children[idx + 1], true), !0;
            if(lcsResultItems.length) return Fe(lcsResultItems[0]), !0;
            return !0;
          }
          if("down" === dir){
            if(rowsGrid && rowsGrid.length && rowsGrid[0].length){
              var targetCol = (0 === idx) ? 0 : ((1 === idx) ? 2 : ((2 === idx) ? 4 : 6));
              return Fe(rowsGrid[0][targetCol], true), !0;
            }
            return !0;
          }
          if("up" === dir){
            return !0;
          }
          return !1;
        };
        actBox.appendChild(btn);
      })(actList[aIdx], aIdx);
    }
  }

  if(closeBtn){
    closeBtn._onFocus = function(){ lcsLastFocusedKey = closeBtn; };
    closeBtn._activate = function(){
      closeLiveChannelSearch();
    };
    closeBtn._onMove = function(dir){
      if("up" === dir){
        if(rowsGrid && rowsGrid.length){
          var lastR = rowsGrid[rowsGrid.length - 1];
          if(lastR && lastR.length){
            var retCol = Math.min(Math.max(0, lcsLastKeyCol || 0), lastR.length - 1);
            return Fe(lastR[retCol], true), !0;
          }
        }
        return !0;
      }
      if("down" === dir){
        return !0;
      }
      if("right" === dir){
        if(lcsResultItems.length) return Fe(lcsResultItems[0]), !0;
        return !0;
      }
      return !1;
    };
  }
}

var lcsSearchDebounceTimer = null;
function updateLiveChannelSearchUI(immediate){
  var qBox = r("lcs-query-text");
  if(qBox){
    if(lcsCurrentQuery && lcsCurrentQuery.length > 0){
      qBox.textContent = lcsCurrentQuery;
      qBox.style.color = "#ffffff";
    } else {
      qBox.textContent = "Buscar canales en vivo...";
      qBox.style.color = "#94a3b8";
    }
  }
  if(lcsSearchDebounceTimer){
    clearTimeout(lcsSearchDebounceTimer);
    lcsSearchDebounceTimer = null;
  }
  if(immediate){
    executeLiveChannelSearch(lcsCurrentQuery);
  } else {
    lcsSearchDebounceTimer = setTimeout(function(){
      lcsSearchDebounceTimer = null;
      executeLiveChannelSearch(lcsCurrentQuery);
    }, 45);
  }
}

function getSearchChannelPool(){
  var pool = [];
  var seen = {};
  function add(ch){
    if(!ch || !ch.name || isAdultChannel(ch)) return;
    var k = String(ch.channelCode || ch.id || "") + "|" + c(ch.name || "").trim();
    if(!seen[k]){
      seen[k] = true;
      pool.push(ch);
    }
  }
  if(window.__masterChannelPool && window.__masterChannelPool.length){
    for(var i=0; i<window.__masterChannelPool.length; i++) add(window.__masterChannelPool[i]);
  }
  if(window.__allLiveChannels && window.__allLiveChannels.length){
    for(var i=0; i<window.__allLiveChannels.length; i++) add(window.__allLiveChannels[i]);
  }
  if(window.__categoryChannelsCache){
    for(var ck in window.__categoryChannelsCache){
      if(Object.prototype.hasOwnProperty.call(window.__categoryChannelsCache, ck) && Array.isArray(window.__categoryChannelsCache[ck])){
        var cArr = window.__categoryChannelsCache[ck];
        for(var ci=0; ci<cArr.length; ci++) add(cArr[ci]);
      }
    }
  }
  if(window.__ESPN_CHANNELS && window.__ESPN_CHANNELS.length){
    for(var i=0; i<window.__ESPN_CHANNELS.length; i++) add(window.__ESPN_CHANNELS[i]);
  }
  if(z && z.length){
    for(var i=0; i<z.length; i++) add(z[i]);
  }
  var favs = getStoredFavorites();
  for(var i=0; i<favs.length; i++) add(favs[i]);
  return pool;
}

function executeLiveChannelSearch(rawQuery){
  var resList = r("lcs-results-list");
  var countEl = r("lcs-results-count");
  if(!resList) return;
  o(resList);
  lcsResultItems = [];

  var q = c(rawQuery || "").trim();
  var pool = getSearchChannelPool();

  if(!q){
    if(countEl) countEl.textContent = pool.length + " canales disponibles";
    var hint = n("div", "lcs-empty-hint", "Escribe en el teclado para buscar canales en vivo…");
    resList.appendChild(hint);
    return;
  }

  var tier1 = [];
  var tier2 = [];
  var tier3 = [];

  for(var i=0; i<pool.length; i++){
    var ch = pool[i];
    if(!ch || !ch.name) continue;
    var normName = c(ch.name).trim();
    var cleanName = normName.replace(/^\d+[\s\.\-]+/, "").trim();
    var words = cleanName.split(/\s+/);

    if(cleanName.indexOf(q) === 0 || normName.indexOf(q) === 0){
      tier1.push(ch);
    } else {
      var wordMatch = false;
      for(var w=1; w<words.length; w++){
        if(words[w].indexOf(q) === 0){
          wordMatch = true;
          break;
        }
      }
      if(wordMatch){
        tier2.push(ch);
      } else if(normName.indexOf(q) !== -1){
        tier3.push(ch);
      }
    }
  }

  sortChannelsAlphaNumFirst(tier1);
  sortChannelsAlphaNumFirst(tier2);
  sortChannelsAlphaNumFirst(tier3);
  var matches = tier1.concat(tier2).concat(tier3);

  if(countEl) countEl.textContent = matches.length + (matches.length === 1 ? " canal encontrado" : " canales encontrados");

  if(!matches.length){
    var noRes = n("div", "lcs-empty-hint", 'No se encontraron canales para "' + rawQuery + '"');
    resList.appendChild(noRes);
    return;
  }

  for(var m=0; m<matches.length; m++){
    (function(matchCh, mIdx){
      var item = n("div", "lcs-item focusable");
      item._resIdx = mIdx;
      var num = n("div", "lcs-item-num", d(matchCh.index || mIdx + 1));
      item.appendChild(num);
      if(matchCh.logo){
        var logoImg = n("img", "lcs-item-logo");
        logoImg.alt = "";
        if(0 === String(matchCh.logo).indexOf("media/")){
          logoImg.src = matchCh.logo;
          logoImg._loaded = !0;
        } else {
          logoImg._realSrc = matchCh.logo;
          item._logoImg = logoImg;
          if(mIdx < 12){
            logoImg._loaded = !0;
            logoImg.onerror = function(){ this.style.display = "none"; };
            logoImg.src = matchCh.logo;
          }
        }
        item.appendChild(logoImg);
      } else {
        var logoPh = n("div", "lcs-item-logo-placeholder", "📺");
        item.appendChild(logoPh);
      }
      var nameEl = n("div", "lcs-item-name", matchCh.name);
      item.appendChild(nameEl);
      if(matchCh.categoryName){
        var catEl = n("div", "lcs-item-cat", matchCh.categoryName);
        item.appendChild(catEl);
      }
      if(isChannelFavorite(matchCh)){
        var favEl = n("div", "lcs-item-cat", "⭐ Favorito");
        favEl.style.color = "#fbbf24";
        item.appendChild(favEl);
      }

      item._activate = function(){
        playLiveSearchChannel(matchCh);
      };

      item._onMove = function(dir){
        if("left" === dir){
          var actEl = r("lcs-actions");
          var returnKey = lcsLastFocusedKey || lcsSpaceKey || lcsKeys[0] || (actEl && actEl.children[0]) || r("lcs-feedback");
          if(returnKey) Fe(returnKey, true);
          return !0;
        }
        if("up" === dir){
          if(mIdx > 0 && lcsResultItems[mIdx - 1]){
            Fe(lcsResultItems[mIdx - 1]);
            scrollSearchItemIntoView(lcsResultItems[mIdx - 1]);
            return !0;
          }
          return !0;
        }
        if("down" === dir){
          if(mIdx < lcsResultItems.length - 1 && lcsResultItems[mIdx + 1]){
            Fe(lcsResultItems[mIdx + 1]);
            scrollSearchItemIntoView(lcsResultItems[mIdx + 1]);
            return !0;
          }
          return !0;
        }
        return !1;
      };

      resList.appendChild(item);
      lcsResultItems.push(item);
    })(matches[m], m);
  }
}

function scrollSearchItemIntoView(el){
  if(!el) return;
  var p = el.parentNode;
  if(!p) return;
  var top = el.offsetTop, h = el.offsetHeight;
  if(top < p.scrollTop + 40){
    p.scrollTop = Math.max(0, top - 60);
  }else if(top + h > p.scrollTop + p.clientHeight - 40){
    p.scrollTop = top + h - p.clientHeight + 60;
  }
  if(void 0 !== el._resIdx && lcsResultItems.length){
    var sI = Math.max(0, el._resIdx - 4);
    var eI = Math.min(lcsResultItems.length - 1, el._resIdx + 10);
    for(var i = sI; i <= eI; i++){
      var rIt = lcsResultItems[i];
      if(rIt && rIt._logoImg && rIt._logoImg._realSrc && !rIt._logoImg._loaded){
        (function(im){
          im._loaded = !0;
          im.onerror = function(){ this.style.display = "none"; };
          im.src = im._realSrc;
        })(rIt._logoImg);
      }
    }
  }
}

function playLiveSearchChannel(ch){
  closeLiveChannelSearch();
  var foundIdx = -1;
  for(var i=0; i<z.length; i++){
    if((z[i].channelCode && ch.channelCode && z[i].channelCode === ch.channelCode) || (z[i].id && ch.id && z[i].id === ch.id) || (z[i].name && ch.name && z[i].name === ch.name)){
      foundIdx = i;
      break;
    }
  }
  if(foundIdx < 0){
    z.unshift(ch);
    foundIdx = 0;
  }
  ke.channel = foundIdx;
  if("player" !== ke.screen){
    hn("live");
  }
  St(foundIdx, !0);
  bn();
  if("internal" === lcsSearchMode && ce){
    Ja();
  }
}

function xn(){
  var e,t;
  if(i()){a();return;}
  document.addEventListener("keydown",$e,!1);
  document.addEventListener("keyup",function(e){461!==(e.keyCode||e.which)&&10009!==(e.keyCode||e.which)&&"Back"!==e.key&&"GoBack"!==e.key||$e(e)},!1);
  window.addEventListener("popstate",function(){je()},!1);
  document.addEventListener("click",function(e){var t=s(e.target,".focusable");t&&(Fe(t,!0),t._activate&&t._activate())});
  window.__splashScreenVisible=true;
  try{
    var cachedCat=loadCachedCatalog();
    if(cachedCat&&cachedCat.length){
      M(cachedCat,"cache",!0);
      preloadCatalogPosters(cachedCat);
    }
  }catch(e){console.warn("[Catalog cache load err]",e);}
  try{Xe();}catch(e){console.error("[Xe err]",e);}
  try{F();}catch(e){console.error("[F err]",e);}
  try{bt();}catch(e){console.error("[bt err]",e);}
  (function(){
    if(A()){
      var e=h.serviceId||"com.webosflux.xuptertv.fidelity.service";
      try{window.webOS.service.request("luna://"+e,{method:"keepAlive",parameters:{subscribe:!0},resubscribe:!0,onSuccess:function(){},onFailure:function(){}})}catch(e){}
      setInterval(function(){try{window.webOS.service.request("luna://"+e,{method:"heartbeat",parameters:{},onSuccess:function(){},onFailure:function(){}})}catch(e){}},15e3);
    }
  })();
  setInterval(function(){i()&&(dn(),ht(),a())},15e3);
  window.__xuper={version:"3.0.0",state:ke,vod:u,channels:z,api:g,portal:y,service:D,refreshPortal:N,reloadVod:F,skipWelcome:Xe,show:function(e){"home"===e?Xe():"detail"===e?At(u[0]):"search"===e?zt():"settings"===e?Jt():"player"===e?hn("live"):ze(e)},selectTab:function(e){Xe(),Ze(e,!0)},openDetail:function(e){At(u[e]||u[0])},openSearch:zt,openSettings:Jt,openHistory:openHistoryManager,historyManager:{open:openHistoryManager,render:renderHistoryManager},openPlayer:function(e,t){hn(e||"live",u[t]||null)},focus:function(e){var t="string"==typeof e?document.querySelector(e):e;t&&Fe(t)},key:function(e){$e({keyCode:e,preventDefault:function(){}})},search:function(e){zt(),jt(e)},settingsPanel:function(e){Jt(),Kt(e,!0)}};
  (function(){
    var e=String(location.search||"").replace(/^\?/,"");
    if(!e)return;
    for(var t={},i=e.split("&"),a=0;a<i.length;a++)if(i[a]){var n=i[a].split("=");t[decodeURIComponent(n[0])]=decodeURIComponent(n.slice(1).join("=")||"")}
    if(void 0!==t.ch){var r=parseInt(t.ch,10)||0;ke.channel=Math.max(0,Math.min(z.length-1,r))}
    var o=t.screen||"home";
    if("welcome"===o)return;
    Xe();
    void 0!==t.tab?Ze(parseInt(t.tab,10)||0,!0):(Ze(0,!1),Fe(X));
    "filter"===o?openFilterScreen():"detail"===o?At(u[parseInt(t.vod,10)||0]):"search"===o?(zt(),t.q&&jt(t.q)):"settings"===o?(Jt(),void 0!==t.panel&&Kt(parseInt(t.panel,10)||0,!0)):"player"===o&&(hn("vod"===t.mode?"vod":"live",u[parseInt(t.vod,10)||0]),"1"===t.channels&&wn());
    if(t.focus){var l=document.querySelector(t.focus);l&&Fe(l)}
  })();
  setTimeout(function(){
    try{
      if(Me.length&&Me[0]){
        Fe(Me[0]);
      }else if(X){
        Fe(X);
      }else if(Ee.length&&Ee[0]){
        Fe(Ee[0]);
      }
      var splash=document.getElementById("splash-screen");
      if(splash){
        splash.classList.add("is-hidden");
        setTimeout(function(){
          splash.style.display="none";
          window.__splashScreenVisible=false;
        },500);
      }else{
        window.__splashScreenVisible=false;
      }
    }catch(err){
      console.error("[Splash dismiss error]",err);
      window.__splashScreenVisible=false;
    }
  },2400);
}function _n(){dn(),Wt()}window.addEventListener("beforeunload",_n),window.addEventListener("unload",_n),document.addEventListener("visibilitychange",function(){if(document.hidden){if(pe&&!pe.paused&&!(window.CactusAVPlay&&window.CactusAVPlay.isActive&&window.CactusAVPlay.isActive())){try{pe.pause()}catch(e){}}}else{if(pe&&pe.paused&&"player"===ke.screen&&pe.src&&!(window.CactusAVPlay&&window.CactusAVPlay.isActive&&window.CactusAVPlay.isActive())){try{var p=pe.play();p&&p.catch&&p.catch(function(){})}catch(e){}}}}),"loading"===document.readyState?document.addEventListener("DOMContentLoaded",xn):xn()}();