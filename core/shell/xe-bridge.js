/**
 * Xuper Eclectic - Tizen Bridge
 * Proporciona autoescalado universal (1366x768 hasta 4K),
 * mapeo de teclas de control remoto Tizen y puente directo con CactusDirect
 * con fallbacks locales pre-empaquetados para máxima resiliencia.
 */
(function (w, d) {
  'use strict';
  var channelCache = Object.create(null);

  // 1. Auto-escalador de resolución universal (1366x768, 720p, 1080p, 4K)
  function fitResolution() {
    try {
      var sw = w.innerWidth || (d.documentElement && d.documentElement.clientWidth) || 1920;
      var sh = w.innerHeight || (d.documentElement && d.documentElement.clientHeight) || 1080;
      var app = d.getElementById('app');
      if (!app) return;

      if (sw !== 1920 || sh !== 1080) {
        var scaleX = sw / 1920;
        var scaleY = sh / 1080;
        var scale = Math.min(scaleX, scaleY);
        app.style.transform = 'scale(' + scale + ')';
        app.style.transformOrigin = '0 0';
        app.style.position = 'absolute';
        app.style.left = Math.max(0, (sw - 1920 * scale) / 2) + 'px';
        app.style.top = Math.max(0, (sh - 1080 * scale) / 2) + 'px';
      } else {
        app.style.transform = '';
        app.style.position = 'relative';
        app.style.left = '0px';
        app.style.top = '0px';
      }
    } catch (e) {
      console.warn('[fitResolution err]', e);
    }
  }

  w.addEventListener('resize', fitResolution);
  if (d.readyState === 'loading') {
    d.addEventListener('DOMContentLoaded', fitResolution);
  } else {
    fitResolution();
  }

  // 2. Registro de teclas de control remoto Samsung Tizen (completo 25 teclas)
  function registerTizenKeys() {
    try {
      if (w.tizen && w.tizen.tvinputdevice) {
        var keys = [
          'MediaPlay', 'MediaPause', 'MediaPlayPause', 'MediaFastForward',
          'MediaRewind', 'MediaStop', 'ChannelUp', 'ChannelDown', 'Info',
          'ColorF0Red', 'ColorF1Green', 'ColorF2Yellow', 'ColorF3Blue',
          '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'
        ];
        for (var i = 0; i < keys.length; i++) {
          try {
            w.tizen.tvinputdevice.registerKey(keys[i]);
          } catch (e) {}
        }
      }
    } catch (e) {}
  }
  registerTizenKeys();

  // 3. Limpieza de localStorage anterior para evitar bloqueos de flash/CPU
  try {
    ['xuper.cached_channels', 'xuper.cached_home_featured', 'xuper.cached_home_movies', 'xuper.cached_home_series', 'xuper.cached_home_anime', 'xuper.cached_home_kids', 'xuper.cached_home_free', 'xuper_Fatal_Errors'].forEach(function(k) {
      w.localStorage.removeItem(k);
    });
  } catch (e) {}

  // Memoria RAM exclusivamente para caché temporal con control de expiración (TTL)
  var CHANNEL_CACHE_TTL = 20 * 60 * 1000;
  var channelCacheTs = 0;
  var masterRefreshInflight = null;
  var homeCache = {};
  var itemAudioCache = {};
  var itemAudioKeys = [];
  var itemSubtitleCache = {};
  var liveChannelsCache = {};
  var liveChannelsCacheTs = {};
  var lastActiveTs = Date.now();

  function isLicenseValid(list) {
    if (!Array.isArray(list) || !list.length || !list[0] || !list[0].license) return false;
    var m = /[?&]expired=(\d+)/.exec(String(list[0].license));
    if (!m) return true;
    var expSec = Number(m[1]);
    if (!expSec) return true;
    return (expSec * 1000) > (Date.now() + 300000);
  }

  function clearAllCaches(includeSessionCheck) {
    channelCache = Object.create(null);
    channelCacheTs = 0;
    masterRefreshInflight = null;
    homeCache = {};
    itemAudioCache = {};
    itemAudioKeys = [];
    itemSubtitleCache = {};
    liveChannelsCache = {};
    liveChannelsCacheTs = {};
    w.__xePortalCache = null;
    w.__xePortalCacheTs = 0;
    w.__xeEpicCache = null;
    w.__xeEpicMenuCache = null;
    w.__xeEpic247Cache = null;
    w.__xeEspnUnifiedCache = null;
    if (w.CactusDirect && w.CactusDirect.connect) {
      w.CactusDirect.connect().then(function(c) {
        if (c && c.catalog && c.catalog.clearCache) c.catalog.clearCache();
        if (c && c.stream) c.stream._slbCache = null;
        if (includeSessionCheck && c && c.session) {
          c.session.ensure();
        }
      }).catch(function(){});
    }
  }

  function onAppWakecheck() {
    var now = Date.now();
    if (now - lastActiveTs > 30 * 60 * 1000) {
      clearAllCaches(true);
    }
    lastActiveTs = now;
  }

  d.addEventListener('visibilitychange', function() {
    if (!d.hidden) onAppWakecheck();
  });
  w.addEventListener('focus', onAppWakecheck);
  function getBundledHome(root) {
    try {
      var portal = w.XUPERTV_PORTAL || {};
      var rawItems = portal.items || [];
      if (!rawItems.length) {
        rawItems = portal[root] || [];
      }
      if (!rawItems.length) return [];
      var items = rawItems.filter(function(it) {
        return it && !/er[oó]tic|hentai|18\+/i.test(it.title || '');
      });
      if (root === 'movies' || root === 'pelicula') {
        var m = items.filter(function(it){ return it.kind === 'película' || it.type === 'movie' || (it.category && it.category.indexOf('pelicula') !== -1); });
        return m.length ? m : items;
      }
      if (root === 'series' || root === 'serie') {
        var s = items.filter(function(it){ return it.kind === 'serie' || it.type === 'teleplay' || (it.category && it.category.indexOf('serie') !== -1); });
        return s.length ? s : items;
      }
      if (root === 'anime') {
        var a = items.filter(function(it){ return it.category && it.category.indexOf('anime') !== -1; });
        return a.length ? a : items;
      }
      if (root === 'kids' || root === 'infantil') {
        var k = items.filter(function(it){ return it.category && it.category.indexOf('infantil') !== -1; });
        return k.length ? k : items;
      }
      return items;
    } catch (e) {
      return [];
    }
  }

  function getBundledDetail(contentId) {
    try {
      var portal = w.XUPERTV_PORTAL || {};
      var items = portal.items || [];
      var found = null;
      for (var i = 0; i < items.length; i++) {
        if (String(items[i].id) === String(contentId)) { found = items[i]; break; }
      }
      if (!found && items.length) found = items[0];
      if (!found) return null;
      var isSeries = found.type === 'teleplay' || found.kind === 'serie';
      var episodes = [];
      var seasons = [];
      if (isSeries) {
        seasons = [{ id: String(found.id), number: 1 }];
        for (var ep = 1; ep <= 12; ep++) {
          episodes.push({
            id: String(found.id) + '_' + ep,
            title: 'Capítulo ' + ep,
            name: 'Capítulo ' + ep,
            number: ep,
            duration: '45:00',
            quality: 'HD',
            description: found.synopsis || ''
          });
        }
      }
      return {
        item: {
          id: String(found.id),
          title: found.title || found.name || '',
          score: found.score || '—',
          year: found.year || '—',
          duration: found.duration || '01:45:00',
          genres: found.genres || [],
          director: found.director || '',
          actors: found.actors || '',
          synopsis: found.synopsis || '',
          poster: found.poster || found.landscape,
          landscape: found.landscape || found.poster,
          backdrop: found.backdrop || found.landscape || found.poster,
          type: isSeries ? 'teleplay' : 'movie',
          alias: found.alias || '',
          country: found.country || '',
          releaseDate: found.releaseDate || found.year || '',
          audio: found.audio || (/bra[sz]il|portug/i.test((found.country || '') + ' ' + (found.title || '')) ? 'Portugués' : ''),
          portal: true
        },
        episodes: episodes,
        seasons: seasons
      };
    } catch(e) {
      return null;
    }
  }

  var isAdultChannel = function(c) {
    if (!c) return false;
    var s = ((c.name || '') + ' ' + (c.channelCode || '')).toLowerCase();
    if (s.indexOf('adult swim') !== -1) return false;
    return /18\+|\+18|xxx|playboy|venus|hustler|sextreme|penthouse|redlight|brazzers|dorcel|tokyo hot|heyzo|carib|1pon|nyokei|cr_sexy/i.test(s);
  };

  function refreshMasterChannelCache(client, force) {
    if (!client || !client.live) return Promise.resolve([]);
    var now = Date.now();
    if (!force && channelCacheTs > 0 && (now - channelCacheTs) < CHANNEL_CACHE_TTL && liveChannelsCache[76182] && liveChannelsCache[76182].length) {
      return Promise.resolve(liveChannelsCache[76182]);
    }
    if (masterRefreshInflight) return masterRefreshInflight;
    masterRefreshInflight = client.live.getLiveData({ columnId: 76182, pageSize: 3000 }).then(function (res) {
      masterRefreshInflight = null;
      var list = res && res.channelList || [];
      var chs = [];
      for (var i = 0; i < list.length; i++) {
        var c = list[i];
        if (!c || isAdultChannel(c) || !Array.isArray(c.liveAddressList) || !c.liveAddressList.length) continue;
        channelCache[c.channelCode] = c;
        chs.push({
          channelCode: c.channelCode,
          index: c.channelNumber || (chs.length + 1),
          name: c.name,
          logo: c.posterUrl || (c.posterList && c.posterList[0] && c.posterList[0].fileUrl) || '',
          uhd: /fhd|uhd|4k/i.test(c.name || ''),
          fav: false,
          now: 'En vivo',
          next: '',
          time: '',
          liveAddressList: c.liveAddressList
        });
      }
      if (chs.length > 0) {
        if (w.__ESPN_CHANNELS && w.__ESPN_CHANNELS.length) {
          for (var eIdx = 0; eIdx < w.__ESPN_CHANNELS.length; eIdx++) {
            var ech = w.__ESPN_CHANNELS[eIdx];
            var exists = false;
            for (var cIdx = 0; cIdx < chs.length; cIdx++) {
              if (chs[cIdx].channelCode === ech.channelCode) { exists = true; break; }
            }
            if (!exists) {
              chs.push(ech);
            }
          }
        }
        liveChannelsCache[76182] = chs;
        liveChannelsCacheTs[76182] = Date.now();
        channelCacheTs = Date.now();
      }
      return chs;
    }).catch(function (err) {
      masterRefreshInflight = null;
      throw err;
    });
    return masterRefreshInflight;
  }

  function getBundledChannels() {
    if (w.__BUNDLED_CHANNELS && w.__BUNDLED_CHANNELS.length > 0) {
      if (!w.__BUNDLED_FILTERED) {
        w.__BUNDLED_FILTERED = w.__BUNDLED_CHANNELS.filter(function(c) {
          return !isAdultChannel(c);
        });
      }
      return w.__BUNDLED_FILTERED;
    }
    var names = [
      "Canal de Películas HD", "Acción & Cine", "Series Estelares",
      "Deportes en Vivo", "Kids Animación", "Cine Clásico",
      "Mundo Documental", "Música & Hits", "Noticias 24h",
      "Comedia Internacional", "Anime Total", "Canal Familia"
    ];
    var chs = [];
    for (var i = 0; i < names.length; i++) {
      chs.push({
        channelCode: "ch_" + (i + 1),
        index: i + 1,
        name: names[i],
        logo: "",
        uhd: i % 2 === 0,
        fav: i < 3,
        now: "Transmisión en directo",
        next: "Programación habitual",
        time: "En emisión",
        liveAddressList: []
      });
    }
    return chs;
  }

  try {
    var initChs = getBundledChannels();
    if (initChs && initChs.length) {
      liveChannelsCache[76182] = initChs;
      liveChannelsCacheTs[76182] = Date.now();
      channelCacheTs = Date.now();
      for (var ci = 0; ci < initChs.length; ci++) {
        if (initChs[ci] && initChs[ci].channelCode) {
          channelCache[initChs[ci].channelCode] = initChs[ci];
        }
      }
    }
  } catch(e) {}

  var COUNTRY_S1_PAIR_MAP = {
    76188: [{ id: 76188, name: 'Colombia', countryFolder: 'Colombia', m3uUrl: 'https://cdn.jsdelivr.net/gh/iptv-org/iptv@gh-pages/countries/co.m3u' }],
    76191: [{ id: 76191, name: 'España', countryFolder: 'España', m3uUrl: 'https://cdn.jsdelivr.net/gh/iptv-org/iptv@gh-pages/countries/es.m3u' }],
    76197: [{ id: 76197, name: 'México', countryFolder: 'México', m3uUrl: 'https://cdn.jsdelivr.net/gh/iptv-org/iptv@gh-pages/countries/mx.m3u' }],
    76190: [{ id: 76190, name: 'Argentina', countryFolder: 'Argentina', m3uUrl: 'https://cdn.jsdelivr.net/gh/iptv-org/iptv@gh-pages/countries/ar.m3u' }],
    76195: [{ id: 76195, name: 'Chile & Perú', countryFolder: 'Chile|Perú', m3uUrls: ['https://cdn.jsdelivr.net/gh/iptv-org/iptv@gh-pages/countries/cl.m3u', 'https://cdn.jsdelivr.net/gh/iptv-org/iptv@gh-pages/countries/pe.m3u'] }],
    76192: [{ id: 76192, name: 'Ecuador', countryFolder: 'Ecuador', m3uUrl: 'https://cdn.jsdelivr.net/gh/iptv-org/iptv@gh-pages/countries/ec.m3u' }],
    76193: [{ id: 76193, name: 'Bolivia', countryFolder: 'Bolivia', m3uUrl: 'https://cdn.jsdelivr.net/gh/iptv-org/iptv@gh-pages/countries/bo.m3u' }],
    76201: [{ id: 76201, name: 'Estados Unidos', countryFolder: 'USA' }],
    76203: [{ id: 76203, name: 'Guatemala', countryFolder: 'Guatemala', m3uUrl: 'https://cdn.jsdelivr.net/gh/iptv-org/iptv@gh-pages/countries/gt.m3u' }]
  };

  function getSecondaryLiveCategories() {
    return [
      { id: 'addons', name: '➕ Addons M3U', isM3u: true }
    ];
  }

  function buildPairedLiveCategories(mainCats) {
    var deportesCode = '';
    var i, mc;
    if (Array.isArray(mainCats)) {
      for (i = 0; i < mainCats.length; i++) {
        mc = mainCats[i];
        if (mc && Number(mc.id != null ? mc.id : mc.columnId) === 76206 && mc.code) {
          deportesCode = mc.code;
          break;
        }
      }
    }
    var out = [
      { id: 76182, name: 'Todos' },
      { id: 'favorites', name: '⭐ Favoritos', isFavorite: true },
      { id: 'epic_events', name: '🔴 Eventos En Vivo', isEpicEvents: true },
      { id: 'espn', name: 'ESPN', isEspn: true },
      { id: 76206, name: 'Deportes', code: deportesCode }
    ];
    var addedColIds = {};
    if (Array.isArray(mainCats)) {
      for (i = 0; i < mainCats.length; i++) {
        mc = mainCats[i];
        if (!mc) continue;
        var colId = Number(mc.id != null ? mc.id : mc.columnId);
        var cName = String(mc.name || mc.title || '').trim();
        if (!colId || !cName) continue;
        if (cName === 'ChannelList' || colId === 76182 || colId === 76206 || /espn/i.test(cName)) continue;
        if (colId === 76208 || /18\+|adult|xxx/i.test(cName)) continue;
        var pairArr = COUNTRY_S1_PAIR_MAP[colId];
        var catEntry = {
          id: mc.id != null ? mc.id : mc.columnId,
          name: cName,
          code: mc.code || ''
        };
        if (pairArr && pairArr[0]) {
          if (pairArr[0].countryFolder) catEntry.countryFolder = pairArr[0].countryFolder;
          if (pairArr[0].m3uUrl) catEntry.m3uUrl = pairArr[0].m3uUrl;
          if (pairArr[0].m3uUrls) catEntry.m3uUrls = pairArr[0].m3uUrls;
        }
        out.push(catEntry);
        addedColIds[colId] = true;
      }
    }
    var pairColOrder = [76188, 76191, 76197, 76190, 76195, 76192, 76193, 76201, 76203];
    for (var pci = 0; pci < pairColOrder.length; pci++) {
      var cid = pairColOrder[pci];
      if (!addedColIds[cid] && COUNTRY_S1_PAIR_MAP[cid] && COUNTRY_S1_PAIR_MAP[cid][0]) {
        out.push(Object.assign({}, COUNTRY_S1_PAIR_MAP[cid][0]));
        addedColIds[cid] = true;
      }
    }
    return out.concat(getSecondaryLiveCategories());
  }

  function buildDefaultLiveCategories(full) {
    var mainCats = [
      { id: 76188, name: 'Colombia' },
      { id: 76191, name: 'España' },
      { id: 76197, name: 'México' },
      { id: 76190, name: 'Argentina' },
      { id: 76195, name: 'Chile & Perú' },
      { id: 76192, name: 'Ecuador' },
      { id: 76193, name: 'Bolivia' },
      { id: 76201, name: 'Estados Unidos' },
      { id: 76203, name: 'Guatemala' },
      { id: 76205, name: 'Cine y Series' }
    ];
    if (full) {
      mainCats.push(
        { id: 79146, name: 'Infantil' },
        { id: 76189, name: 'Venezuela' },
        { id: 76194, name: 'Uruguay' },
        { id: 76196, name: 'Paraguay' },
        { id: 76204, name: 'Honduras' },
        { id: 76207, name: 'El Salvador' },
        { id: 76211, name: 'Noticias' },
        { id: 76212, name: 'Música' },
        { id: 76217, name: 'Cultura y Ciencia' }
      );
    }
    return buildPairedLiveCategories(mainCats);
  }

  // 4. Puente de servicios: Reemplaza las llamadas de webOS Luna service por CactusDirect nativo
  function serviceCall(method, params, callback) {
    params = params || {};
    callback = callback || function () {};

    if (method === 'ping' || method === 'keepAlive' || method === 'heartbeat') {
      return setTimeout(function () {
        callback(null, { returnValue: true, alive: true });
      }, 0);
    }

    if (method === 'mediaInfo') {
      var cid = String(params.contentId || '');
      var cachedAudio = itemAudioCache[cid] || '';
      var cachedSubs = itemSubtitleCache[cid] || [];
      if (!cachedAudio || !cachedSubs.length) {
        var bd = getBundledDetail(cid);
        if (bd && bd.item) {
          if (!cachedAudio && bd.item.audio) cachedAudio = bd.item.audio;
          if (!cachedSubs.length && bd.item.subtitles && bd.item.subtitles.length) cachedSubs = bd.item.subtitles;
        }
      }
      return setTimeout(function() {
        callback(null, {
          returnValue: true,
          name: params.title || '',
          audio: cachedAudio || '',
          subtitles: cachedSubs || [],
          tracks: [],
          duration: 0
        });
      }, 0);
    }

    if (method === 'netdiag') {
      return setTimeout(function() {
        callback(null, {
          returnValue: true,
          hosts: [
            { host: 'api.portal.magis', doh: { ok: true, ips: ['127.0.0.1'] }, system: { ok: true, ips: ['127.0.0.1'] } }
          ],
          layers: { portal: true, session: true, stream: true },
          version: '2.0.5'
        });
      }, 0);
    }

    if (method === 'home') {
      var rootCheck = params.root || 'movies';
      if (homeCache[rootCheck] && homeCache[rootCheck].length > 0) {
        return setTimeout(function () {
          callback(null, { returnValue: true, root: rootCheck, items: homeCache[rootCheck] });
        }, 0);
      }
      if (rootCheck === 'free') {
        var freeBundled = getBundledHome('free');
        homeCache['free'] = freeBundled;
        return setTimeout(function () {
          callback(null, { returnValue: true, root: 'free', items: freeBundled });
        }, 0);
      }
    }

    // =========================================================================
    // M3U Addons & Dynamic Sports LATAM (PlayLatam / EpicTV) - Sin bloquear Portal
    // =========================================================================
    var DEFAULT_PULSERA = 'e13cb181.gente.1794773248.69f665b7f07df5c4cd69efc5e048ad0d2d7e094be05c33cfbfea2c01d3854008';
    var EPIC_TOKEN_KEY = 'xuper_epic_pulsera_v1';
    var EPIC_TTL_MS = 20 * 60 * 60 * 1000;
    var M3U_MEM_CACHE = w.__xeM3uMemCache || (w.__xeM3uMemCache = {});
    var M3U_TTL_MS = 12 * 60 * 60 * 1000;

    function isValidPulseraToken(tok) {
      return typeof tok === 'string' && tok.indexOf('.gente.') !== -1 && tok.length > 24;
    }

    var ORIG_USER_AGENT = w.__xeOrigUserAgent || (typeof navigator !== 'undefined' ? (navigator.userAgent || '') : '');
    if (!w.__xeOrigUserAgent && ORIG_USER_AGENT) w.__xeOrigUserAgent = ORIG_USER_AGENT;
    var EPIC_MOBILE_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
    var EPIC_DALVIK_UA = 'Dalvik/2.1.0 (Linux; U; Android 13; SM-G991B Build/TP1A.220624.014)';
    var __xeEpicUaPromise = null;
    var __xeEpicUaMode = '';

    function isEpicBlockedHost(url) {
      return /playlatam\.site|epictvparaiphone\.top|api\.entrada-sur\.workers\.dev|187\.127\.21\.89|84\.32\.109\.221/i.test(String(url || ''));
    }

    function ensureEpicUserAgent() {
      try {
        var curUa = (typeof navigator !== 'undefined' && navigator.userAgent) ? navigator.userAgent : '';
        if (/^Dalvik\//i.test(curUa)) {
          return Promise.resolve(true);
        }
        if (__xeEpicUaPromise) return __xeEpicUaPromise;
        if (w.tizen && w.tizen.websetting && typeof w.tizen.websetting.setUserAgentString === 'function') {
          __xeEpicUaPromise = new Promise(function (resolve) {
            var done = false;
            var tm = setTimeout(function () {
              if (!done) { done = true; __xeEpicUaPromise = null; resolve(false); }
            }, 1200);
            try {
              w.tizen.websetting.setUserAgentString(EPIC_DALVIK_UA, function () {
                if (!done) { done = true; clearTimeout(tm); __xeEpicUaPromise = null; resolve(true); }
              }, function () {
                if (!done) { done = true; clearTimeout(tm); __xeEpicUaPromise = null; resolve(false); }
              });
            } catch (_) {
              if (!done) { done = true; clearTimeout(tm); __xeEpicUaPromise = null; resolve(false); }
            }
          });
          return __xeEpicUaPromise;
        }
      } catch (_) {}
      return Promise.resolve(false);
    }

    function getEpicTokenCached() {
      try {
        var raw = w.localStorage && w.localStorage.getItem(EPIC_TOKEN_KEY);
        if (raw) {
          var parsed = JSON.parse(raw);
          if (parsed && isValidPulseraToken(parsed.token) && (Date.now() - (parsed.timestamp || 0)) < EPIC_TTL_MS) {
            return parsed.token;
          }
          // Limpiar tokens invalidos (ej. "numero" corto sin ".gente.") guardados previamente
          if (parsed && !isValidPulseraToken(parsed.token)) {
            try { w.localStorage.removeItem(EPIC_TOKEN_KEY); } catch (_) {}
          }
        }
      } catch (_) {}
      return '';
    }

    function isTizen3Device() {
      var ua = w.__xeOrigUserAgent || (typeof navigator !== 'undefined' ? (navigator.userAgent || '') : '');
      return /Tizen\s*3\.|AppleWebKit\/538/i.test(ua);
    }

    var PORTAL_MIRRORS = [
      'https://playlatam.site',
      'https://api.entrada-sur.workers.dev',
      'https://187.127.21.89',
      'https://84.32.109.221'
    ];
    var PORTAL_BEST_HOST_KEY = 'xuper.portal_best_host';
    var PORTAL_BEST_HOST_TTL = 30 * 60 * 1000;
    var PORTAL_APARATO_KEY = 'xuper.portal_aparato_id';

    function getPortalAparatoId() {
      if (w.__xePortalAparatoId) return w.__xePortalAparatoId;
      try {
        var saved = w.localStorage && w.localStorage.getItem(PORTAL_APARATO_KEY);
        if (saved && /^[0-9a-f]{8}$/i.test(saved)) {
          w.__xePortalAparatoId = saved.toLowerCase();
          return w.__xePortalAparatoId;
        }
      } catch (_) {}
      var hex = '';
      for (var i = 0; i < 8; i++) {
        hex += Math.floor(Math.random() * 16).toString(16);
      }
      w.__xePortalAparatoId = hex;
      try {
        if (w.localStorage) w.localStorage.setItem(PORTAL_APARATO_KEY, hex);
      } catch (_) {}
      return hex;
    }

    function getCachedBestPortalHost() {
      var now = Date.now();
      if (w.__xeBestPortalHost && w.__xeBestPortalHostTs && (now - w.__xeBestPortalHostTs) < PORTAL_BEST_HOST_TTL) {
        return w.__xeBestPortalHost;
      }
      try {
        var raw = w.localStorage && w.localStorage.getItem(PORTAL_BEST_HOST_KEY);
        if (raw) {
          var parsed = JSON.parse(raw);
          if (parsed && parsed.host && PORTAL_MIRRORS.indexOf(parsed.host) !== -1 && (now - (parsed.ts || 0)) < PORTAL_BEST_HOST_TTL) {
            w.__xeBestPortalHost = parsed.host;
            w.__xeBestPortalHostTs = parsed.ts;
            return parsed.host;
          }
        }
      } catch (_) {}
      return '';
    }

    function saveBestPortalHost(host, latencyMs) {
      if (!host || PORTAL_MIRRORS.indexOf(host) === -1) return;
      var now = Date.now();
      w.__xeBestPortalHost = host;
      w.__xeBestPortalHostTs = now;
      w.__xeBestPortalHostMs = latencyMs || 0;
      try {
        if (w.localStorage) {
          w.localStorage.setItem(PORTAL_BEST_HOST_KEY, JSON.stringify({ host: host, ms: latencyMs || 0, ts: now }));
        }
      } catch (_) {}
    }

    function probeFastestPortalMirror() {
      if (w.__xePortalProbeInflight || typeof w.fetch !== 'function' || isTizen3Device()) return;
      w.__xePortalProbeInflight = true;
      ensureEpicUserAgent().then(function () {
        var bestHost = '';
        var bestMs = 999999;
        var pending = PORTAL_MIRRORS.length;
        for (var i = 0; i < PORTAL_MIRRORS.length; i++) {
          (function (mirrorHost) {
            var t0 = Date.now();
            var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
            var tm = ctrl ? setTimeout(function () { try { ctrl.abort(); } catch (_) {} }, 3200) : null;
            w.fetch(mirrorHost + '/iphone/pulsera', {
              method: 'POST',
              headers: { 'Accept': 'application/json, text/plain, */*' },
              signal: ctrl ? ctrl.signal : undefined
            }).then(function (r) {
              if (tm) clearTimeout(tm);
              if (r && r.ok) {
                var dt = Date.now() - t0;
                if (dt < bestMs) {
                  bestMs = dt;
                  bestHost = mirrorHost;
                  saveBestPortalHost(bestHost, bestMs);
                }
              }
            }).catch(function () {
              if (tm) clearTimeout(tm);
            }).then(function () {
              pending--;
              if (pending <= 0) w.__xePortalProbeInflight = false;
            });
          })(PORTAL_MIRRORS[i]);
        }
      });
    }

    function getOrderedPortalMirrors() {
      var best = getCachedBestPortalHost();
      if (!best) probeFastestPortalMirror();
      var list = [];
      if (best) list.push(best);
      for (var i = 0; i < PORTAL_MIRRORS.length; i++) {
        if (list.indexOf(PORTAL_MIRRORS[i]) === -1) list.push(PORTAL_MIRRORS[i]);
      }
      return list;
    }

    function epicRawFetch(targetUrl, method, headers, timeoutMs, asText) {
      if (typeof w.fetch !== 'function') return Promise.reject(new Error('fetch no disponible'));
      var relay = w.XuperRelay;
      function execOnce(urlToCall, useRelay, mirrorBase) {
        var reqUrl = urlToCall;
        var reqHdrs = Object.assign({}, headers || {});
        if (useRelay && relay && typeof relay.wrapPortalRequest === 'function') {
          if (reqHdrs['X-Pulsera'] && !reqHdrs['X-Cookie']) {
            reqHdrs['X-Cookie'] = '__Host-pulsera=' + reqHdrs['X-Pulsera'];
          }
          var wrapped = relay.wrapPortalRequest(targetUrl, { method: method || 'GET', headers: reqHdrs });
          if (wrapped && wrapped.relayed) {
            reqUrl = wrapped.url;
            reqHdrs = wrapped.options.headers || reqHdrs;
          }
        }
        var t0 = Date.now();
        var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
        var tm = ctrl ? setTimeout(function () { try { ctrl.abort(); } catch (_) {} }, timeoutMs || 4500) : null;
        return w.fetch(reqUrl, {
          method: method || 'GET',
          headers: reqHdrs,
          signal: ctrl ? ctrl.signal : undefined
        }).then(function (r) {
          if (tm) clearTimeout(tm);
          if (!r || !r.ok) throw new Error('HTTP ' + (r ? r.status : 0));
          if (mirrorBase && !useRelay) {
            var dt = Date.now() - t0;
            if (!w.__xeBestPortalHost || mirrorBase === w.__xeBestPortalHost || dt < (w.__xeBestPortalHostMs || 999999)) {
              saveBestPortalHost(mirrorBase, dt);
            }
          }
          return asText ? r.text() : r.json();
        }, function (err) {
          if (tm) clearTimeout(tm);
          throw err;
        });
      }
      if (isTizen3Device() && relay && typeof relay.wrapPortalRequest === 'function') {
        return execOnce(targetUrl, true, '');
      }
      var uaReady = isEpicBlockedHost(targetUrl) ? ensureEpicUserAgent() : Promise.resolve(true);
      return uaReady.then(function () {
        if (/^https:\/\/playlatam\.site(\/|$)/i.test(String(targetUrl || ''))) {
          var mirrors = getOrderedPortalMirrors();
          var tryMirrorIdx = function (mIdx) {
            if (mIdx >= mirrors.length) {
              if (relay && typeof relay.wrapPortalRequest === 'function') return execOnce(targetUrl, true, '');
              return Promise.reject(new Error('Todos los espejos de playlatam fallaron'));
            }
            var mHost = mirrors[mIdx];
            var mUrl = String(targetUrl).replace(/^https:\/\/playlatam\.site/i, mHost);
            var mTmo = mIdx === 0 ? (timeoutMs || 4500) : Math.min(timeoutMs || 4500, 3500);
            var prevTmo = timeoutMs;
            timeoutMs = mTmo;
            return execOnce(mUrl, false, mHost).then(function (res) {
              timeoutMs = prevTmo;
              return res;
            }, function () {
              timeoutMs = prevTmo;
              return tryMirrorIdx(mIdx + 1);
            });
          };
          return tryMirrorIdx(0);
        }
        return execOnce(targetUrl, false, '').catch(function (err) {
          if (relay && typeof relay.wrapPortalRequest === 'function') return execOnce(targetUrl, true, '');
          throw err;
        });
      });
    }

    function epicFetch(targetUrl, method, headers, timeoutMs) {
      return epicRawFetch(targetUrl, method, headers, timeoutMs, false);
    }

    function epicTextFetch(targetUrl, headers, timeoutMs) {
      return epicRawFetch(targetUrl, 'GET', headers, timeoutMs, true);
    }

    function fetchEpicTokenFresh() {
      var cachedTok = getEpicTokenCached();
      // App 1 conserva siempre el token firmado ".gente." y nunca lo pisa con "numero" corto de 8 chars.
      if (isValidPulseraToken(cachedTok)) {
        return Promise.resolve(cachedTok);
      }
      if (typeof w.fetch !== 'function') return Promise.resolve(DEFAULT_PULSERA);
      return epicFetch('https://playlatam.site/iphone/pulsera', 'POST', { 'Accept': 'application/json, text/plain, */*' }, 3500)
        .then(function (j) {
          var candidate = j && j.token;
          var tok = isValidPulseraToken(candidate) ? candidate : DEFAULT_PULSERA;
          if (isValidPulseraToken(candidate)) {
            try {
              if (w.localStorage) w.localStorage.setItem(EPIC_TOKEN_KEY, JSON.stringify({ token: tok, timestamp: Date.now() }));
            } catch (_) {}
          }
          return tok;
        }).catch(function () {
          return DEFAULT_PULSERA;
        });
    }

    function normalizeEpicChannelUrl(rawUrl, slug) {
      var u = String(rawUrl || '').trim();
      var baseSlug = String(slug || '').replace(/^pere-|^epic-/, '').replace(/\.m3u8$/i, '');
      if (!u) {
        return baseSlug ? ('https://epictvparaiphone.top/perelman/' + baseSlug + '.m3u8') : '';
      }
      if (u.indexOf('http') === 0) {
        var cleanSlug = u.substring(u.lastIndexOf('/') + 1).replace(/\.m3u8$/i, '') || baseSlug;
        if (u.indexOf('epictvparaiphone.top') !== -1) {
          return /\.m3u8($|\?)/i.test(u) ? u : (u + '.m3u8');
        }
        return cleanSlug ? ('https://epictvparaiphone.top/perelman/' + cleanSlug + '.m3u8') : u;
      }
      var relSlug = u.substring(u.lastIndexOf('/') + 1).replace(/\.m3u8$/i, '') || baseSlug;
      return 'https://epictvparaiphone.top/perelman/' + relSlug + '.m3u8';
    }

    function mergeEpicChannels(dynamicList) {
      var stat = (w.__EPIC_SPORTS_CHANNELS && w.__EPIC_SPORTS_CHANNELS.slice()) || [];
      var statByCode = {};
      var i, item;
      for (i = 0; i < stat.length; i++) {
        if (stat[i] && stat[i].channelCode) statByCode[stat[i].channelCode] = stat[i];
      }
      var merged = [];
      var seen = {};
      if (Array.isArray(dynamicList)) {
        for (i = 0; i < dynamicList.length; i++) {
          item = dynamicList[i];
          if (!item) continue;
          var cleanId = String(item.id || item.code || ('dyn-' + i)).replace(/^pere-/, '');
          var code = cleanId.indexOf('epic-') === 0 ? cleanId : ('epic-' + cleanId);
          var url = normalizeEpicChannelUrl(item.url, cleanId);
          if (!url || seen[code]) continue;
          seen[code] = true;
          var rawLogo = String(item.logo || '').trim();
          var logo = rawLogo
            ? (rawLogo.indexOf('http') === 0 ? rawLogo : ('https://playlatam.site' + (rawLogo.charAt(0) === '/' ? '' : '/') + rawLogo))
            : ((statByCode[code] && statByCode[code].logo) || '');
          var backupList = [];
          if (item.url && String(item.url).indexOf('http') === 0) {
            var altUrl = /\.m3u8($|\?)/i.test(String(item.url)) ? String(item.url) : (String(item.url) + '.m3u8');
            if (altUrl !== url) backupList.push(altUrl);
          }
          var chName = String(item.nombre || item.name || item.title || (statByCode[code] && statByCode[code].name) || cleanId);
          merged.push({
            channelCode: code,
            index: 901 + i,
            name: chName,
            logo: logo,
            uhd: /fhd|uhd|4k/i.test(chName),
            fav: false,
            now: 'En vivo',
            next: '',
            time: 'EN VIVO',
            url: url,
            streamUrl: url,
            backupUrls: backupList,
            isEpic: true,
            liveAddressList: []
          });
        }
      }
      for (i = 0; i < stat.length; i++) {
        item = stat[i];
        if (!item) continue;
        var sc = String(item.channelCode || item.name);
        if (!seen[sc]) {
          seen[sc] = true;
          merged.push(item);
        }
      }
      return merged;
    }

    function fetchRawEpicPerelmanChannels() {
      return fetchEpicTokenFresh().then(function (tok) {
        if (typeof w.fetch !== 'function') return mergeEpicChannels(null);
        var hdrs = { 'Accept': 'application/json', 'X-Cred': PORTAL_CRED };
        if (tok) hdrs['X-Pulsera'] = tok;
        return epicFetch('https://playlatam.site/iphone/canales', 'GET', hdrs, 4500)
          .then(function (payload) {
            var arr = Array.isArray(payload) ? payload : (payload && (payload.channels || payload.data || payload.canales)) || [];
            return mergeEpicChannels(arr);
          }).catch(function () {
            return mergeEpicChannels(null);
          });
      });
    }

    function fetchEpicSportsChannels() {
      if (w.__xeEpicCache && (Date.now() - (w.__xeEpicCacheTs || 0)) < 15 * 60 * 1000 && w.__xeEpicCache.length) {
        return Promise.resolve(w.__xeEpicCache);
      }
      return Promise.all([
        fetchRawEpicPerelmanChannels().catch(function () { return mergeEpicChannels(null); }),
        fetchPortalCanales().catch(function () { return []; })
      ]).then(function (resArr) {
        var pereList = Array.isArray(resArr[0]) ? resArr[0] : [];
        var portalList = Array.isArray(resArr[1]) ? resArr[1] : [];
        var t3LogoSkip = isTizen3Device();
        var buckets = {};
        var order = [];
        var seenNames = {};
        var pereRows = pereList.map(function (pc) {
          return {
            name: pc.name,
            url: pc.url || pc.streamUrl,
            backupUrls: pc.backupUrls || [],
            logo: pc.logo || '',
            fuente: 'perelman',
            prioridad: true,
            active: true,
            isSports: true,
            now: pc.now || 'En vivo',
            next: pc.next || 'Deportes-S1'
          };
        });
        var portalSportsRows = portalList.filter(function (x) {
          if (!x) return false;
          if (x.categoria === 'epic_events' || x.isSports) return true;
          return /deporte|sport|futbol|f[uú]tbol|espn|fox\s*sport|directv|dsports|tnt\s*sport|tyc|win\s*sport|tudn|dazn|bein|gol|liga|ufc|nba|mlb|nfl|f1|formula\s*1|motogp|mls|premier|laliga/i.test((x.folder || '') + ' ' + (x.seccion || '') + ' ' + (x.name || ''));
        });
        appendCatalogRowsToBucket(pereRows, buckets, order, seenNames, t3LogoSkip);
        appendCatalogRowsToBucket(portalSportsRows, buckets, order, seenNames, t3LogoSkip);
        var list = finalizeBucketItems(buckets, order, 'epic-', 900);
        if (!list.length) list = pereList;
        w.__xeEpicCache = list;
        w.__xeEpicCacheTs = Date.now();
        return list;
      });
    }

    // ─────────────────────────────────────────────────────────────
    // Canales del portal oficial (/canales con X-Cred)
    // ─────────────────────────────────────────────────────────────

    var PORTAL_CRED = '75c621e6.1fe6d1c6.1794808297.9435c39a162550b14136a3ef12c2a2f1ac08e6e7f4fddec88794f3594708513d';

    function normalizePaisFolder(folder) {
      if (!folder || !String(folder).trim()) return 'Otros';
      var f = String(folder).trim();
      var map = {
        'CANAIS DO BRASIL': 'Brasil',
        'BRASIL': 'Brasil',
        'BRAZIL': 'Brasil',
        'COLOMBIA': 'Colombia',
        'MÉXICO': 'México',
        'MEXICO': 'México',
        'PERÚ': 'Perú',
        'PERU': 'Perú',
        'ARGENTINA': 'Argentina',
        'LATINOAMERICA': 'Latinoamérica',
        'LATINOAMÉRICA': 'Latinoamérica',
        'CHILE': 'Chile',
        'ECUADOR': 'Ecuador',
        'BOLIVIA': 'Bolivia',
        'GUATEMALA': 'Guatemala',
        'EE UU': 'USA',
        'EE. UU.': 'USA',
        'EE.UU.': 'USA',
        'ESTADOS UNIDOS': 'USA',
        'UNITED STATES': 'USA',
        'USA': 'USA',
        'ESPAÑA': 'España',
        'ESPANA': 'España',
        'SPAIN': 'España',
        'SPAIN M3U': 'España',
        'MUNDO': 'Mundo'
      };
      return map[f.toUpperCase()] || f;
    }

    function isPortalEvento(folder, seccion) {
      var s = ((folder || '') + ' ' + (seccion || '')).toLowerCase();
      return s.indexOf('partido') !== -1 ||
             s.indexOf('highlight') !== -1 ||
             s.indexOf('fifa+') !== -1;
    }

    function isPortalDashOrDead(url, cdn) {
      var u = String(url || '').trim();
      if (!/^https?:\/\//i.test(u)) return true;
      if (w.__xeDeadUrls && w.__xeDeadUrls[u]) return true;
      if (/youtube\.com|youtu\.be|\.mpd(\?|$)|tvf90\.com|stream1\.liveland\.af/i.test(u)) return true;
      if (/teledeportes\.st|rdcanais\.org/i.test(u)) {
        var cNorm = String(cdn || '').trim();
        if (/^(prime\s*video|zapitv|telia)$/i.test(cNorm) ||
            /(dash2\.antik\.sk|tentcdn\.eu|viaplay\.tv|t-online\.de|a92aivottepl-a\.akamaihd\.net|\bdash\b)/i.test(cNorm)) {
          return true;
        }
      }
      return false;
    }

    function fetchPortalCanales() {
      if (w.__xePortalCache && (Date.now() - (w.__xePortalCacheTs || 0)) < 15 * 60 * 1000) {
        return Promise.resolve(w.__xePortalCache);
      }
      if (typeof w.fetch !== 'function') return Promise.resolve([]);

      var headers = {
        'Accept': 'application/json',
        'X-Cred': PORTAL_CRED,
        'X-Aparato': getPortalAparatoId(),
        'X-Pantalla': 'tele',
        'X-Ap': '1.0'
      };

      var deadMap = w.__xeDeadUrls || (w.__xeDeadUrls = {});

      return epicFetch('https://playlatam.site/canales?pais=ALL', 'GET', headers, 10000)
        .then(function (payload) {
          var arr = Array.isArray(payload) ? payload : (payload && (payload.canales || payload.data)) || [];
          var list = [];
          for (var i = 0; i < arr.length; i++) {
            var c = arr[i] || {};
            if (!c.name || !c.url) continue;
            if (c.abre === false || c.sin_nombre) continue;
            if (/^apareci[oó]\s+al\s+abrir/i.test(String(c.name || '').trim())) continue;
            if (/^(caido|apagado|offline|dead|inactivo|error|0)$/i.test(String(c.estado || '').trim())) continue;
            if (typeof c.opacidad === 'number' && c.opacidad > 0 && c.opacidad < 0.5) continue;
            var mainUrl = String(c.url || '').trim();
            if (isPortalDashOrDead(mainUrl, c.cdn)) continue;
            var isHighlightVod = /highlight|fifa\+/i.test(String(c.name || '') + ' ' + String(c.folder || '') + ' ' + String(c.seccion || ''));
            if (isHighlightVod) continue;
            if (/\bvs\b/i.test(String(c.name || '')) && !/^\s*TV\s+/i.test(String(c.name || ''))) {
              var cDateStr = String(c.date || c.fecha || '').trim();
              if (!cDateStr) continue;
              var cDateMs = Date.parse(cDateStr);
              if (!cDateMs || (Date.now() - cDateMs) > 24 * 3600 * 1000) continue;
            }
            var respaldosRaw = Array.isArray(c.respaldos) ? c.respaldos : [];
            var backupUrls = [];
            for (var ri = 0; ri < respaldosRaw.length; ri++) {
              var rItem = respaldosRaw[ri];
              var rUrl = String((rItem && typeof rItem === 'object') ? (rItem.url || rItem.link || rItem.stream || '') : (rItem || '')).trim();
              var rCdn = (rItem && typeof rItem === 'object') ? rItem.cdn : c.cdn;
              if (isPortalDashOrDead(rUrl, rCdn)) continue;
              if (deadMap[rUrl]) continue;
              if (rUrl !== mainUrl && backupUrls.indexOf(rUrl) === -1) backupUrls.push(rUrl);
            }
            if (deadMap[mainUrl]) {
              if (!backupUrls.length) continue;
              mainUrl = backupUrls.shift();
            }
            var isEv = isPortalEvento(c.folder, c.seccion);
            var folderName = normalizePaisFolder(c.folder);
            var isHighlightVod = /highlight/i.test(String(c.name || '') + ' ' + String(c.folder || ''));
            var isSp = (!isHighlightVod && isEv) || /deporte|sport|futbol|f[uú]tbol|espn|fox\s*sport|directv|dsports|tnt\s*sport|tyc|win\s*sport|tudn|dazn|bein|gol\s*peru|liga\s*1|l1\s*max|ufc|nba|mlb|nfl|f1|formula\s*1|motogp|mls|liga\s*mx|premier|laliga/i.test((c.folder || '') + ' ' + (c.seccion || '') + ' ' + (c.name || ''));
            var rawLogo = String(c.logo || c.img || '').trim();
            var logoUrl = rawLogo
              ? (rawLogo.indexOf('http') === 0 ? rawLogo : ('https://playlatam.site' + (rawLogo.charAt(0) === '/' ? '' : '/') + rawLogo))
              : '';
            list.push({
              name: c.name,
              nome: c.name,
              url: mainUrl,
              backupUrls: backupUrls,
              prioridad: !!c.prioridad,
              logo: logoUrl,
              folder: folderName,
              fuente: 'portal',
              fonte: 'portal',
              categoria: isEv ? 'epic_events' : 'epic_247',
              active: true,
              isSports: isSp,
              now: c.seccion ? String(c.seccion) : (isEv ? 'Evento en vivo' : 'Señal 24/7'),
              next: folderName,
              marca: c.marca || '',
              seccion: c.seccion || '',
              cdn: c.cdn || '',
              mode: c.mode || 'directo'
            });
          }
          w.__xePortalCache = list;
          w.__xePortalCacheTs = Date.now();
          return list;
        }).catch(function (e) {
          if (w.console && w.console.warn) w.console.warn('[portal] fallo:', e && e.message);
          return [];
        });
    }

    var MENU_TTL_MS = 2 * 60 * 1000;
    var epicMenuByCode = w.__xeEpicMenuByCode || (w.__xeEpicMenuByCode = {});

    function menuSourceRank(fuente, url) {
      var f = String(fuente || '').toLowerCase();
      var u = String(url || '').toLowerCase();
      if (/youtube\.com|youtu\.be|\.mpd(\?|$)|tvf90\.com|edge\.wedd48c\.top|dlive\.sx/i.test(u)) return 99;
      if (/perelman|epictvparaiphone\.top|playlatam\.site\/perelman/i.test(f + ' ' + u)) return 0;
      if (f === 'oficial' && /\.m3u8(\?|$)/i.test(u)) return 0;
      if (f === 'portal') return 1;
      if (/^(instreams|zohan|teledeportes|channels_alt|streamtp|deporflix|latam|pirlotv)$/i.test(f) || /streamtp\d*[a-z]*\.sbs|ksdjugfssddeports\.com|sofayshop\.st|104game\.click|cdplay\.live|pirlotv\.la|playvi\.org/i.test(u)) {
        if (/zohan·nav|zohan·hd/i.test(f)) return 2;
        return 1;
      }
      if (/\.m3u8(\?|$)/i.test(u) && !/edge\.wedd48c\.top/i.test(u)) return 2;
      if (/^(tvlibre|channels|la18|geespy|zohan·hd|zohan·nav)$/i.test(f)) return 3;
      if (/daddylive·stream|edge\.wedd48c\.top/i.test(f + ' ' + u)) return 4;
      return 5;
    }

    function normalizeMenuFamilyKey(name) {
      var s = String(name || '').toLowerCase();
      try { s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (_) {}
      s = s.replace(/\|.*$|┃.*$/g, '')
           .replace(/[()]/g, ' ')
           .replace(/\b(pirlotv|bix|latam|lat|oficial|spain|argentina|arg|mexico|mx|peru|pe|colombia|col|brazil|brasil|uk|us|usa|nl|fr|france|de|it|ar|cl|ec|bo|gt|uy|py|ve|pa|cr|hn|sv|do|pr|hd|fhd|uhd|4k|sd|1080p|720p|480p|360p|h265|265|hevc|vip|op\s*\d+|liviano)\b/g, ' ')
           .replace(/\bdirectv\s*sports\b/g, 'dsports')
           .replace(/\bespn\s*1\b/g, 'espn')
           .replace(/liga\s*1\s*max|liga1max|l1\s*max/g, 'l1max')
           .replace(/win\s*sports\s*plus|win\s*sports\+|win\s*plus/g, 'winsportsplus')
           .replace(/[^a-z0-9+]+/g, '')
           .trim();
      return s;
    }

    function findMatchingMasterChannel(chName) {
      if (/^pirlotv\s+canal\s+\d+/i.test(String(chName || '').trim())) return null;
      var target = normalizeMenuFamilyKey(chName);
      if (!target || target.length < 3) return null;
      var pools = [];
      if (w.__masterChannelPool && w.__masterChannelPool.length) pools.push(w.__masterChannelPool);
      if (liveChannelsCache[76182] && liveChannelsCache[76182].length) pools.push(liveChannelsCache[76182]);
      pools.push(getBundledChannels());
      var best = null;
      var bestScore = 0;
      for (var p = 0; p < pools.length; p++) {
        var list = pools[p] || [];
        for (var i = 0; i < list.length; i++) {
          var c = list[i];
          if (!c || !c.channelCode) continue;
          var ck = normalizeMenuFamilyKey(c.name || '');
          if (!ck) continue;
          var sc = 0;
          if (ck === target) sc = 100;
          else if (target.length >= 4 && ck.indexOf(target) === 0 && !/\d/.test(ck.slice(target.length))) sc = 70;
          else if (target === 'espn' && ck === 'espnhd') sc = 90;
          else if (target === 'foxsports2' && ck.indexOf('foxsports2') !== -1) sc = 85;
          else if (target === 'dazn1' && ck.indexOf('dazn1') !== -1) sc = 85;
          else if (target === 'dazn2' && ck.indexOf('dazn2') !== -1) sc = 85;
          else if (target === 'laligatvhypermotion' && ck.indexOf('laligahypermotion') !== -1) sc = 85;
          if (sc > 0 && c.liveAddressList && c.liveAddressList.length) sc += 20;
          if (sc > bestScore) {
            bestScore = sc;
            best = c;
          }
        }
      }
      return best;
    }

    function findMatchingEpicUrls(chName) {
      var target = normalizeMenuFamilyKey(chName);
      if (!target || target.length < 3) return [];
      var pool = (w.__xeEpicCache && w.__xeEpicCache.length) ? w.__xeEpicCache : ((w.__EPIC_SPORTS_CHANNELS && w.__EPIC_SPORTS_CHANNELS.slice()) || []);
      var out = [];
      for (var i = 0; i < pool.length; i++) {
        var ec = pool[i];
        if (!ec || !ec.url) continue;
        var ek = normalizeMenuFamilyKey(ec.name || '');
        if (!ek) continue;
        if (ek === target || (target === 'espnar' && ek === 'espn') || (target === 'teledeporte' && ek === 'teledeporte')) {
          if (out.indexOf(ec.url) === -1) out.push(ec.url);
        }
      }
      return out;
    }

    function buildEpicMenuChannels(payload) {
      var events = (payload && Array.isArray(payload.events)) ? payload.events : [];
      var byKey = {};
      var byFamilyWorking = {};
      var keys = [];
      var t3LogoSkip = isTizen3Device();

      function addCandidate(chObj, evTitle, liga, isLiveEv, fuente) {
        if (!chObj) return;
        var u = String(chObj.url || '').trim();
        if (!/^https?:\/\//i.test(u) || /youtube\.com|youtu\.be|\.mpd(\?|$)/i.test(u)) return;
        var rank = menuSourceRank(fuente, u);
        if (rank >= 90) return;
        var chName = String(chObj.publico || chObj.name || '').trim();
        if (!chName) return;
        var fam = normalizeMenuFamilyKey(chName);
        var k = (fam && fam.length >= 3) ? fam : chName.toLowerCase();
        var rawLogo = t3LogoSkip ? '' : String(chObj.logo || '').trim();
        var logo = rawLogo
          ? (rawLogo.indexOf('http') === 0 ? rawLogo : ('https://playlatam.site' + (rawLogo.charAt(0) === '/' ? '' : '/') + rawLogo))
          : '';
        if (!byKey[k]) {
          byKey[k] = {
            key: k,
            family: fam,
            name: chName,
            bestNameRank: rank,
            logo: logo,
            now: evTitle || liga || 'Deportes en vivo',
            next: liga || '',
            isLiveEv: !!isLiveEv,
            cands: []
          };
          keys.push(k);
        } else if (rank < byKey[k].bestNameRank && !/^pirlotv\s/i.test(chName)) {
          byKey[k].name = chName;
          byKey[k].bestNameRank = rank;
        }
        var entry = byKey[k];
        if (!entry.logo && logo) entry.logo = logo;
        if (isLiveEv && !entry.isLiveEv) {
          entry.isLiveEv = true;
          if (evTitle) entry.now = evTitle;
          if (liga) entry.next = liga;
        }
        var dup = false;
        for (var ci = 0; ci < entry.cands.length; ci++) {
          if (entry.cands[ci].url === u) { dup = true; break; }
        }
        if (!dup) entry.cands.push({ url: u, rank: rank, live: !!isLiveEv });
        if (rank <= 1 && entry.family) {
          if (!byFamilyWorking[entry.family]) byFamilyWorking[entry.family] = [];
          if (byFamilyWorking[entry.family].indexOf(u) === -1) byFamilyWorking[entry.family].push(u);
        }
      }

      for (var ei = 0; ei < events.length; ei++) {
        var ev = events[ei];
        if (!ev || ev.ended || ev.oculto) continue;
        if (ev.date) {
          var evIso = String(ev.date).trim() + 'T' + (ev.hour ? String(ev.hour).trim() : '00:00') + ':00Z';
          var evMs = Date.parse(evIso);
          if (evMs > 0 && (Date.now() - evMs) > 24 * 3600 * 1000) continue;
        }
        var evTitle = String(ev.description || ev.titulo || ev.liga || '').trim();
        var liga = String(ev.liga || '').trim();
        var isLiveEv = !ev.oculto && (ev.status === 'live' || !ev.ended);
        var cocinas = Array.isArray(ev.cocinas) ? ev.cocinas : [];
        for (var ci = 0; ci < cocinas.length; ci++) {
          var coc = cocinas[ci];
          var cList = coc && Array.isArray(coc.canales) ? coc.canales : [];
          for (var xi = 0; xi < cList.length; xi++) {
            addCandidate(cList[xi], evTitle, liga, isLiveEv, coc.fuente);
          }
        }
        var extraArrays = ['channels', 'channels_alt', 'channels_sky'];
        for (var ai = 0; ai < extraArrays.length; ai++) {
          var arr = Array.isArray(ev[extraArrays[ai]]) ? ev[extraArrays[ai]] : [];
          for (var xi2 = 0; xi2 < arr.length; xi2++) {
            addCandidate(arr[xi2], evTitle, liga, isLiveEv, arr[xi2] && arr[xi2].marca);
          }
        }
      }

      var items = [];
      for (var ki = 0; ki < keys.length; ki++) {
        var entry = byKey[keys[ki]];
        entry.cands.sort(function (a, b) {
          if (a.rank !== b.rank) return a.rank - b.rank;
          return (b.live ? 1 : 0) - (a.live ? 1 : 0);
        });
        if (!entry.cands.length) continue;
        var urls = [];
        var tailUrls = [];
        for (var ci2 = 0; ci2 < entry.cands.length; ci2++) {
          var candObj = entry.cands[ci2];
          if (candObj.rank <= 1) {
            if (urls.indexOf(candObj.url) === -1) urls.push(candObj.url);
          } else {
            if (tailUrls.indexOf(candObj.url) === -1) tailUrls.push(candObj.url);
          }
        }
        var famUrls = entry.family ? (byFamilyWorking[entry.family] || []) : [];
        for (var fi = 0; fi < famUrls.length; fi++) {
          if (urls.indexOf(famUrls[fi]) === -1) urls.push(famUrls[fi]);
        }
        var pereUrls = findMatchingEpicUrls(entry.name);
        for (var pi = 0; pi < pereUrls.length; pi++) {
          if (urls.indexOf(pereUrls[pi]) === -1) urls.push(pereUrls[pi]);
        }
        for (var ti = 0; ti < tailUrls.length; ti++) {
          if (urls.indexOf(tailUrls[ti]) === -1) urls.push(tailUrls[ti]);
        }
        var masterMatch = findMatchingMasterChannel(entry.name);
        var effectiveRank = entry.cands[0].rank;
        if (effectiveRank > 1 && (famUrls.length || pereUrls.length)) effectiveRank = 1;
        else if (effectiveRank > 2 && masterMatch) effectiveRank = 2;

        var slug = entry.key.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || ('ev-' + ki);
        var code = 'epicm-' + slug + '-' + ki;
        var chItem = {
          channelCode: code,
          index: ki + 1,
          name: entry.name,
          logo: entry.logo,
          uhd: /fhd|uhd|4k|hd\b/i.test(entry.name),
          fav: false,
          now: entry.now,
          next: entry.next,
          time: entry.isLiveEv ? 'EN VIVO' : 'HOY',
          url: urls[0],
          streamUrl: urls[0],
          backupUrls: urls.slice(1, 10),
          masterFallbackCode: masterMatch ? masterMatch.channelCode : '',
          isEpicMenu: true,
          bestRank: effectiveRank,
          isLiveEv: entry.isLiveEv,
          liveAddressList: []
        };
        epicMenuByCode[code] = chItem;
        items.push(chItem);
      }

      items.sort(function (a, b) {
        if (a.isLiveEv !== b.isLiveEv) return a.isLiveEv ? -1 : 1;
        if (a.bestRank !== b.bestRank) return a.bestRank - b.bestRank;
        return a.index - b.index;
      });
      for (var idx = 0; idx < items.length; idx++) items[idx].index = idx + 1;
      return items;
    }

    function decodeHelloHowKv(b64Text) {
      if (!w.CryptoJS || !w.CryptoJS.AES || typeof atob !== 'function') {
        throw new Error('CryptoJS AES no disponible');
      }
      var clean = String(b64Text || '').trim().replace(/\s+/g, '');
      var bin = atob(clean);
      var bytes = [];
      for (var i = 0; i < bin.length; i++) bytes.push(bin.charCodeAt(i));
      for (var j = 0; j + 1 < bytes.length; j += 2) {
        var tmp = bytes[j];
        bytes[j] = bytes[j + 1];
        bytes[j + 1] = tmp;
      }
      bytes.reverse();
      var cipherStr = '';
      for (var k = 0; k < bytes.length; k++) cipherStr += String.fromCharCode(bytes[k]);
      var key = w.CryptoJS.enc.Utf8.parse('RT1zdnBRcVZvSU1t');
      var iv = w.CryptoJS.enc.Utf8.parse('bkmlmKnk9i5Khs9n');
      var plain = w.CryptoJS.AES.decrypt(cipherStr, key, { iv: iv }).toString(w.CryptoJS.enc.Utf8);
      if (!plain) throw new Error('Payload vacío');
      return plain;
    }

    function parseHelloHowDMY(d, t) {
      var dm = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(d || '').trim());
      if (!dm) return 0;
      var iso = dm[3] + '-' + dm[2] + '-' + dm[1] + 'T' + String(t || '00:00:00').trim() + 'Z';
      return Date.parse(iso) || 0;
    }

    function fetchClientPublicIp() {
      var now = Date.now();
      if (w.__xePublicIp && (now - (w.__xePublicIpTs || 0)) < 10 * 60 * 1000) {
        return Promise.resolve(w.__xePublicIp);
      }
      if (typeof w.fetch !== 'function') return Promise.resolve('127.0.0.1');
      var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
      var tm = ctrl ? setTimeout(function () { try { ctrl.abort(); } catch (_) {} }, 3000) : null;
      return w.fetch('https://api.ipify.org/', { signal: ctrl ? ctrl.signal : undefined })
        .then(function (r) {
          if (tm) clearTimeout(tm);
          return r && r.ok ? r.text() : '';
        })
        .then(function (txt) {
          var ip = String(txt || '').trim();
          if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) {
            w.__xePublicIp = ip;
            w.__xePublicIpTs = Date.now();
          }
          return w.__xePublicIp || '127.0.0.1';
        })
        .catch(function () {
          if (tm) clearTimeout(tm);
          return w.__xePublicIp || '127.0.0.1';
        });
    }

    function fetchHelloHowLiveEvents() {
      if (typeof w.fetch !== 'function' || !w.CryptoJS) return Promise.resolve([]);
      var url = 'https://hello-how.pages.dev/events.txt';
      var relay = w.XuperRelay;
      if (isTizen3Device() && relay && typeof relay.wrapPortalRequest === 'function') {
        var wr = relay.wrapPortalRequest(url, { method: 'GET' });
        if (wr && wr.relayed) url = wr.url;
      }
      var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
      var tm = ctrl ? setTimeout(function () { try { ctrl.abort(); } catch (_) {} }, 5000) : null;
      return w.fetch(url, { signal: ctrl ? ctrl.signal : undefined })
        .then(function (r) {
          if (tm) clearTimeout(tm);
          if (!r || !r.ok) return [];
          return r.text();
        })
        .then(function (txt) {
          if (!txt || typeof txt !== 'string') return [];
          var arr = JSON.parse(decodeHelloHowKv(txt));
          if (!Array.isArray(arr)) return [];
          var now = Date.now();
          var out = [];
          var seenLinks = {};
          for (var i = 0; i < arr.length; i++) {
            var a = arr[i];
            if (!a) continue;
            var ev = a.event ? (typeof a.event === 'string' ? JSON.parse(a.event) : a.event) : a;
            if (!ev || ev.visible === false || !ev.links) continue;
            var linksPath = String(ev.links || '').trim();
            if (!linksPath || seenLinks[linksPath]) continue;
            var stMs = parseHelloHowDMY(ev.date, ev.time);
            if (stMs <= 0) continue;
            var endMs = (ev.end_date && ev.end_time) ? parseHelloHowDMY(ev.end_date, ev.end_time) : (stMs + 3 * 3600 * 1000);
            if (endMs < stMs) endMs += 24 * 3600 * 1000;
            if (now < (stMs - 30 * 60 * 1000) || now > endMs) continue;
            seenLinks[linksPath] = true;
            var tA = String(ev.teamAName || '').trim();
            var tB = String(ev.teamBName || '').trim();
            var title = (tA && tB && tA !== tB) ? (tA + ' vs ' + tB) : (tA || tB || ev.eventName || 'Evento en vivo');
            var hhUrl = 'hellohow://' + linksPath.replace(/^\/+/, '');
            var code = 'epicm-hh-' + i;
            var item = {
              channelCode: code,
              index: 900 + i,
              name: title,
              logo: '',
              uhd: false,
              fav: false,
              now: String(ev.eventName || ev.category || 'Deportes en vivo'),
              next: String(ev.category || ''),
              time: 'EN VIVO',
              url: hhUrl,
              streamUrl: hhUrl,
              backupUrls: [],
              isEpicMenu: true,
              isHelloHow: true,
              bestRank: 1,
              isLiveEv: true,
              liveAddressList: []
            };
            epicMenuByCode[code] = item;
            out.push(item);
          }
          return out;
        })
        .catch(function () {
          if (tm) clearTimeout(tm);
          return [];
        });
    }

    function resolveHelloHowEventStreams(hhUrl) {
      var rel = String(hhUrl || '').replace(/^hellohow:\/\//i, '');
      var fullUrl = /^https?:\/\//i.test(rel) ? rel : ('https://hello-how.pages.dev/' + rel.replace(/^\/+/, ''));
      var relay = w.XuperRelay;
      var fetchUrl = fullUrl;
      var fetchHdrs = {};
      if (isTizen3Device() && relay && typeof relay.wrapPortalRequest === 'function') {
        var wr = relay.wrapPortalRequest(fullUrl, { method: 'GET' });
        if (wr && wr.relayed) {
          fetchUrl = wr.url;
          fetchHdrs = wr.options.headers || {};
        }
      }
      return w.fetch(fetchUrl, { headers: fetchHdrs }).then(function (r) {
        if (!r || !r.ok) throw new Error('HTTP ' + (r ? r.status : 0));
        return r.text();
      }).then(function (txt) {
        var arr = JSON.parse(decodeHelloHowKv(txt));
        if (!Array.isArray(arr) || !arr.length) return [];
        return fetchClientPublicIp().then(function (pubIp) {
          var cands = [];
          for (var i = 0; i < arr.length; i++) {
            var st = arr[i];
            if (!st) continue;
            var raw = String(st.link || st.url || '').trim();
            var hdrs = {};
            if (raw.indexOf('|') !== -1) {
              var parts = raw.split('|');
              raw = parts[0].trim();
              var kvs = parts.slice(1).join('|').split('&');
              for (var ki = 0; ki < kvs.length; ki++) {
                var eq = kvs[ki].indexOf('=');
                if (eq > 0) {
                  var hk = kvs[ki].slice(0, eq).trim().toLowerCase();
                  var hv = kvs[ki].slice(eq + 1).trim();
                  if (hk === 'referer') hdrs.Referer = hv;
                  else if (hk === 'origin') hdrs.Origin = hv;
                  else if (hk === 'user-agent') hdrs['User-Agent'] = hv;
                }
              }
            }
            if (/\.mpd(\?|$)/i.test(raw)) continue;
            if (!raw && st.tokenApi) {
              try {
                var ta = JSON.parse(st.tokenApi);
                var tType = String(ta.type || '').toLowerCase();
                if ((tType === 'ls' || ta.default_string) && /^https?:\/\//i.test(ta.url || '')) {
                  var tgt = String(ta.url);
                  var mPath = /^https?:\/\/[^\/]+(\/[^?#]*)/i.exec(tgt);
                  var segs = (mPath ? mPath[1] : '').split('/').filter(Boolean);
                  if (segs.length >= 2 && w.CryptoJS && w.CryptoJS.SHA1) {
                    var slugSeg = segs[segs.length - 2];
                    var defStr = ta.default_string || '9HY(#b1q6';
                    var ts = Math.floor(Date.now() / 1000);
                    var sig = w.CryptoJS.SHA1(slugSeg + defStr + ts + pubIp).toString(w.CryptoJS.enc.Hex);
                    raw = tgt + (tgt.indexOf('?') !== -1 ? '&' : '?') + 'token=' + sig + '-' + (ts + 77) + '-' + ts;
                  }
                } else if (tType === 'embed' && ta.api && !isTizen3Device()) {
                  var apiUrl = String(ta.api).split('|')[0].trim();
                  if (/^https?:\/\//i.test(apiUrl)) raw = 'embed://' + apiUrl;
                }
              } catch (_) {}
            }
            if (/^(https?|embed):\/\//i.test(raw)) {
              cands.push({ url: raw, headers: Object.keys(hdrs).length ? hdrs : null });
            }
          }
          return cands;
        });
      });
    }

    function fetchStreamTpChannels() {
      var now = Date.now();
      if (w.__xeStpCache && (now - (w.__xeStpCacheTs || 0)) < 5 * 60 * 1000 && w.__xeStpCache.length) {
        return Promise.resolve(w.__xeStpCache);
      }
      var deadMap = w.__xeDeadUrls || (w.__xeDeadUrls = {});
      return Promise.all([
        epicTextFetch('https://streamtp99a.sbs/', { 'Accept': 'text/html' }, 5000).catch(function () { return ''; }),
        epicFetch('https://streamtp99a.sbs/status.json?id=' + now, 'GET', { 'Accept': 'application/json' }, 3500).catch(function () { return []; })
      ]).then(function (resArr) {
        var html = String(resArr[0] || '');
        var stArr = Array.isArray(resArr[1]) ? resArr[1] : [];
        var stMap = {};
        for (var si = 0; si < stArr.length; si++) {
          var row = stArr[si];
          if (row && row.Canal) stMap[String(row.Canal).toLowerCase()] = String(row.Estado || '').toLowerCase() === 'activo';
        }
        var out = [];
        var re = /['"]([^'"]{2,55})['"]\s*:\s*['"](https?:\/\/streamtp\d*[a-z]*\.sbs\/global\d*\.php\?stream=([a-z0-9_\-]+))['"]/gi;
        var m;
        while ((m = re.exec(html))) {
          var chName = m[1].trim();
          var chUrl = m[2].trim();
          var slug = String(m[3] || '').toLowerCase();
          var active = (slug in stMap) ? stMap[slug] : true;
          if (active === false || deadMap[chUrl]) continue;
          out.push({ name: chName, url: chUrl, fuente: 'streamtp', active: true, isSports: true });
        }
        if (out.length) {
          w.__xeStpCache = out;
          w.__xeStpCacheTs = Date.now();
        }
        return out;
      });
    }

    function fetchKsdChannels() {
      var now = Date.now();
      if (w.__xeKsdCache && (now - (w.__xeKsdCacheTs || 0)) < 5 * 60 * 1000 && w.__xeKsdCache.length) {
        return Promise.resolve(w.__xeKsdCache);
      }
      return epicTextFetch('https://embed.ksdjugfssddeports.com/', { 'Accept': 'text/html' }, 5000).then(function (html) {
        var txt = String(html || '');
        var regPos = txt.indexOf('id="regionales"');
        var out = [];
        var cardRe = /<div class="channel-name">([^<]+)<\/div>[\s\S]{0,180}?<a href="(https?:\/\/[^"]+)"/gi;
        var m;
        while ((m = cardRe.exec(txt))) {
          var nm = m[1].trim();
          var u = m[2].replace(/&amp;/gi, '&').trim();
          if (!nm || !/^https?:\/\//i.test(u)) continue;
          if (w.__xeDeadUrls && w.__xeDeadUrls[u]) continue;
          var isSp = (regPos === -1) || (m.index < regPos) || /espn|fox|tnt sports|tyc|directv|dsports|liga\s*1|dazn|movistar|bein|tudn|azteca deportes|win/i.test(nm);
          out.push({ name: nm, url: u, fuente: 'ksd', active: true, isSports: isSp });
        }
        if (out.length) {
          w.__xeKsdCache = out;
          w.__xeKsdCacheTs = Date.now();
        }
        return out;
      }).catch(function () { return w.__xeKsdCache || []; });
    }

    function fetchPirloTvChannels() {
      var now = Date.now();
      if (w.__xePirloCache && (now - (w.__xePirloCacheTs || 0)) < 5 * 60 * 1000 && w.__xePirloCache.length) {
        return Promise.resolve(w.__xePirloCache);
      }
      return epicTextFetch('https://pirlotv.la/canales.php', { 'Accept': 'text/html' }, 5000).then(function (html) {
        var txt = String(html || '');
        var out = [];
        var currentName = '';
        var re = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]{1,120}?)<\/a>/gi;
        var m;
        while ((m = re.exec(txt))) {
          var href = m[1].trim();
          var label = m[2].replace(/<[^>]+>/g, '').trim();
          if (!label || /pirlo tv|canales|dmca|aviso/i.test(label)) continue;
          if (href === '#') {
            currentName = label.replace(/\s*\(En Vivo.*\)$/i, '').replace(/\s*\(DirecTV.*\)$/i, '').trim();
          } else if (href.indexOf('https://pirlotv.la/') === 0 && !/pirlotv\.la\/$/i.test(href)) {
            var chTitle = currentName || label;
            var cleanHref = href.replace(/&amp;/gi, '&');
            if (!chTitle || (w.__xeDeadUrls && w.__xeDeadUrls[cleanHref])) continue;
            out.push({ name: chTitle, url: cleanHref, fuente: 'pirlotv', active: true, isSports: true });
          }
        }
        if (out.length) {
          w.__xePirloCache = out;
          w.__xePirloCacheTs = Date.now();
        }
        return out;
      }).catch(function () { return w.__xePirloCache || []; });
    }

    function appendCatalogRowsToBucket(rows, bucketMap, orderList, nameSeenMap, skipLogo, customKeyFn) {
      var deadMap = w.__xeDeadUrls || (w.__xeDeadUrls = {});
      for (var i = 0; i < (rows || []).length; i++) {
        var row = rows[i];
        if (!row || !row.url || !row.name) continue;
        if (row.active === false) continue;
        var mainUrl = String(row.url).trim();
        if (!mainUrl || deadMap[mainUrl]) continue;
        var nm = String(row.name).trim();
        var nl = nm.toLowerCase();
        var fam = typeof customKeyFn === 'function' ? customKeyFn(nm, row) : normalizeMenuFamilyKey(nm);
        var bKey = (fam && fam.length >= 3) ? fam : nl;
        var rank = menuSourceRank(row.fuente || row.fonte, mainUrl);
        if (rank >= 90) continue;
        if (row.prioridad === true) rank = Math.max(0, rank - 1);
        if (!bucketMap[bKey]) {
          bucketMap[bKey] = {
            key: bKey,
            family: fam,
            name: nm,
            logo: skipLogo ? '' : (row.logo || ''),
            now: row.now || 'Señal 24/7',
            next: row.next || (row.isSports === false ? 'TV Internacional' : 'Deportes 24/7'),
            isLiveEv: !!row.active,
            cands: []
          };
          orderList.push(bKey);
        } else if (row.logo && !bucketMap[bKey].logo && !skipLogo) {
          bucketMap[bKey].logo = row.logo;
        }
        if (nameSeenMap) nameSeenMap[nl] = true;
        var cands = bucketMap[bKey].cands;
        var addCandToBucket = function (candUrl, candRank, isLiveFlag) {
          var cu = String(candUrl || '').trim();
          if (!cu || deadMap[cu] || /youtube\.com|youtu\.be|\.mpd(\?|$)/i.test(cu)) return;
          for (var ci = 0; ci < cands.length; ci++) {
            if (cands[ci].url === cu) {
              if (candRank < cands[ci].rank) cands[ci].rank = candRank;
              return;
            }
          }
          cands.push({ url: cu, rank: candRank, live: !!isLiveFlag });
        };
        addCandToBucket(mainUrl, rank, !!row.active);
        if (Array.isArray(row.backupUrls)) {
          for (var bi = 0; bi < row.backupUrls.length; bi++) {
            var bu = row.backupUrls[bi];
            var buStr = String((bu && typeof bu === 'object') ? (bu.url || bu.link || bu.stream || '') : (bu || '')).trim();
            if (buStr) {
              addCandToBucket(buStr, rank + 1, !!row.active);
            }
          }
        }
      }
    }

    function finalizeBucketItems(bucketMap, orderList, codePrefix, baseIndex) {
      var out = [];
      for (var ki = 0; ki < orderList.length; ki++) {
        var b = bucketMap[orderList[ki]];
        if (!b || !b.cands || !b.cands.length) continue;
        b.cands.sort(function (a, c) {
          if (a.rank !== c.rank) return a.rank - c.rank;
          return (c.live ? 1 : 0) - (a.live ? 1 : 0);
        });
        var urls = [];
        for (var ci = 0; ci < b.cands.length; ci++) {
          if (urls.indexOf(b.cands[ci].url) === -1) urls.push(b.cands[ci].url);
        }
        var pereUrls = findMatchingEpicUrls(b.name);
        for (var pi = 0; pi < pereUrls.length; pi++) {
          if (urls.indexOf(pereUrls[pi]) === -1) urls.push(pereUrls[pi]);
        }
        var masterMatch = findMatchingMasterChannel(b.name);
        var slug = b.key.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || ('ch-' + ki);
        var code = codePrefix + slug + '-' + ki;
        var chObj = {
          channelCode: code,
          index: (baseIndex || 0) + out.length + 1,
          name: b.name,
          logo: b.logo || '',
          uhd: /fhd|uhd|4k|hd\b/i.test(b.name),
          fav: false,
          now: b.now,
          next: b.next,
          time: b.isLiveEv ? 'EN VIVO' : '24/7',
          url: urls[0],
          streamUrl: urls[0],
          backupUrls: urls.slice(1, 12),
          masterFallbackCode: masterMatch ? masterMatch.channelCode : '',
          isEpicMenu: true,
          bestRank: b.cands[0].rank,
          isLiveEv: !!b.isLiveEv,
          liveAddressList: []
        };
        epicMenuByCode[code] = chObj;
        out.push(chObj);
      }
      return out;
    }

    function normalizeEspnBucketKey(name, row) {
      var s = String(name || '').toLowerCase();
      try { s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (_) {}
      var folderStr = row && row.folder ? String(row.folder).toLowerCase() : '';
      try { folderStr = folderStr.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (_) {}
      s = s.replace(/\|.*$|┃.*$/g, '')
           .replace(/[()]/g, ' ')
           .replace(/\b(pirlotv|bix|latam|lat|oficial|hd|fhd|uhd|4k|sd|op\s*\d+|liviano)\b/g, ' ')
           .replace(/\bmx\b/g, 'mexico')
           .replace(/\bcol\b/g, 'colombia')
           .replace(/\barg\b|\bar\b/g, 'argentina')
           .replace(/\bcl\b/g, 'chile')
           .replace(/\bpe\b/g, 'peru')
           .replace(/\bec\b/g, 'ecuador')
           .replace(/\bbrazil\b|\bbr\b/g, 'brasil')
           .replace(/\bus\b/g, 'usa')
           .replace(/\bespn\s*1\b/g, 'espn');
      if (folderStr && /^(mexico|colombia|argentina|brasil|chile|peru|ecuador|usa|venezuela|bolivia|guatemala)$/.test(folderStr) && s.indexOf(folderStr) === -1) {
        s += ' ' + folderStr;
      }
      return s.replace(/[^a-z0-9+]+/g, '').trim() || 'espn';
    }

    function fetchUnifiedEspnChannels() {
      var now = Date.now();
      if (w.__xeEspnUnifiedCache && (now - (w.__xeEspnUnifiedCacheTs || 0)) < 10 * 60 * 1000 && w.__xeEspnUnifiedCache.length) {
        return Promise.resolve(w.__xeEspnUnifiedCache);
      }
      return Promise.all([
        fetchEpicSportsChannels().catch(function () { return mergeEpicChannels(null); }),
        fetchPortalCanales().catch(function () { return []; })
      ]).then(function (resArr) {
        var t3LogoSkip = isTizen3Device();
        var buckets = {};
        var order = [];
        var seenNames = {};
        var rows = [];
        var espnRe = /espn/i;

        function pushEspnCandidate(ch, defaultFuente, isPrio) {
          if (!ch || !espnRe.test(String(ch.name || ch.nome || ''))) return;
          var u = String(ch.url || ch.streamUrl || '').trim();
          if (!u) return;
          var chName = String(ch.name || ch.nome).trim();
          var fName = String(ch.folder || '').trim();
          if (fName && /^(México|Colombia|Argentina|Brasil|Chile|Perú|Ecuador|USA|Venezuela|Bolivia|Guatemala)$/i.test(fName)) {
            var normN = chName.toLowerCase();
            var normF = fName.toLowerCase();
            try {
              normN = normN.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
              normF = normF.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            } catch (_) {}
            if (normN.indexOf(normF) === -1) {
              chName = chName + ' (' + fName + ')';
            }
          }
          rows.push({
            name: chName,
            url: u,
            backupUrls: Array.isArray(ch.backupUrls) ? ch.backupUrls : [],
            logo: ch.logo || '',
            folder: fName,
            fuente: ch.fuente || ch.fonte || defaultFuente || 'portal',
            prioridad: !!(ch.prioridad || isPrio),
            active: ch.active !== false,
            isSports: true,
            now: ch.now || 'ESPN En Vivo',
            next: fName || ch.next || 'Deportes'
          });
        }

        var staticEspn = w.__ESPN_CHANNELS || [];
        var i;
        for (i = 0; i < staticEspn.length; i++) {
          pushEspnCandidate(staticEspn[i], /epictvparaiphone\.top|perelman/i.test(String(staticEspn[i] && staticEspn[i].url || '')) ? 'perelman' : 'oficial', true);
        }
        var staticEpic = w.__EPIC_SPORTS_CHANNELS || [];
        for (i = 0; i < staticEpic.length; i++) {
          pushEspnCandidate(staticEpic[i], 'perelman', true);
        }
        var dynEpic = Array.isArray(resArr[0]) ? resArr[0] : [];
        for (i = 0; i < dynEpic.length; i++) {
          pushEspnCandidate(dynEpic[i], dynEpic[i] && dynEpic[i].fuente || 'perelman', false);
        }
        var portalAll = Array.isArray(resArr[1]) ? resArr[1] : [];
        for (i = 0; i < portalAll.length; i++) {
          pushEspnCandidate(portalAll[i], 'portal', false);
        }

        var masterPool = (liveChannelsCache[76182] && liveChannelsCache[76182].length) ? liveChannelsCache[76182] : getBundledChannels();
        var masterLiveOnly = [];
        for (i = 0; i < (masterPool || []).length; i++) {
          var mc = masterPool[i];
          if (!mc || !espnRe.test(String(mc.name || ''))) continue;
          if (mc.url || mc.streamUrl) {
            pushEspnCandidate(mc, 'portal', false);
          } else if (Array.isArray(mc.liveAddressList) && mc.liveAddressList.length) {
            masterLiveOnly.push(mc);
          }
        }

        appendCatalogRowsToBucket(rows, buckets, order, seenNames, t3LogoSkip, normalizeEspnBucketKey);
        var items = finalizeBucketItems(buckets, order, 'espn-', 0);

        for (i = 0; i < masterLiveOnly.length; i++) {
          var mCh = masterLiveOnly[i];
          var mKey = normalizeEspnBucketKey(mCh.name, mCh);
          var matched = false;
          for (var ji = 0; ji < items.length; ji++) {
            if (normalizeEspnBucketKey(items[ji].name, items[ji]) === mKey) {
              if (!items[ji].masterFallbackCode) items[ji].masterFallbackCode = mCh.channelCode;
              if (!items[ji].liveAddressList || !items[ji].liveAddressList.length) items[ji].liveAddressList = mCh.liveAddressList;
              matched = true;
              break;
            }
          }
          if (!matched) {
            var copyCh = Object.assign({}, mCh, { index: items.length + 1 });
            items.push(copyCh);
          }
        }

        for (i = 0; i < items.length; i++) {
          items[i].index = i + 1;
        }
        if (items.length) {
          w.__xeEspnUnifiedCache = items;
          w.__xeEspnUnifiedCacheTs = Date.now();
        }
        return items;
      });
    }

    var COUNTRY_S1_CONFIG = {
      m3u_co: { folder: 'Colombia', m3uUrl: 'https://cdn.jsdelivr.net/gh/iptv-org/iptv@gh-pages/countries/co.m3u' },
      m3u_es: { folder: 'España', m3uUrl: 'https://cdn.jsdelivr.net/gh/iptv-org/iptv@gh-pages/countries/es.m3u' },
      m3u_mx: { folder: 'México', m3uUrl: 'https://cdn.jsdelivr.net/gh/iptv-org/iptv@gh-pages/countries/mx.m3u' },
      m3u_ar: { folder: 'Argentina', m3uUrl: 'https://cdn.jsdelivr.net/gh/iptv-org/iptv@gh-pages/countries/ar.m3u' },
      m3u_cl: { folder: 'Chile', m3uUrl: 'https://cdn.jsdelivr.net/gh/iptv-org/iptv@gh-pages/countries/cl.m3u' },
      m3u_pe: { folder: 'Perú', m3uUrl: 'https://cdn.jsdelivr.net/gh/iptv-org/iptv@gh-pages/countries/pe.m3u' },
      m3u_ec: { folder: 'Ecuador', m3uUrl: 'https://cdn.jsdelivr.net/gh/iptv-org/iptv@gh-pages/countries/ec.m3u' },
      m3u_bo: { folder: 'Bolivia', m3uUrl: 'https://cdn.jsdelivr.net/gh/iptv-org/iptv@gh-pages/countries/bo.m3u' },
      m3u_gt: { folder: 'Guatemala', m3uUrl: 'https://cdn.jsdelivr.net/gh/iptv-org/iptv@gh-pages/countries/gt.m3u' },
      s1_us:  { folder: 'USA', m3uUrl: '' }
    };

    function fetchCountryS1Channels(colId, customM3uUrl, customFolder, customM3uUrls) {
      var cfg = COUNTRY_S1_CONFIG[colId] || {};
      var targetFolder = String(customFolder || cfg.folder || '').trim();
      var m3uListUrls = [];
      if (Array.isArray(customM3uUrls)) m3uListUrls = customM3uUrls.slice();
      else if (customM3uUrl || cfg.m3uUrl) m3uListUrls = [String(customM3uUrl || cfg.m3uUrl || '').trim()];
      var folderParts = targetFolder ? targetFolder.split('|').map(function (s) { return s.trim().toLowerCase(); }).filter(Boolean) : [];
      var m3uPromises = m3uListUrls.map(function (u) {
        return u ? fetchM3uPlaylist(u, colId).catch(function () { return []; }) : Promise.resolve([]);
      });
      return Promise.all([
        fetchPortalCanales().catch(function () { return []; }),
        Promise.all(m3uPromises).then(function (arrs) {
          var flat = [];
          for (var ai = 0; ai < arrs.length; ai++) {
            if (Array.isArray(arrs[ai])) flat = flat.concat(arrs[ai]);
          }
          return flat;
        })
      ]).then(function (resArr) {
        var portalAll = Array.isArray(resArr[0]) ? resArr[0] : [];
        var m3uList = Array.isArray(resArr[1]) ? resArr[1] : [];
        var t3LogoSkip = isTizen3Device();
        var buckets = {};
        var order = [];
        var seenNames = {};
        var portalCountryRows = [];
        if (folderParts.length) {
          for (var pi = 0; pi < portalAll.length; pi++) {
            var pc = portalAll[pi];
            if (pc && folderParts.indexOf(String(pc.folder || '').toLowerCase()) !== -1) {
              portalCountryRows.push(pc);
            }
          }
        }
        var m3uRows = [];
        for (var mi = 0; mi < m3uList.length; mi++) {
          var mc = m3uList[mi];
          if (!mc || !(mc.url || mc.streamUrl)) continue;
          m3uRows.push({
            name: mc.name,
            url: mc.url || mc.streamUrl,
            backupUrls: mc.backupUrls || [],
            logo: mc.logo || '',
            fuente: 'm3u',
            active: true,
            isSports: false,
            now: mc.now || 'En vivo',
            next: targetFolder || mc.group || 'TV Internacional'
          });
        }
        appendCatalogRowsToBucket(portalCountryRows, buckets, order, seenNames, t3LogoSkip);
        appendCatalogRowsToBucket(m3uRows, buckets, order, seenNames, t3LogoSkip);
        return finalizeBucketItems(buckets, order, colId + '-', 0);
      });
    }

    function fetchEpicMenuChannels() {
      if (w.__xeEpicMenuCache && (Date.now() - (w.__xeEpicMenuCacheTs || 0)) < MENU_TTL_MS && w.__xeEpicMenuCache.length) {
        return Promise.resolve(w.__xeEpicMenuCache);
      }
      return fetchEpicTokenFresh().then(function (tok) {
        var tz = 'America/Mexico_City';
        try {
          var sysTz = typeof Intl !== 'undefined' && Intl.DateTimeFormat && Intl.DateTimeFormat().resolvedOptions().timeZone;
          if (sysTz && /^[A-Za-z_]+(\/[A-Za-z0-9_+-]+)*$/.test(sysTz)) tz = sysTz;
        } catch (_) {}
        var menuUrl = 'https://playlatam.site/menu?all=1&recetas=aparte&agenda=propia&v=9999&tz=' + encodeURIComponent(tz) + '&idioma=es';
        var menuHdrs = { 'Accept': 'application/json', 'X-Cred': PORTAL_CRED };
        if (tok) menuHdrs['X-Pulsera'] = tok;
        return Promise.all([
          fetchEpicSportsChannels().catch(function () { return mergeEpicChannels(null); }),
          epicFetch(menuUrl, 'GET', menuHdrs, 7500).catch(function () { return { events: [] }; }),
          fetchHelloHowLiveEvents().catch(function () { return []; }),
          fetchStreamTpChannels().catch(function () { return []; }),
          fetchKsdChannels().catch(function () { return []; }),
          fetchPirloTvChannels().catch(function () { return []; }),
          fetchPortalCanales().catch(function () { return []; })
        ]).then(function (results) {
          var pereList = Array.isArray(results[0]) ? results[0] : [];
          var payload = results[1] || { events: [] };
          var hhList = Array.isArray(results[2]) ? results[2] : [];
          var stpList = Array.isArray(results[3]) ? results[3] : [];
          var ksdList = (Array.isArray(results[4]) ? results[4] : []).filter(function (x) { return x && x.isSports; });
          var pirloList = Array.isArray(results[5]) ? results[5] : [];
          var portalEvList = (Array.isArray(results[6]) ? results[6] : []).filter(function (x) { return x && x.categoria === 'epic_events'; });

          var list = buildEpicMenuChannels(payload);
          var t3LogoSkip = isTizen3Device();
          var famItemMap = {};
          var existingNames = {};
          for (var i = 0; i < list.length; i++) {
            var it = list[i];
            existingNames[String(it.name || '').trim().toLowerCase()] = true;
            var fk = normalizeMenuFamilyKey(it.name);
            if (fk && !famItemMap[fk]) famItemMap[fk] = it;
          }

          var extraBuckets = {};
          var extraOrder = [];
          var extraSources = [
            pereList.map(function (pc) {
              return { name: pc.name, url: pc.url, logo: pc.logo, fuente: 'perelman', active: true, isSports: true, now: 'Señal directa 24/7', next: 'Deportes LATAM' };
            }),
            portalEvList,
            pirloList,
            stpList,
            ksdList
          ];
          for (var si = 0; si < extraSources.length; si++) {
            var srcArr = extraSources[si];
            var remain = [];
            for (var ri = 0; ri < srcArr.length; ri++) {
              var row = srcArr[ri];
              if (!row || !row.url || !row.name) continue;
              var rfam = normalizeMenuFamilyKey(row.name);
              var targetEv = famItemMap[rfam];
              if (targetEv) {
                if (targetEv.url !== row.url && targetEv.backupUrls.indexOf(row.url) === -1 && targetEv.backupUrls.length < 12) {
                  targetEv.backupUrls.push(row.url);
                }
                continue;
              } else if (si === 1) {
                remain.push(row);
              }
            }
            if (remain.length) appendCatalogRowsToBucket(remain, extraBuckets, extraOrder, existingNames, t3LogoSkip);
          }

          var extraItems = finalizeBucketItems(extraBuckets, extraOrder, 'epicm-s247-', list.length);
          for (var ei = 0; ei < extraItems.length; ei++) list.push(extraItems[ei]);
          for (var hi = 0; hi < hhList.length; hi++) list.push(hhList[hi]);

          list.sort(function (a, b) {
            var aOk = a.bestRank <= 1 ? 0 : 1;
            var bOk = b.bestRank <= 1 ? 0 : 1;
            if (aOk !== bOk) return aOk - bOk;
            if (a.isLiveEv !== b.isLiveEv) return a.isLiveEv ? -1 : 1;
            if (a.bestRank !== b.bestRank) return a.bestRank - b.bestRank;
            return a.index - b.index;
          });
          for (var fi = 0; fi < list.length; fi++) list[fi].index = fi + 1;
          if (list.length) {
            w.__xeEpicMenuCache = list;
            w.__xeEpicMenuCacheTs = Date.now();
          }
          return list;
        });
      });
    }

    function fetchEpic247Channels() {
      var now = Date.now();
      if (w.__xeEpic247Cache && (now - (w.__xeEpic247CacheTs || 0)) < 5 * 60 * 1000 && w.__xeEpic247Cache.length) {
        return Promise.resolve(w.__xeEpic247Cache);
      }
      return Promise.all([
        fetchEpicSportsChannels().catch(function () { return mergeEpicChannels(null); }),
        fetchPortalCanales().catch(function () { return []; }),
        fetchPirloTvChannels().catch(function () { return []; }),
        fetchStreamTpChannels().catch(function () { return []; }),
        fetchKsdChannels().catch(function () { return []; })
      ]).then(function (resArr) {
        var t3LogoSkip = isTizen3Device();
        var buckets = {};
        var order = [];
        var seenNames = {};
        var pereRows = (Array.isArray(resArr[0]) ? resArr[0] : []).map(function (pc) {
          return { name: pc.name, url: pc.url, logo: pc.logo, fuente: 'perelman', active: true, isSports: true, now: 'Señal directa 24/7', next: 'Deportes LATAM' };
        });
        var portal247Rows = (Array.isArray(resArr[1]) ? resArr[1] : []).filter(function (x) { return x && x.categoria === 'epic_247'; });
        appendCatalogRowsToBucket(pereRows, buckets, order, seenNames, t3LogoSkip);
        appendCatalogRowsToBucket(portal247Rows, buckets, order, seenNames, t3LogoSkip);
        appendCatalogRowsToBucket(resArr[2], buckets, order, seenNames, t3LogoSkip);
        appendCatalogRowsToBucket(resArr[3], buckets, order, seenNames, t3LogoSkip);
        appendCatalogRowsToBucket(resArr[4], buckets, order, seenNames, t3LogoSkip);
        var items = finalizeBucketItems(buckets, order, 'epicm-247-', 0);
        if (items.length) {
          w.__xeEpic247Cache = items;
          w.__xeEpic247CacheTs = Date.now();
        }
        return items;
      });
    }

    function fetchPortalCategoryChannels() {
      return fetchPortalCanales().then(function (rows) {
        var t3LogoSkip = isTizen3Device();
        var buckets = {};
        var order = [];
        var seenNames = {};
        appendCatalogRowsToBucket(rows || [], buckets, order, seenNames, t3LogoSkip);
        return finalizeBucketItems(buckets, order, 'portal-', 0);
      });
    }

    function decodeBase64ParamUrl(u) {
      try {
        var m = /[?&]r=([A-Za-z0-9+/=_%-]+)/i.exec(String(u || ''));
        if (!m || !m[1] || typeof atob !== 'function') return '';
        var b64 = decodeURIComponent(m[1]).replace(/-/g, '+').replace(/_/g, '/');
        while (b64.length % 4) b64 += '=';
        var decoded = atob(b64).trim();
        return /^https?:\/\//i.test(decoded) ? decoded : '';
      } catch (_) {
        return '';
      }
    }

    function decodeEmbedObfuscatedHtml(html) {
      var out = String(html || '');
      if (typeof atob === 'function') {
        var charArrM = /var\s+\w+\s*=\s*(\[[^\]]+\])\s*;[\s\S]{0,300}?parseInt\(atob\([^)]+\)\.replace\([^)]+\)\)\s*-\s*(\d+)\s*\)/.exec(out);
        if (charArrM && charArrM[1]) {
          try {
            var strs = charArrM[1].match(/"([^"]+)"/g) || [];
            var off = parseInt(charArrM[2], 10) || 0;
            var dec = '';
            for (var ci = 0; ci < strs.length; ci++) {
              var b = strs[ci].slice(1, -1);
              var numStr = atob(b).replace(/\D/g, '');
              if (numStr) dec += String.fromCharCode(parseInt(numStr, 10) - off);
            }
            try { dec = decodeURIComponent(escape(dec)); } catch (_) {}
            if (dec) out += '\n' + dec;
          } catch (_) {}
        }
        var xorM = /var\s+\w+\s*=\s*\[([\d,\s]+)\]\s*,\s*\w+\s*=\s*(\d+)\s*,\s*\w+\s*=\s*(\d+)/.exec(out);
        if (xorM && xorM[1]) {
          try {
            var nums = xorM[1].split(',');
            var p1 = parseInt(xorM[2], 10) || 0;
            var p2 = parseInt(xorM[3], 10) || 0;
            var variants = [[p1, p2], [p2, p1]];
            for (var vi = 0; vi < variants.length; vi++) {
              var k1 = variants[vi][0], k2 = variants[vi][1], candTxt = '';
              for (var ni = 0; ni < nums.length; ni++) {
                var vNum = parseInt(nums[ni], 10);
                if (!isNaN(vNum)) candTxt += String.fromCharCode(((vNum ^ k1) - k2 + 65536) % 256);
              }
              if (/https?:\/\//i.test(candTxt)) out += '\n' + candTxt;
            }
          } catch (_) {}
        }
        var tupleFullRe = /([A-Za-z_$][\w$]*)\s*=\s*(\[\[\d+,"[A-Za-z0-9+/=]+"\]\s*(?:,\s*\[\d+,"[A-Za-z0-9+/=]+"\]\s*)+\])\s*;[\s\S]{0,260}?var\s+\w+\s*=\s*([A-Za-z_$][\w$]*)\(\)\s*\+\s*([A-Za-z_$][\w$]*)\(\)/g;
        var tupleM;
        while ((tupleM = tupleFullRe.exec(out))) {
          try {
            var fn1Re = new RegExp('function\\s+' + tupleM[3].replace(/\$/g, '\\$') + '\\s*\\(\\)\\s*\\{\\s*return\\s+(\\d+)\\s*;?\\s*\\}');
            var fn2Re = new RegExp('function\\s+' + tupleM[4].replace(/\$/g, '\\$') + '\\s*\\(\\)\\s*\\{\\s*return\\s+(\\d+)\\s*;?\\s*\\}');
            var fm1 = fn1Re.exec(out);
            var fm2 = fn2Re.exec(out);
            if (fm1 && fm2) {
              var tKey = parseInt(fm1[1], 10) + parseInt(fm2[1], 10);
              var pairRe = /\[(\d+),"([A-Za-z0-9+/=]+)"\]/g;
              var pairM, pairs = [];
              while ((pairM = pairRe.exec(tupleM[2]))) {
                pairs.push([parseInt(pairM[1], 10), pairM[2]]);
              }
              pairs.sort(function (a, b) { return a[0] - b[0]; });
              var tTxt = '';
              for (var pi = 0; pi < pairs.length; pi++) {
                var rawNum = atob(pairs[pi][1]).replace(/\D/g, '');
                if (rawNum) tTxt += String.fromCharCode(parseInt(rawNum, 10) - tKey);
              }
              if (/https?:\/\//i.test(tTxt)) out += '\n' + tTxt;
            }
          } catch (_) {}
        }
      }
      return out.replace(/\\u0026/gi, '&').replace(/\\x26/gi, '&').replace(/\\u003d/gi, '=').replace(/\\\//g, '/').replace(/&amp;/gi, '&');
    }

    function resolveDirectClientEmbed(startUrl, maxDepth) {
      if (isTizen3Device() || typeof w.fetch !== 'function') {
        return Promise.reject(new Error('Embed directo omitido en Tizen 3.0'));
      }
      var decodedTarget = decodeBase64ParamUrl(startUrl);
      var firstUrl = decodedTarget || startUrl;
      var firstRef = decodedTarget ? startUrl : '';

      function step(curUrl, refUrl, depth) {
        if (depth > (maxDepth || 4) || !/^https?:\/\//i.test(curUrl)) {
          return Promise.reject(new Error('Sin m3u8 en embed'));
        }
        var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
        var tm = ctrl ? setTimeout(function () { try { ctrl.abort(); } catch (_) {} }, 5000) : null;
        var h = {};
        if (refUrl && /^https?:\/\//i.test(refUrl)) h.Referer = refUrl;
        return w.fetch(curUrl, { method: 'GET', headers: h, signal: ctrl ? ctrl.signal : undefined })
          .then(function (r) {
            if (tm) clearTimeout(tm);
            if (!r || !r.ok) throw new Error('HTTP ' + (r ? r.status : 0));
            return r.text();
          })
          .then(function (rawHtml) {
            var html = decodeEmbedObfuscatedHtml(rawHtml);
            var m3uRe = /https?:\/\/[^\s"'<>\\]+\.m3u8[^\s"'<>\\]*/gi;
            var m3uM;
            while ((m3uM = m3uRe.exec(html))) {
              if (m3uM[0] && !/\.m3u8\.(?:png|jpg|js|css)/i.test(m3uM[0])) {
                var cleanStream = m3uM[0].replace(/^(https:\/\/[^\/]+):443(\/|$)/i, '$1$2');
                var om = /^(https?:\/\/[^\/]+)/i.exec(curUrl);
                var origin = om ? om[1] : '';
                var hdrs = {};
                if (origin) {
                  hdrs.Referer = origin + '/';
                  hdrs.Origin = origin;
                }
                return { url: cleanStream, headers: Object.keys(hdrs).length ? hdrs : null };
              }
            }
            if (/\.mpd(\?|$)/i.test(html)) {
              throw new Error('DASH .mpd no compatible en este extractor');
            }
            var locMatch = html.match(/nuevoDominio\s*=\s*["'](https?:\/\/[^"']+)["']/i) ||
                           html.match(/window\.location\.replace\(\s*["'](https?:\/\/[^"']+)["']/i);
            if (locMatch && locMatch[1]) {
              var nextDom = locMatch[1].replace(/\/+$/, '');
              var nextU = curUrl.replace(/^https?:\/\/[^\/]+/i, nextDom);
              if (nextU !== curUrl) return step(nextU, curUrl, depth + 1);
            }
            if (/embed\.ksdjugfssddeports\.com/i.test(curUrl)) {
              var ksdEm = /embed2\/[a-z0-9_.-]+\.php(?:\?[^"'\s<>]+)?/i.exec(html);
              if (ksdEm && ksdEm[0]) {
                var ksdNext = 'https://embed.ksdjugfssddeports.com/' + ksdEm[0].replace(/^\/+/, '');
                if (ksdNext !== curUrl) return step(ksdNext, curUrl, depth + 1);
              }
            }
            var ifrRe = /<iframe[^>]+src=["']((?:https?:)?\/\/[^"']+)["']/gi;
            var ifr;
            while ((ifr = ifrRe.exec(html))) {
              var ifrU = ifr[1].indexOf('//') === 0 ? ('https:' + ifr[1]) : ifr[1];
              if (ifrU && ifrU !== curUrl && !/chat\.php|instreams\.click\/ad|acscdn|ad\d*\.html|doubleclick|histats|waust|whos\.amung|popads|adsterra/i.test(ifrU)) {
                return step(ifrU, curUrl, depth + 1);
              }
            }
            throw new Error('Sin iframe ni m3u8');
          }, function (err) {
            if (tm) clearTimeout(tm);
            throw err;
          });
      }

      return step(firstUrl, firstRef, 0);
    }

    function resolveEpicMenuCandidate(cand) {
      var candObj = (cand && typeof cand === 'object') ? cand : null;
      var u = String(candObj ? (candObj.url || '') : (cand || '')).trim();
      var baseHdrs = (candObj && candObj.headers) ? Object.assign({}, candObj.headers) : null;
      if (u.indexOf('embed://') === 0) {
        return resolveDirectClientEmbed(u.replace(/^embed:\/\//i, ''), 4);
      }
      if (!/^https?:\/\//i.test(u)) return Promise.reject(new Error('URL inválida'));
      if (/\/perelman\/[^/?#]+$/i.test(u) && /playlatam\.site|epictvparaiphone\.top/i.test(u)) {
        u = u.replace(/^https?:\/\/playlatam\.site/i, 'https://epictvparaiphone.top');
        if (!/\.m3u8(\?|#|$)/i.test(u)) u += '.m3u8';
      }
      if (/\.m3u8(\?|#|$)/i.test(u)) {
        var cleanDirect = u.replace(/#mpegurl$/i, '');
        if (/epictvparaiphone\.top|playlatam\.site/i.test(cleanDirect)) {
          return ensureEpicUserAgent().then(function () {
            return fetchEpicTokenFresh().then(function (tok) {
              var h = Object.assign({}, baseHdrs || {});
              h['X-Cred'] = PORTAL_CRED;
              if (tok) h['X-Pulsera'] = tok;
              return { url: cleanDirect, headers: h };
            });
          });
        }
        return Promise.resolve({ url: cleanDirect, headers: baseHdrs });
      }
      var tryServerResolve = function () {
        return fetchEpicTokenFresh().then(function (tok) {
          var apiUrl = 'https://playlatam.site/resolve?url=' + encodeURIComponent(u) + '&navegador=1';
          return epicFetch(apiUrl, 'GET', { 'Accept': 'application/json', 'X-Pulsera': tok }, 8000).then(function (res) {
            var st = res && typeof res.stream === 'string' ? res.stream.trim() : '';
            if (!/^https?:\/\//i.test(st)) throw new Error((res && res.error) || 'Sin stream');
            if (res.tipo === 'dash' || /\.mpd(\?|$)/i.test(st)) throw new Error('DASH no compatible');
            st = st.replace(/#mpegurl$/i, '').replace(/([?&])[a-zA-Z0-9_]+=\[[A-Z0-9_]+\]/g, '$1').replace(/\?&+/, '?').replace(/&&+/g, '&').replace(/[?&]$/, '');
            var hdrs = {};
            var ref = res && typeof res.ref === 'string' ? res.ref.trim() : '';
            if (/^https?:\/\//i.test(ref)) {
              hdrs.Referer = ref;
              var om = /^(https?:\/\/[^\/]+)/i.exec(ref);
              if (om && om[1]) hdrs.Origin = om[1];
            }
            if (/epictvparaiphone\.top|playlatam\.site/i.test(st)) {
              hdrs['X-Pulsera'] = tok;
            }
            return { url: st, headers: Object.keys(hdrs).length ? hdrs : null };
          });
        });
      };
      if (/pirlotv\.la|cdplay\.live|playvi\.org|104game\.click|sofayshop\.st|la18hd\.su|streamtp\d*[a-z]*\.sbs|streamx[a-z0-9]*\.sbs|ksdjugfssddeports\.com|saohgdassregions\.com|pelotalibretv\.net\.pe|tvf90\.com|rdcanais\.org|dadinhodetapioca\.fun|embed\.st|embedsports\.me/i.test(u)) {
        return resolveDirectClientEmbed(u, 4).catch(function () {
          return tryServerResolve();
        });
      }
      return tryServerResolve();
    }

    w.XuperEpicSports = {
      getPulseraToken: fetchEpicTokenFresh,
      getCachedToken: getEpicTokenCached,
      resolveCandidate: resolveEpicMenuCandidate,
      fetchChannels: fetchEpicSportsChannels,
      fetchMenuChannels: fetchEpicMenuChannels,
      fetch247Channels: fetchEpic247Channels,
      fetchPortalChannels: fetchPortalCanales,
      fetchEspnChannels: fetchUnifiedEspnChannels,
      fetchCountryS1Channels: fetchCountryS1Channels
    };

    function parseM3uPlaylist(rawText, sourceUrl) {
      var lines = String(rawText || '').split(/\r?\n/);
      var channels = [];
      var pending = null;
      var adultRe = /18\+|adult|xxx|porn|hentai|er[oó]tic|sex\b/i;
      var limitedRe = /\[geo-blocked\]|\[not 24\/7\]/i;
      var deadMap = w.__xeDeadUrls || (w.__xeDeadUrls = {});
      var totalCount = 0;
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (!line) continue;
        if (line.indexOf('#EXTINF:') === 0) {
          var logoMatch = line.match(/tvg-logo=["']([^"']*)["']/i);
          var grpMatch = line.match(/group-title=["']([^"']*)["']/i);
          var commaIdx = line.lastIndexOf(',');
          var chName = commaIdx !== -1 ? line.slice(commaIdx + 1).trim() : 'Canal';
          pending = {
            name: chName || 'Canal',
            logo: (logoMatch && logoMatch[1]) || '',
            group: (grpMatch && grpMatch[1]) || 'M3U'
          };
        } else if (line.charAt(0) === '#') {
          continue;
        } else if (/^https?:\/\//i.test(line)) {
          var meta = pending || { name: 'Canal ' + (totalCount + 1), logo: '', group: 'M3U' };
          pending = null;
          if (adultRe.test(meta.name) || adultRe.test(meta.group)) continue;
          if (limitedRe.test(meta.name) || limitedRe.test(meta.group)) continue;
          if (deadMap[line]) continue;
          var chObj = {
            channelCode: 'm3u_' + totalCount + '_' + meta.name.replace(/[^a-z0-9]/gi, '').slice(0, 12),
            index: totalCount + 1,
            name: meta.name,
            logo: meta.logo,
            group: meta.group,
            uhd: /fhd|uhd|4k|1080/i.test(meta.name),
            fav: false,
            now: 'En vivo',
            next: '',
            time: 'EN VIVO',
            url: line,
            streamUrl: line,
            isM3u: true,
            sourceUrl: sourceUrl || '',
            liveAddressList: []
          };
          channels.push(chObj);
          totalCount++;
          if (totalCount >= 600) break;
        } else {
          pending = null;
        }
      }
      for (var c = 0; c < channels.length; c++) {
        channels[c].index = c + 1;
      }
      return channels;
    }

    function buildM3uFetchCandidates(rawUrl) {
      var u = String(rawUrl || '').trim();
      var ghMatch = /^https?:\/\/iptv-org\.github\.io\/iptv\/(.+)$/i.exec(u);
      if (ghMatch) {
        return [
          'https://cdn.jsdelivr.net/gh/iptv-org/iptv@gh-pages/' + ghMatch[1],
          u
        ];
      }
      var jsdMatch = /^https?:\/\/cdn\.jsdelivr\.net\/gh\/iptv-org\/iptv@gh-pages\/(.+)$/i.exec(u);
      if (jsdMatch) {
        return [
          u,
          'https://iptv-org.github.io/iptv/' + jsdMatch[1]
        ];
      }
      return [u];
    }

    function inferM3uPresetId(columnId, url) {
      if (columnId && String(columnId).indexOf('m3u_') === 0) return String(columnId);
      var s = String(url || '');
      if (/\/languages\/spa\.m3u$/i.test(s)) return 'm3u_spa';
      var cm = /\/countries\/([a-z]{2})\.m3u$/i.exec(s);
      return cm ? ('m3u_' + cm[1].toLowerCase()) : '';
    }

    function getBundledM3uFallback(columnId, sourceUrl) {
      var map = w.__BUNDLED_M3U_LISTS;
      if (!map) return [];
      var key = inferM3uPresetId(columnId, sourceUrl);
      var rows = key ? map[key] : null;
      if (!Array.isArray(rows) || !rows.length) return [];
      var list = [];
      var limitedRe = /\[geo-blocked\]|\[not 24\/7\]/i;
      var deadMap = w.__xeDeadUrls || (w.__xeDeadUrls = {});
      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        if (!Array.isArray(row) || row.length < 2) continue;
        var chName = String(row[0] || ('Canal ' + (i + 1)));
        var chUrl = String(row[1] || '').trim();
        var chLogo = String(row[2] || '');
        if (!/^https?:\/\//i.test(chUrl)) continue;
        if (limitedRe.test(chName) || deadMap[chUrl]) continue;
        var chObj = {
          channelCode: 'm3u_' + i + '_' + chName.replace(/[^a-z0-9]/gi, '').slice(0, 12),
          index: list.length + 1,
          name: chName,
          logo: chLogo,
          group: 'M3U',
          uhd: /fhd|uhd|4k|1080/i.test(chName),
          fav: false,
          now: 'En vivo',
          next: '',
          time: 'EN VIVO',
          url: chUrl,
          streamUrl: chUrl,
          isM3u: true,
          sourceUrl: sourceUrl || '',
          liveAddressList: []
        };
        list.push(chObj);
      }
      return list;
    }

    function fetchM3uTextOnce(targetUrl) {
      if (typeof w.fetch !== 'function') {
        return Promise.reject(new Error('fetch no disponible para M3U'));
      }
      var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
      var tm = ctrl ? setTimeout(function () { try { ctrl.abort(); } catch (_) {} }, 6000) : null;
      return w.fetch(targetUrl, {
        method: 'GET',
        headers: { 'Accept': '*/*' },
        signal: ctrl ? ctrl.signal : undefined
      }).then(function (r) {
        if (tm) clearTimeout(tm);
        if (!r || !r.ok) throw new Error('HTTP ' + (r ? r.status : 0));
        return r.text();
      }).catch(function (err) {
        if (tm) clearTimeout(tm);
        throw err;
      });
    }

    function fetchM3uPlaylist(m3uUrl, columnId) {
      var url = String(m3uUrl || '').trim();
      if (!/^https?:\/\//i.test(url)) {
        return Promise.reject(new Error('URL M3U no válida'));
      }
      // Las listas -S1 curadas solo conservan enlaces verificados; no reinyectar listas remotas sin filtrar.
      var presetKey = inferM3uPresetId(columnId, url);
      if (presetKey && w.__BUNDLED_M3U_LISTS && Array.isArray(w.__BUNDLED_M3U_LISTS[presetKey]) && w.__BUNDLED_M3U_LISTS[presetKey].length) {
        var curatedList = getBundledM3uFallback(columnId, url);
        if (curatedList.length) {
          M3U_MEM_CACHE[url] = { ts: Date.now(), channels: curatedList };
          return Promise.resolve(curatedList);
        }
      }
      var candidates = buildM3uFetchCandidates(url);
      var primaryKey = candidates[0] || url;
      var now = Date.now();
      var mem = M3U_MEM_CACHE[primaryKey] || M3U_MEM_CACHE[url];
      if (mem && (now - mem.ts) < M3U_TTL_MS && mem.channels && mem.channels.length) {
        return Promise.resolve(mem.channels);
      }
      var storageKey = 'xuper.m3u.v3::' + primaryKey;
      try {
        var rawLs = w.localStorage && w.localStorage.getItem(storageKey);
        if (rawLs) {
          var parsedLs = JSON.parse(rawLs);
          if (parsedLs && (now - (parsedLs.ts || 0)) < M3U_TTL_MS && Array.isArray(parsedLs.channels) && parsedLs.channels.length) {
            M3U_MEM_CACHE[primaryKey] = { ts: parsedLs.ts, channels: parsedLs.channels };
            return Promise.resolve(parsedLs.channels);
          }
        }
      } catch (_) {}

      function tryMirror(idx) {
        if (idx >= candidates.length) {
          var fbList = getBundledM3uFallback(columnId, url);
          if (fbList.length) {
            M3U_MEM_CACHE[primaryKey] = { ts: Date.now(), channels: fbList };
            return Promise.resolve(fbList);
          }
          return Promise.reject(new Error('No se pudo cargar la lista M3U'));
        }
        return fetchM3uTextOnce(candidates[idx]).then(function (txt) {
          var list = parseM3uPlaylist(txt, candidates[idx]);
          if (!list.length) throw new Error('Lista M3U vacía');
          M3U_MEM_CACHE[primaryKey] = { ts: Date.now(), channels: list };
          try {
            if (w.localStorage && list.length <= 450) {
              w.localStorage.setItem(storageKey, JSON.stringify({ ts: Date.now(), channels: list }));
            }
          } catch (_) {}
          return list;
        }).catch(function () {
          return tryMirror(idx + 1);
        });
      }

      return tryMirror(0);
    }

    if (method === 'fetchM3u') {
      var targetM3u = params && (params.url || params.m3uUrl || '');
      fetchM3uPlaylist(targetM3u, params && params.columnId).then(function (channels) {
        callback(null, { returnValue: true, channels: channels, url: targetM3u });
      }).catch(function (err) {
        callback(err, { returnValue: false, channels: [], errorText: String((err && err.message) || err) });
      });
      return true;
    }

    if (method === 'liveChannels' && params && (params.columnId === 'espn' || params.columnId === 'ESPN' || params.isEspn)) {
      fetchUnifiedEspnChannels().then(function (channels) {
        callback(null, { returnValue: true, channels: channels });
      }).catch(function () {
        var espnFallback = (w.__ESPN_CHANNELS && w.__ESPN_CHANNELS.length) ? w.__ESPN_CHANNELS.slice() : [];
        callback(null, { returnValue: true, channels: espnFallback });
      });
      return true;
    }

    if (method === 'liveChannels' && params && (params.columnId === 'portal_canales' || params.isPortalCanales)) {
      fetchPortalCategoryChannels().then(function (channels) {
        callback(null, { returnValue: true, channels: channels });
      }).catch(function () {
        callback(null, { returnValue: true, channels: [] });
      });
      return true;
    }

    if (method === 'liveChannels' && params && (params.columnId === 'epic_sports' || params.isEpicSports)) {
      fetchEpicSportsChannels().then(function (channels) {
        callback(null, { returnValue: true, channels: channels });
      }).catch(function () {
        callback(null, { returnValue: true, channels: mergeEpicChannels(null) });
      });
      return true;
    }

    if (method === 'liveChannels' && params && (params.columnId === 'epic_events' || params.isEpicEvents)) {
      fetchEpicMenuChannels().then(function (channels) {
        callback(null, { returnValue: true, channels: channels });
      }).catch(function () {
        callback(null, { returnValue: true, channels: w.__xeEpicMenuCache || [] });
      });
      return true;
    }

    if (method === 'liveChannels' && params && (params.columnId === 'epic_247' || params.isEpic247)) {
      fetchEpic247Channels().then(function (channels) {
        callback(null, { returnValue: true, channels: channels });
      }).catch(function () {
        callback(null, { returnValue: true, channels: w.__xeEpic247Cache || [] });
      });
      return true;
    }

    if (method === 'liveChannels' && params && COUNTRY_S1_CONFIG[params.columnId]) {
      fetchCountryS1Channels(String(params.columnId || ''), params.m3uUrl, params.countryFolder).then(function (channels) {
        callback(null, { returnValue: true, channels: channels });
      }).catch(function (err) {
        callback(err, { returnValue: false, channels: [], errorText: String((err && err.message) || err) });
      });
      return true;
    }

    if (method === 'liveChannels' && params && params.columnId === 'all_search') {
      Promise.all([
        fetchUnifiedEspnChannels().catch(function () { return []; }),
        fetchEpicSportsChannels().catch(function () { return []; }),
        fetchEpicMenuChannels().catch(function () { return []; }),
        fetchEpic247Channels().catch(function () { return []; }),
        fetchPortalCategoryChannels().catch(function () { return []; })
      ]).then(function (groups) {
        var combined = [];
        var seen = {};
        var pushUnique = function (list, catLabel) {
          if (!Array.isArray(list)) return;
          for (var i = 0; i < list.length; i++) {
            var item = list[i];
            if (!item || !item.name) continue;
            var key = String(item.channelCode || item.id || '') + '|' + String(item.name || '').trim().toLowerCase();
            if (seen[key]) continue;
            seen[key] = true;
            if (!item.categoryName && catLabel) item.categoryName = catLabel;
            combined.push(item);
          }
        };
        pushUnique(w.__masterChannelPool, 'Principal');
        pushUnique(groups[0], 'ESPN');
        pushUnique(groups[1], 'Deportes-S1');
        pushUnique(groups[2], 'Todos-S2');
        pushUnique(groups[3], 'Canales 24/7-S1');
        pushUnique(groups[4], 'Portal');
        callback(null, { returnValue: true, channels: combined });
      }).catch(function () {
        callback(null, { returnValue: true, channels: w.__masterChannelPool || [] });
      });
      return true;
    }

    if (method === 'liveChannels' && params && (params.m3uUrl || String(params.columnId || '').indexOf('m3u_') === 0)) {
      var presetM3uMap = {
        m3u_spa: 'https://cdn.jsdelivr.net/gh/iptv-org/iptv@gh-pages/languages/spa.m3u',
        m3u_es: 'https://cdn.jsdelivr.net/gh/iptv-org/iptv@gh-pages/countries/es.m3u',
        m3u_mx: 'https://cdn.jsdelivr.net/gh/iptv-org/iptv@gh-pages/countries/mx.m3u',
        m3u_co: 'https://cdn.jsdelivr.net/gh/iptv-org/iptv@gh-pages/countries/co.m3u',
        m3u_ar: 'https://cdn.jsdelivr.net/gh/iptv-org/iptv@gh-pages/countries/ar.m3u',
        m3u_pe: 'https://cdn.jsdelivr.net/gh/iptv-org/iptv@gh-pages/countries/pe.m3u',
        m3u_cl: 'https://cdn.jsdelivr.net/gh/iptv-org/iptv@gh-pages/countries/cl.m3u',
        m3u_ec: 'https://cdn.jsdelivr.net/gh/iptv-org/iptv@gh-pages/countries/ec.m3u',
        m3u_bo: 'https://cdn.jsdelivr.net/gh/iptv-org/iptv@gh-pages/countries/bo.m3u',
        m3u_gt: 'https://cdn.jsdelivr.net/gh/iptv-org/iptv@gh-pages/countries/gt.m3u'
      };
      var m3uEndpoint = params.m3uUrl || presetM3uMap[params.columnId];
      if (m3uEndpoint) {
        fetchM3uPlaylist(m3uEndpoint, params.columnId).then(function (channels) {
          callback(null, { returnValue: true, channels: channels });
        }).catch(function (err) {
          callback(err, { returnValue: false, channels: [], errorText: String((err && err.message) || err) });
        });
        return true;
      }
    }

    if (method === 'resolveLive' && params && /^(https?|hellohow):\/\//i.test(String(params.streamUrl || params.url || ''))) {
      var primaryDirect = String(params.streamUrl || params.url);
      var backupCandidates = [primaryDirect];
      if (Array.isArray(params.backupUrls)) {
        for (var bIdx = 0; bIdx < params.backupUrls.length; bIdx++) {
          if (params.backupUrls[bIdx] && backupCandidates.indexOf(params.backupUrls[bIdx]) === -1) {
            backupCandidates.push(params.backupUrls[bIdx]);
          }
        }
      }
      var poolsToCheck = (w.__ESPN_CHANNELS || []).concat(w.__EPIC_SPORTS_CHANNELS || []);
      for (var pIdx = 0; pIdx < poolsToCheck.length; pIdx++) {
        var pc = poolsToCheck[pIdx];
        if (pc && pc.channelCode === params.channelCode && Array.isArray(pc.backupUrls)) {
          for (var pb = 0; pb < pc.backupUrls.length; pb++) {
            if (pc.backupUrls[pb] && backupCandidates.indexOf(pc.backupUrls[pb]) === -1) {
              backupCandidates.push(pc.backupUrls[pb]);
            }
          }
        }
      }
      var menuEntry = params.channelCode ? epicMenuByCode[params.channelCode] : null;
      if (menuEntry && Array.isArray(menuEntry.backupUrls)) {
        for (var mb = 0; mb < menuEntry.backupUrls.length; mb++) {
          if (menuEntry.backupUrls[mb] && backupCandidates.indexOf(menuEntry.backupUrls[mb]) === -1) {
            backupCandidates.push(menuEntry.backupUrls[mb]);
          }
        }
      }

      if (isTizen3Device()) {
        var chLabelT3 = String((params && params.name) || (menuEntry && menuEntry.name) || (params && params.channelCode) || '');
        if (/espn/i.test(chLabelT3) && w.__BUNDLED_M3U_LISTS && typeof w.__BUNDLED_M3U_LISTS === 'object') {
          var wantNumM = /espn\s*([2-7]|plus|premium|extra|deportes)/i.exec(chLabelT3);
          var wantTag = wantNumM ? wantNumM[1].toLowerCase() : '';
          var m3uKeys = Object.keys(w.__BUNDLED_M3U_LISTS);
          for (var mk = 0; mk < m3uKeys.length; mk++) {
            var arrM = w.__BUNDLED_M3U_LISTS[m3uKeys[mk]];
            if (!Array.isArray(arrM)) continue;
            for (var mi = 0; mi < arrM.length; mi++) {
              var rowM = arrM[mi];
              if (!Array.isArray(rowM) || rowM.length < 2) continue;
              var nmM = String(rowM[0] || '');
              var urlM = String(rowM[1] || '').trim();
              if (!/^http:\/\//i.test(urlM) || !/espn/i.test(nmM)) continue;
              if (wantTag) {
                if (nmM.toLowerCase().indexOf(wantTag) === -1) continue;
              } else if (/espn\s*[2-7]|premium|plus|extra/i.test(nmM)) {
                continue;
              }
              if (backupCandidates.indexOf(urlM) === -1) backupCandidates.push(urlM);
            }
          }
        }
      }

      if (isTizen3Device() && backupCandidates.length > 1) {
        var t3Http = [];
        var t3Other = [];
        for (var t3i = 0; t3i < backupCandidates.length; t3i++) {
          var t3u = backupCandidates[t3i];
          if (/^http:\/\//i.test(String(t3u || ''))) t3Http.push(t3u);
          else t3Other.push(t3u);
        }
        if (t3Http.length) {
          backupCandidates = t3Http.concat(t3Other);
          primaryDirect = backupCandidates[0];
        }
      }

      var liveTicket = (w.__xuperLiveResolveTicket = (w.__xuperLiveResolveTicket || 0) + 1);
      var pulseraRe = /epictvparaiphone\.top|playlatam\.site/i;
      var isEpicMenuItem = !!(menuEntry && menuEntry.isEpicMenu) || /^(epicm-|epic247-|espn-|epic-|portal-)/i.test(String(params.channelCode || ''));
      if (isEpicMenuItem) {
        if (backupCandidates.length > 12) backupCandidates = backupCandidates.slice(0, 12);
        var verifyMenuManifest = function (checkUrl, checkHdrs) {
          if (typeof w.fetch !== 'function') return Promise.resolve(true);
          var relay = w.XuperRelay;
          var fetchOnce = function (useRelay) {
            var uReq = checkUrl;
            var hReq = Object.assign({}, checkHdrs || {});
            if (useRelay && relay && typeof relay.wrapPortalRequest === 'function' && /^https:\/\//i.test(checkUrl) && !/workers\.dev|localhost|127\.0\.0\.1|10\.0\.2\.2/i.test(checkUrl)) {
              if (hReq['X-Pulsera'] && !hReq['X-Cookie']) hReq['X-Cookie'] = '__Host-pulsera=' + hReq['X-Pulsera'];
              if (hReq.Referer && !hReq['X-Referer']) hReq['X-Referer'] = hReq.Referer;
              if (hReq.Origin && !hReq['X-Origin']) hReq['X-Origin'] = hReq.Origin;
              var wrp = relay.wrapPortalRequest(checkUrl, { method: 'GET', headers: hReq });
              if (wrp && wrp.relayed) {
                uReq = wrp.url;
                hReq = wrp.options.headers || hReq;
              }
            }
            var ctrl = typeof AbortController === 'function' ? new AbortController() : null;
            var tm = ctrl ? setTimeout(function () { try { ctrl.abort(); } catch (_) {} }, 3500) : null;
            return w.fetch(uReq, {
              method: 'GET',
              headers: hReq,
              signal: ctrl ? ctrl.signal : undefined
            }).then(function (resp) {
              if (tm) clearTimeout(tm);
              if (!resp || !resp.ok) throw new Error('HTTP ' + (resp ? resp.status : 0));
              return resp.text().then(function (txt) {
                if (!/#EXTM3U/i.test(txt || '')) throw new Error('Manifiesto no válido');
                if (!isTizen3Device() && !useRelay && !/#EXT-X-STREAM-INF/i.test(txt)) {
                  var pLines = String(txt || '').split(/\r?\n/);
                  var segLines = [];
                  for (var li = 0; li < pLines.length; li++) {
                    var ln = String(pLines[li] || '').trim();
                    if (ln && ln.charAt(0) !== '#') segLines.push(ln);
                  }
                  if (!segLines.length) throw new Error('Manifiesto no válido (sin segmentos)');
                  var lastSeg = segLines[segLines.length - 1];
                  var lastSegUrl = lastSeg;
                  if (!/^https?:\/\//i.test(lastSegUrl)) {
                    try {
                      lastSegUrl = new URL(lastSeg, checkUrl).toString();
                    } catch (_) {
                      var mBase = /^(https?:\/\/[^\/?#]+)(\/[^?#]*)?/i.exec(checkUrl);
                      if (mBase) {
                        if (lastSeg.charAt(0) === '/') {
                          lastSegUrl = mBase[1] + lastSeg;
                        } else {
                          var pDir = (mBase[2] || '/').replace(/[^\/]*$/, '');
                          lastSegUrl = mBase[1] + pDir + lastSeg;
                        }
                      }
                    }
                  }
                  if (/^https?:\/\//i.test(lastSegUrl)) {
                    var sCtrl = typeof AbortController === 'function' ? new AbortController() : null;
                    var sTm = sCtrl ? setTimeout(function () { try { sCtrl.abort(); } catch (_) {} }, 2500) : null;
                    var sHdrs = Object.assign({}, checkHdrs || {});
                    sHdrs.Range = 'bytes=0-31';
                    return w.fetch(lastSegUrl, {
                      method: 'GET',
                      headers: sHdrs,
                      signal: sCtrl ? sCtrl.signal : undefined
                    }).then(function (sResp) {
                      if (sTm) clearTimeout(sTm);
                      if (sResp && (sResp.status === 404 || sResp.status === 410)) {
                        throw new Error('Manifiesto no válido (segmento HTTP ' + sResp.status + ')');
                      }
                      return true;
                    }, function () {
                      if (sTm) clearTimeout(sTm);
                      return true;
                    });
                  }
                }
                return true;
              });
            }, function (err) {
              if (tm) clearTimeout(tm);
              throw err;
            });
          };
          var hasCustomHdrs = !!(checkHdrs && (checkHdrs.Referer || checkHdrs.Origin || checkHdrs['X-Pulsera']));
          var canDirectAvFallback = !pulseraRe.test(checkUrl) && !!(w.CactusAVPlay && w.CactusAVPlay.available());
          var allowBypassIfBrowserBlocked = function (err) {
            var msg = String(err && err.message || '');
            if (/HTTP\s+(404|410|451|5\d\d)|Manifiesto no v/i.test(msg)) throw err;
            if (isTizen3Device()) return true;
            if (canDirectAvFallback && ((/HTTP\s+403/i.test(msg) && hasCustomHdrs) || /^https?:\/\//i.test(checkUrl) || !/HTTP\s+\d+/i.test(msg))) {
              return true;
            }
            throw err;
          };
          return fetchOnce(false).catch(function (err) {
            var msg = String(err && err.message || '');
            if (/HTTP\s+(403|404|410)/i.test(msg)) {
              try {
                w.__xeDeadUrls = w.__xeDeadUrls || {};
                w.__xeDeadUrls[checkUrl] = Date.now();
              } catch (_) {}
            }
            if (/HTTP\s+(404|410|451|5\d\d)|Manifiesto no v/i.test(msg)) throw err;
            if (/HTTP\s+4\d\d/i.test(msg) && !(hasCustomHdrs && /403/.test(msg))) throw err;
            return allowBypassIfBrowserBlocked(err);
          });
        };
        var playResolved = function (idx, resolvedCb) {
          if (liveTicket !== w.__xuperLiveResolveTicket) return;
          if (idx >= backupCandidates.length) {
            var fbCode = menuEntry && menuEntry.masterFallbackCode;
            var fbCh = (fbCode && channelCache[fbCode]) || findMatchingMasterChannel(params.name || (menuEntry && menuEntry.name) || '');
            if (fbCh && fbCh.channelCode) {
              return serviceCall('resolveLive', {
                channelCode: fbCh.channelCode,
                name: params.name || fbCh.name || 'Canal en vivo',
                liveAddressList: fbCh.liveAddressList || []
              }, function (fbErr, fbRes) {
                if (liveTicket !== w.__xuperLiveResolveTicket) return;
                if (!resolvedCb) return callback(fbErr, fbRes);
                if (fbErr || !fbRes || fbRes.returnValue === false) {
                  if (w.__onStreamError) w.__onStreamError('Señal deportiva no disponible por el momento');
                } else if (fbRes.url && fbRes.url !== '__cactus_live__' && fbRes.url !== '__cactus_avplay__' && typeof w.pn === 'function') {
                  w.pn(fbRes.proxyPath || fbRes.url);
                }
              });
            }
            if (resolvedCb) {
              if (w.__onStreamError) w.__onStreamError('Señal deportiva no disponible (protegida o sin respuesta)');
            } else {
              callback(new Error('Señal deportiva no disponible (protegida o sin respuesta)'), { returnValue: false, errorText: 'Señal deportiva no disponible (protegida o sin respuesta)' });
            }
            return;
          }
          resolveEpicMenuCandidate(backupCandidates[idx]).then(function (resolved) {
            if (liveTicket !== w.__xuperLiveResolveTicket) return;
            var rUrl = String(resolved.url || '').replace(/^(https:\/\/[^\/]+):443(\/|$)/i, '$1$2');
            var rHdrs = resolved.headers ? Object.assign({}, resolved.headers) : {};
            var rWrappedMap = {};
            var isPulseraResolved = pulseraRe.test(rUrl);
            if (isPulseraResolved && rUrl.indexOf('playlatam.site/perelman/') !== -1) {
              rUrl = rUrl.replace(/https?:\/\/playlatam\.site/i, 'https://epictvparaiphone.top');
              if (!/\.m3u8($|\?)/i.test(rUrl)) rUrl += '.m3u8';
            }
            if (false && isTizen3Device() && w.XuperRelay && typeof w.XuperRelay.wrapPortalRequest === 'function' && /^https:\/\//i.test(rUrl) && isPulseraResolved) {
              if (rHdrs['X-Pulsera'] && !rHdrs['X-Cookie']) rHdrs['X-Cookie'] = '__Host-pulsera=' + rHdrs['X-Pulsera'];
              var wr = w.XuperRelay.wrapPortalRequest(rUrl, { method: 'GET', headers: rHdrs });
              if (wr && wr.relayed) {
                rWrappedMap[wr.url] = wr.options.headers;
                Object.assign(rHdrs, wr.options.headers);
                rUrl = wr.url;
              }
            }
            return verifyMenuManifest(rUrl, rHdrs).then(function () {
              if (liveTicket !== w.__xuperLiveResolveTicket) return;
              var allResolvedBackups = [rUrl];
              for (var bk = idx + 1; bk < backupCandidates.length; bk++) {
                var bCand = backupCandidates[bk];
                var bUrl = String((bCand && typeof bCand === 'object') ? (bCand.url || '') : (bCand || '')).trim();
                if (!/^https?:\/\//i.test(bUrl)) continue;
                bUrl = bUrl.replace(/#mpegurl$/i, '').replace(/^(https:\/\/[^\/]+):443(\/|$)/i, '$1$2');
                if (bUrl.indexOf('playlatam.site/perelman/') !== -1) {
                  bUrl = bUrl.replace(/https?:\/\/playlatam\.site/i, 'https://epictvparaiphone.top');
                  if (!/\.m3u8($|\?)/i.test(bUrl)) bUrl += '.m3u8';
                }
                if (isTizen3Device() && w.XuperRelay && typeof w.XuperRelay.wrapPortalRequest === 'function' && /^https:\/\//i.test(bUrl) && pulseraRe.test(bUrl)) {
                  var wrB = w.XuperRelay.wrapPortalRequest(bUrl, { method: 'GET', headers: rHdrs });
                  if (wrB && wrB.relayed) {
                    rWrappedMap[wrB.url] = wrB.options.headers;
                    bUrl = wrB.url;
                  }
                }
                if (allResolvedBackups.indexOf(bUrl) === -1) allResolvedBackups.push(bUrl);
              }
              if (!rHdrs['X-Pulsera']) {
                for (var pi2 = 0; pi2 < allResolvedBackups.length; pi2++) {
                  if (pulseraRe.test(allResolvedBackups[pi2])) {
                    rHdrs['X-Pulsera'] = getEpicTokenCached();
                    break;
                  }
                }
              }
              w.__xuperCurrentStreamMeta = {
                url: rUrl,
                originalUrl: resolved.url,
                headers: rHdrs,
                headersByUrl: rWrappedMap,
                skipAvOnT3Https: false,
                backupUrls: allResolvedBackups
              };
              w.__xuperCurrentBackupUrls = allResolvedBackups;
              var useHlsFirst = isPulseraResolved || (isTizen3Device() && /^https:\/\//i.test(rUrl) && !!(w.Hls && w.Hls.isSupported()));
              if (!useHlsFirst && w.CactusAVPlay && w.CactusAVPlay.available()) {
                var avOk = false;
                w.CactusAVPlay.start({
                  url: rUrl,
                  title: params.name || 'Todos-S2',
                  kind: 'live',
                  suppressStreamError: true,
                  headers: Object.keys(rHdrs).length ? rHdrs : undefined,
                  onError: function () {
                    if (avOk && idx + 1 < backupCandidates.length) playResolved(idx + 1, true);
                  }
                }).then(function () {
                  avOk = true;
                }).catch(function () {
                  if (liveTicket !== w.__xuperLiveResolveTicket) return;
                  if (idx + 1 < backupCandidates.length) {
                    playResolved(idx + 1, true);
                  } else if (typeof w.pn === 'function') {
                    w.__xuperSkipAvFallbackNext = true;
                    w.pn(rUrl);
                  }
                });
                if (!resolvedCb) {
                  callback(null, { returnValue: true, url: '__cactus_live__', proxyPath: '__cactus_live__', isHls: true, backupUrls: allResolvedBackups });
                }
                return;
              }
              if (resolvedCb && typeof w.pn === 'function') {
                w.pn(rUrl);
              } else {
                callback(null, { returnValue: true, url: rUrl, proxyPath: rUrl, isHls: true, headers: Object.keys(rHdrs).length ? rHdrs : undefined, backupUrls: allResolvedBackups });
              }
            });
          }).catch(function () {
            var failedCand = backupCandidates[idx];
            var failedUrl = String((failedCand && typeof failedCand === 'object') ? (failedCand.url || '') : (failedCand || '')).trim();
            if (failedUrl && !/epictvparaiphone\.top\/perelman\//i.test(failedUrl)) {
              w.__xeDeadUrls = w.__xeDeadUrls || {};
              w.__xeDeadUrls[failedUrl] = true;
            }
            playResolved(idx + 1, resolvedCb);
          });
        };
        if (primaryDirect.indexOf('hellohow://') === 0) {
          resolveHelloHowEventStreams(primaryDirect).then(function (hhCands) {
            if (liveTicket !== w.__xuperLiveResolveTicket) return;
            backupCandidates = Array.isArray(hhCands) ? hhCands.slice(0, 10) : [];
            playResolved(0, false);
          }).catch(function () {
            if (liveTicket !== w.__xuperLiveResolveTicket) return;
            callback(new Error('Evento deportivo no disponible por el momento'), { returnValue: false, errorText: 'Evento deportivo no disponible por el momento' });
          });
          return true;
        }
        playResolved(0, false);
        return true;
      }
      var primaryNeedsPulsera = pulseraRe.test(primaryDirect);
      var expandedCandidates = [];
      for (var cIdx = 0; cIdx < backupCandidates.length; cIdx++) {
        var cand = backupCandidates[cIdx];
        if (!cand) continue;
        if (cand.indexOf('playlatam.site') !== -1) {
          var candEpic = cand.replace(/https?:\/\/playlatam\.site/i, 'https://epictvparaiphone.top');
          if (!/\.m3u8($|\?)/i.test(candEpic)) candEpic += '.m3u8';
          if (expandedCandidates.indexOf(candEpic) === -1) expandedCandidates.push(candEpic);
          if (cIdx === 0) primaryDirect = candEpic;
        }
        if (expandedCandidates.indexOf(cand) === -1) expandedCandidates.push(cand);
        if (cand.indexOf('epictvparaiphone.top') !== -1) {
          var candPlay = cand.replace(/https?:\/\/epictvparaiphone\.top/i, 'https://playlatam.site');
          if (expandedCandidates.indexOf(candPlay) === -1) expandedCandidates.push(candPlay);
        }
      }
      backupCandidates = expandedCandidates;
      var anyNeedsPulsera = primaryNeedsPulsera || backupCandidates.some(function (u) { return pulseraRe.test(u); });
      var hdrPromise = anyNeedsPulsera
        ? ensureEpicUserAgent().then(function () {
            return fetchEpicTokenFresh().then(function (tok) {
              var outH = { 'X-Cred': PORTAL_CRED };
              if (tok) outH['X-Pulsera'] = tok;
              return outH;
            });
          })
        : Promise.resolve(null);

      hdrPromise.then(function (extraHdrs) {
        if (liveTicket !== w.__xuperLiveResolveTicket) return;
        var streamHdrs = extraHdrs ? Object.assign({}, extraHdrs) : {};
        var wrappedMap = {};
        // En Tizen 3.0 (WebKit 538.1), epictvparaiphone.top / playlatam.site fallan en TLS SNI/ECDSA;
        // enrutar via HTTP Worker con X-Target-Host y X-Cookie: __Host-pulsera.
        if (false && anyNeedsPulsera && isTizen3Device() && w.XuperRelay && typeof w.XuperRelay.wrapPortalRequest === 'function') {
          var wrapUrlIfNeeded = function (u) {
            if (!u || !pulseraRe.test(u)) return u;
            var hObj = Object.assign({}, streamHdrs);
            if (hObj['X-Pulsera'] && !hObj['X-Cookie']) {
              hObj['X-Cookie'] = '__Host-pulsera=' + hObj['X-Pulsera'];
            }
            var wr = w.XuperRelay.wrapPortalRequest(u, { method: 'GET', headers: hObj });
            if (wr && wr.relayed) {
              wrappedMap[wr.url] = wr.options.headers;
              if (!streamHdrs['X-Target-Host']) {
                Object.assign(streamHdrs, wr.options.headers);
              }
              return wr.url;
            }
            return u;
          };
          primaryDirect = wrapUrlIfNeeded(primaryDirect);
          for (var wi = 0; wi < backupCandidates.length; wi++) {
            backupCandidates[wi] = wrapUrlIfNeeded(backupCandidates[wi]);
          }
          if (Object.keys(wrappedMap).length) {
            extraHdrs = streamHdrs;
          }
        }
        w.__xuperCurrentStreamMeta = {
          url: primaryDirect,
          headers: extraHdrs || {},
          headersByUrl: wrappedMap,
          backupUrls: backupCandidates
        };
        w.__xuperCurrentBackupUrls = backupCandidates;

        // epictvparaiphone.top / playlatam.site requieren header X-Pulsera y desencapsulado PNG en segmentos .image;
        // en Tizen 3.0, AVPlay nativo tambien falla TLS moderno en streams HTTPS .m3u8 mientras WebKit/Hls.js los reproduce en HD.
        var preferHlsOnT3Https = isTizen3Device() && /^https:\/\//i.test(primaryDirect) && /\.m3u8($|\?)/i.test(primaryDirect) && !!(w.Hls && w.Hls.isSupported());
        if (!primaryNeedsPulsera && !preferHlsOnT3Https && w.CactusAVPlay && w.CactusAVPlay.available()) {
          var tryCandidate = function (idx) {
            if (liveTicket !== w.__xuperLiveResolveTicket) return;
            var curUrl = backupCandidates[idx];
            if ((pulseraRe.test(curUrl) || !!wrappedMap[curUrl]) && typeof w.pn === 'function') {
              try { w.CactusAVPlay.stop(); } catch (_) {}
              w.__xuperCurrentStreamMeta.url = curUrl;
              w.__xuperCurrentBackupUrls = backupCandidates.slice(idx);
              w.pn(curUrl);
              return;
            }
            w.__xuperCurrentStreamMeta.url = curUrl;
            var avResolved = false;
            var avFailedHandled = false;
            var handleAvFailure = function (err) {
              if (avFailedHandled || liveTicket !== w.__xuperLiveResolveTicket) return;
              avFailedHandled = true;
              console.warn('[AVPlay live candidate failed]', idx, curUrl, err);
              if (idx + 1 < backupCandidates.length) {
                tryCandidate(idx + 1);
              } else if (avResolved || (err && err.mpeg2Unsupported)) {
                if (w.__onStreamError) {
                  w.__onStreamError(String((err && err.message) || err || 'Señal interrumpida por el servidor del canal'));
                }
              } else if (typeof w.pn === 'function') {
                w.__xuperSkipAvFallbackNext = true;
                w.pn(primaryDirect);
              } else if (w.__onStreamError) {
                w.__onStreamError(String((err && err.message) || err || 'Canal no disponible por el momento'));
              }
            };
            w.CactusAVPlay.start({
              url: curUrl,
              title: params.name || 'Canal en vivo',
              kind: 'live',
              suppressStreamError: true,
              headers: extraHdrs || undefined,
              onError: function (err) {
                if (avResolved) handleAvFailure(err);
              }
            }).then(function () {
              avResolved = true;
              if (liveTicket !== w.__xuperLiveResolveTicket) return;
              console.log('[AVPlay live direct success]', curUrl);
            }).catch(function (err) {
              if (!avResolved) handleAvFailure(err);
            });
          };
          tryCandidate(0);
          return callback(null, { returnValue: true, url: '__cactus_live__', proxyPath: '__cactus_live__', isHls: true, backupUrls: backupCandidates });
        }
        return callback(null, { returnValue: true, url: primaryDirect, proxyPath: primaryDirect, isHls: true, headers: extraHdrs || undefined, backupUrls: backupCandidates });
      });
      return true;
    }

    try {
      if (!w.CactusDirect || !w.CactusDirect.connect) {
        // Fallbacks automáticos sin arrojar excepción
        if (method === 'home') {
          var rFallback = params.root || 'movies';
          return callback(null, { returnValue: true, root: rFallback, items: getBundledHome(rFallback) });
        }
        if (method === 'detail') {
          var bd = getBundledDetail(params.contentId);
          if (bd) return callback(null, { returnValue: true, item: bd.item, episodes: bd.episodes, seasons: bd.seasons });
        }
        if (method === 'liveChannels') {
          return callback(null, { returnValue: true, channels: getBundledChannels() });
        }
        if (method === 'liveCategories') {
          return callback(null, { returnValue: true, categories: buildDefaultLiveCategories(false) });
        }
        return setTimeout(function () {
          callback(new Error('CactusDirect no disponible'), { returnValue: false });
        }, 0);
      }

      w.CactusDirect.connect().then(function (client) {

        function getPosterUrl(node) {
          if (!node) return '';
          var list = node.posterList || [];
          for (var j = 0; j < list.length; j++) {
            if (list[j] && list[j].fileType === 'icon' && list[j].fileUrl) return list[j].fileUrl;
          }
          for (var i = 0; i < list.length; i++) {
            if (list[i] && list[i].fileType === 'poster' && list[i].fileUrl) return list[i].fileUrl;
          }
          for (var k = 0; k < list.length; k++) {
            if (list[k] && list[k].fileUrl) return list[k].fileUrl;
          }
          return node.posterUrl || node.poster || node.fileUrl || node.cover || node.imageUrl || node.landscape || '';
        }

        function getBackdropUrl(node) {
          if (!node) return '';
          var list = node.posterList || [];
          for (var i = 0; i < list.length; i++) {
            if (list[i] && list[i].fileType === 'poster' && list[i].fileUrl) return list[i].fileUrl;
          }
          for (var j = 0; j < list.length; j++) {
            if (list[j] && list[j].fileType === 'stage' && list[j].fileUrl) return list[j].fileUrl;
          }
          return node.backdrop || node.landscape || '';
        }

        if (method === 'home') {
          var rootName = params.root || 'movies';
          var fetchShelf = function(colId, pgSize) {
            if (!client || !client.api || !client.catalog || !w.XuperConfig) return Promise.resolve([]);
            return client.api.call(w.XuperConfig.EP.getShelveData, client.catalog._base({
              columnId: colId,
              columnType: '2',
              pageNum: 1,
              pageSize: pgSize || 40,
              encryptVersion: 0
            })).then(function(r) {
              return (r && r.data && r.data.assetList) || [];
            }).catch(function() { return []; });
          };
          var mapServerNode = function(a, catTag, forceKind) {
            if (!a || !(a.contentId || a.id)) return null;
            var titleStr = a.name || a.title || '';
            if (/er[oó]tic|hentai|18\+/i.test(titleStr)) return null;
            var isSer = forceKind === 'serie' || a.programType === 'teleplay' || a.programType === 'series' || String(a.type) === '0' || (a.volumnCount && parseInt(a.volumnCount, 10) > 1);
            var pUrl = getPosterUrl(a);
            if (!pUrl) return null;
            var bUrl = getBackdropUrl(a) || pUrl;
            var rel = String(a.releaseTime || a.releaseDate || '');
            var yr = rel.slice(0, 4) || (a.year ? String(a.year) : '2026');
            var gArr = a.tags ? (typeof a.tags === 'string' ? a.tags.split(',') : a.tags) : (a.genres || []);
            return {
              id: String(a.contentId || a.id),
              contentId: String(a.contentId || a.id),
              rawType: isSer ? '0' : '1',
              type: isSer ? 'teleplay' : 'movie',
              programType: isSer ? 'teleplay' : 'movie',
              title: titleStr,
              alias: a.alias || '',
              category: catTag,
              score: a.score != null ? String(a.score) : '8.0',
              year: yr,
              releaseDate: rel,
              shelveTime: a.shelveTime || a.updateTime || '',
              duration: a.duration || '',
              genres: gArr,
              director: a.director || '—',
              actors: a.actorDisplay || a.actors || '—',
              synopsis: a.description || a.synopsis || 'Sin sinopsis disponible.',
              kind: isSer ? 'serie' : 'película',
              poster: pUrl,
              landscape: bUrl,
              backdrop: bUrl,
              country: a.originalCountry || a.country || '',
              volumeCount: parseInt(a.volumnCount || a.volumeCount, 10) || 0,
              updateCount: parseInt(a.updateCount, 10) || 0,
              portal: true,
              _portal: true
            };
          };

          var homePromise;
          if (rootName === 'movies' || rootName === 'pelicula') {
            homePromise = Promise.all([fetchShelf(76264, 45), fetchShelf(76263, 45), fetchShelf(79105, 35)]).then(function(lists) {
              var raw = [].concat(lists[0] || [], lists[1] || [], lists[2] || []);
              var out = [];
              for (var i = 0; i < raw.length; i++) {
                var m = mapServerNode(raw[i], 'pelicula', 'película');
                if (m) out.push(m);
              }
              return out;
            });
          } else if (rootName === 'series' || rootName === 'serie') {
            homePromise = Promise.all([fetchShelf(76237, 45), fetchShelf(76235, 45)]).then(function(lists) {
              var raw = [].concat(lists[0] || [], lists[1] || []);
              var out = [];
              for (var i = 0; i < raw.length; i++) {
                var s = mapServerNode(raw[i], 'serie', 'serie');
                if (s) out.push(s);
              }
              return out;
            });
          } else if (rootName === 'featured' || rootName === 'destacado') {
            homePromise = Promise.all([
              fetchShelf(79105, 30),
              fetchShelf(76264, 20),
              fetchShelf(76237, 20),
              client.catalog.getNextColumns('masnew_featured', 1, 15).catch(function(){ return null; })
            ]).then(function(resArr) {
              var raw = [].concat(resArr[0] || [], resArr[1] || [], resArr[2] || []);
              var fCols = (resArr[3] && resArr[3].recommendList) || [];
              for (var c = 0; c < fCols.length; c++) {
                if (fCols[c] && !/tr[aá]iler/i.test(fCols[c].name || '') && fCols[c].assetList) {
                  raw = raw.concat(fCols[c].assetList);
                }
              }
              var out = [];
              for (var i = 0; i < raw.length; i++) {
                var f = mapServerNode(raw[i], 'destacado', null);
                if (f) out.push(f);
              }
              return out;
            });
          } else if (rootName === 'anime') {
            homePromise = Promise.all([fetchShelf(76210, 40), fetchShelf(76209, 40)]).then(function(lists) {
              var raw = [].concat(lists[0] || [], lists[1] || []);
              var out = [];
              for (var i = 0; i < raw.length; i++) {
                var an = mapServerNode(raw[i], 'anime', null);
                if (an) out.push(an);
              }
              return out;
            });
          } else if (rootName === 'kids' || rootName === 'infantil') {
            homePromise = Promise.all([
              client.catalog.getNextColumns('masnew_kids', 1, 20).catch(function(){ return null; }),
              fetchShelf(76794, 40)
            ]).then(function(resArr) {
              var raw = [];
              var kCols = (resArr[0] && resArr[0].recommendList) || [];
              for (var c = 0; c < kCols.length; c++) {
                if (kCols[c] && kCols[c].assetList) raw = raw.concat(kCols[c].assetList);
              }
              raw = raw.concat(resArr[1] || []);
              var out = [];
              for (var i = 0; i < raw.length; i++) {
                var kd = mapServerNode(raw[i], 'infantil', null);
                if (kd) out.push(kd);
              }
              return out;
            });
          } else {
            homePromise = Promise.resolve([]);
          }

          var homeTimeout = new Promise(function(_, reject) {
            setTimeout(function() { reject(new Error('home live timeout')); }, 5000);
          });

          return Promise.race([homePromise, homeTimeout]).then(function(liveItems) {
            var localFallback = getBundledHome(rootName);
            var seen = {}, merged = [];
            for (var i = 0; i < liveItems.length; i++) {
              var lid = String(liveItems[i].id);
              if (!seen[lid]) {
                seen[lid] = true;
                merged.push(liveItems[i]);
              }
            }
            for (var j = 0; j < localFallback.length; j++) {
              var bid = String(localFallback[j].id);
              if (!seen[bid]) {
                seen[bid] = true;
                merged.push(localFallback[j]);
              }
            }
            homeCache[rootName] = merged;
            return callback(null, { returnValue: true, root: rootName, items: merged });
          }).catch(function(err) {
            console.warn('[home live fetch fallback]', rootName, err && err.message);
            var fallback = getBundledHome(rootName);
            return callback(null, { returnValue: true, root: rootName, items: fallback });
          });
        }

        if (method === 'detail') {
          var contentId = params.contentId;
          var reqType = String(params.type != null ? params.type : (params.isSeries ? '0' : (params.rawType != null ? params.rawType : '0')));
          var tryGetDetail = function(t) {
            return client.catalog.getItemData(contentId, t);
          };
          return tryGetDetail(reqType).catch(function () {
            var altType = (reqType === '0') ? '1' : '0';
            return tryGetDetail(altType);
          }).then(function (data) {
            var item = null;
            var episodes = [];
            var seasons = [];
            if (data && data.assetData) {
              var a = data.assetData;
              var pType = String(a.programType || a.type || a.contentType || '').toLowerCase();
              var isMovie = (pType === 'movie' || pType === 'pelicula' || pType === 'película' || pType === '1');
              var isSeries = !isMovie && (pType === 'teleplay' || pType === 'series' || pType === '0' || (a.volumnCount && parseInt(a.volumnCount, 10) > 1) || (a.volumeCount && parseInt(a.volumeCount, 10) > 1) || (a.sameSeasonSeriesList && a.sameSeasonSeriesList.length > 1) || (a.simpleProgramList && a.simpleProgramList.length > 1));
              var posterUrl = getPosterUrl(a);
              var backdropUrl = getBackdropUrl(a) || posterUrl;
              var audioStr = a.audio || a.audioInfo || a.language || a.languages || a.dubLanguage || a.voiceLanguage || '';
              if (!audioStr && (a.movieList || a.simpleProgramList)) {
                var mList = a.movieList || a.simpleProgramList;
                for (var mi = 0; mi < mList.length; mi++) {
                  if (mList[mi] && (mList[mi].audio || mList[mi].audioInfo)) {
                    audioStr = mList[mi].audio || mList[mi].audioInfo;
                    break;
                  }
                }
              }
              if (!audioStr && /bra[sz]il|portug/i.test((a.originalCountry || a.country || '') + ' ' + (a.name || a.title || ''))) {
                audioStr = 'Portugués';
              }
              if (audioStr) {
                itemAudioCache[String(contentId)] = audioStr;
              }
              var extractedSubs = (w.CactusTracks ? w.CactusTracks.collect(a) : (a.subtitles || [])) || [];
              if (extractedSubs.length) {
                itemSubtitleCache[String(contentId)] = extractedSubs;
              }
              item = {
                id: String(a.contentId),
                contentId: String(a.contentId),
                title: a.name || a.title || '',
                score: a.score || '—',
                year: a.releaseTime ? a.releaseTime.slice(0, 4) : '—',
                duration: a.duration || '',
                genres: a.tags ? (typeof a.tags === 'string' ? a.tags.split(',') : a.tags) : (a.genres || []),
                director: a.director || '',
                actors: a.actorDisplay || a.actors || '',
                synopsis: a.description || a.synopsis || '',
                poster: posterUrl,
                landscape: backdropUrl,
                backdrop: backdropUrl,
                type: isSeries ? 'teleplay' : 'movie',
                kind: isSeries ? 'serie' : 'película',
                rawType: isSeries ? '0' : '1',
                alias: a.alias || '',
                country: a.originalCountry || a.country || '',
                releaseDate: a.releaseTime || a.releaseDate || '',
                audio: audioStr || '',
                subtitles: extractedSubs,
                portal: true,
                _portal: true
              };

              if (isSeries) {
                var progList = a.simpleProgramList || a.itemList || [];
                for (var e = 0; e < progList.length; e++) {
                  var ep = progList[e];
                  episodes.push({
                    id: String(ep.contentId || ep.id),
                    title: ep.name || ep.title || ('Capítulo ' + (e + 1)),
                    name: ep.name || ep.title || ('Capítulo ' + (e + 1)),
                    number: ep.seriesNumber || ep.number || (e + 1),
                    duration: ep.duration || '',
                    quality: ep.quality || 'HD',
                    description: ep.description || ep.synopsis || ''
                  });
                }

                var ssList = a.sameSeasonSeriesList || [];
                for (var s = 0; s < ssList.length; s++) {
                  seasons.push({
                    id: String(ssList[s].contentId),
                    number: ssList[s].seasonNumber || (s + 1)
                  });
                }
              }
            }
            callback(null, { returnValue: true, item: item, episodes: episodes, seasons: seasons });
          }).catch(function (err) {
            console.warn('[detail error, using bundled]', err);
            var bd = getBundledDetail(contentId);
            if (bd) return callback(null, { returnValue: true, item: bd.item, episodes: bd.episodes, seasons: bd.seasons });
            callback(err, { returnValue: false, errorText: String(err && err.message || err) });
          });
        }

        if (method === 'search') {
          var query = params.value || '';
          var normBridge = function(s) {
            if (!s) return '';
            try {
              return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ñ/g, 'n').trim();
            } catch(e) { return String(s).toLowerCase().trim(); }
          };
          var stripBridge = function(s) {
            return normBridge(s).replace(/[^a-z0-9]/g, '');
          };
          var scoreBridgeItem = function(it, qNorm, qStrip) {
            var tN = normBridge(it.title || it.name || '');
            var tStrip = stripBridge(it.title || it.name || '');
            var aN = normBridge(it.alias || '');
            var aStrip = stripBridge(it.alias || '');
            var s = 0;
            if (tN === qNorm || (qStrip.length > 1 && tStrip === qStrip)) s += 10000;
            else if (tN.indexOf(qNorm) === 0 || (qStrip.length > 1 && tStrip.indexOf(qStrip) === 0)) s += 5000;
            else if (tN.indexOf(qNorm) !== -1 || (qStrip.length > 1 && tStrip.indexOf(qStrip) !== -1)) s += 2500;
            else if (aN.indexOf(qNorm) !== -1 || (qStrip.length > 1 && aStrip.indexOf(qStrip) !== -1)) s += 1500;
            else {
              var full = tN + ' ' + aN + ' ' + normBridge(it.actors || '') + ' ' + normBridge(it.director || '') + ' ' + normBridge(it.synopsis || '');
              if (full.indexOf(qNorm) !== -1) s += 500;
            }
            if (it._portal || it.portal) s += 300;
            return s;
          };

          var searchLocalPool = function(q) {
            var nq = normBridge(q);
            var sq = stripBridge(q);
            if (!nq && !sq) return [];
            var pool = ((w.XUPERTV_PORTAL && w.XUPERTV_PORTAL.items) || []).concat((w.XUPERTV_CATALOG && w.XUPERTV_CATALOG.items) || []);
            var matches = [], seen = {};
            for (var k = 0; k < pool.length; k++) {
              var it = pool[k];
              if (!it) continue;
              var cid = String(it.id || k);
              var sc = scoreBridgeItem(it, nq, sq);
              if (sc > 0 && !seen[cid]) {
                seen[cid] = true;
                matches.push({ item: it, score: sc });
              }
            }
            matches.sort(function(a, b) { return b.score - a.score; });
            return matches.map(function(m) { return m.item; });
          };

          var extractFromApi = function(obj) {
            var res = [], seenMap = {};
            var walk = function(node) {
              if (!node || typeof node !== 'object') return;
              if (node.contentId || (node.id && (node.title || node.name))) {
                var id = String(node.contentId || node.id);
                if (!seenMap[id]) {
                  seenMap[id] = true;
                  var isSeries = (node.programType === 'teleplay' || node.programType === 'series' || String(node.type) === '0' || (node.volumnCount && parseInt(node.volumnCount, 10) > 1));
                  var pUrl = getPosterUrl(node);
                  var bUrl = getBackdropUrl(node) || pUrl;
                  res.push({
                    id: id,
                    contentId: id,
                    title: node.name || node.title || '',
                    score: node.score || '—',
                    year: node.releaseTime ? String(node.releaseTime).slice(0, 4) : (node.year || '—'),
                    poster: pUrl,
                    landscape: bUrl,
                    backdrop: bUrl,
                    type: isSeries ? 'teleplay' : 'movie',
                    kind: isSeries ? 'serie' : 'película',
                    programType: isSeries ? 'teleplay' : 'movie',
                    rawType: isSeries ? '0' : '1',
                    genres: node.tags ? (typeof node.tags === 'string' ? node.tags.split(',') : node.tags) : (node.genres || []),
                    director: node.director || '',
                    actors: node.actorDisplay || node.actors || '',
                    synopsis: node.description || node.synopsis || node.programUpdateContent || '',
                    portal: true,
                    _portal: true
                  });
                }
                return;
              }
              for (var key in node) {
                if (Object.prototype.hasOwnProperty.call(node, key)) {
                  walk(node[key]);
                }
              }
            }
            walk(obj);
            return res;
          }

          return client.catalog.search(query, 1, 50, '4').then(function (data) {
            var apiItems = extractFromApi(data);
            var qNorm = normBridge(query), qStrip = stripBridge(query);
            var localItems = searchLocalPool(query);
            var seen = {}, merged = [];
            apiItems.sort(function(a, b) {
              return scoreBridgeItem(b, qNorm, qStrip) - scoreBridgeItem(a, qNorm, qStrip);
            });
            for (var a = 0; a < apiItems.length; a++) {
              seen[String(apiItems[a].id)] = true;
              merged.push(apiItems[a]);
            }
            for (var b = 0; b < localItems.length; b++) {
              if (!seen[String(localItems[b].id)]) {
                seen[String(localItems[b].id)] = true;
                merged.push(localItems[b]);
              }
            }
            merged.sort(function(a, b) {
              return scoreBridgeItem(b, qNorm, qStrip) - scoreBridgeItem(a, qNorm, qStrip);
            });
            callback(null, { returnValue: true, items: merged, total: merged.length });
          }).catch(function (err) {
            console.warn('[search API error, using local search pool]', err);
            var localItems = searchLocalPool(query);
            callback(null, { returnValue: true, items: localItems, total: localItems.length });
          });
        }

        if (method === 'liveChannels') {
          var colId = params.columnId || 76182;
          if (colId === 'espn' || colId === 'ESPN' || params.isEspn) {
            return fetchUnifiedEspnChannels().then(function (channels) {
              callback(null, { returnValue: true, channels: channels });
            }).catch(function () {
              var espnList = (w.__ESPN_CHANNELS && w.__ESPN_CHANNELS.length) ? w.__ESPN_CHANNELS.slice() : [];
              callback(null, { returnValue: true, channels: espnList });
            });
          }
          if (colId === 'favorites') {
            var favList = [];
            try {
              var raw = (typeof localStorage !== 'undefined') ? localStorage.getItem('xuper_favorite_channels') : null;
              var favCodes = raw ? JSON.parse(raw) : [];
              if (Array.isArray(favCodes) && favCodes.length > 0) {
                var pool = (liveChannelsCache[76182] && liveChannelsCache[76182].length) ? liveChannelsCache[76182] : getBundledChannels();
                for (var f = 0; f < pool.length; f++) {
                  var pch = pool[f];
                  if (favCodes.indexOf(pch.channelCode || pch.name) !== -1 || pch.fav) {
                    favList.push(pch);
                  }
                }
              }
            } catch(e) {}
            return setTimeout(function() {
              callback(null, { returnValue: true, channels: favList });
            }, 0);
          }
          if (Number(colId) === 76208) {
            return setTimeout(function() {
              callback(null, { returnValue: true, channels: [] });
            }, 0);
          }
          var nowMs = Date.now();
          if (liveChannelsCache[colId] && liveChannelsCache[colId].length && (nowMs - (liveChannelsCacheTs[colId] || 0)) < CHANNEL_CACHE_TTL) {
            return setTimeout(function() {
              callback(null, { returnValue: true, channels: liveChannelsCache[colId] });
            }, 0);
          }
          if (client && client.live) {
            var timeoutPromise = new Promise(function(_, reject) {
              setTimeout(function() { reject(new Error('liveChannels fetch timeout')); }, 3000);
            });
            return Promise.race([
              client.live.getLiveData({ columnId: colId, pageSize: 3000 }),
              timeoutPromise
            ]).then(function (res) {
              var list = res && res.channelList || [];
              var chs = [];
              var masByFam = {};
              for (var i = 0; i < list.length; i++) {
                var c = list[i];
                if (!c || isAdultChannel(c) || !Array.isArray(c.liveAddressList) || !c.liveAddressList.length) continue;
                channelCache[c.channelCode] = c;
                var cHasLic = isLicenseValid(c.liveAddressList);
                var chObj = {
                  channelCode: c.channelCode,
                  index: c.channelNumber || (chs.length + 1),
                  name: c.name,
                  logo: c.posterUrl || (c.posterList && c.posterList[0] && c.posterList[0].fileUrl) || '',
                  uhd: /fhd|uhd|4k/i.test(c.name || ''),
                  fav: false,
                  now: 'En vivo',
                  next: '',
                  time: '',
                  liveAddressList: c.liveAddressList,
                  _hasValidLic: cHasLic
                };
                var cFam = normalizeMenuFamilyKey(c.name || '');
                if (cFam && masByFam[cFam]) {
                  var prevMas = masByFam[cFam];
                  if (!prevMas._hasValidLic && cHasLic) {
                    var prevIdx = chs.indexOf(prevMas);
                    if (prevIdx !== -1) chs[prevIdx] = chObj;
                    masByFam[cFam] = chObj;
                  } else if (Array.isArray(c.liveAddressList)) {
                    prevMas.liveAddressList = prevMas.liveAddressList.concat(c.liveAddressList);
                  }
                  continue;
                }
                if (cFam) masByFam[cFam] = chObj;
                chs.push(chObj);
              }
              var mergeUnifiedExtras = function (baseList, extraGroups) {
                var byFam = {};
                var outList = baseList.slice();
                for (var bi = 0; bi < outList.length; bi++) {
                  var bCh = outList[bi];
                  var bFam = normalizeMenuFamilyKey(bCh.name || '');
                  if (bFam && !byFam[bFam]) byFam[bFam] = bCh;
                }
                for (var gi = 0; gi < extraGroups.length; gi++) {
                  var grp = Array.isArray(extraGroups[gi]) ? extraGroups[gi] : [];
                  for (var ei = 0; ei < grp.length; ei++) {
                    var ech = grp[ei];
                    if (!ech || !ech.name) continue;
                    var eFam = normalizeMenuFamilyKey(ech.name);
                    var existing = eFam && byFam[eFam];
                    if (existing) {
                      var eUrl = ech.streamUrl || ech.url || '';
                      if (eUrl && /^https?:\/\//i.test(eUrl)) {
                        existing.backupUrls = Array.isArray(existing.backupUrls) ? existing.backupUrls : [];
                        if (!existing._hasValidLic && !existing.streamUrl) {
                          existing.streamUrl = eUrl;
                          existing.url = eUrl;
                        } else if (existing.backupUrls.indexOf(eUrl) === -1) {
                          existing.backupUrls.push(eUrl);
                        }
                        if (Array.isArray(ech.backupUrls)) {
                          for (var ebi = 0; ebi < ech.backupUrls.length; ebi++) {
                            var ebUrl = ech.backupUrls[ebi];
                            if (ebUrl && /^https?:\/\//i.test(ebUrl) && existing.backupUrls.indexOf(ebUrl) === -1 && ebUrl !== existing.streamUrl) {
                              existing.backupUrls.push(ebUrl);
                            }
                          }
                        }
                      }
                      continue;
                    }
                    if (eFam) byFam[eFam] = ech;
                    outList.push(ech);
                  }
                }
                return outList;
              };
              if (chs.length > 0) {
                var cidNum = Number(colId);
                var countryPair = COUNTRY_S1_PAIR_MAP[cidNum] && COUNTRY_S1_PAIR_MAP[cidNum][0];
                var extraPromise = null;
                if (cidNum === 76182) {
                  extraPromise = Promise.all([
                    fetchUnifiedEspnChannels().catch(function () { return []; }),
                    fetchEpicSportsChannels().catch(function () { return []; }),
                    fetchPortalCategoryChannels().catch(function () { return []; }),
                    fetchEpic247Channels().catch(function () { return []; })
                  ]);
                } else if (cidNum === 76206) {
                  extraPromise = Promise.all([
                    fetchEpicSportsChannels().catch(function () { return []; }),
                    fetchPortalCanales().then(function (rows) {
                      var sp = [];
                      for (var ri = 0; ri < (rows || []).length; ri++) {
                        if (rows[ri] && rows[ri].isSports) sp.push(rows[ri]);
                      }
                      var b = {}, o = [], s = {};
                      appendCatalogRowsToBucket(sp, b, o, s, isTizen3Device());
                      return finalizeBucketItems(b, o, 'portal-sp-', 0);
                    }).catch(function () { return []; })
                  ]);
                } else if (countryPair || params.countryFolder || params.m3uUrl || params.m3uUrls) {
                  var cFolder = params.countryFolder || (countryPair && countryPair.countryFolder) || '';
                  var cM3u = params.m3uUrl || (countryPair && countryPair.m3uUrl) || '';
                  var cM3us = params.m3uUrls || (countryPair && countryPair.m3uUrls) || null;
                  extraPromise = fetchCountryS1Channels(String(colId), cM3u, cFolder, cM3us).then(function (arr) { return [arr]; }).catch(function () { return []; });
                }
                var finalizeLiveResult = function (finalChs) {
                  liveChannelsCache[colId] = finalChs;
                  liveChannelsCacheTs[colId] = Date.now();
                  if (cidNum === 76182) {
                    channelCacheTs = Date.now();
                  }
                  return callback(null, { returnValue: true, channels: finalChs });
                };
                if (extraPromise) {
                  return extraPromise.then(function (groups) {
                    return finalizeLiveResult(mergeUnifiedExtras(chs, groups));
                  });
                }
                return finalizeLiveResult(chs);
              }
              var fallback = (liveChannelsCache[76182] && liveChannelsCache[76182].length) ? liveChannelsCache[76182] : getBundledChannels();
              return callback(null, { returnValue: true, channels: fallback });
            }).catch(function (err) {
              console.warn('[liveChannels category fetch error, using fallback]', err);
              var fallback = (liveChannelsCache[76182] && liveChannelsCache[76182].length) ? liveChannelsCache[76182] : getBundledChannels();
              return callback(null, { returnValue: true, channels: fallback });
            });
          }
          var fallbackChs = (liveChannelsCache[colId] && liveChannelsCache[colId].length) ? liveChannelsCache[colId] : getBundledChannels();
          return setTimeout(function() {
            callback(null, { returnValue: true, channels: fallbackChs });
          }, 0);
        }

        if (method === 'liveCategories') {
          return client.catalog.getNextColumns('masnew_live', 1, 50).then(function (r) {
            var rec = r && r.recommendList || [];
            var categories = rec.length ? buildPairedLiveCategories(rec) : buildDefaultLiveCategories(true);
            callback(null, { returnValue: true, categories: categories });
          }).catch(function (err) {
            console.warn('[liveCategories error, using default]', err);
            callback(null, { returnValue: true, categories: buildDefaultLiveCategories(true) });
          });
        }

        if (method === 'filterOptions') {
          var rootCol = (params && (params.root || params.columnCode)) || 'movies';
          return client.catalog.filterOptions(rootCol).then(function (res) {
            callback(null, { returnValue: true, data: res });
          }).catch(function (err) {
            console.warn('[filterOptions error]', err);
            callback(null, { returnValue: false, errorText: String(err && err.message || err) });
          });
        }

        if (method === 'filterContent') {
          var rootCol2 = (params && (params.root || params.columnCode)) || 'movies';
          return client.catalog.filterContent(rootCol2, params || {}).then(function (res) {
            var items = extractFromApi(res);
            callback(null, { returnValue: true, items: items, total: items.length });
          }).catch(function (err) {
            console.warn('[filterContent error]', err);
            callback(null, { returnValue: false, errorText: String(err && err.message || err) });
          });
        }

        if (method === 'resolve' || method === 'resolveSmooth') {
          var isSeries = String(params.type) === '0';
          var sId = params.contentId;
          var item = {
            contentId: sId,
            type: isSeries ? '0' : '1',
            episode: isSeries ? (Number(params.episode) || 1) : 1
          };
          if (isSeries) {
            item.seriesContentId = params.seriesContentId || sId;
            item.columnId = params.columnId || 76178;
          }
          return w.CactusDirect.http('play', [item]).then(function (res) {
            return res.json().then(function (json) {
              var data = json && json.data;
              if (!data) {
                return callback(new Error(json && json.error || 'No se pudo resolver el enlace de reproducción'), { returnValue: false });
              }
              var rSubs = data.subtitles || [];
              if (rSubs.length) {
                itemSubtitleCache[String(sId)] = rSubs;
                if (isSeries && params.seriesContentId) itemSubtitleCache[String(params.seriesContentId)] = rSubs;
              }
              var startPos = params.startTime || params.resume || (w.__resumeStartTime || 0);
              if (data.engine === 'cactus-vod-ts' && w.CactusVODBrowser) {
                w.CactusVODBrowser.start(data, {
                  title: params.title || 'Reproducción',
                  resume: startPos,
                  startTime: startPos,
                  subtitles: data.subtitles || []
                }).then(function() {
                  console.log('[CactusVODBrowser] Started successfully');
                }).catch(function (err) {
                  var errStr = String(err && err.message || err || '');
                  if (!/cancelad/i.test(errStr)) {
                    console.error('[CactusVODBrowser error]', err);
                    if (w.__onStreamError) w.__onStreamError(errStr);
                  }
                });
                return callback(null, {
                  returnValue: true,
                  proxyPath: '__cactus_vod__',
                  url: '__cactus_vod__',
                  mime: 'application/vnd.apple.mpegurl',
                  duration: data.duration || 0,
                  subtitles: data.subtitles || [],
                  isHls: true,
                  data: data
                });
              }
              var streamUrl = data.url || '';
              if (w.CactusAVPlay && w.CactusAVPlay.available() && streamUrl) {
                w.CactusAVPlay.start({
                  url: streamUrl,
                  headers: data.headers || null,
                  title: params.title || 'Reproducción',
                  kind: 'vod',
                  subtitles: data.subtitles || [],
                  startTime: startPos,
                  resume: startPos
                }).catch(function(err){
                  console.error('[CactusAVPlay error]', err);
                  var errStr = String(err && err.message || err || '');
                  if (!/cancelad/i.test(errStr) && w.__onStreamError) w.__onStreamError(errStr);
                });
                return callback(null, {
                  returnValue: true,
                  proxyPath: '__cactus_avplay__',
                  url: '__cactus_avplay__',
                  mime: 'video/mp4',
                  duration: data.duration || 0,
                  subtitles: data.subtitles || []
                });
              }
              callback(null, {
                returnValue: true,
                proxyPath: streamUrl,
                url: streamUrl,
                mime: 'video/mp4',
                duration: data.duration || 0,
                subtitles: data.subtitles || [],
                isHls: streamUrl.indexOf('.m3u8') !== -1,
                data: data
              });
            });
          }).catch(function (err) {
            console.error('[resolve error]', err);
            callback(err, { returnValue: false, errorText: String(err && err.message || err) });
          });
        }

        if (method === 'resolveLive') {
          var directStream = params.streamUrl || params.url || '';
          if (directStream && /^https?:\/\//i.test(directStream)) {
            if (w.CactusAVPlay && w.CactusAVPlay.available()) {
              var directResolved = false, directFailHandled = false;
              var handleDirectFail = function(err){
                if (directFailHandled) return;
                directFailHandled = true;
                console.warn('[AVPlay live direct error, falling back to Hls.js]', err);
                if (directResolved || (err && err.mpeg2Unsupported)) {
                  if (w.__onStreamError) w.__onStreamError(String((err && err.message) || err || 'Señal interrumpida por el servidor del canal'));
                } else if (typeof w.pn === 'function') {
                  w.__xuperSkipAvFallbackNext = true;
                  w.pn(directStream);
                } else if (w.__onStreamError) {
                  w.__onStreamError(String((err && err.message) || err || 'Canal no disponible por el momento'));
                }
              };
              w.CactusAVPlay.start({
                url: directStream,
                title: params.name || 'Canal en vivo',
                kind: 'live',
                suppressStreamError: true,
                onError: function(err){ if (directResolved) handleDirectFail(err); }
              }).then(function(){
                directResolved = true;
                console.log('[AVPlay live direct success]');
              }).catch(function(err){
                if (!directResolved) handleDirectFail(err);
              });
              return callback(null, { returnValue: true, url: '__cactus_live__', proxyPath: '__cactus_live__', isHls: true });
            }
            return callback(null, { returnValue: true, url: directStream, proxyPath: directStream, isHls: true });
          }
          var tuneWithItem = function(chItem) {
            var addrList = Array.isArray(chItem.liveAddressList) ? chItem.liveAddressList : [];
            function tryAddressVariant(addrIdx) {
              var variantItem = addrList.length > 1
                ? Object.assign({}, chItem, { liveAddressList: [addrList[addrIdx]].concat(addrList.filter(function(_, x) { return x !== addrIdx; })) })
                : chItem;
              return w.CactusDirect.http('play', [variantItem]).then(function (res) {
                return res.json().then(function (json) {
                  var data = json && json.data;
                  if (data && data.engine === 'cactus-live-15' && w.CactusAVPlay) {
                    w.CactusAVPlay.start({
                      kind: 'live',
                      engine: 'cactus-live-15',
                      title: variantItem.name,
                      item: variantItem
                    }).then(function() {
                      console.log('[CactusLiveTV] Playing channel successfully');
                    }).catch(function (err) {
                      console.error('[CactusAVPlay live error]', err);
                      if (addrIdx + 1 < addrList.length) {
                        tryAddressVariant(addrIdx + 1);
                      } else if (w.__onStreamError) {
                        w.__onStreamError(String(err && err.message || err));
                      }
                    });
                    return callback(null, {
                      returnValue: true,
                      url: '__cactus_live__',
                      proxyPath: '__cactus_live__',
                      isHls: true
                    });
                  }
                  var directUrl = data && data.url;
                  if (directUrl) {
                    if (w.CactusAVPlay && w.CactusAVPlay.available()) {
                      w.CactusAVPlay.start({
                        url: directUrl,
                        title: variantItem.name,
                        kind: 'live'
                      }).catch(function(err){
                        console.error('[AVPlay live]', err);
                        if (addrIdx + 1 < addrList.length) tryAddressVariant(addrIdx + 1);
                      });
                      return callback(null, { returnValue: true, url: '__cactus_live__', proxyPath: '__cactus_live__', isHls: true });
                    }
                    return callback(null, { returnValue: true, url: directUrl, proxyPath: directUrl, isHls: true });
                  }
                  if (addrIdx + 1 < addrList.length) {
                    return tryAddressVariant(addrIdx + 1);
                  }
                  callback(new Error(json && json.error || 'No se pudo sintonizar el canal'), { returnValue: false });
                });
              }).catch(function (err) {
                if (addrIdx + 1 < addrList.length) return tryAddressVariant(addrIdx + 1);
                throw err;
              });
            }
            return tryAddressVariant(0);
          };

          var isCacheFresh = channelCacheTs > 0 && (Date.now() - channelCacheTs) < CHANNEL_CACHE_TTL;
          var cached = channelCache[params.channelCode] || {};
          var fastList = (isCacheFresh && isLicenseValid(cached.liveAddressList))
            ? cached.liveAddressList
            : ((params.liveAddressList && params.liveAddressList.length && params.liveAddressList[0].license && isLicenseValid(params.liveAddressList))
                ? params.liveAddressList
                : (isLicenseValid(cached.liveAddressList) ? cached.liveAddressList : null));

          var tryExternalBackupFallback = function () {
            var bUrls = [];
            if (Array.isArray(params.backupUrls)) {
              for (var bi = 0; bi < params.backupUrls.length; bi++) {
                var bu = String(params.backupUrls[bi] || '').trim();
                if (/^https?:\/\//i.test(bu) && bUrls.indexOf(bu) === -1) bUrls.push(bu);
              }
            }
            if (!bUrls.length && params.name) {
              var famTarget = normalizeMenuFamilyKey(params.name);
              var extraLists = [w.__EPIC_SPORTS_CHANNELS, w.__xePortalCache];
              for (var eli = 0; eli < extraLists.length; eli++) {
                var elArr = extraLists[eli];
                if (!Array.isArray(elArr)) continue;
                for (var ei2 = 0; ei2 < elArr.length; ei2++) {
                  var ec = elArr[ei2];
                  if (ec && famTarget && normalizeMenuFamilyKey(ec.name || '') === famTarget) {
                    var eu = String(ec.streamUrl || ec.url || '').trim();
                    if (/^https?:\/\//i.test(eu) && bUrls.indexOf(eu) === -1) bUrls.push(eu);
                  }
                }
              }
            }
            if (bUrls.length) {
              return serviceCall('resolveLive', {
                channelCode: params.channelCode || 'backup-live',
                name: params.name || 'Canal en vivo',
                streamUrl: bUrls[0],
                backupUrls: bUrls.slice(1)
              }, callback);
            }
            return false;
          };

          if (fastList && fastList.length && fastList[0].license) {
            return tuneWithItem({
              channelCode: params.channelCode,
              name: params.name || cached.name || 'Canal en vivo',
              liveAddressList: fastList
            }).catch(function (err) {
              console.warn('[resolveLive fastList tune failed, attempting refreshMasterChannelCache]', err);
              return refreshMasterChannelCache(client, true).then(function() {
                var fresh = channelCache[params.channelCode];
                var freshList = (fresh && isLicenseValid(fresh.liveAddressList)) ? fresh.liveAddressList : null;
                if (freshList && freshList.length) {
                  return tuneWithItem({
                    channelCode: params.channelCode,
                    name: params.name || (fresh && fresh.name) || 'Canal en vivo',
                    liveAddressList: freshList
                  });
                }
                throw err;
              }).catch(function (err2) {
                if (tryExternalBackupFallback()) return;
                console.error('[resolveLive error]', err2);
                callback(err2, { returnValue: false, errorText: String(err2 && err2.message || err2) });
              });
            });
          }

          return refreshMasterChannelCache(client, !isCacheFresh).then(function () {
            var fresh = channelCache[params.channelCode];
            var fallbackList = (fresh && isLicenseValid(fresh.liveAddressList))
              ? fresh.liveAddressList
              : (isLicenseValid(params.liveAddressList) ? params.liveAddressList : ((fresh && fresh.liveAddressList) || params.liveAddressList || []));
            if (fallbackList && fallbackList.length) {
              return tuneWithItem({
                channelCode: params.channelCode,
                name: params.name || (fresh && fresh.name) || 'Canal en vivo',
                liveAddressList: fallbackList
              });
            }
            throw new Error('Canal sin licencia de emisión disponible');
          }).catch(function (err) {
            var fallback = isLicenseValid(params.liveAddressList) ? params.liveAddressList : (cached.liveAddressList || []);
            if (fallback && fallback.length) {
              return tuneWithItem({
                channelCode: params.channelCode,
                name: params.name || cached.name || 'Canal en vivo',
                liveAddressList: fallback
              }).catch(function (err2) {
                if (tryExternalBackupFallback()) return;
                callback(err2, { returnValue: false, errorText: String(err2 && err2.message || err2) });
              });
            }
            if (tryExternalBackupFallback()) return;
            console.error('[resolveLive error after refresh]', err);
            callback(err, { returnValue: false, errorText: String(err && err.message || err) });
          });
        }

        callback(new Error('Método desconocido: ' + method), { returnValue: false });
      }).catch(function (err) {
        console.warn('[CactusDirect.connect rejected, using local fallback]', method, err);
        if (method === 'home') {
          return callback(null, { returnValue: true, root: params.root || 'movies', items: getBundledHome(params.root || 'movies') });
        }
        if (method === 'liveChannels') {
          return callback(null, { returnValue: true, channels: getBundledChannels() });
        }
        if (method === 'liveCategories') {
          return callback(null, { returnValue: true, categories: buildDefaultLiveCategories(false) });
        }
        callback(err, { returnValue: false, errorText: String(err && err.message || err) });
      });
    } catch (syncErr) {
      console.error('[Tizen Bridge Sync Error]', method, syncErr);
      if (method === 'home') {
        return callback(null, { returnValue: true, root: params.root || 'movies', items: getBundledHome(params.root || 'movies') });
      }
      if (method === 'liveChannels') {
        return callback(null, { returnValue: true, channels: getBundledChannels() });
      }
      if (method === 'liveCategories') {
        return callback(null, { returnValue: true, categories: [{ id: 76182, name: 'Todos' }] });
      }
      callback(syncErr, { returnValue: false, errorText: String(syncErr && syncErr.message || syncErr) });
    }
    return true;
  }

  // Exportar el puente como mock de webOS.service para máxima compatibilidad con el controlador
  w.webOS = w.webOS || {};
  w.webOS.service = {
    request: function (uri, opts) {
      opts = opts || {};
      var method = opts.method;
      var params = opts.parameters;
      serviceCall(method, params, function (err, res) {
        if (err || (res && res.returnValue === false)) {
          if (opts.onFailure) opts.onFailure(err || res);
        } else {
          if (opts.onSuccess) opts.onSuccess(res);
        }
      });
      return { cancel: function () {} };
    }
  };

  w.XuperTizenBridge = {
    call: serviceCall,
    fitResolution: fitResolution,
    clearCaches: function() { clearAllCaches(true); }
  };

})(window, document);
