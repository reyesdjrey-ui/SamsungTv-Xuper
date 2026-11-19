(function(){
  'use strict';
  // 1. globalThis polyfill
  if (typeof globalThis === 'undefined') {
    if (typeof window !== 'undefined') window.globalThis = window;
    else if (typeof self !== 'undefined') self.globalThis = self;
    else if (typeof global !== 'undefined') global.globalThis = global;
    else (function(){ return this; })().globalThis = (function(){ return this; })();
  }

  // 2. crypto.getRandomValues polyfill
  if (typeof window !== 'undefined') {
    if (!window.crypto) window.crypto = {};
    if (!window.crypto.getRandomValues) {
      window.crypto.getRandomValues = function (arr) {
        for (var i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      };
    }
  }

  // 3. Object.assign
  if (typeof Object.assign !== 'function') {
    Object.assign = function(target) {
      if (target == null) throw new TypeError('Target is null');
      var t = Object(target);
      for (var i = 1; i < arguments.length; i++) {
        var s = arguments[i];
        if (s != null) {
          for (var k in Object(s)) {
            if (Object.prototype.hasOwnProperty.call(s, k)) t[k] = s[k];
          }
        }
      }
      return t;
    };
  }

  // 4. Array.from, Object.values, Object.entries, Uint8Array.from & Number helpers (Tizen 3.0 WebKit 538.1)
  if (!Array.from) {
    Array.from = function(obj) { return Array.prototype.slice.call(obj); };
  }
  if (!Object.values) {
    Object.values = function(obj) { return Object.keys(obj).map(function(k){ return obj[k]; }); };
  }
  if (!Object.entries) {
    Object.entries = function(obj) {
      var keys = Object.keys(obj), res = new Array(keys.length);
      for (var i = 0; i < keys.length; i++) res[i] = [keys[i], obj[keys[i]]];
      return res;
    };
  }
  if (typeof Number.MAX_SAFE_INTEGER !== 'number') {
    Number.MAX_SAFE_INTEGER = 9007199254740991;
  }
  if (typeof Number.isFinite !== 'function') {
    Number.isFinite = function(v) { return typeof v === 'number' && isFinite(v); };
  }
  if (typeof Number.isInteger !== 'function') {
    Number.isInteger = function(v) { return typeof v === 'number' && isFinite(v) && Math.floor(v) === v; };
  }
  if (typeof Uint8Array !== 'undefined' && typeof Uint8Array.from !== 'function') {
    Uint8Array.from = function(src, mapFn, thisArg) {
      var arr = Array.prototype.slice.call(src);
      var out = new Uint8Array(arr.length);
      for (var i = 0; i < arr.length; i++) {
        out[i] = mapFn ? mapFn.call(thisArg, arr[i], i) : arr[i];
      }
      return out;
    };
  }
  if (typeof window !== 'undefined') {
    if (!window.MediaSource && window.WebKitMediaSource) {
      window.MediaSource = window.WebKitMediaSource;
    }
    if (!window.performance) window.performance = {};
    if (typeof window.performance.now !== 'function') {
      var __perfT0 = Date.now();
      window.performance.now = function() { return Date.now() - __perfT0; };
    }
  }
  if (typeof ArrayBuffer !== 'undefined' && !ArrayBuffer.isView) {
    ArrayBuffer.isView = function(obj) {
      return !!(obj && obj.buffer instanceof ArrayBuffer);
    };
  }

  // 5. String helpers
  if (!String.prototype.padStart) {
    String.prototype.padStart = function(n, c) {
      var s = String(this);
      c = String(c || ' ');
      while (s.length < n) s = c + s;
      return s.slice(-n);
    };
  }
  if (!String.prototype.padEnd) {
    String.prototype.padEnd = function(n, c) {
      var s = String(this);
      c = String(c || ' ');
      while (s.length < n) s = s + c;
      return s.slice(0, n);
    };
  }
  if (!Array.prototype.includes) {
    Array.prototype.includes = function(v) { return this.indexOf(v) >= 0; };
  }
  if (!Array.prototype.find) {
    Array.prototype.find = function(fn, thisArg) {
      for (var i = 0; i < this.length; i++) {
        if (fn.call(thisArg, this[i], i, this)) return this[i];
      }
      return undefined;
    };
  }
  if (!Array.prototype.findIndex) {
    Array.prototype.findIndex = function(fn, thisArg) {
      for (var i = 0; i < this.length; i++) {
        if (fn.call(thisArg, this[i], i, this)) return i;
      }
      return -1;
    };
  }
  if (!Number.isSafeInteger) {
    Number.isSafeInteger = function(n) {
      return typeof n === 'number' && isFinite(n) && Math.floor(n) === n && Math.abs(n) <= 9007199254740991;
    };
  }
  if (!String.prototype.includes) {
    String.prototype.includes = function(v) { return this.indexOf(v) >= 0; };
  }
  if (!String.prototype.startsWith) {
    String.prototype.startsWith = function(v) { return this.slice(0, v.length) === v; };
  }
  if (!String.prototype.endsWith) {
    String.prototype.endsWith = function(v) { return this.slice(-v.length) === v; };
  }

  // 6. Element matches and closest (critical for Smart TV DOM lookups)
  if (typeof Element !== 'undefined') {
    if (!Element.prototype.matches) {
      Element.prototype.matches = Element.prototype.webkitMatchesSelector ||
        Element.prototype.mozMatchesSelector ||
        Element.prototype.msMatchesSelector ||
        Element.prototype.oMatchesSelector ||
        function(s) {
          var matches = (this.document || this.ownerDocument).querySelectorAll(s),
              i = matches.length;
          while (--i >= 0 && matches.item(i) !== this) {}
          return i > -1;
        };
    }
    if (!Element.prototype.closest) {
      Element.prototype.closest = function(s) {
        var el = this;
        do {
          if (el.matches && el.matches(s)) return el;
          el = el.parentElement || el.parentNode;
        } while (el !== null && el.nodeType === 1);
        return null;
      };
    }
  }

  // 7. AbortController
  if (!window.AbortController) {
    window.AbortController = function() {
      var signal = this.signal = {
        aborted: false,
        listeners: [],
        addEventListener: function(e, fn) { if (e === 'abort') this.listeners.push(fn); },
        removeEventListener: function(e, fn) { this.listeners = this.listeners.filter(function(x) { return x !== fn; }); }
      };
      this.abort = function() {
        signal.aborted = true;
        signal.listeners.forEach(function(fn) { fn(); });
      };
    };
  }

  // 8. ResizeObserver
  if (!window.ResizeObserver) {
    window.ResizeObserver = function(fn) {
      this.observe = function(el) {
        try { fn([{ target: el, contentRect: el.getBoundingClientRect() }]); } catch (e) {}
      };
      this.disconnect = function() {};
      this.unobserve = function() {};
    };
  }

  // 9. CustomEvent
  if (typeof window !== 'undefined' && typeof window.CustomEvent !== 'function') {
    window.CustomEvent = function(event, params) {
      params = params || { bubbles: false, cancelable: false, detail: null };
      var evt = document.createEvent('CustomEvent');
      evt.initCustomEvent(event, params.bubbles, params.cancelable, params.detail);
      return evt;
    };
  }

  // 10. Tizen 3.0-10.0 ES5 Polyfills (Promise, finally, trimStart/End, URL, fetch, SourceBuffer, MediaUtils)
  var _g = typeof globalThis !== 'undefined' ? globalThis : (typeof window !== 'undefined' ? window : self);

  // 10a. String.prototype.trimStart / trimEnd
  if (!String.prototype.trimStart) {
    String.prototype.trimStart = function() { return this.replace(/^\s+/, ''); };
  }
  if (!String.prototype.trimEnd) {
    String.prototype.trimEnd = function() { return this.replace(/\s+$/, ''); };
  }

  // 10b. Promise ES5 fallback + Promise.prototype.finally + allSettled
  if (typeof _g.Promise !== 'function') {
    (function(root) {
      var PENDING = 0, FULFILLED = 1, REJECTED = 2;
      var defer = typeof setTimeout === 'function'
        ? function(fn) { setTimeout(fn, 0); }
        : function(fn) { fn(); };

      function SimplePromise(executor) {
        var self = this;
        self._state = PENDING;
        self._value = undefined;
        self._handlers = [];

        function resolve(val) {
          if (self._state !== PENDING) return;
          if (val === self) { reject(new TypeError('Chaining cycle')); return; }
          if (val && (typeof val === 'object' || typeof val === 'function')) {
            var called = false;
            try {
              var thenFn = val.then;
              if (typeof thenFn === 'function') {
                thenFn.call(val, function(v) {
                  if (!called) { called = true; resolve(v); }
                }, function(r) {
                  if (!called) { called = true; reject(r); }
                });
                return;
              }
            } catch (ex) {
              if (!called) reject(ex);
              return;
            }
          }
          self._state = FULFILLED;
          self._value = val;
          flush();
        }

        function reject(reason) {
          if (self._state !== PENDING) return;
          self._state = REJECTED;
          self._value = reason;
          flush();
        }

        function flush() {
          defer(function() {
            while (self._handlers.length) {
              var h = self._handlers.shift();
              handle(h);
            }
          });
        }

        function handle(h) {
          if (self._state === PENDING) {
            self._handlers.push(h);
            return;
          }
          var cb = self._state === FULFILLED ? h.onFulfilled : h.onRejected;
          if (typeof cb !== 'function') {
            (self._state === FULFILLED ? h.resolve : h.reject)(self._value);
            return;
          }
          try {
            h.resolve(cb(self._value));
          } catch (ex) {
            h.reject(ex);
          }
        }

        self._handle = handle;
        try {
          executor(resolve, reject);
        } catch (ex) {
          reject(ex);
        }
      }

      SimplePromise.prototype.then = function(onFulfilled, onRejected) {
        var self = this;
        return new SimplePromise(function(resolve, reject) {
          defer(function() {
            self._handle({
              onFulfilled: onFulfilled,
              onRejected: onRejected,
              resolve: resolve,
              reject: reject
            });
          });
        });
      };

      SimplePromise.prototype['catch'] = function(onRejected) {
        return this.then(null, onRejected);
      };

      SimplePromise.resolve = function(v) {
        if (v instanceof SimplePromise) return v;
        return new SimplePromise(function(res) { res(v); });
      };

      SimplePromise.reject = function(r) {
        return new SimplePromise(function(_, rej) { rej(r); });
      };

      SimplePromise.all = function(arr) {
        return new SimplePromise(function(resolve, reject) {
          var list = Array.prototype.slice.call(arr || []);
          if (!list.length) { resolve([]); return; }
          var out = new Array(list.length);
          var rem = list.length;
          for (var i = 0; i < list.length; i++) {
            (function(idx) {
              SimplePromise.resolve(list[idx]).then(function(val) {
                out[idx] = val;
                if (--rem === 0) resolve(out);
              }, reject);
            })(i);
          }
        });
      };

      SimplePromise.race = function(arr) {
        return new SimplePromise(function(resolve, reject) {
          var list = Array.prototype.slice.call(arr || []);
          for (var i = 0; i < list.length; i++) {
            SimplePromise.resolve(list[i]).then(resolve, reject);
          }
        });
      };

      root.Promise = SimplePromise;
    })(_g);
  }

  if (typeof _g.Promise === 'function' && !_g.Promise.prototype['finally']) {
    _g.Promise.prototype['finally'] = function(cb) {
      var P = this.constructor || _g.Promise;
      return this.then(
        function(val) { return P.resolve(typeof cb === 'function' ? cb() : undefined).then(function() { return val; }); },
        function(err) { return P.resolve(typeof cb === 'function' ? cb() : undefined).then(function() { throw err; }); }
      );
    };
  }

  if (typeof _g.Promise === 'function' && !_g.Promise.allSettled) {
    _g.Promise.allSettled = function(arr) {
      var list = Array.prototype.slice.call(arr || []);
      return _g.Promise.all(list.map(function(p) {
        return _g.Promise.resolve(p).then(
          function(v) { return { status: 'fulfilled', value: v }; },
          function(e) { return { status: 'rejected', reason: e }; }
        );
      }));
    };
  }

  // 10c. Safe URL polyfill (preserving URL.createObjectURL / revokeObjectURL)
  if (typeof _g.URL !== 'function') {
    (function(root) {
      var origURL = root.URL;
      function makeSearchParams(qs) {
        var map = {};
        if (qs) {
          var clean = qs.charAt(0) === '?' ? qs.slice(1) : qs;
          if (clean) {
            var parts = clean.split('&');
            for (var i = 0; i < parts.length; i++) {
              var kv = parts[i].split('=');
              var k = decodeURIComponent((kv[0] || '').replace(/\+/g, ' '));
              var v = decodeURIComponent((kv.slice(1).join('=') || '').replace(/\+/g, ' '));
              if (k) map[k] = v;
            }
          }
        }
        return {
          get: function(k) { return Object.prototype.hasOwnProperty.call(map, k) ? map[k] : null; },
          set: function(k, v) { map[k] = String(v); },
          has: function(k) { return Object.prototype.hasOwnProperty.call(map, k); },
          'delete': function(k) { delete map[k]; },
          toString: function() {
            var out = [];
            for (var k in map) {
              if (Object.prototype.hasOwnProperty.call(map, k)) {
                out.push(encodeURIComponent(k) + '=' + encodeURIComponent(map[k]));
              }
            }
            return out.join('&');
          }
        };
      }
      function PolyURL(url, base) {
        var s = String(url || '');
        if (base && !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(s)) {
          var b = new PolyURL(base);
          if (s.charAt(0) === '/') s = b.origin + s;
          else s = b.origin + b.pathname.replace(/\/[^\/]*$/, '/') + s;
        }
        var m = s.match(/^([a-zA-Z][a-zA-Z0-9+.-]*:)\/\/([^\/?#]+)([^?#]*)(\?[^#]*)?(#.*)?$/);
        if (!m) throw new TypeError('Invalid URL: ' + s);
        var hostParts = m[2].split(':');
        this.protocol = m[1];
        this.host = m[2];
        this.hostname = hostParts[0] || '';
        this.port = hostParts[1] || '';
        this.pathname = m[3] || '/';
        this.search = m[4] || '';
        this.hash = m[5] || '';
        this.origin = this.protocol + '//' + this.host;
        this.href = s;
        this.searchParams = makeSearchParams(this.search);
      }
      PolyURL.prototype.toString = function() { return this.href; };
      if (origURL && origURL.createObjectURL) PolyURL.createObjectURL = origURL.createObjectURL;
      if (origURL && origURL.revokeObjectURL) PolyURL.revokeObjectURL = origURL.revokeObjectURL;
      root.URL = PolyURL;
    })(_g);
  }

  // 10d. XHR-backed fetch() polyfill for Tizen 3.0 (WebKit 538.1)
  if (typeof _g.fetch !== 'function' && typeof XMLHttpRequest !== 'undefined') {
    (function(root) {
      function PolyHeaders(init) {
        this._map = {};
        if (init) {
          for (var k in init) {
            if (Object.prototype.hasOwnProperty.call(init, k)) {
              this._map[String(k).toLowerCase()] = String(init[k]);
            }
          }
        }
      }
      PolyHeaders.prototype.get = function(k) {
        var lk = String(k || '').toLowerCase();
        return Object.prototype.hasOwnProperty.call(this._map, lk) ? this._map[lk] : null;
      };
      PolyHeaders.prototype.has = function(k) {
        return Object.prototype.hasOwnProperty.call(this._map, String(k || '').toLowerCase());
      };
      PolyHeaders.prototype.set = function(k, v) {
        this._map[String(k || '').toLowerCase()] = String(v);
      };
      PolyHeaders.prototype.forEach = function(cb, ctx) {
        for (var k in this._map) {
          if (Object.prototype.hasOwnProperty.call(this._map, k)) cb.call(ctx, this._map[k], k, this);
        }
      };

      function decodeUtf8Bytes(buf) {
        var u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf || 0);
        if (typeof TextDecoder === 'function') {
          try { return new TextDecoder('utf-8').decode(u8); } catch (_) {}
        }
        var out = '';
        for (var i = 0; i < u8.length;) {
          var b = u8[i++];
          if (b < 128) out += String.fromCharCode(b);
          else if (b < 224) out += String.fromCharCode(((b & 31) << 6) | (u8[i++] & 63));
          else if (b < 240) out += String.fromCharCode(((b & 15) << 12) | ((u8[i++] & 63) << 6) | (u8[i++] & 63));
          else {
            var cp = (((b & 7) << 18) | ((u8[i++] & 63) << 12) | ((u8[i++] & 63) << 6) | (u8[i++] & 63)) - 65536;
            out += String.fromCharCode(55296 + (cp >> 10), 56320 + (cp & 1023));
          }
        }
        return out;
      }

      if (typeof root.Headers !== 'function') root.Headers = PolyHeaders;
      root.fetch = function(url, opts) {
        opts = opts || {};
        return new root.Promise(function(resolve, reject) {
          if (opts.signal && opts.signal.aborted) {
            reject(new Error('Aborted'));
            return;
          }
          var xhr = new XMLHttpRequest();
          var method = String(opts.method || 'GET').toUpperCase();
          var targetUrl = String(url);
          xhr.open(method, targetUrl, true);
          try { xhr.responseType = 'arraybuffer'; } catch (_) {}

          if (opts.headers) {
            if (typeof opts.headers.forEach === 'function') {
              opts.headers.forEach(function(v, k) {
                try { xhr.setRequestHeader(k, v); } catch (_) {}
              });
            } else {
              for (var hk in opts.headers) {
                if (Object.prototype.hasOwnProperty.call(opts.headers, hk)) {
                  try { xhr.setRequestHeader(hk, opts.headers[hk]); } catch (_) {}
                }
              }
            }
          }

          var aborted = false;
          if (opts.signal && typeof opts.signal.addEventListener === 'function') {
            opts.signal.addEventListener('abort', function() {
              aborted = true;
              try { xhr.abort(); } catch (_) {}
              reject(new Error('Aborted'));
            });
          }

          xhr.onload = function() {
            if (aborted) return;
            var status = xhr.status === 0 && !/^https?:/.test(targetUrl) ? 200 : xhr.status;
            var rawHdrs = {};
            try {
              var lines = (xhr.getAllResponseHeaders() || '').split(/\r?\n/);
              for (var i = 0; i < lines.length; i++) {
                var idx = lines[i].indexOf(':');
                if (idx > 0) {
                  rawHdrs[lines[i].slice(0, idx).trim().toLowerCase()] = lines[i].slice(idx + 1).trim();
                }
              }
            } catch (_) {}

            var ab = xhr.response instanceof ArrayBuffer
              ? xhr.response
              : (function() {
                var txt = xhr.responseText || '';
                var u = new Uint8Array(txt.length);
                for (var j = 0; j < txt.length; j++) u[j] = txt.charCodeAt(j) & 255;
                return u.buffer;
              })();

            resolve({
              ok: status >= 200 && status < 300,
              status: status,
              statusText: xhr.statusText || '',
              url: xhr.responseURL || targetUrl,
              headers: new PolyHeaders(rawHdrs),
              arrayBuffer: function() { return root.Promise.resolve(ab); },
              text: function() { return root.Promise.resolve(decodeUtf8Bytes(ab)); },
              json: function() {
                try { return root.Promise.resolve(JSON.parse(decodeUtf8Bytes(ab))); }
                catch (ex) { return root.Promise.reject(ex); }
              }
            });
          };

          xhr.onerror = function() {
            if (!aborted) reject(new Error('Network error fetching ' + targetUrl));
          };
          xhr.ontimeout = function() {
            if (!aborted) reject(new Error('Timeout fetching ' + targetUrl));
          };
          xhr.onabort = function() {
            if (!aborted) { aborted = true; reject(new Error('Aborted')); }
          };

          try {
            xhr.send(opts.body !== undefined ? opts.body : null);
          } catch (sendErr) {
            reject(sendErr);
          }
        });
      };
    })(_g);
  }

  // 10e. SourceBuffer wrapper omitted: xe-hevc-engine / xe-mp4-engine / Hls.js manage their own MSE buffers.

  // 10f. XuperMediaUtils: PNG wrapper stripper for disguised .ts segments + HLS.js loader + ES5 fMP4 MSE fallback
  function stripPngWrapper(input) {
    if (!input) return input;
    var isAb = (typeof ArrayBuffer !== 'undefined') && (input instanceof ArrayBuffer);
    var u8 = isAb ? new Uint8Array(input) : (input instanceof Uint8Array ? input : null);
    if (!u8 || u8.length < 72) return input;

    // Cabecera PNG camuflada (0x89 0x50 0x4E 0x47)
    if (u8[0] === 0x89 && u8[1] === 0x50 && u8[2] === 0x4E && u8[3] === 0x47) {
      var cut = -1;
      var exactLen = -1;
      // Chunk directo prVt / pVrT en offset 33 (después de PNG sig + IHDR = 33 bytes)
      if (u8.length > 420 && u8[37] === 0x70 && (u8[38] === 0x72 || u8[38] === 0x56) && u8[41] === 0x47 && u8[41 + 188] === 0x47) {
        cut = 41;
        var cLen = ((u8[33] << 24) | (u8[34] << 16) | (u8[35] << 8) | u8[36]) >>> 0;
        if (cLen >= 188 && cut + cLen <= u8.length) {
          exactLen = cLen - (cLen % 188);
        }
      }
      if (cut < 0 && u8.length > 445 && u8[67] === 0x47 && u8[67 + 188] === 0x47 && u8[67 + 376] === 0x47) {
        cut = 67;
      }
      if (cut < 0) {
        var maxScan = Math.min(u8.length - 377, 1024);
        for (var i = 4; i < maxScan; i++) {
          if (u8[i] === 0x47 && u8[i + 188] === 0x47 && u8[i + 376] === 0x47) {
            cut = i;
            break;
          }
        }
      }
      if (cut > 0) {
        var tsLen = exactLen > 0 ? exactLen : (u8.length - cut);
        if (tsLen >= 188) tsLen -= (tsLen % 188);
        return isAb ? input.slice(cut, cut + tsLen) : u8.subarray(cut, cut + tsLen);
      }
    }
    return input;
  }

  function createPngStripLoader(HlsCtor) {
    if (!HlsCtor || !HlsCtor.DefaultConfig || !HlsCtor.DefaultConfig.loader) return null;
    var BaseLoader = HlsCtor.DefaultConfig.loader;
    function PngStripLoader(config) {
      BaseLoader.call(this, config);
    }
    PngStripLoader.prototype = Object.create(BaseLoader.prototype);
    PngStripLoader.prototype.constructor = PngStripLoader;
    var seqTracker = { url: '', map: {}, order: [], maxSeq: -1 };
    function normalizeSeqPlaylistText(txt, plUrl) {
      var mSeq = /#EXT-X-MEDIA-SEQUENCE:[ \t]*(\d+)/.exec(txt);
      if (!mSeq || txt.indexOf('#EXTINF') === -1) return txt;
      var plKey = String(plUrl || '').split('?')[0];
      if (plKey && seqTracker.url !== plKey) {
        seqTracker.url = plKey;
        seqTracker.map = {};
        seqTracker.order = [];
        seqTracker.maxSeq = -1;
      }
      var lines = txt.split(/\r?\n/);
      var segs = [];
      for (var li = 0; li < lines.length; li++) {
        var ln = String(lines[li] || '').trim();
        if (ln && ln.charAt(0) !== '#') {
          var noQ = ln.split('?')[0];
          var pathIdx = noQ.indexOf('://');
          if (pathIdx !== -1) {
            var slIdx = noQ.indexOf('/', pathIdx + 3);
            noQ = slIdx !== -1 ? noQ.slice(slIdx) : noQ;
          }
          segs.push(noQ);
        }
      }
      if (!segs.length) return txt;
      var rawSeq = Number(mSeq[1]);
      var nextSeq = rawSeq;
      var matchedAt = -1;
      for (var si = 0; si < segs.length; si++) {
        if (Object.prototype.hasOwnProperty.call(seqTracker.map, segs[si])) {
          matchedAt = si;
          break;
        }
      }
      if (matchedAt >= 0) {
        nextSeq = seqTracker.map[segs[matchedAt]] - matchedAt;
      } else if (seqTracker.maxSeq >= 0 && nextSeq < seqTracker.maxSeq) {
        nextSeq = seqTracker.maxSeq;
      }
      for (var si2 = 0; si2 < segs.length; si2++) {
        var sk = segs[si2];
        if (!Object.prototype.hasOwnProperty.call(seqTracker.map, sk)) {
          seqTracker.order.push(sk);
        }
        seqTracker.map[sk] = nextSeq + si2;
      }
      if (nextSeq + segs.length > seqTracker.maxSeq) {
        seqTracker.maxSeq = nextSeq + segs.length;
      }
      while (seqTracker.order.length > 300) {
        var oldK = seqTracker.order.shift();
        delete seqTracker.map[oldK];
      }
      if (nextSeq === rawSeq) return txt;
      return txt.replace(mSeq[0], '#EXT-X-MEDIA-SEQUENCE:' + nextSeq);
    }
    var origLoad = BaseLoader.prototype.load;
    PngStripLoader.prototype.load = function(context, config, callbacks) {
      if (config && config._xeRelayPortal && context && context.url &&
          /^https:\/\/[^\/:]+(\/|$)/i.test(String(context.url)) &&
          _g.XuperRelay && typeof _g.XuperRelay.wrapPortalRequest === 'function') {
        var origUrl = String(context.url);
        var wr = _g.XuperRelay.wrapPortalRequest(origUrl, { method: 'GET', headers: {} });
        if (wr && wr.relayed) {
          context._xeOrigUrl = origUrl;
          context.url = wr.url;
          config._xeRelayHdrsMap = config._xeRelayHdrsMap || {};
          config._xeRelayHdrsMap[wr.url] = (wr.options && wr.options.headers) || {};
        }
      }
      var wrappedCallbacks = callbacks ? Object.assign({}, callbacks) : {};
      if (callbacks && typeof callbacks.onSuccess === 'function') {
        wrappedCallbacks.onSuccess = function(response, stats, ctx, details) {
          try {
            if (context && context._xeOrigUrl && response && typeof response.data === 'string' && response.data.indexOf('#EXTM3U') !== -1) {
              try { response.url = context._xeOrigUrl; } catch (_) {}
              if (ctx) { try { ctx.url = context._xeOrigUrl; } catch (_) {} }
            }
            if (response && response.data) {
              if (response.data instanceof ArrayBuffer || response.data instanceof Uint8Array) {
                response.data = stripPngWrapper(response.data);
              } else if (typeof response.data === 'string' && response.data.indexOf('#EXTM3U') !== -1 &&
                         response.data.indexOf('#EXT-X-ENDLIST') === -1 &&
                         (/epictvparaiphone\.top|playlatam\.site|\/perelman\//i.test(String(response.url || (context && (context._xeOrigUrl || context.url)) || '')) ||
                          (_g.__xuperCurrentStreamMeta && _g.__xuperCurrentStreamMeta.headers && (_g.__xuperCurrentStreamMeta.headers['X-Pulsera'] || _g.__xuperCurrentStreamMeta.headers['X-Cookie'])))) {
                // Evita seek preciso en mitad de segmento al abrir en vivo y estabiliza EXT-X-MEDIA-SEQUENCE
                var m3uTxt = response.data.replace(/#EXT-X-START:[^\r\n]*(\r?\n)?/g, '');
                var plSrcUrl = String(response.url || (context && (context._xeOrigUrl || context.url)) || '');
                response.data = normalizeSeqPlaylistText(m3uTxt, plSrcUrl);
              }
            }
          } catch (_) {}
          return callbacks.onSuccess(response, stats, ctx, details);
        };
      }
      return origLoad.call(this, context, config, wrappedCallbacks);
    };
    return PngStripLoader;
  }

  var __fmp4State = null;
  function stopDirectFmp4Live() {
    var st = __fmp4State;
    __fmp4State = null;
    if (!st) return;
    st.stopped = true;
    if (st.timer) try { clearTimeout(st.timer); } catch (_) {}
    if (st.abort) try { st.abort.abort(); } catch (_) {}
    if (st.video) {
      try {
        if (st.onPlaying) st.video.removeEventListener('playing', st.onPlaying);
        if (st.onErr) st.video.removeEventListener('error', st.onErr);
        st.video.pause();
        st.video.removeAttribute('src');
      } catch (_) {}
    }
    if (st.blobUrl) try { URL.revokeObjectURL(st.blobUrl); } catch (_) {}
  }

  function startDirectFmp4Live(videoEl, manifestUrl, hdrs, cbs) {
    stopDirectFmp4Live();
    cbs = cbs || {};
    var MS = _g.MediaSource || _g.WebKitMediaSource;
    if (!videoEl || !MS || !_g.CactusFmp4) return false;
    var st = {
      stopped: false,
      video: videoEl,
      abort: typeof _g.AbortController === 'function' ? new _g.AbortController() : null,
      timer: null,
      blobUrl: '',
      segCache: {},
      started: false,
      noAudio: false
    };
    __fmp4State = st;

    function resolveAbs(ref, base) {
      ref = String(ref || '').trim();
      if (/^https?:\/\//i.test(ref)) return ref;
      try { return new URL(ref, base).href; } catch (_) {}
      var m = /^(https?:\/\/[^\/]+)(\/[^?#]*)?/.exec(String(base || ''));
      if (!m) return ref;
      if (ref.charAt(0) === '/') return m[1] + ref;
      return m[1] + (m[2] || '/').replace(/\/[^\/]*$/, '/') + ref;
    }

    function req(url, asBin) {
      var reqH = {};
      var uStr = String(url || '');
      var rBase = (_g.XuperRelay && typeof _g.XuperRelay.relayBase === 'function') ? _g.XuperRelay.relayBase() : '';
      var isRelayTarget = /workers\.dev/i.test(uStr) || (rBase && uStr.indexOf(rBase) === 0);
      if (hdrs) {
        if (isRelayTarget) {
          for (var hk in hdrs) {
            if (Object.prototype.hasOwnProperty.call(hdrs, hk) && hdrs[hk]) {
              reqH[hk] = hdrs[hk];
            }
          }
          if (hdrs['X-Pulsera'] && !reqH['X-Cookie']) {
            reqH['X-Cookie'] = '__Host-pulsera=' + hdrs['X-Pulsera'];
          }
        } else if (/epictvparaiphone\.top|playlatam\.site/i.test(uStr)) {
          if (hdrs['X-Cred']) reqH['X-Cred'] = hdrs['X-Cred'];
          if (hdrs['X-Pulsera']) reqH['X-Pulsera'] = hdrs['X-Pulsera'];
        }
      }
      return fetch(url, {
        method: 'GET',
        headers: reqH,
        signal: st.abort ? st.abort.signal : undefined,
        cache: 'no-store',
        redirect: 'follow'
      }).then(function(r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return asBin ? r.arrayBuffer() : r.text();
      });
    }

    function fetchPlaylist(url) {
      var target = url;
      var rBase = (_g.XuperRelay && typeof _g.XuperRelay.relayBase === 'function') ? _g.XuperRelay.relayBase() : '';
      if (rBase && manifestUrl.indexOf(rBase) === 0 && /epictvparaiphone\.top|playlatam\.site/i.test(String(target || ''))) {
        var wrappedVar = _g.XuperRelay.wrapPortalRequest(target, { headers: hdrs || {} });
        if (wrappedVar && wrappedVar.relayed) {
          target = wrappedVar.url;
          if (wrappedVar.options && wrappedVar.options.headers) hdrs = Object.assign({}, hdrs || {}, wrappedVar.options.headers);
        }
      }
      return req(target, false).then(function(txt) {
        var lines = txt.replace(/\r/g, '').split('\n');
        var seqBase = 0, target = 5, variant = null, chunks = [];
        for (var i = 0; i < lines.length; i++) {
          var l = lines[i].trim();
          if (!l) continue;
          if (l.indexOf('#EXT-X-STREAM-INF:') === 0) {
            for (var j = i + 1; j < lines.length; j++) {
              var nl = lines[j].trim();
              if (nl && nl.charAt(0) !== '#') { variant = resolveAbs(nl, url); break; }
            }
            break;
          }
          if (l.indexOf('#EXT-X-MEDIA-SEQUENCE:') === 0) seqBase = parseInt(l.split(':')[1], 10) || 0;
          else if (l.indexOf('#EXT-X-TARGETDURATION:') === 0) target = Math.max(2, parseInt(l.split(':')[1], 10) || 5);
          else if (l.charAt(0) !== '#') chunks.push({ seq: seqBase + chunks.length, url: resolveAbs(l, url) });
        }
        if (variant) return fetchPlaylist(variant);
        return { target: target, chunks: chunks };
      });
    }

    function fetchSeg(item) {
      if (st.segCache[item.seq]) return Promise.resolve(st.segCache[item.seq]);
      var p = req(item.url, true).then(function(ab) {
        var clean = stripPngWrapper(ab);
        st.segCache[item.seq] = clean;
        return clean;
      }).catch(function(e) {
        delete st.segCache[item.seq];
        throw e;
      });
      st.segCache[item.seq] = p;
      return p;
    }

    function sbAppend(sb, buf) {
      return new Promise(function(resolve, reject) {
        if (st.stopped) return resolve();
        function run() {
          var done = false;
          var tmo = setTimeout(function() { cleanup(); resolve(); }, 8000);
          function cleanup() {
            clearTimeout(tmo);
            sb.removeEventListener('updateend', onOk);
            sb.removeEventListener('error', onBad);
          }
          function onOk() { if (!done) { done = true; cleanup(); resolve(); } }
          function onBad() { if (!done) { done = true; cleanup(); reject(new Error('SourceBuffer error')); } }
          sb.addEventListener('updateend', onOk);
          sb.addEventListener('error', onBad);
          try {
            sb.appendBuffer(buf);
          } catch (e) {
            done = true; cleanup(); reject(e);
          }
        }
        if (!sb.updating) run();
        else {
          var waitFn = function() { sb.removeEventListener('updateend', waitFn); run(); };
          sb.addEventListener('updateend', waitFn);
        }
      });
    }

    function sbTrim(sb, ct) {
      if (!sb || st.stopped || !ct || ct < 35 || sb.updating) return Promise.resolve();
      try {
        if (sb.buffered && sb.buffered.length && sb.buffered.start(0) < ct - 24) {
          return new Promise(function(resolve) {
            var fn = function() { sb.removeEventListener('updateend', fn); resolve(); };
            sb.addEventListener('updateend', fn);
            try { sb.remove(sb.buffered.start(0), ct - 20); } catch (_) { sb.removeEventListener('updateend', fn); resolve(); }
          });
        }
      } catch (_) {}
      return Promise.resolve();
    }

    function failOut(err) {
      if (st.stopped) return;
      stopDirectFmp4Live();
      if (typeof cbs.onError === 'function') cbs.onError(err);
    }

    st.onPlaying = function() {
      if (st.stopped) return;
      st.started = true;
      if (typeof cbs.onPlaying === 'function') cbs.onPlaying();
    };
    st.onErr = function() {
      if (st.stopped) return;
      var code = videoEl.error ? videoEl.error.code : 0;
      if (!st.started) failOut(new Error('MSE video error ' + code));
    };
    videoEl.addEventListener('playing', st.onPlaying);
    videoEl.addEventListener('error', st.onErr);

    fetchPlaylist(manifestUrl).then(function(info) {
      if (st.stopped) return;
      var list = info.chunks || [];
      if (!list.length) throw new Error('Sin segmentos en playlist');
      var startIdx = Math.max(0, list.length - 6);
      var firstItem = list[startIdx];
      if (list[startIdx + 1]) fetchSeg(list[startIdx + 1]).catch(function() {});

      return fetchSeg(firstItem).then(function(bytes) {
        if (st.stopped) return;
        var parsed = _g.CactusFmp4.demux(new Uint8Array(bytes));
        var v = parsed && parsed.video;
        var a = (!st.noAudio && parsed && parsed.audio && parsed.audio.length) ? parsed.audio[0] : null;
        if (!v || !v.codec) throw new Error('Pista de vídeo no reconocida');
        var mimeV = 'video/mp4; codecs="' + v.codec + '"';
        if (!MS.isTypeSupported(mimeV)) throw new Error('MSE no soporta ' + v.codec);
        var mimeA = a ? ('audio/mp4; codecs="' + a.codec + '"') : null;
        if (mimeA && !MS.isTypeSupported(mimeA)) { a = null; mimeA = null; }

        var ms = new MS();
        st.blobUrl = URL.createObjectURL(ms);
        videoEl.src = st.blobUrl;

        var msOpened = false;
        function onSourceOpen() {
          if (msOpened || st.stopped || ms.readyState !== 'open') return;
          msOpened = true;
          var vb = ms.addSourceBuffer(mimeV);
          var ab = null;
          if (mimeA) { try { ab = ms.addSourceBuffer(mimeA); } catch (_) { ab = null; a = null; } }
          var vOrig = v.samples[0].dts;
          var aOrig = (ab && a && a.samples.length) ? a.samples[0].dts : 0;
          var hints = { video: { params: v.params, sps: v.sps } };
          var mp4Seq = 1, lastSeq = firstItem.seq;

          sbAppend(vb, _g.CactusFmp4.initSegment(v)).then(function() {
            return (ab && a) ? sbAppend(ab, _g.CactusFmp4.initSegment(a)) : null;
          }).then(function() {
            return sbAppend(vb, _g.CactusFmp4.mediaSegment(v, mp4Seq, 0));
          }).then(function() {
            if (ab && a && a.samples.length) {
              return sbAppend(ab, _g.CactusFmp4.mediaSegment(a, mp4Seq, Math.max(0, Math.round(a.samples[0].dts - aOrig))));
            }
          }).then(function() {
            if (st.stopped) return;
            mp4Seq++;
            delete st.segCache[firstItem.seq];
            try { videoEl.muted = false; videoEl.volume = 1; } catch (_) {}
            var pr = videoEl.play();
            if (pr && pr.catch) pr.catch(function() { try { videoEl.muted = true; videoEl.play(); } catch (_) {} });

            function step() {
              if (st.stopped) return;
              fetchPlaylist(manifestUrl).then(function(nxt) {
                if (st.stopped) return;
                var arr = (nxt && nxt.chunks) || [];
                var pending = [];
                for (var k = 0; k < arr.length; k++) {
                  if (arr[k].seq > lastSeq) pending.push(arr[k]);
                }
                function nextSeg(idx) {
                  if (st.stopped) return;
                  if (idx >= pending.length) {
                    st.timer = setTimeout(step, Math.min(3000, Math.max(1000, (nxt.target || 5) * 350)));
                    return;
                  }
                  var item = pending[idx];
                  lastSeq = item.seq;
                  if (pending[idx + 1]) fetchSeg(pending[idx + 1]).catch(function() {});
                  fetchSeg(item).then(function(abuf) {
                    if (st.stopped) return;
                    var dm = _g.CactusFmp4.demux(new Uint8Array(abuf), hints);
                    var dv = dm && dm.video, da = (ab && dm && dm.audio && dm.audio.length) ? dm.audio[0] : null;
                    if (!dv || !dv.samples.length) return nextSeg(idx + 1);
                    hints = { video: { params: dv.params, sps: dv.sps } };
                    var vt = Math.max(0, Math.round(dv.samples[0].dts - vOrig));
                    return sbAppend(vb, _g.CactusFmp4.mediaSegment(dv, mp4Seq, vt)).then(function() {
                      if (ab && da && da.samples.length) {
                        var at = Math.max(0, Math.round(da.samples[0].dts - aOrig));
                        return sbAppend(ab, _g.CactusFmp4.mediaSegment(da, mp4Seq, at));
                      }
                    }).then(function() {
                      mp4Seq++;
                      delete st.segCache[item.seq];
                      return sbTrim(vb, videoEl.currentTime || 0).then(function() {
                        return ab ? sbTrim(ab, videoEl.currentTime || 0) : null;
                      });
                    }).then(function waitBuf() {
                      if (st.stopped) return;
                      var b = videoEl.buffered;
                      if (!b || !b.length || (b.end(b.length - 1) - (videoEl.currentTime || 0)) <= 24) {
                        return nextSeg(idx + 1);
                      }
                      st.timer = setTimeout(waitBuf, 350);
                    });
                  }).catch(function() {
                    if (!st.stopped) st.timer = setTimeout(function() { nextSeg(idx + 1); }, 300);
                  });
                }
                nextSeg(0);
              }).catch(function() {
                if (!st.stopped) st.timer = setTimeout(step, 2000);
              });
            }
            step();
          }).catch(failOut);
        }
        ms.addEventListener('sourceopen', onSourceOpen);
        ms.addEventListener('webkitsourceopen', onSourceOpen);
      });
    }).catch(failOut);

    return true;
  }

  _g.XuperMediaUtils = {
    stripPngWrapper: stripPngWrapper,
    createPngStripLoader: createPngStripLoader,
    startDirectFmp4Live: startDirectFmp4Live,
    stopDirectFmp4Live: stopDirectFmp4Live
  };

  // 11. Normalize HTMLMediaElement.play() to always return a Promise.
  // Tizen 3.0 (WebKit 538.1) returns `undefined` from play(), so the common
  // `video.play().catch(...)` pattern throws TypeError and aborts the VOD/HEVC
  // append loop after the first segment. Wrap it so every caller can chain
  // .then/.catch regardless of the engine version.
  if (typeof window !== 'undefined' && window.HTMLMediaElement) {
    try {
      var __origPlay = HTMLMediaElement.prototype.play;
      HTMLMediaElement.prototype.play = function() {
        try {
          var __r = __origPlay.apply(this, arguments);
          if (__r && typeof __r.then === 'function') return __r;
          return Promise.resolve();
        } catch (__e) {
          return Promise.resolve();
        }
      };
    } catch (_) {}
  }
})();
