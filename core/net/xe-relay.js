/* Xuper Eclectic - Centralized Cloudflare Relay Helper (Tizen 3.0 - 10.0 ES5) */
(function (root) {
  "use strict";
  var isNode = typeof require === "function";
  var cfg = isNode ? require("./xe-env.js") : (root.XuperConfig || {});
  var _clockOffsetMs = 0;
  var _portalBlocked = false;
  var _blockedImgHosts = Object.create(null);
  var _blockedStreamHosts = Object.create(null);

  function extractHost(rawUrl) {
    var m = /^https?:\/\/([^\/:?#]+)/i.exec(String(rawUrl || ""));
    return m ? m[1].toLowerCase() : "";
  }

  function isPortalBlocked() { return _portalBlocked; }
  function markPortalBlocked() { _portalBlocked = true; }

  function isImgHostBlocked(rawUrl) {
    var h = extractHost(rawUrl);
    return !!(h && _blockedImgHosts[h]);
  }
  function markImgHostBlocked(rawUrl) {
    var h = extractHost(rawUrl);
    if (h) _blockedImgHosts[h] = true;
  }

  function isStreamHostBlocked(rawUrl) {
    var h = extractHost(rawUrl);
    return !!(h && _blockedStreamHosts[h]);
  }
  function markStreamHostBlocked(rawUrl) {
    var h = extractHost(rawUrl);
    if (h) _blockedStreamHosts[h] = true;
  }

  function md5Hex(input) {
    if (isNode) {
      return require("crypto").createHash("md5").update(String(input)).digest("hex");
    }
    if (root.CryptoJS && root.CryptoJS.MD5) {
      return root.CryptoJS.MD5(String(input)).toString();
    }
    return "";
  }

  function trimSlash(u) {
    return String(u || "").replace(/\/+$/, "");
  }

  function isTizen3Browser() {
    var ua = root.__xeOrigUserAgent || (typeof navigator !== "undefined" ? (navigator.userAgent || "") : "");
    return /Tizen\s*3\.|AppleWebKit\/538/i.test(ua);
  }

  var TIZEN3_RELAY_URL = "http://tizen3-stream-relay.eclecticempire03.workers.dev";
  var TIZEN3_RELAY_SALT = "Xup3r_T3_R3l4y_#2026_Pr1v";

  function relayBase() {
    if (!cfg || cfg.RELAY_ENABLED === false) return "";
    if (isTizen3Browser()) {
      return TIZEN3_RELAY_URL;
    }
    var base = trimSlash(cfg.RELAY_URL || "");
    return base;
  }

  function relaySalt() {
    if (isTizen3Browser()) return TIZEN3_RELAY_SALT;
    return (cfg && cfg.RELAY_SALT) || "";
  }

  function isLocalOrRelay(rawUrl) {
    var s = String(rawUrl || "");
    if (!/^https?:\/\//i.test(s)) return true;
    var base = relayBase();
    if (base && s.replace(/^https?:\/\//i, "").indexOf(base.replace(/^https?:\/\//i, "")) === 0) return true;
    return /^https?:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2)(:|\/|$)/i.test(s);
  }

  function getDuid(device) {
    if (device && device.sn) return String(device.sn);
    try {
      if (typeof localStorage !== "undefined") {
        var p = "cactus.samsung.v101.device.";
        var v = localStorage.getItem(p + "xuper.sn") || localStorage.getItem(p + "xuper.installationId") || localStorage.getItem("xuper.sn") || localStorage.getItem("xuper.installationId");
        if (v) return String(v);
      }
    } catch (_) {}
    return "tizen-tv-guest";
  }

  function parseHostAndPath(rawUrl) {
    var m = /^https?:\/\/([^\/?#]+)(\/[^?#]*)?(\?[^#]*)?/i.exec(String(rawUrl || ""));
    if (!m) return null;
    return {
      host: m[1].split(":")[0],
      authority: m[1],
      path: m[2] || "/",
      search: m[3] || ""
    };
  }

  function cleanClientHeaders(hdrs) {
    var out = {};
    if (!hdrs) return out;
    var k;
    for (k in hdrs) {
      if (!Object.prototype.hasOwnProperty.call(hdrs, k)) continue;
      if (/^(user-agent|connection|accept-encoding|host|content-length)$/i.test(k)) continue;
      out[k] = hdrs[k];
    }
    return out;
  }

  function nowSynced() {
    return Math.round(Date.now() + _clockOffsetMs);
  }

  function syncClockFromHeaders(headers) {
    if (!headers || typeof headers.get !== "function") return;
    var st = headers.get("x-server-time") || headers.get("X-Server-Time");
    if (!st) return;
    var serverMs = Number(st);
    if (!isFinite(serverMs) || serverMs < 1500000000000) return;
    var diff = serverMs - Date.now();
    if (Math.abs(diff) > 10000) {
      _clockOffsetMs = diff;
    } else if (Math.abs(_clockOffsetMs) > 0 && Math.abs(diff) <= 5000) {
      _clockOffsetMs = 0;
    }
  }

  function syncClock(fetchFn) {
    var base = relayBase();
    if (!base || typeof fetchFn !== "function") return Promise.resolve(false);
    return fetchFn(base + "/time", { method: "GET", cache: "no-store" }).then(function (res) {
      syncClockFromHeaders(res && res.headers);
      if (res && typeof res.text === "function") {
        return res.text().then(function (txt) {
          try {
            var j = JSON.parse(txt);
            if (j && j.serverTime) {
              var s = Number(j.serverTime);
              if (isFinite(s) && s > 1500000000000) _clockOffsetMs = s - Date.now();
            }
          } catch (_) {}
          return true;
        });
      }
      return true;
    }).catch(function () { return false; });
  }

  function buildSigHeaders(host, device) {
    var ts = String(nowSynced());
    var duid = getDuid(device);
    var sig = md5Hex("eclex:" + ts + ":" + host + ":" + duid + ":" + relaySalt());
    return {
      "X-Eclex-Time": ts,
      "X-Eclex-Duid": duid,
      "X-Eclex-Sig": sig
    };
  }

  function buildSigHeadersForUrl(rawUrl, device) {
    var p = parseHostAndPath(rawUrl);
    if (!p) return null;
    return buildSigHeaders(p.host, device);
  }

  function stripSigParams(rawUrl) {
    return String(rawUrl || "")
      .replace(/([?&])(t|d|s)=[^&]*/gi, "$1")
      .replace(/\?&+/g, "?")
      .replace(/&&+/g, "&")
      .replace(/[?&]$/, "");
  }

  function signQueryUrl(rawUrl, scopeKey, device, saltOverride) {
    if (!rawUrl || !scopeKey) return rawUrl;
    var salt = saltOverride !== undefined ? String(saltOverride || "") : ((cfg && cfg.RELAY_SALT) || "");
    var ts = String(nowSynced());
    var duid = getDuid(device);
    var sig = md5Hex("eclex:" + ts + ":" + String(scopeKey) + ":" + duid + ":" + salt);
    var cleaned = stripSigParams(rawUrl);
    var sep = cleaned.indexOf("?") === -1 ? "?" : "&";
    return cleaned + sep + "t=" + encodeURIComponent(ts) + "&d=" + encodeURIComponent(duid) + "&s=" + encodeURIComponent(sig);
  }

  function wrapT3StreamUrl(innerUrl, device) {
    if (!innerUrl) return innerUrl;
    var host = extractHost(innerUrl);
    if (!host) return innerUrl;
    var ts = String(nowSynced());
    var duid = getDuid(device);
    var sig = md5Hex("eclex:" + ts + ":" + host + ":" + duid + ":" + TIZEN3_RELAY_SALT);
    return (
      TIZEN3_RELAY_URL + "/stream?url=" + encodeURIComponent(String(innerUrl)) +
      "&t=" + encodeURIComponent(ts) +
      "&d=" + encodeURIComponent(duid) +
      "&s=" + encodeURIComponent(sig)
    );
  }

  function refreshT3PlaylatamUrl(rawUrl, device) {
    var s = String(rawUrl || "");
    if (!s) return s;
    if (/tizen3-stream-relay\.eclecticempire03\.workers\.dev\/stream\?/i.test(s)) {
      var mOuter = /[?&]url=([^&]+)/i.exec(s);
      if (mOuter && mOuter[1]) {
        var inner = "";
        try { inner = decodeURIComponent(mOuter[1]); } catch (_) { inner = mOuter[1]; }
        if (/(?:api\.xupereclectic\.xyz|eclex-playlatam\.eclecticempire03\.workers\.dev)\/stream-proxy/i.test(inner)) {
          var mIn = /[?&]url=([^&]+)/i.exec(inner);
          var decT = "";
          if (mIn && mIn[1]) { try { decT = decodeURIComponent(mIn[1]); } catch (_) { decT = mIn[1]; } }
          var sm = /\/perelman\/([a-zA-Z0-9_-]+?)(?:\.m3u8)?(?:[/?#]|$)/i.exec(decT);
          if (sm && sm[1]) {
            inner = signQueryUrl(inner, "playlatam:" + sm[1].toLowerCase(), device);
          }
        }
        return wrapT3StreamUrl(inner, device);
      }
      return s;
    }
    if (/(?:api\.xupereclectic\.xyz|eclex-playlatam\.eclecticempire03\.workers\.dev)\/stream-proxy/i.test(s)) {
      var mDir = /[?&]url=([^&]+)/i.exec(s);
      var decDir = "";
      if (mDir && mDir[1]) { try { decDir = decodeURIComponent(mDir[1]); } catch (_) { decDir = mDir[1]; } }
      var smDir = /\/perelman\/([a-zA-Z0-9_-]+?)(?:\.m3u8)?(?:[/?#]|$)/i.exec(decDir);
      if (smDir && smDir[1]) {
        return signQueryUrl(s, "playlatam:" + smDir[1].toLowerCase(), device);
      }
    }
    return s;
  }

  function wrapPortalRequest(targetUrl, opts, device) {
    opts = opts || {};
    var base = relayBase();
    var p = parseHostAndPath(targetUrl);
    if (!base || !p) {
      return { url: targetUrl, options: opts, relayed: false };
    }
    var sigH = buildSigHeaders(p.host, device);
    var merged = cleanClientHeaders(opts.headers);
    merged["X-Target-Host"] = p.host;
    merged["X-Eclex-Time"] = sigH["X-Eclex-Time"];
    merged["X-Eclex-Duid"] = sigH["X-Eclex-Duid"];
    merged["X-Eclex-Sig"] = sigH["X-Eclex-Sig"];

    var nextOpts = {};
    for (var k in opts) {
      if (Object.prototype.hasOwnProperty.call(opts, k)) nextOpts[k] = opts[k];
    }
    nextOpts.headers = merged;
    return {
      url: base + p.path + p.search,
      options: nextOpts,
      relayed: true
    };
  }

  function wrapMediaRequest(req, kind, device) {
    if (!req || !req.url || kind !== "sub") return req;
    var base = relayBase();
    if (!base || isLocalOrRelay(req.url)) return req;
    var p = parseHostAndPath(req.url);
    if (!p) return req;
    var route = "/sub";
    var sigH = buildSigHeaders(p.host, device);
    var merged = cleanClientHeaders(req.headers);
    merged["X-Eclex-Time"] = sigH["X-Eclex-Time"];
    merged["X-Eclex-Duid"] = sigH["X-Eclex-Duid"];
    merged["X-Eclex-Sig"] = sigH["X-Eclex-Sig"];
    return {
      url: base + route + "?url=" + encodeURIComponent(req.url),
      headers: merged,
      relayed: true
    };
  }

  function wrapSubtitleUrl(rawUrl, device) {
    var base = relayBase();
    if (!base || !rawUrl || isLocalOrRelay(rawUrl)) return rawUrl;
    var p = parseHostAndPath(rawUrl);
    if (!p) return rawUrl;
    var sigH = buildSigHeaders(p.host, device);
    return (
      base + "/sub?url=" + encodeURIComponent(rawUrl) +
      "&t=" + encodeURIComponent(sigH["X-Eclex-Time"]) +
      "&d=" + encodeURIComponent(sigH["X-Eclex-Duid"]) +
      "&s=" + encodeURIComponent(sigH["X-Eclex-Sig"])
    );
  }

  function imageUrl(rawUrl) {
    return rawUrl;
  }

  function donateSession(fetchFn, device, clockRetried) {
    var base = relayBase();
    if (!base || typeof fetchFn !== "function" || !device || !device.sn || !device.userId || !device.userToken) {
      return Promise.resolve(false);
    }
    var sigH = buildSigHeaders("session.eclex", device);
    var hdrs = {
      "Content-Type": "application/json; charset=utf-8",
      "X-Eclex-Time": sigH["X-Eclex-Time"],
      "X-Eclex-Duid": sigH["X-Eclex-Duid"],
      "X-Eclex-Sig": sigH["X-Eclex-Sig"]
    };
    return fetchFn(base + "/session/donate", {
      method: "POST",
      headers: hdrs,
      body: JSON.stringify({
        sn: device.sn,
        snToken: device.snToken || "",
        userId: device.userId,
        userToken: device.userToken
      })
    }).then(function (res) {
      syncClockFromHeaders(res && res.headers);
      if (res && res.status === 403 && !clockRetried) {
        return syncClock(fetchFn).then(function () {
          return donateSession(fetchFn, device, true);
        });
      }
      return !!(res && res.ok);
    }).catch(function () { return false; });
  }

  function fetchFallbackSession(fetchFn, device, clockRetried) {
    var base = relayBase();
    if (!base || typeof fetchFn !== "function") return Promise.resolve(null);
    var sigH = buildSigHeaders("session.eclex", device);
    return fetchFn(base + "/session/fallback", {
      method: "GET",
      cache: "no-store",
      headers: {
        "X-Eclex-Time": sigH["X-Eclex-Time"],
        "X-Eclex-Duid": sigH["X-Eclex-Duid"],
        "X-Eclex-Sig": sigH["X-Eclex-Sig"]
      }
    }).then(function (res) {
      syncClockFromHeaders(res && res.headers);
      if (res && res.status === 403 && !clockRetried) {
        return syncClock(fetchFn).then(function () {
          return fetchFallbackSession(fetchFn, device, true);
        });
      }
      if (!res || !res.ok) return null;
      return res.text().then(function (txt) {
        try {
          var j = JSON.parse(txt);
          return (j && j.ok && j.session && j.session.userId && j.session.userToken) ? j.session : null;
        } catch (_) { return null; }
      });
    }).catch(function () { return null; });
  }

  function fetchMedia(fetchFn, req, kind, fetchOpts, device) {
    fetchOpts = fetchOpts || {};
    var userSignal = fetchOpts.signal;
    if (userSignal && userSignal.aborted) {
      var ae = new Error("Aborted");
      ae.name = "AbortError";
      return Promise.reject(ae);
    }
    var base = relayBase();
    function buildOpts(url, hdrs, sig) {
      var o = {
        method: fetchOpts.method || "GET",
        headers: hdrs || {},
        redirect: fetchOpts.redirect || "follow",
        cache: fetchOpts.cache || "no-store"
      };
      if (sig) o.signal = sig;
      return o;
    }
    function doRelay() {
      var wReq = wrapMediaRequest(req, kind, device);
      var mergedHdrs = Object.assign({}, wReq.headers || {}, cleanClientHeaders(fetchOpts.headers));
      return fetchFn(wReq.url, buildOpts(wReq.url, mergedHdrs, userSignal)).then(function (r) {
        syncClockFromHeaders(r && r.headers);
        return r;
      });
    }
    if (!base || isLocalOrRelay(req.url) || kind !== "sub") {
      var localHdrs = Object.assign({}, cleanClientHeaders(req.headers), cleanClientHeaders(fetchOpts.headers));
      return fetchFn(req.url, buildOpts(req.url, localHdrs, userSignal));
    }
    if (isStreamHostBlocked(req.url)) {
      return doRelay();
    }
    var directHdrs = Object.assign({}, cleanClientHeaders(req.headers), cleanClientHeaders(fetchOpts.headers));
    var probeCtrl = typeof AbortController === "function" ? new AbortController() : null;
    var probeTimedOut = false;
    var probeTimer = null;
    var onUserAbort = null;
    if (probeCtrl) {
      if (userSignal && typeof userSignal.addEventListener === "function") {
        onUserAbort = function () { try { probeCtrl.abort(); } catch (_) {} };
        userSignal.addEventListener("abort", onUserAbort, { once: true });
      }
      probeTimer = setTimeout(function () {
        probeTimedOut = true;
        try { probeCtrl.abort(); } catch (_) {}
      }, 4500);
    }
    function cleanupProbe() {
      if (probeTimer) { clearTimeout(probeTimer); probeTimer = null; }
      if (onUserAbort && userSignal && typeof userSignal.removeEventListener === "function") {
        try { userSignal.removeEventListener("abort", onUserAbort); } catch (_) {}
        onUserAbort = null;
      }
    }
    return fetchFn(req.url, buildOpts(req.url, directHdrs, probeCtrl ? probeCtrl.signal : userSignal)).then(function (r) {
      cleanupProbe();
      if (r && (r.ok || r.status === 206)) {
        return r;
      }
      if (r && (r.status === 403 || r.status === 451 || r.status >= 500)) {
        try { if (r.body && r.body.cancel) r.body.cancel(); } catch (_) {}
        markStreamHostBlocked(req.url);
        return doRelay();
      }
      return r;
    }, function (err) {
      cleanupProbe();
      if (userSignal && userSignal.aborted && !probeTimedOut) {
        throw err;
      }
      markStreamHostBlocked(req.url);
      return doRelay();
    });
  }

  var api = {
    relayBase: relayBase,
    isPortalBlocked: isPortalBlocked,
    markPortalBlocked: markPortalBlocked,
    isImgHostBlocked: isImgHostBlocked,
    markImgHostBlocked: markImgHostBlocked,
    isStreamHostBlocked: isStreamHostBlocked,
    markStreamHostBlocked: markStreamHostBlocked,
    wrapPortalRequest: wrapPortalRequest,
    buildSigHeaders: buildSigHeaders,
    buildSigHeadersForUrl: buildSigHeadersForUrl,
    signQueryUrl: signQueryUrl,
    wrapT3StreamUrl: wrapT3StreamUrl,
    refreshT3PlaylatamUrl: refreshT3PlaylatamUrl,
    wrapMediaRequest: wrapMediaRequest,
    fetchMedia: fetchMedia,
    wrapSubtitleUrl: wrapSubtitleUrl,
    imageUrl: imageUrl,
    syncClockFromHeaders: syncClockFromHeaders,
    syncClock: syncClock,
    donateSession: donateSession,
    fetchFallbackSession: fetchFallbackSession
  };

  root.XuperRelay = api;
  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
})("undefined" !== typeof globalThis ? globalThis : this);
