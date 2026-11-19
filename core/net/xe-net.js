!function (t) {
  "use strict";
  var isNode = "function" == typeof require,
    r = isNode ? require("./xe-env.js") : t.XuperConfig,
    n = isNode ? require("./xe-cipher.js") : t.XuperCrypto,
    relay = isNode ? require("./xe-relay.js") : t.XuperRelay;

  function o(opts) {
    opts = opts || {};
    var sHost = null;
    try {
      sHost = typeof localStorage !== "undefined" && localStorage.getItem("xuper.working_host");
    } catch (_) {}
    this.hosts = opts.hosts || r.PORTAL_HOSTS.slice();
    this.host = sHost && this.hosts.indexOf(sHost) !== -1 ? sHost : (opts.host || this.hosts[0]);
    this.scheme = opts.scheme || "https";
    this.timeout = opts.timeout || 5000;
    this._fetch = opts.fetch || function () {
      if ("function" == typeof fetch) return fetch;
      throw new Error("fetch no disponible");
    }();
    this.debug = !!opts.debug;
    this.headers = Object.assign({}, r.HEADERS, opts.headers || {});
    ["User-Agent", "Connection", "Accept-Encoding", "Host", "Content-Length"].forEach(function (k) {
      delete this.headers[k];
    }, this);
    this.minInterval = null != opts.minInterval ? opts.minInterval : 120;
    this.device = opts.device || null;
    this._turn = Promise.resolve();
    this._lastCall = 0;
  }

  function i(t) {
    if (null == t) return null;
    var e = "res" in t ? "res" : "data" in t ? "data" : null;
    if (!e) return t;
    var val = t[e];
    if ("string" == typeof val && /^[0-9a-fA-F]+$/.test(val) && val.length > 16) {
      try { return JSON.parse(n.unwrap(val)); } catch (_) {
        try { return n.unwrap(val); } catch (_) { return val; }
      }
    }
    return val;
  }

  // Pool de Web Workers ES5 para descifrado 3DES en segundo plano (compatible Tizen 3.0-10.0)
  var WorkerPool = (function () {
    var WORKER_PATH = (!isNode && t.__XE_CRYPTO_WORKER_URL) ? t.__XE_CRYPTO_WORKER_URL : "core/net/xe-crypto-worker.js";
    var disabled = isNode || typeof Worker !== "function";
    var slots = [];
    var nextId = 1;
    var rrIndex = 0;

    function maxWorkers() {
      var hc = typeof navigator !== "undefined" && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 2;
      if (hc < 2) return 1;
      return hc > 3 ? 3 : hc;
    }

    function createSlot() {
      var w;
      try {
        w = new Worker(WORKER_PATH);
      } catch (e) {
        disabled = true;
        return null;
      }
      var slot = {
        worker: w,
        pending: {},
        busy: 0,
        broken: false
      };
      w.onmessage = function (ev) {
        var msg = ev && ev.data;
        if (!msg) return;
        if (msg.fatal) {
          slot.broken = true;
          disabled = true;
          failAll(slot, new Error(msg.error || "Worker fatal"));
          return;
        }
        var req = slot.pending[msg.id];
        if (!req) return;
        delete slot.pending[msg.id];
        if (slot.busy > 0) slot.busy--;
        if (req.timer) clearTimeout(req.timer);
        if (msg.ok) req.resolve(msg);
        else req.reject(new Error(msg.error || "Error en Worker"));
      };
      w.onerror = function (err) {
        slot.broken = true;
        disabled = true;
        failAll(slot, new Error((err && err.message) || "Worker onerror"));
        try { w.terminate(); } catch (_) {}
      };
      return slot;
    }

    function failAll(slot, err) {
      var keys = Object.keys(slot.pending);
      for (var k = 0; k < keys.length; k++) {
        var req = slot.pending[keys[k]];
        delete slot.pending[keys[k]];
        if (req.timer) clearTimeout(req.timer);
        req.reject(err);
      }
      slot.busy = 0;
    }

    function ensurePool() {
      if (disabled) return 0;
      var target = maxWorkers();
      while (slots.length < target) {
        var s = createSlot();
        if (!s) break;
        slots.push(s);
      }
      var alive = 0;
      for (var k = 0; k < slots.length; k++) {
        if (!slots[k].broken) alive++;
      }
      if (alive === 0) disabled = true;
      return alive;
    }

    function pickSlot() {
      ensurePool();
      if (disabled || !slots.length) return null;
      var best = null;
      for (var k = 0; k < slots.length; k++) {
        var idx = (rrIndex + k) % slots.length;
        var s = slots[idx];
        if (s.broken) continue;
        if (!best || s.busy < best.busy) best = s;
      }
      rrIndex = (rrIndex + 1) % Math.max(1, slots.length);
      return best;
    }

    function sendToSlot(slot, payload, transfer, timeoutMs) {
      return new Promise(function (resolve, reject) {
        if (!slot || slot.broken || disabled) {
          reject(new Error("Worker no disponible"));
          return;
        }
        var id = nextId++;
        payload.id = id;
        slot.busy++;
        var timer = setTimeout(function () {
          if (slot.pending[id]) {
            delete slot.pending[id];
            if (slot.busy > 0) slot.busy--;
            reject(new Error("Timeout en Worker (" + id + ")"));
          }
        }, timeoutMs || 15000);
        slot.pending[id] = { resolve: resolve, reject: reject, timer: timer };
        try {
          if (transfer && transfer.length) {
            try {
              slot.worker.postMessage(payload, transfer);
              return;
            } catch (_) {}
          }
          slot.worker.postMessage(payload);
        } catch (err) {
          delete slot.pending[id];
          if (slot.busy > 0) slot.busy--;
          clearTimeout(timer);
          reject(err);
        }
      });
    }

    function unwrapAsync(hexStr) {
      if (disabled || typeof hexStr !== "string" || hexStr.length < 1024) {
        return Promise.reject(new Error("sync-fast-path"));
      }
      var alive = ensurePool();
      if (!alive || disabled) {
        return Promise.reject(new Error("worker-disabled"));
      }

      // Payloads grandes (>= 64 KB hex): paralelizar bloques de 8 bytes entre multiples workers
      if (alive >= 2 && hexStr.length >= 65536 && n._hexDecode && n._utf8Decode && n._b64decode) {
        try {
          var b64Str = n._utf8Decode(n._hexDecode(hexStr));
          var cipherBytes = n._b64decode(b64Str);
          var totalLen = cipherBytes.length;
          if (totalLen >= 16384 && totalLen % 8 === 0) {
            var count = Math.min(alive, 3);
            var rawChunk = Math.floor(totalLen / count / 8) * 8;
            var jobs = [];
            var offset = 0;
            for (var c = 0; c < count; c++) {
              var end = (c === count - 1) ? totalLen : (offset + rawChunk);
              var sliceCopy = new Uint8Array(end - offset);
              sliceCopy.set(cipherBytes.subarray(offset, end));
              var slot = slots[c % slots.length];
              if (!slot || slot.broken) slot = pickSlot();
              jobs.push(sendToSlot(slot, {
                op: "decryptSlice",
                bytes: sliceCopy.buffer,
                isLast: c === count - 1
              }, [sliceCopy.buffer], 15000));
              offset = end;
            }
            return Promise.all(jobs).then(function (parts) {
              var outLen = 0;
              var arrays = [];
              for (var p = 0; p < parts.length; p++) {
                var u8 = new Uint8Array(parts[p].bytes);
                arrays.push(u8);
                outLen += u8.length;
              }
              var merged = new Uint8Array(outLen);
              var pos = 0;
              for (var q = 0; q < arrays.length; q++) {
                merged.set(arrays[q], pos);
                pos += arrays[q].length;
              }
              var txt = n._utf8Decode(merged);
              try { return JSON.parse(txt); } catch (_) { return txt; }
            });
          }
        } catch (_) {}
      }

      var slotSingle = pickSlot();
      return sendToSlot(slotSingle, { op: "unwrapJson", hex: hexStr }, null, 15000).then(function (res) {
        return res.data;
      });
    }

    return {
      isSupported: function () { return !disabled; },
      unwrapAsync: unwrapAsync,
      ping: function () {
        var s = pickSlot();
        return s ? sendToSlot(s, { op: "ping" }, null, 3000) : Promise.reject(new Error("no-worker"));
      }
    };
  })();

  function extractPayloadAsync(t) {
    if (null == t) return Promise.resolve(null);
    var e = "res" in t ? "res" : "data" in t ? "data" : null;
    if (!e) return Promise.resolve(t);
    var val = t[e];
    if ("string" == typeof val && /^[0-9a-fA-F]+$/.test(val) && val.length >= 1024 && WorkerPool.isSupported()) {
      return WorkerPool.unwrapAsync(val).catch(function () {
        return i(t);
      });
    }
    return Promise.resolve(i(t));
  }

  function a(t) {
    return null == t ? null : "err" in t ? String(t.err) : "returnCode" in t ? String(t.returnCode) : "code" in t ? String(t.code) : null;
  }

  o.prototype._wait = function () {
    var self = this;
    var p = self._turn.then(function () {
      var gap = self.minInterval - (Date.now() - self._lastCall);
      if (self._lastCall && gap > 0) {
        return new Promise(function (resolve) { setTimeout(resolve, gap); });
      }
    }).then(function () {
      self._lastCall = Date.now();
    });
    self._turn = p.catch(function () {});
    return p;
  };

  function _uuid() {
    if (!isNode && t.crypto && t.crypto.randomUUID) return t.crypto.randomUUID();
    if (isNode) {
      var cr = require("crypto");
      if (cr.randomUUID) return cr.randomUUID();
    }
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var v = 16 * Math.random() | 0;
      return ("x" === c ? v : (3 & v | 8)).toString(16);
    });
  }

  o.prototype._sendOnce = function (endpoint, payloadStr, host, reqHeaders, useRelay, timeoutMs, clockRetried) {
    var self = this;
    var targetUrl = self.scheme + "://" + host + "/api/portalCore/" + endpoint;
    var hdrs = Object.assign({}, self.headers, reqHeaders || {});
    var fetchUrl = targetUrl;
    var sec = r.SEC;
    var fetchOpts;

    if (sec && n.secWrap && n.md5) {
      var trace = _uuid();
      var meta = n.md5(trace + sec.metaSalt);
      var hdrMap = Object.assign({}, hdrs, { "X-Request-Trace": trace, "X-Client-Meta": meta });
      var hdrLines = [];
      Object.keys(hdrMap).forEach(function (k) {
        if (void 0 !== hdrMap[k] && null !== hdrMap[k]) hdrLines.push(k + ": " + hdrMap[k]);
      });
      var dVal = n.secWrap(hdrLines.join("\r\n") + "\r\n", sec.keyHex, sec.alpha);
      var cookieStr = "d=" + dVal + "; s=" + sec.s + "; t=" + sec.t;
      var secHeaders = {
        "Accept": "*/*",
        "Content-Type": "application/x-www-form-urlencoded"
      };
      if (useRelay) secHeaders["X-Cookie"] = cookieStr;
      else secHeaders["Cookie"] = cookieStr;
      fetchOpts = { method: "POST", headers: secHeaders, body: payloadStr };
    } else {
      fetchOpts = { method: "POST", headers: hdrs, body: payloadStr };
    }

    if (useRelay && relay && relay.relayBase && relay.relayBase()) {
      var wrapped = relay.wrapPortalRequest(targetUrl, fetchOpts, self.device);
      fetchUrl = wrapped.url;
      fetchOpts = wrapped.options;
    }

    var ctrl = "function" == typeof AbortController ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { try { ctrl.abort(); } catch (_) {} }, timeoutMs || self.timeout) : null;
    if (ctrl) fetchOpts.signal = ctrl.signal;

    return self._fetch(fetchUrl, fetchOpts).then(function (res) {
      if (relay && relay.syncClockFromHeaders && res && res.headers) {
        relay.syncClockFromHeaders(res.headers);
      }
      if (useRelay && res.status === 403 && !clockRetried && relay && relay.syncClock) {
        return relay.syncClock(self._fetch).then(function () {
          if (timer) clearTimeout(timer);
          return self._sendOnce(endpoint, payloadStr, host, reqHeaders, true, timeoutMs, true);
        });
      }
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.text();
    }).then(function (txt) {
      if (timer) clearTimeout(timer);
      var rawTxt = String(txt || "").trim();
      if (sec && n.secUnwrap && rawTxt && rawTxt.charAt(0) !== "{") {
        try { rawTxt = n.secUnwrap(rawTxt, sec.keyHex, sec.alpha); } catch (_) {}
      }
      var parsed;
      try { parsed = JSON.parse(rawTxt); } catch (_) {
        throw new Error("El portal devolvió una respuesta no válida");
      }
      if (!parsed || "object" != typeof parsed || Array.isArray(parsed)) {
        throw new Error("Respuesta de portal no válida");
      }
      var code = a(parsed);
      if (null === code) throw new Error("Respuesta de portal sin estado");
      return extractPayloadAsync(parsed).then(function (bodyData) {
        if ("0" !== code) {
          var pe = new Error("El servidor rechazó " + endpoint + " (código " + code + ")");
          pe.code = code;
          pe.portalError = true;
          throw pe;
        }
        self.host = host;
        try { typeof localStorage !== "undefined" && localStorage.setItem("xuper.working_host", host); } catch (_) {}
        if (!useRelay && "v8/active" === endpoint && bodyData && bodyData.userId && bodyData.userToken && self.device && relay && relay.donateSession) {
          if (self.device.store) self.device.store.set("xuper.pooledSession", "");
          setTimeout(function () {
            try {
              var snap = {
                sn: self.device.sn,
                snToken: self.device.snToken || "",
                userId: bodyData.userId,
                userToken: bodyData.userToken
              };
              relay.donateSession(self._fetch, snap);
            } catch (_) {}
          }, 500);
        }
        self.debug && console.log("[api]", endpoint, "code=" + code, useRelay ? "(relay)" : "(direct)");
        return { code: code, data: bodyData, envelope: parsed };
      });
    }, function (err) {
      if (timer) clearTimeout(timer);
      throw err;
    });
  };

  o.prototype.call = function (endpoint, payload, opts) {
    var self = this;
    opts = opts || {};
    var bodyStr = (r.SEC && n.secWrap) ? n.secWrap(JSON.stringify(payload), r.SEC.keyHex, r.SEC.alpha) : n.wrap(JSON.stringify(payload));
    var hosts = [self.host].concat(self.hosts.filter(function (h) { return h !== self.host; }));
    var hasRelay = !!(relay && relay.relayBase && relay.relayBase());
    var isActivation = ("v8/active" === endpoint || "v8/login" === endpoint);

    function runMode(useRelay, limitHosts, overrideTimeout) {
      var idx = 0;
      var list = limitHosts ? hosts.slice(0, limitHosts) : hosts;
      var tout = overrideTimeout || ((!useRelay && isActivation) ? 2500 : self.timeout);
      function nextHost() {
        if (idx >= list.length) {
          return Promise.reject(new Error("todos los hosts fallaron para " + endpoint));
        }
        var h = list[idx++];
        return self._sendOnce(endpoint, bodyStr, h, opts.headers, useRelay, tout, false).catch(function (err) {
          if (err && err.portalError) throw err;
          self.debug && console.log("[api] host", h, useRelay ? "(relay)" : "(direct)", "fallo:", err.message);
          return nextHost();
        });
      }
      return nextHost();
    }

    return self._wait().then(function () {
      var preferDirectIp = ("v15/getSlbInfo" === endpoint || "v14/getSlbInfo" === endpoint || isActivation);
      var portalAlreadyBlocked = !preferDirectIp && !!(hasRelay && relay.isPortalBlocked && relay.isPortalBlocked());
      var directGotPortalError = false;
      var chain;
      if (!hasRelay) {
        chain = runMode(false);
      } else if (portalAlreadyBlocked || r.SEC) {
        chain = runMode(true);
      } else {
        // Direct-first: solo usar el Worker si la ruta directa esta bloqueada o geo-restringida
        chain = runMode(false, 2, 3500).catch(function (directErr) {
          if (directErr && directErr.portalError) directGotPortalError = true;
          self.debug && console.warn("[xe-net] Ruta directa bloqueada/fallida en " + endpoint + " (" + directErr.message + "), activando Worker...");
          if (relay && relay.markPortalBlocked && !(directErr && directErr.portalError)) relay.markPortalBlocked();
          return runMode(true);
        });
      }
      return chain.catch(function (err) {
        // v8/active may return portal100024 through CF Worker egress; fall back to direct residential IP (unless browser SEC strips Cookie or direct already returned portalError), then KV session pool
        if (hasRelay && isActivation) {
          var isBrowserEnv = (typeof window !== "undefined" && typeof navigator !== "undefined" && !opts._allowDirectCookie);
          var directHosts = (r.SEC && isBrowserEnv) ? [] : (directGotPortalError ? [] : (portalAlreadyBlocked ? hosts.slice(0, 3) : hosts.slice(2, 5)));
          var directTry = directHosts.length ? (function () {
            var dIdx = 0;
            function nextDirect() {
              if (dIdx >= directHosts.length) return Promise.reject(err);
              return self._sendOnce(endpoint, bodyStr, directHosts[dIdx++], opts.headers, false, 2000, false).catch(function (de) {
                if (de && de.portalError) throw de;
                return nextDirect();
              });
            }
            return nextDirect();
          })() : Promise.reject(err);
          return directTry.catch(function (directErr) {
            if ("v8/active" === endpoint && relay && relay.fetchFallbackSession) {
              self.debug && console.warn("[xe-net] Ruta directa bloqueada (" + directErr.message + "), consultando pool de sesiones KV...");
              return relay.fetchFallbackSession(self._fetch, self.device).then(function (pooled) {
                if (!pooled) throw err;
                if (self.device) {
                  if (pooled.sn) {
                    self.device.sn = pooled.sn;
                    if (self.device.store) {
                      self.device.store.set("xuper.sn", pooled.sn);
                      self.device.store.set("xuper.registeredSn", "");
                      self.device.store.set("xuper.pooledSession", "1");
                    }
                  }
                  if (pooled.snToken && typeof self.device.setSnToken === "function") {
                    self.device.setSnToken(pooled.snToken);
                  }
                }
                self.debug && console.log("[api]", endpoint, "code=0 (kv-pool)");
                return {
                  code: "0",
                  data: { userId: pooled.userId, userToken: pooled.userToken, availableTime: 28800, remainingDays: 1, fromPool: true },
                  envelope: { returnCode: "0" }
                };
              });
            }
            throw err;
          });
        }
        throw err;
      }).catch(function (tErr) {
        if (tErr && tErr.portalError) {
          var cStr = String(tErr.code || tErr.message || "");
          var isExp = /^(aaa10002[78]|aaa10000[123]|aaa10008[0-9]|aaa10009[0-9]|10002[78]|10008[0-9]|401|403)$/i.test(String(tErr.code || "")) ||
            /aaa10002[78]|aaa10000[123]|aaa10008[0-9]|aaa10009[0-9]|token|session|auth/i.test(cStr);
          if (isExp && self.onSessionExpired && (opts._sessionRetries || 0) < 2 && "v3/snToken" !== endpoint && "v8/active" !== endpoint) {
            console.warn("[xe-net] Renovando sesión automáticamente (" + tErr.code + ") en " + endpoint);
            opts._sessionRetries = (opts._sessionRetries || 0) + 1;
            return self.onSessionExpired().then(function () {
              if (payload && self.device) {
                if ("userId" in payload) payload.userId = self.device.userId;
                if ("userToken" in payload) payload.userToken = self.device.userToken;
                if ("sn" in payload) payload.sn = self.device.sn;
                if ("drmId" in payload) payload.drmId = self.device.drmId;
                if ("snToken" in payload) payload.snToken = self.device.snToken || "";
              }
              return self.call(endpoint, payload, opts);
            });
          }
        }
        var isContentQueryErr = !!(tErr && tErr.portalError && /^(portal100006|portal100081)$/i.test(String(tErr.code || "")));
        if (!r.SEC && !opts._secRetried && !opts._skipSecFallback && !isContentQueryErr && typeof r.activateSecFallback === "function") {
          console.warn("[xe-net] Ruta sin cookies fallo en " + endpoint + " (" + (tErr && (tErr.code || tErr.message) || "error") + "), cambiando a respaldo SEC...");
          opts._secRetried = true;
          r.activateSecFallback();
          try {
            var badgeEl = typeof document !== "undefined" && document.getElementById("xe-ota-debug-badge");
            if (badgeEl && badgeEl.textContent) badgeEl.textContent = badgeEl.textContent.replace(/LEGACY$/, "SEC");
          } catch (_) {}
          self.hosts = r.PORTAL_HOSTS.slice();
          self.host = self.hosts[0];
          self.headers = Object.assign({}, r.HEADERS);
          if (self.device && typeof self.device.setAuthMode === "function") {
            self.device.setAuthMode("sec");
          }
          var syncPayloadFields = function () {
            if (!payload || !self.device) return;
            var f = self.device.fields();
            for (var fk in f) {
              if (Object.prototype.hasOwnProperty.call(f, fk) && fk in payload) {
                payload[fk] = f[fk];
              }
            }
            if ("userId" in payload) payload.userId = self.device.userId || "";
            if ("userToken" in payload) payload.userToken = self.device.userToken || "";
            if ("sn" in payload) payload.sn = self.device.sn || "";
            if ("drmId" in payload) payload.drmId = self.device.drmId || "";
            if ("snToken" in payload) payload.snToken = self.device.snToken || "";
          };
          if ("v3/snToken" !== endpoint && "v8/active" !== endpoint && self.onSessionExpired &&
              (!self.device || !self.device.userId || !self.device.userToken || (self.device.isSessionStale && self.device.isSessionStale(28800000)))) {
            return self.onSessionExpired().then(function () {
              syncPayloadFields();
              return self.call(endpoint, payload, opts);
            });
          }
          syncPayloadFields();
          if ("v3/snToken" === endpoint && self.device && "2" === self.device.identityVersion) {
            Object.assign(payload, self.device.registrationFields());
            if (!self.device.store || !self.device.store.get(self.device._key("registeredSn"))) payload.sn = "";
          }
          return self.call(endpoint, payload, opts);
        }
        if (tErr && tErr.portalError) throw tErr;
        try { typeof localStorage !== "undefined" && localStorage.removeItem("xuper.working_host"); } catch (_) {}
        self.host = self.hosts[0];
        throw tErr;
      });
    });
  };

  var s = { Api: o, extractPayload: i, extractPayloadAsync: extractPayloadAsync, envelopeCode: a, workerPool: WorkerPool };
  t.XuperCryptoWorker = WorkerPool;
  t.XuperApi = s;
  "undefined" != typeof module && module.exports && (module.exports = s);
}("undefined" != typeof globalThis ? globalThis : this);
