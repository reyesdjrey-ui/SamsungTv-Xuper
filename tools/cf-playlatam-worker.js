// Cloudflare Worker: PlayLatam Channel List & Stream Proxy (protegido con firma HMAC-MD5)
// Variables / Secrets requeridos en Cloudflare Worker (Settings -> Variables and Secrets):
//   ORACLE_ORIGIN = http://<tu-origin-hostname>:8080
//   ORIGIN_KEY    = contenido de /opt/xuper/.origin_key en tu servidor Oracle (Secret)
//   SIGN_SALT     = clave compartida de firma Eclex (Secret, igual a RELAY_SALT de la app)

const MAX_CLOCK_SKEW_MS = 6 * 60 * 60 * 1000; // 6 horas para partidos largos y relojes TV desfasados

function md5(str) {
  function rotateLeft(lValue, iShiftBits) {
    return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
  }
  function addUnsigned(lX, lY) {
    var lX8 = lX & 0x80000000;
    var lY8 = lY & 0x80000000;
    var lX4 = lX & 0x40000000;
    var lY4 = lY & 0x40000000;
    var lResult = (lX & 0x3fffffff) + (lY & 0x3fffffff);
    if (lX4 & lY4) return lResult ^ 0x80000000 ^ lX8 ^ lY8;
    if (lX4 | lY4) {
      if (lResult & 0x40000000) return lResult ^ 0xc0000000 ^ lX8 ^ lY8;
      return lResult ^ 0x40000000 ^ lX8 ^ lY8;
    }
    return lResult ^ lX8 ^ lY8;
  }
  function F(x, y, z) { return (x & y) | (~x & z); }
  function G(x, y, z) { return (x & z) | (y & ~z); }
  function H(x, y, z) { return x ^ y ^ z; }
  function I(x, y, z) { return y ^ (x | ~z); }
  function FF(a, b, c, d, x, s, ac) { a = addUnsigned(a, addUnsigned(addUnsigned(F(b, c, d), x), ac)); return addUnsigned(rotateLeft(a, s), b); }
  function GG(a, b, c, d, x, s, ac) { a = addUnsigned(a, addUnsigned(addUnsigned(G(b, c, d), x), ac)); return addUnsigned(rotateLeft(a, s), b); }
  function HH(a, b, c, d, x, s, ac) { a = addUnsigned(a, addUnsigned(addUnsigned(H(b, c, d), x), ac)); return addUnsigned(rotateLeft(a, s), b); }
  function II(a, b, c, d, x, s, ac) { a = addUnsigned(a, addUnsigned(addUnsigned(I(b, c, d), x), ac)); return addUnsigned(rotateLeft(a, s), b); }
  function convertToWordArray(s) {
    var lMessageLength = s.length;
    var lNumberOfWordsTemp1 = lMessageLength + 8;
    var lNumberOfWordsTemp2 = (lNumberOfWordsTemp1 - (lNumberOfWordsTemp1 % 64)) / 64;
    var lNumberOfWords = (lNumberOfWordsTemp2 + 1) * 16;
    var lWordArray = Array(lNumberOfWords - 1);
    var lByteCount = 0;
    while (lByteCount < lMessageLength) {
      var lWordCount = (lByteCount - (lByteCount % 4)) / 4;
      var lBytePosition = (lByteCount % 4) * 8;
      lWordArray[lWordCount] = lWordArray[lWordCount] | (s.charCodeAt(lByteCount) << lBytePosition);
      lByteCount++;
    }
    var wc = (lByteCount - (lByteCount % 4)) / 4;
    var bp = (lByteCount % 4) * 8;
    lWordArray[wc] = lWordArray[wc] | (0x80 << bp);
    lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
    lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
    return lWordArray;
  }
  function wordToHex(lValue) {
    var out = "";
    for (var i = 0; i <= 3; i++) {
      var b = (lValue >>> (i * 8)) & 255;
      var t = "0" + b.toString(16);
      out += t.substr(t.length - 2, 2);
    }
    return out;
  }
  var bytes = new TextEncoder().encode(str);
  var utf8Str = "";
  for (var i = 0; i < bytes.length; i++) utf8Str += String.fromCharCode(bytes[i]);
  var x = convertToWordArray(utf8Str);
  var a = 0x67452301, b = 0xefcdab89, c = 0x98badcfe, d = 0x10325476;
  var S11 = 7, S12 = 12, S13 = 17, S14 = 22, S21 = 5, S22 = 9, S23 = 14, S24 = 20;
  var S31 = 4, S32 = 11, S33 = 16, S34 = 23, S41 = 6, S42 = 10, S43 = 15, S44 = 21;
  for (var k = 0; k < x.length; k += 16) {
    var AA = a, BB = b, CC = c, DD = d;
    a = FF(a, b, c, d, x[k + 0], S11, 0xd76aa478); d = FF(d, a, b, c, x[k + 1], S12, 0xe8c7b756); c = FF(c, d, a, b, x[k + 2], S13, 0x242070db); b = FF(b, c, d, a, x[k + 3], S14, 0xc1bdceee);
    a = FF(a, b, c, d, x[k + 4], S11, 0xf57c0faf); d = FF(d, a, b, c, x[k + 5], S12, 0x4787c62a); c = FF(c, d, a, b, x[k + 6], S13, 0xa8304613); b = FF(b, c, d, a, x[k + 7], S14, 0xfd469501);
    a = FF(a, b, c, d, x[k + 8], S11, 0x698098d8); d = FF(d, a, b, c, x[k + 9], S12, 0x8b44f7af); c = FF(c, d, a, b, x[k + 10], S13, 0xffff5bb1); b = FF(b, c, d, a, x[k + 11], S14, 0x895cd7be);
    a = FF(a, b, c, d, x[k + 12], S11, 0x6b901122); d = FF(d, a, b, c, x[k + 13], S12, 0xfd987193); c = FF(c, d, a, b, x[k + 14], S13, 0xa679438e); b = FF(b, c, d, a, x[k + 15], S14, 0x49b40821);
    a = GG(a, b, c, d, x[k + 1], S21, 0xf61e2562); d = GG(d, a, b, c, x[k + 6], S22, 0xc040b340); c = GG(c, d, a, b, x[k + 11], S23, 0x265e5a51); b = GG(b, c, d, a, x[k + 0], S24, 0xe9b6c7aa);
    a = GG(a, b, c, d, x[k + 5], S21, 0xd62f105d); d = GG(d, a, b, c, x[k + 10], S22, 0x02441453); c = GG(c, d, a, b, x[k + 15], S23, 0xd8a1e681); b = GG(b, c, d, a, x[k + 4], S24, 0xe7d3fbc8);
    a = GG(a, b, c, d, x[k + 9], S21, 0x21e1cde6); d = GG(d, a, b, c, x[k + 14], S22, 0xc33707d6); c = GG(c, d, a, b, x[k + 3], S23, 0xf4d50d87); b = GG(b, c, d, a, x[k + 8], S24, 0x455a14ed);
    a = GG(a, b, c, d, x[k + 13], S21, 0xa9e3e905); d = GG(d, a, b, c, x[k + 2], S22, 0xfcefa3f8); c = GG(c, d, a, b, x[k + 7], S23, 0x676f02d9); b = GG(b, c, d, a, x[k + 12], S24, 0x8d2a4c8a);
    a = HH(a, b, c, d, x[k + 5], S31, 0xfffa3942); d = HH(d, a, b, c, x[k + 8], S32, 0x8771f681); c = HH(c, d, a, b, x[k + 11], S33, 0x6d9d6122); b = HH(b, c, d, a, x[k + 14], S34, 0xfde5380c);
    a = HH(a, b, c, d, x[k + 1], S31, 0xa4beea44); d = HH(d, a, b, c, x[k + 4], S32, 0x4bdecfa9); c = HH(c, d, a, b, x[k + 7], S33, 0xf6bb4b60); b = HH(b, c, d, a, x[k + 10], S34, 0xbebfbc70);
    a = HH(a, b, c, d, x[k + 13], S31, 0x289b7ec6); d = HH(d, a, b, c, x[k + 0], S32, 0xeaa127fa); c = HH(c, d, a, b, x[k + 3], S33, 0xd4ef3085); b = HH(b, c, d, a, x[k + 6], S34, 0x04881d05);
    a = HH(a, b, c, d, x[k + 9], S31, 0xd9d4d039); d = HH(d, a, b, c, x[k + 12], S32, 0xe6db99e5); c = HH(c, d, a, b, x[k + 15], S33, 0x1fa27cf8); b = HH(b, c, d, a, x[k + 2], S34, 0xc4ac5665);
    a = II(a, b, c, d, x[k + 0], S41, 0xf4292244); d = II(d, a, b, c, x[k + 7], S42, 0x432aff97); c = II(c, d, a, b, x[k + 14], S43, 0xab9423a7); b = II(b, c, d, a, x[k + 5], S44, 0xfc93a039);
    a = II(a, b, c, d, x[k + 12], S41, 0x655b59c3); d = II(d, a, b, c, x[k + 3], S42, 0x8f0ccc92); c = II(c, d, a, b, x[k + 10], S43, 0xffeff47d); b = II(b, c, d, a, x[k + 1], S44, 0x85845dd1);
    a = II(a, b, c, d, x[k + 8], S41, 0x6fa87e4f); d = II(d, a, b, c, x[k + 15], S42, 0xfe2ce6e0); c = II(c, d, a, b, x[k + 6], S43, 0xa3014314); b = II(b, c, d, a, x[k + 13], S44, 0x4e0811a1);
    a = II(a, b, c, d, x[k + 4], S41, 0xf7537e82); d = II(d, a, b, c, x[k + 11], S42, 0xbd3af235); c = II(c, d, a, b, x[k + 2], S43, 0x2ad7d2bb); b = II(b, c, d, a, x[k + 9], S44, 0xeb86d391);
    a = addUnsigned(a, AA); b = addUnsigned(b, BB); c = addUnsigned(c, CC); d = addUnsigned(d, DD);
  }
  return (wordToHex(a) + wordToHex(b) + wordToHex(c) + wordToHex(d)).toLowerCase();
}

