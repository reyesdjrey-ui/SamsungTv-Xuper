/* Xuper Eclectic - OTA Secure Boot & Cache Loader (Tizen 3.0 - 10.0 ES5) */
(function (w, d) {
  "use strict";

  var BASE_REV = 13;
  var BASE_VERSION = "3.0.2";
  var OTA_BASE_URL = "https://reyesdjrey-ui.github.io/SamsungTv-Xuper/ota/";
  var MANIFEST_URL = OTA_BASE_URL + "manifest.json";
  var OTA_SALT = "EcLex_0TA_Sh13ld_#2026_S4msungTv_Xup3r";
  var DB_NAME = "xuper_ota_v1";
  var STORE_NAME = "bundles";
  var BOOT_KEY = "xuper.ota.boot_state";
  var MANIFEST_TIMEOUT_MS = 2200;
  var BUNDLE_TIMEOUT_MS = 5500;

  var MODULES = [
    "core/net/xe-env.js",
    "core/net/xe-cipher.js",
    "core/net/xe-relay.js",
    "core/net/xe-net.js",
    "core/net/xe-identity.js",
    "core/net/xe-auth.js",
    "core/net/xe-repository.js",
    "core/net/xe-broadcast.js",
    "core/net/xe-digest.js",
    "core/net/xe-manifest.js",
    "core/media/xe-system-scanner.js",
    "core/media/xe-gateway.js",
    "core/media/xe-byte-buffer.js",
    "core/media/xe-audio-clock.js",
    "core/media/xe-isobmff-mux.js",
    "core/media/xe-track-mgr.js",
    "core/media/xe-hevc-engine.js",
    "core/media/xe-mp4-engine.js",
    "core/media/xe-vod-engine.js",
    "core/media/xe-tizen-av.js",
    "core/media/xe-live-engine.js",
    "core/media/xe-watch-state.js",
    "store/xe-vod-index.js",
    "store/xe-featured-index.js",
    "store/xe-live-index.js",
    "store/xe-m3u-index.js",
    "store/xe-runtime-cfg.js",
    "core/shell/xe-bridge.js",
    "core/shell/xe-controller.js"
  ];

  function md5Hex(s) {
    return (w.CryptoJS && w.CryptoJS.MD5) ? w.CryptoJS.MD5(String(s)).toString().toLowerCase() : "";
  }

  function sha256Hex(s) {
    return (w.CryptoJS && w.CryptoJS.SHA256) ? w.CryptoJS.SHA256(String(s)).toString().toLowerCase() : "";
  }

  function readBootState() {
    try {
      var raw = w.localStorage && w.localStorage.getItem(BOOT_KEY);
      return raw ? JSON.parse(raw) : { rev: BASE_REV, fails: 0 };
    } catch (_) {
      return { rev: BASE_REV, fails: 0 };
    }
  }

  function writeBootState(st) {
    try {
      if (w.localStorage) w.localStorage.setItem(BOOT_KEY, JSON.stringify(st));
    } catch (_) {}
  }

  function openDb(cb) {
    var idb = w.indexedDB || w.webkitIndexedDB;
    if (!idb) return cb(null);
    try {
      var req = idb.open(DB_NAME, 1);
      req.onupgradeneeded = function (ev) {
        var db = ev.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = function (ev) { cb(ev.target.result); };
      req.onerror = function () { cb(null); };
    } catch (_) {
      cb(null);
    }
  }

  function idbGetActive(cb) {
    openDb(function (db) {
      if (!db) return cb(null);
      try {
        var tx = db.transaction([STORE_NAME], "readonly");
        var req = tx.objectStore(STORE_NAME).get("active");
        req.onsuccess = function () {
          try { db.close(); } catch (_) {}
          cb(req.result || null);
        };
        req.onerror = function () {
          try { db.close(); } catch (_) {}
          cb(null);
        };
      } catch (_) {
        try { db.close(); } catch (_) {}
        cb(null);
      }
    });
  }

  function idbPutActive(bundleObj, cb) {
    openDb(function (db) {
      if (!db) return cb(false);
      try {
        var tx = db.transaction([STORE_NAME], "readwrite");
        var req = tx.objectStore(STORE_NAME).put(bundleObj, "active");
        tx.oncomplete = function () {
          try { db.close(); } catch (_) {}
          cb(true);
        };
        tx.onerror = req.onerror = function () {
          try { db.close(); } catch (_) {}
          cb(false);
        };
      } catch (_) {
        try { db.close(); } catch (_) {}
        cb(false);
      }
    });
  }

  function idbClearActive(cb) {
    openDb(function (db) {
      if (!db) return cb && cb();
      try {
        var tx = db.transaction([STORE_NAME], "readwrite");
        tx.objectStore(STORE_NAME).delete("active");
        tx.oncomplete = function () { try { db.close(); } catch (_) {} if (cb) cb(); };
        tx.onerror = function () { try { db.close(); } catch (_) {} if (cb) cb(); };
      } catch (_) {
        try { db.close(); } catch (_) {}
        if (cb) cb();
      }
    });
  }

  function xhrText(url, timeoutMs, cb) {
    if (typeof XMLHttpRequest === "undefined") return cb(new Error("no xhr"), null);
    var done = false;
    function finish(err, text) {
      if (done) return;
      done = true;
      cb(err, text);
    }
    try {
      var x = new XMLHttpRequest();
      x.open("GET", url, true);
      x.timeout = timeoutMs;
      x.onload = function () {
        if (x.status >= 200 && x.status < 300 && x.responseText) {
          finish(null, x.responseText);
        } else {
          finish(new Error("HTTP " + x.status), null);
        }
      };
      x.onerror = function () { finish(new Error("network"), null); };
      x.ontimeout = function () { finish(new Error("timeout"), null); };
      x.send();
    } catch (e) {
      finish(e, null);
    }
  }

  function verifySignature(m) {
    if (!m || typeof m !== "object") return false;
    var rev = Number(m.rev || 0);
    if (!rev || !m.version || !m.bundle || !m.sha256 || !m.sig) return false;
    var expected = md5Hex("xuper-ota:" + rev + ":" + m.version + ":" + String(m.sha256).toLowerCase() + ":" + OTA_SALT);
    return !!expected && expected === String(m.sig).toLowerCase();
  }

  function verifyManifest(m) {
    if (!verifySignature(m)) return false;
    var rev = Number(m.rev || 0);
    var minBase = Number(m.minBaseRev || 1);
    return rev > BASE_REV && minBase <= BASE_REV;
  }

  function showWgtUpdateBanner(m) {
    try {
      w.__XE_WGT_UPDATE_REQUIRED = {
        version: String(m.version || ""),
        minBaseRev: Number(m.minBaseRev || 1),
        notes: String(m.notes || ""),
        url: "https://github.com/reyesdjrey-ui/SamsungTv-Xuper/releases"
      };
      setTimeout(function () {
        try {
          if (!d.body || d.getElementById("xe-wgt-update-banner")) return;
          var box = d.createElement("div");
          box.id = "xe-wgt-update-banner";
          box.style.cssText = "position:fixed;top:24px;right:32px;z-index:99999;background:rgba(15,23,42,0.92);color:#f8fafc;border:1px solid rgba(56,189,248,0.6);border-radius:10px;padding:12px 18px;font-family:sans-serif;font-size:20px;box-shadow:0 8px 24px rgba(0,0,0,0.45);max-width:560px;pointer-events:none;";
          box.textContent = "Nueva versión " + String(m.version || "") + " disponible. Instala el nuevo .wgt para actualizar.";
          d.body.appendChild(box);
          setTimeout(function () {
            try { if (box.parentNode) box.parentNode.removeChild(box); } catch (_) {}
          }, 12000);
        } catch (_) {}
      }, 2500);
    } catch (_) {}
  }

  function prepareWorkerBlob(bundleFiles) {
    if (!bundleFiles) return;
    var hasCipher = typeof bundleFiles["core/net/xe-cipher.js"] === "string";
    var hasWorker = typeof bundleFiles["core/net/xe-crypto-worker.js"] === "string";
    if (!hasCipher && !hasWorker) return;
    if (typeof Blob !== "function" || !w.URL || typeof w.URL.createObjectURL !== "function") return;
    if (!hasWorker) {
      // Only xe-cipher updated; keep built-in worker or disable if cipher changed critically
      return;
    }
    try {
      var cipherSrc = hasCipher ? bundleFiles["core/net/xe-cipher.js"] : "";
      var workerSrc = bundleFiles["core/net/xe-crypto-worker.js"];
      if (hasCipher) {
        workerSrc = cipherSrc + "\n" + workerSrc.replace(/importScripts\([^)]*\)\s*;?/g, "/* inlined */");
      }
      var blob = new Blob([workerSrc], { type: "application/javascript" });
      w.__XE_CRYPTO_WORKER_URL = w.URL.createObjectURL(blob);
    } catch (_) {}
  }

  function injectCss(bundleFiles) {
    if (!bundleFiles || typeof bundleFiles["styles/xe-theme.css"] !== "string") return;
    try {
      var st = d.createElement("style");
      st.id = "xe-ota-theme";
      st.type = "text/css";
      st.textContent = bundleFiles["styles/xe-theme.css"];
      (d.head || d.documentElement).appendChild(st);
    } catch (_) {}
  }

  function updateSplashLabel(ver) {
    try {
      w.__XE_APP_VERSION = ver;
      var el = d.querySelector("#splash-screen .splash-title");
      if (el) el.textContent = "Xuper Eclectic " + ver;
    } catch (_) {}
  }

  function loadScriptsSequential(bundleObj) {
    var files = (bundleObj && bundleObj.files) || null;
    var scriptList = (bundleObj && bundleObj.scripts && bundleObj.scripts.length) ? bundleObj.scripts : MODULES;
    var activeRev = bundleObj ? Number(bundleObj.rev || BASE_REV) : BASE_REV;
    var activeVer = bundleObj ? String(bundleObj.version || BASE_VERSION) : BASE_VERSION;

    updateSplashLabel(activeVer);
    if (files) {
      injectCss(files);
      prepareWorkerBlob(files);
    }

    var prevState = readBootState();
    var nextFails = (prevState && prevState.rev === activeRev) ? (Number(prevState.fails || 0) + 1) : 1;
    if (activeRev > BASE_REV) {
      writeBootState({ rev: activeRev, fails: nextFails });
    }

    var idx = 0;
    var parent = d.body || d.head || d.documentElement;

    function onAllDone() {
      if (activeRev > BASE_REV) {
        setTimeout(function () {
          var errs = w.__xuperErrors || [];
          if (!errs.length) {
            writeBootState({ rev: activeRev, fails: 0 });
          }
        }, 1800);
      }
    }

    function step() {
      if (idx >= scriptList.length) {
        onAllDone();
        return;
      }
      var path = scriptList[idx++];
      var s = d.createElement("script");
      if (files && typeof files[path] === "string") {
        s.type = "text/javascript";
        s.text = files[path] + "\n//# sourceURL=" + path;
        parent.appendChild(s);
        step();
      } else {
        s.src = path;
        s.async = false;
        s.onload = step;
        s.onerror = step;
        parent.appendChild(s);
      }
    }

    step();
  }

  function fetchBundle(manifest, cb) {
    var rel = String(manifest.bundle || "").replace(/^\/+/, "");
    if (!rel || /\.\./.test(rel)) return cb(null);
    var bUrl = OTA_BASE_URL + rel + "?v=" + encodeURIComponent(String(manifest.rev));
    xhrText(bUrl, BUNDLE_TIMEOUT_MS, function (err, txt) {
      if (err || !txt) return cb(null);
      var actualSha = sha256Hex(txt);
      if (!actualSha || actualSha !== String(manifest.sha256).toLowerCase()) {
        console.warn("[xe-ota] SHA-256 invalido, descartando actualizacion");
        return cb(null);
      }
      try {
        var parsed = JSON.parse(txt);
        if (!parsed || typeof parsed !== "object" || !parsed.files) return cb(null);
        parsed.rev = Number(manifest.rev);
        parsed.version = String(manifest.version);
        parsed.sha256 = String(manifest.sha256).toLowerCase();
        cb(parsed);
      } catch (_) {
        cb(null);
      }
    });
  }

  function boot() {
    idbGetActive(function (cached) {
      var st = readBootState();
      if (cached && Number(cached.rev || 0) <= BASE_REV) {
        cached = null;
        idbClearActive();
      }
      if (st && Number(st.rev || 0) <= BASE_REV) {
        writeBootState({ rev: BASE_REV, fails: 0 });
      }
      if (cached && st && Number(st.rev) === Number(cached.rev) && Number(st.fails || 0) >= 2) {
        console.warn("[xe-ota] Rollback automatico de rev", cached.rev, "a base", BASE_VERSION);
        cached = null;
        idbClearActive();
        writeBootState({ rev: BASE_REV, fails: 0 });
      }

      var curRev = cached ? Number(cached.rev) : BASE_REV;
      var mUrl = MANIFEST_URL + "?t=" + Math.floor(Date.now() / 300000);

      xhrText(mUrl, MANIFEST_TIMEOUT_MS, function (err, txt) {
        if (err || !txt) {
          loadScriptsSequential(cached);
          return;
        }
        var manifest = null;
        try { manifest = JSON.parse(txt); } catch (_) { manifest = null; }
        if (verifySignature(manifest) && Number(manifest.minBaseRev || 1) > BASE_REV) {
          showWgtUpdateBanner(manifest);
          loadScriptsSequential(cached);
          return;
        }
        if (!verifyManifest(manifest) || Number(manifest.rev) <= curRev) {
          loadScriptsSequential(cached);
          return;
        }
        console.log("[xe-ota] Descargando actualizacion rev=" + manifest.rev + " (" + manifest.version + ")...");
        fetchBundle(manifest, function (freshBundle) {
          if (!freshBundle) {
            loadScriptsSequential(cached);
            return;
          }
          idbPutActive(freshBundle, function () {
            loadScriptsSequential(freshBundle);
          });
        });
      });
    });
  }

  w.XuperOTA = {
    BASE_REV: BASE_REV,
    BASE_VERSION: BASE_VERSION,
    MANIFEST_URL: MANIFEST_URL,
    boot: boot,
    clearCache: idbClearActive
  };

  boot();
})(window, document);