function corsHeaders(extra) {
  return Object.assign(
    {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Accept, X-Eclex-Time, X-Eclex-Duid, X-Eclex-Sig",
      "Access-Control-Expose-Headers": "Content-Type, X-Server-Time",
      "X-Server-Time": String(Date.now()),
    },
    extra || {}
  );
}

function jsonResp(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: corsHeaders({ "Content-Type": "application/json; charset=utf-8" }),
  });
}

function verifySig(request, url, scopeKey, salt) {
  if (!salt) return { ok: false, status: 503 };
  const ts = request.headers.get("X-Eclex-Time") || url.searchParams.get("t") || "";
  const duid = request.headers.get("X-Eclex-Duid") || url.searchParams.get("d") || "";
  const sig = request.headers.get("X-Eclex-Sig") || url.searchParams.get("s") || "";
  if (!ts || !duid || !sig) return { ok: false, status: 403 };
  const reqMs = Number(ts);
  if (!isFinite(reqMs) || Math.abs(Date.now() - reqMs) > MAX_CLOCK_SKEW_MS) {
    return { ok: false, status: 403 };
  }
  const expected = md5("eclex:" + ts + ":" + scopeKey + ":" + duid + ":" + salt);
  if (sig.toLowerCase() !== expected) return { ok: false, status: 403 };
  return { ok: true };
}

function extractPerelmanSlug(rawUrl) {
  const s = String(rawUrl || "").trim();
  if (!s) return "";
  try {
    const u = new URL(s);
    const host = u.hostname.toLowerCase();
    if (host !== "playlatam.site" && host !== "epictvparaiphone.top") return "";
    const m = /^\/perelman\/([a-zA-Z0-9_-]+?)(?:\.m3u8)?\/?$/.exec(u.pathname || "");
    return m ? m[1] : "";
  } catch (_) {
    return "";
  }
}

export default {
  async fetch(request, env, ctx) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders({ "Access-Control-Max-Age": "86400" }) });
    }
    if (request.method !== "GET" && request.method !== "HEAD") {
      return jsonResp({ ok: false }, 405);
    }

    const url = new URL(request.url);
    const oracleBase = String((env && env.ORACLE_ORIGIN) || "").replace(/\/+$/, "");
    const originKey = String((env && env.ORIGIN_KEY) || "").trim();
    const signSalt = String((env && env.SIGN_SALT) || "").trim();

    if (url.pathname === "/" || url.pathname === "/health" || url.pathname === "/time") {
      return jsonResp({ ok: true, serverTime: Date.now() }, 200);
    }

    if (!oracleBase) {
      return jsonResp({ ok: false }, 503);
    }

    const cache = caches.default;

    if (
      url.pathname === "/data/epic-channels.json" ||
      url.pathname === "/canales" ||
      url.pathname === "/channels.json"
    ) {
      const auth = verifySig(request, url, "playlatam:channels", signSalt);
      if (!auth.ok) return jsonResp({ ok: false }, auth.status);

      const cacheKey = new Request("https://eclex-cache.internal/data/epic-channels.json");
      const cached = await cache.match(cacheKey);
      if (cached) {
        const hdrs = new Headers(cached.headers);
        hdrs.set("X-Server-Time", String(Date.now()));
        return new Response(request.method === "HEAD" ? null : cached.body, { status: cached.status, headers: hdrs });
      }

      const upRes = await fetch(oracleBase + "/data/epic-channels.json", {
        headers: originKey ? { "X-Eclex-Origin-Key": originKey } : {},
      });
      const body = await upRes.arrayBuffer();
      const respHdrs = new Headers(corsHeaders({
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": upRes.ok ? "public, max-age=1800" : "no-store",
      }));
      const resp = new Response(body, { status: upRes.status, headers: respHdrs });
      if (upRes.ok && ctx && typeof ctx.waitUntil === "function") {
        ctx.waitUntil(cache.put(cacheKey, resp.clone()));
      }
      return request.method === "HEAD"
        ? new Response(null, { status: upRes.status, headers: respHdrs })
        : resp;
    }

    if (url.pathname === "/stream-proxy" || url.pathname === "/stream") {
      const rawTarget = url.searchParams.get("url") || "";
      const slug = extractPerelmanSlug(rawTarget);
      if (!slug) return jsonResp({ ok: false }, 400);

      const auth = verifySig(request, url, "playlatam:" + slug.toLowerCase(), signSalt);
      if (!auth.ok) return jsonResp({ ok: false }, auth.status);

      const wantHttp = url.searchParams.get("http") === "1" ? "1" : "0";
      const cacheKey = new Request(`https://eclex-cache.internal/stream-proxy/${slug.toLowerCase()}?http=${wantHttp}`);
      const cached = await cache.match(cacheKey);
      if (cached) {
        const hdrs = new Headers(cached.headers);
        hdrs.set("X-Server-Time", String(Date.now()));
        return new Response(request.method === "HEAD" ? null : cached.body, { status: cached.status, headers: hdrs });
      }

      const normTarget = `https://playlatam.site/perelman/${slug}.m3u8`;
      const oracleUrl = `${oracleBase}/stream-proxy?url=${encodeURIComponent(normTarget)}${wantHttp === "1" ? "&http=1" : ""}`;
      const upRes = await fetch(oracleUrl, {
        headers: originKey ? { "X-Eclex-Origin-Key": originKey } : {},
      });
      const body = await upRes.arrayBuffer();
      const respHdrs = new Headers(corsHeaders({
        "Content-Type": upRes.ok ? "application/vnd.apple.mpegurl" : "application/json; charset=utf-8",
        "Cache-Control": upRes.ok ? "public, max-age=0, s-maxage=2" : "no-store",
      }));
      const resp = new Response(body, { status: upRes.status, headers: respHdrs });
      if (upRes.ok && ctx && typeof ctx.waitUntil === "function") {
        ctx.waitUntil(cache.put(cacheKey, resp.clone()));
      }
      return request.method === "HEAD"
        ? new Response(null, { status: upRes.status, headers: respHdrs })
        : resp;
    }

    return jsonResp({ ok: false }, 404);
  },
};
