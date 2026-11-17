/* Xuper Eclectic MP4-to-fMP4 Streaming Engine v2.0.37 (ES5 Tizen 3.0-10.0) */
(function (w, d) {
  'use strict';
  var MediaSourceCtor = w.MediaSource || w.WebKitMediaSource;
  var active = null;
  var MAX_INT = 9007199254740991;

  function readU32(b, p) {
    return ((b[p] << 24) >>> 0) + (b[p + 1] << 16) + (b[p + 2] << 8) + b[p + 3];
  }

  function readI32(b, p) {
    return (b[p] << 24) | (b[p + 1] << 16) | (b[p + 2] << 8) | b[p + 3];
  }

  function readU64(b, p) {
    return readU32(b, p) * 4294967296 + readU32(b, p + 4);
  }

  function fourcc(b, p) {
    return String.fromCharCode(b[p], b[p + 1], b[p + 2], b[p + 3]);
  }

  function writeU32(b, p, v) {
    b[p] = (v >>> 24) & 255;
    b[p + 1] = (v >>> 16) & 255;
    b[p + 2] = (v >>> 8) & 255;
    b[p + 3] = v & 255;
  }

  function writeI32(b, p, v) {
    writeU32(b, p, v | 0);
  }

  function u32Bytes(v) {
    var b = new Uint8Array(4);
    writeU32(b, 0, v);
    return b;
  }

  function u16Bytes(v) {
    return new Uint8Array([(v >>> 8) & 255, v & 255]);
  }

  function u64Bytes(v) {
    var b = new Uint8Array(8);
    writeU32(b, 0, Math.floor(v / 4294967296));
    writeU32(b, 4, v >>> 0);
    return b;
  }

  function asciiBytes(s) {
    var b = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) b[i] = s.charCodeAt(i) & 255;
    return b;
  }

  function concatBytes(list) {
    var total = 0, i;
    for (i = 0; i < list.length; i++) total += list[i].length;
    var out = new Uint8Array(total), off = 0;
    for (i = 0; i < list.length; i++) {
      out.set(list[i], off);
      off += list[i].length;
    }
    return out;
  }

  function makeBox(type) {
    var parts = [], i;
    for (i = 1; i < arguments.length; i++) {
      if (arguments[i] && arguments[i].length) parts.push(arguments[i]);
    }
    var payloadLen = 0;
    for (i = 0; i < parts.length; i++) payloadLen += parts[i].length;
    var out = new Uint8Array(8 + payloadLen);
    writeU32(out, 0, 8 + payloadLen);
    out[4] = type.charCodeAt(0);
    out[5] = type.charCodeAt(1);
    out[6] = type.charCodeAt(2);
    out[7] = type.charCodeAt(3);
    var off = 8;
    for (i = 0; i < parts.length; i++) {
      out.set(parts[i], off);
      off += parts[i].length;
    }
    return out;
  }

  function makeFullBox(type, ver, flags) {
    var header = new Uint8Array(4);
    header[0] = ver & 255;
    header[1] = (flags >>> 16) & 255;
    header[2] = (flags >>> 8) & 255;
    header[3] = flags & 255;
    var args = [type, header];
    for (var i = 3; i < arguments.length; i++) args.push(arguments[i]);
    return makeBox.apply(null, args);
  }

  function findBoxes(buf, start, end) {
    var list = [], p = start;
    while (p + 8 <= end) {
      var size = readU32(buf, p);
      var type = fourcc(buf, p + 4);
      var hdr = 8;
      if (size === 1) {
        if (p + 16 > end) break;
        size = readU64(buf, p + 8);
        hdr = 16;
      } else if (size === 0) {
        size = end - p;
      }
      if (size < hdr || p + size > end) break;
      list.push({ type: type, start: p, hdr: hdr, end: p + size, size: size });
      p += size;
    }
    return list;
  }

  function findBox(buf, start, end, target) {
    var boxes = findBoxes(buf, start, end);
    for (var i = 0; i < boxes.length; i++) {
      if (boxes[i].type === target) return boxes[i];
    }
    return null;
  }

  // XMLHttpRequest works natively on all Tizen versions (3.0 WebKit 538.1 -> 10.0)
  function fetchRange(s, start, end, attempt) {
    attempt = attempt || 0;
    if (s.ended || active !== s) return Promise.reject(Error('Reproducción cancelada'));
    var req = s.session.mediaRequest('bytes=' + start + '-' + end);
    if (!req || !/^https?:\/\//i.test(req.url)) {
      return Promise.reject(Error('Destino MP4 no válido'));
    }
    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      var done = false;
      s.pendingXhr = xhr;
      xhr.open('GET', req.url, true);
      xhr.responseType = 'arraybuffer';
      xhr.timeout = 25000;
      if (req.headers) {
        for (var k in req.headers) {
          if (Object.prototype.hasOwnProperty.call(req.headers, k)) {
            if (/^(user-agent|connection|host|content-length)$/i.test(k)) continue;
            try { xhr.setRequestHeader(k, req.headers[k]); } catch (_) {}
          }
        }
      }
      function finishErr(err) {
        if (done) return;
        done = true;
        if (s.pendingXhr === xhr) s.pendingXhr = null;
        if (s.ended || active !== s) return reject(Error('Reproducción cancelada'));
        if (attempt < 2) {
          setTimeout(function () {
            fetchRange(s, start, end, attempt + 1).then(resolve, reject);
          }, 600);
          return;
        }
        reject(err);
      }
      xhr.onload = function () {
        if (done) return;
        if (s.pendingXhr === xhr) s.pendingXhr = null;
        if ((xhr.status === 401 || xhr.status === 403) && attempt < 3 && typeof s.renewSession === 'function') {
          done = true;
          s.renewSession().then(function () {
            return fetchRange(s, start, end, attempt + 1);
          }).then(resolve, reject);
          return;
        }
        if (xhr.status !== 206 && xhr.status !== 200) {
          return finishErr(Error('CDN HTTP ' + xhr.status + ' al solicitar MP4'));
        }
        done = true;
        var cr = xhr.getResponseHeader('Content-Range');
        var total = 0;
        if (cr) {
          var m = /\/(\d+)/.exec(cr);
          if (m) total = Number(m[1]);
        }
        var ab = xhr.response;
        resolve({ data: new Uint8Array(ab || 0), total: total, status: xhr.status });
      };
      xhr.onerror = function () { finishErr(Error('Error de red/CORS al leer MP4 desde Tizen.')); };
      xhr.ontimeout = function () { finishErr(Error('Tiempo de espera agotado al leer MP4.')); };
      xhr.onabort = function () {
        if (!done) { done = true; reject(Error('Reproducción cancelada')); }
      };
      try { xhr.send(); } catch (e) { finishErr(e); }
    });
  }

  function locateMoov(s) {
    return fetchRange(s, 0, 65535, 0).then(function (res) {
      var buf = res.data;
      var total = res.total || buf.length;
      var pos = 0;
      var ftypBox = null;
      function scanNext(chunk, chunkStart) {
        while (pos - chunkStart + 8 <= chunk.length) {
          var rel = pos - chunkStart;
          var size = readU32(chunk, rel);
          var type = fourcc(chunk, rel + 4);
          var hdr = 8;
          if (size === 1 && rel + 16 <= chunk.length) {
            size = readU64(chunk, rel + 8);
            hdr = 16;
          } else if (size === 0) {
            size = total - pos;
          }
          if (size < hdr) throw Error('Encabezado MP4 inválido.');
          if (type === 'ftyp' && !ftypBox && pos + size <= chunkStart + chunk.length) {
            ftypBox = new Uint8Array(chunk.subarray(rel, rel + size));
          }
          if (type === 'moov') {
            if (pos + size <= chunkStart + chunk.length) {
              return Promise.resolve({
                ftyp: ftypBox,
                moov: new Uint8Array(chunk.subarray(rel, rel + size)),
                moovEnd: pos + size,
                total: total
              });
            }
            return fetchRange(s, pos, pos + size - 1, 0).then(function (mres) {
              return { ftyp: ftypBox, moov: mres.data, moovEnd: pos + size, total: total };
            });
          }
          pos += size;
          if (pos >= total) throw Error('No se encontró el átomo moov en el MP4.');
          if (pos >= chunkStart + chunk.length) {
            var nextEnd = Math.min(total - 1, pos + 262143);
            return fetchRange(s, pos, nextEnd, 0).then(function (nres) {
              return scanNext(nres.data, pos);
            });
          }
        }
        var moreEnd = Math.min(total - 1, pos + 262143);
        return fetchRange(s, pos, moreEnd, 0).then(function (nres) {
          return scanNext(nres.data, pos);
        });
      }
      return scanNext(buf, 0);
    });
  }

  function hex2(n) {
    return ('00' + (n & 255).toString(16)).slice(-2);
  }

  function parseCodecFromEntry(buf, entry) {
    var type = entry.type;
    var p = entry.start + entry.hdr;
    if (type === 'avc1' || type === 'avc3') {
      var avcC = findBox(buf, p + 78, entry.end, 'avcC');
      if (avcC && avcC.start + 12 <= avcC.end) {
        var c = avcC.start + avcC.hdr;
        return 'avc1.' + hex2(buf[c + 1]) + hex2(buf[c + 2]) + hex2(buf[c + 3]);
      }
      return 'avc1.42E01E';
    }
    if (type === 'hvc1' || type === 'hev1') return type + '.1.6.L93.B0';
    if (type === 'mp4a') return 'mp4a.40.2';
    if (type === 'ac-3' || type === 'ec-3') return type;
    return type;
  }

  function zeroBoxDuration(boxBytes, isTkhd) {
    var out = new Uint8Array(boxBytes);
    var hdr = 8;
    var ver = out[hdr];
    if (isTkhd) {
      if (ver === 1 && out.length >= hdr + 36) {
        writeU32(out, hdr + 28, 0); writeU32(out, hdr + 32, 0);
      } else if (ver === 0 && out.length >= hdr + 24) {
        writeU32(out, hdr + 20, 0);
      }
    } else {
      if (ver === 1 && out.length >= hdr + 32) {
        writeU32(out, hdr + 24, 0); writeU32(out, hdr + 28, 0);
      } else if (ver === 0 && out.length >= hdr + 20) {
        writeU32(out, hdr + 16, 0);
      }
    }
    return out;
  }

  function parseTrack(buf, trakBox) {
    var tkhd = findBox(buf, trakBox.start + trakBox.hdr, trakBox.end, 'tkhd');
    var mdia = findBox(buf, trakBox.start + trakBox.hdr, trakBox.end, 'mdia');
    if (!tkhd || !mdia) return null;
    var tkVer = buf[tkhd.start + tkhd.hdr];
    var trackId = readU32(buf, tkhd.start + tkhd.hdr + (tkVer === 1 ? 20 : 12));

    var mdhd = findBox(buf, mdia.start + mdia.hdr, mdia.end, 'mdhd');
    var hdlr = findBox(buf, mdia.start + mdia.hdr, mdia.end, 'hdlr');
    var minf = findBox(buf, mdia.start + mdia.hdr, mdia.end, 'minf');
    if (!mdhd || !hdlr || !minf) return null;

    var mdVer = buf[mdhd.start + mdhd.hdr];
    var timescale = readU32(buf, mdhd.start + mdhd.hdr + (mdVer === 1 ? 20 : 12)) || 90000;
    var mdDuration = mdVer === 1
      ? readU64(buf, mdhd.start + mdhd.hdr + 24)
      : readU32(buf, mdhd.start + mdhd.hdr + 16);
    var handler = fourcc(buf, hdlr.start + hdlr.hdr + 8);
    if (handler !== 'vide' && handler !== 'soun') return null;

    var stbl = findBox(buf, minf.start + minf.hdr, minf.end, 'stbl');
    if (!stbl) return null;

    var stsd = findBox(buf, stbl.start + stbl.hdr, stbl.end, 'stsd');
    var stts = findBox(buf, stbl.start + stbl.hdr, stbl.end, 'stts');
    var ctts = findBox(buf, stbl.start + stbl.hdr, stbl.end, 'ctts');
    var stss = findBox(buf, stbl.start + stbl.hdr, stbl.end, 'stss');
    var stsc = findBox(buf, stbl.start + stbl.hdr, stbl.end, 'stsc');
    var stsz = findBox(buf, stbl.start + stbl.hdr, stbl.end, 'stsz');
    var stco = findBox(buf, stbl.start + stbl.hdr, stbl.end, 'stco');
    var co64 = findBox(buf, stbl.start + stbl.hdr, stbl.end, 'co64');
    if (!stsd || !stts || !stsc || !stsz || (!stco && !co64)) return null;

    var stsdRaw = buf.subarray(stsd.start, stsd.end);
    var entries = findBoxes(buf, stsd.start + stsd.hdr + 8, stsd.end);
    if (!entries.length) return null;
    var codec = parseCodecFromEntry(buf, entries[0]);

    var szOff = stsz.start + stsz.hdr + 4;
    var constSize = readU32(buf, szOff);
    var sampleCount = readU32(buf, szOff + 4);
    var sizes = new Uint32Array(sampleCount);
    var i;
    if (constSize > 0) {
      for (i = 0; i < sampleCount; i++) sizes[i] = constSize;
    } else {
      for (i = 0; i < sampleCount; i++) sizes[i] = readU32(buf, szOff + 8 + i * 4);
    }

    var chunkOffsets = [];
    if (stco) {
      var coOff = stco.start + stco.hdr + 4;
      var coCount = readU32(buf, coOff);
      for (i = 0; i < coCount; i++) chunkOffsets.push(readU32(buf, coOff + 4 + i * 4));
    } else {
      var c64Off = co64.start + co64.hdr + 4;
      var c64Count = readU32(buf, c64Off);
      for (i = 0; i < c64Count; i++) chunkOffsets.push(readU64(buf, c64Off + 4 + i * 8));
    }

    var scOff = stsc.start + stsc.hdr + 4;
    var scCount = readU32(buf, scOff);
    var scEntries = [];
    for (i = 0; i < scCount; i++) {
      scEntries.push({
        firstChunk: readU32(buf, scOff + 4 + i * 12),
        samplesPerChunk: readU32(buf, scOff + 8 + i * 12)
      });
    }
    var sampleOffsets = new Array(sampleCount);
    var sIdx = 0;
    for (var c = 0; c < chunkOffsets.length && sIdx < sampleCount; c++) {
      var chunkNum = c + 1;
      var spc = 1;
      for (var e = 0; e < scEntries.length; e++) {
        if (chunkNum >= scEntries[e].firstChunk) spc = scEntries[e].samplesPerChunk;
        else break;
      }
      var bytePos = chunkOffsets[c];
      for (var k = 0; k < spc && sIdx < sampleCount; k++) {
        sampleOffsets[sIdx] = bytePos;
        bytePos += sizes[sIdx];
        sIdx++;
      }
    }

    var tsOff = stts.start + stts.hdr + 4;
    var tsCount = readU32(buf, tsOff);
    var durations = new Uint32Array(sampleCount);
    var dtsList = new Array(sampleCount);
    var curDts = 0;
    sIdx = 0;
    for (i = 0; i < tsCount && sIdx < sampleCount; i++) {
      var cnt = readU32(buf, tsOff + 4 + i * 8);
      var delta = readU32(buf, tsOff + 8 + i * 8);
      for (var j = 0; j < cnt && sIdx < sampleCount; j++) {
        dtsList[sIdx] = curDts;
        durations[sIdx] = delta;
        curDts += delta;
        sIdx++;
      }
    }

    var ctsOffsets = new Int32Array(sampleCount);
    if (ctts && handler === 'vide') {
      var ctVer = buf[ctts.start + ctts.hdr];
      var ctOff = ctts.start + ctts.hdr + 4;
      var ctCount = readU32(buf, ctOff);
      sIdx = 0;
      for (i = 0; i < ctCount && sIdx < sampleCount; i++) {
        var cCnt = readU32(buf, ctOff + 4 + i * 8);
        var cVal = ctVer === 1 ? readI32(buf, ctOff + 8 + i * 8) : readU32(buf, ctOff + 8 + i * 8);
        for (var cj = 0; cj < cCnt && sIdx < sampleCount; cj++) {
          ctsOffsets[sIdx] = cVal;
          sIdx++;
        }
      }
    }

    var syncMap = null;
    if (stss) {
      syncMap = {};
      var ssOff = stss.start + stss.hdr + 4;
      var ssCount = readU32(buf, ssOff);
      for (i = 0; i < ssCount; i++) syncMap[readU32(buf, ssOff + 4 + i * 4) - 1] = true;
    }

    var tkhdCopy = zeroBoxDuration(buf.subarray(tkhd.start, tkhd.end), true);
    var mdhdCopy = zeroBoxDuration(buf.subarray(mdhd.start, mdhd.end), false);
    var hdlrCopy = new Uint8Array(buf.subarray(hdlr.start, hdlr.end));
    var vmhdOrSmhd = findBox(buf, minf.start + minf.hdr, minf.end, handler === 'vide' ? 'vmhd' : 'smhd');
    var dinf = findBox(buf, minf.start + minf.hdr, minf.end, 'dinf');

    return {
      id: trackId,
      handler: handler,
      codec: codec,
      timescale: timescale,
      durationSec: curDts / timescale || mdDuration / timescale || 0,
      sampleCount: sampleCount,
      sizes: sizes,
      offsets: sampleOffsets,
      durations: durations,
      dts: dtsList,
      ctsOffsets: ctsOffsets,
      syncMap: syncMap,
      tkhd: tkhdCopy,
      mdhd: mdhdCopy,
      hdlr: hdlrCopy,
      mediaHdr: vmhdOrSmhd ? new Uint8Array(buf.subarray(vmhdOrSmhd.start, vmhdOrSmhd.end)) : null,
      dinf: dinf ? new Uint8Array(buf.subarray(dinf.start, dinf.end)) : null,
      stsd: new Uint8Array(stsdRaw)
    };
  }

  function buildTrackInit(track) {
    var emptyStbl = makeBox(
      'stbl',
      track.stsd,
      makeFullBox('stts', 0, 0, u32Bytes(0)),
      makeFullBox('stsc', 0, 0, u32Bytes(0)),
      makeFullBox('stsz', 0, 0, u32Bytes(0), u32Bytes(0)),
      makeFullBox('stco', 0, 0, u32Bytes(0))
    );
    var dinf = track.dinf || makeFullBox('dinf', 0, 0, makeFullBox('dref', 0, 0, u32Bytes(1), makeFullBox('url ', 0, 1)));
    var minf = makeBox('minf', track.mediaHdr || (track.handler === 'vide' ? makeFullBox('vmhd', 0, 1, new Uint8Array(8)) : makeFullBox('smhd', 0, 0, new Uint8Array(4))), dinf, emptyStbl);
    var mdia = makeBox('mdia', track.mdhd, track.hdlr, minf);
    var trak = makeBox('trak', track.tkhd, mdia);

    var mvhdPayload = concatBytes([
      u32Bytes(0), u32Bytes(0), u32Bytes(1000), u32Bytes(0),
      u32Bytes(65536), u16Bytes(256), u16Bytes(0), u32Bytes(0), u32Bytes(0),
      new Uint8Array([0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,64,0,0,0]),
      new Uint8Array(24),
      u32Bytes(4294967295)
    ]);
    var mvhd = makeFullBox('mvhd', 0, 0, mvhdPayload);
    var trex = makeFullBox('trex', 0, 0, u32Bytes(track.id), u32Bytes(1), u32Bytes(0), u32Bytes(0), u32Bytes(0));
    var mvex = makeBox('mvex', trex);
    var ftyp = makeBox('ftyp', asciiBytes('isom'), u32Bytes(512), asciiBytes('isom'), asciiBytes('iso6'), asciiBytes('mp41'));
    var moov = makeBox('moov', mvhd, trak, mvex);
    return concatBytes([ftyp, moov]);
  }

  function findSampleAtTime(track, timeSec) {
    var targetDts = timeSec * track.timescale;
    var lo = 0, hi = track.sampleCount;
    while (lo < hi) {
      var mid = (lo + hi) >>> 1;
      if (track.dts[mid] < targetDts) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }

  function buildSegments(vTrack, aTrack) {
    var segs = [];
    var primary = vTrack || aTrack;
    var targetSec = 4;
    var i = 0;
    while (i < primary.sampleCount) {
      var startIdx = i;
      var startSec = primary.dts[startIdx] / primary.timescale;
      i++;
      while (i < primary.sampleCount) {
        var curSec = primary.dts[i] / primary.timescale;
        var isKey = !primary.syncMap || !!primary.syncMap[i];
        if (curSec - startSec >= targetSec && isKey) break;
        i++;
      }
      var endIdx = i;
      var endSec = endIdx < primary.sampleCount
        ? primary.dts[endIdx] / primary.timescale
        : primary.durationSec;

      var seg = { startTime: startSec, duration: Math.max(0.05, endSec - startSec), v: null, a: null };
      if (vTrack) seg.v = { start: startIdx, end: endIdx };
      if (aTrack) {
        var aStart = findSampleAtTime(aTrack, startSec);
        var aEnd = endIdx < primary.sampleCount ? findSampleAtTime(aTrack, endSec) : aTrack.sampleCount;
        if (aEnd > aStart) seg.a = { start: aStart, end: aEnd };
      }
      segs.push(seg);
    }
    return segs;
  }

  function buildMoofMdat(track, rangeInfo, seq, rawSamples) {
    var count = rangeInfo.end - rangeInfo.start;
    var isVideo = track.handler === 'vide';
    var trunTable = new Uint8Array(count * 16);
    var totalPayload = 0;
    var baseDts = track.dts[rangeInfo.start];
    for (var i = 0; i < count; i++) {
      var idx = rangeInfo.start + i;
      var p = i * 16;
      var isSync = !isVideo || !track.syncMap || !!track.syncMap[idx];
      writeU32(trunTable, p, track.durations[idx]);
      writeU32(trunTable, p + 4, track.sizes[idx]);
      writeU32(trunTable, p + 8, isSync ? 33554432 : 16842752);
      writeI32(trunTable, p + 12, isVideo ? track.ctsOffsets[idx] : 0);
      totalPayload += track.sizes[idx];
    }
    var trun = makeFullBox('trun', 1, 0x000f01, u32Bytes(count), u32Bytes(0), trunTable);
    var tfhd = makeFullBox('tfhd', 0, 0x020000, u32Bytes(track.id));
    var tfdt = makeFullBox('tfdt', 1, 0, u64Bytes(baseDts));
    var traf = makeBox('traf', tfhd, tfdt, trun);
    var mfhd = makeFullBox('mfhd', 0, 0, u32Bytes(seq >>> 0));
    var moof = makeBox('moof', mfhd, traf);
    var dataOffset = moof.length + 8;
    writeI32(moof, moof.length - trun.length + 16, dataOffset);

    var mdat = new Uint8Array(8 + totalPayload);
    writeU32(mdat, 0, 8 + totalPayload);
    mdat[4] = 109; mdat[5] = 100; mdat[6] = 97; mdat[7] = 116;
    var mPos = 8;
    for (var j = 0; j < count; j++) {
      mdat.set(rawSamples[j], mPos);
      mPos += rawSamples[j].length;
    }
    return concatBytes([moof, mdat]);
  }

  function fetchTrackSamples(s, track, rangeInfo) {
    var start = rangeInfo.start, end = rangeInfo.end;
    var minOff = MAX_INT, maxOff = 0;
    for (var i = start; i < end; i++) {
      var off = track.offsets[i];
      var sz = track.sizes[i];
      if (off < minOff) minOff = off;
      if (off + sz > maxOff) maxOff = off + sz;
    }
    if (maxOff <= minOff) return Promise.resolve([]);
    return fetchRange(s, minOff, maxOff - 1, 0).then(function (res) {
      var list = new Array(end - start);
      for (var j = start; j < end; j++) {
        var rel = track.offsets[j] - minOff;
        list[j - start] = res.data.subarray(rel, rel + track.sizes[j]);
      }
      return list;
    });
  }

  function stop() {
    if (!active) return;
    var s = active;
    active = null;
    s.ended = true;
    if (s.pendingXhr) { try { s.pendingXhr.abort(); } catch (_) {} s.pendingXhr = null; }
    if (s.loopTimer) { clearTimeout(s.loopTimer); s.loopTimer = null; }
    try {
      if (s.video) {
        s.video.removeEventListener('seeking', s.onSeeking);
        s.video.removeEventListener('timeupdate', s.onTimeUpdate);
        s.video.removeEventListener('ended', s.onEnded);
        s.video.pause();
        s.video.removeAttribute('src');
        s.video.load();
      }
    } catch (_) {}
    if (s.objectUrl) { try { URL.revokeObjectURL(s.objectUrl); } catch (_) {} s.objectUrl = null; }
    if (s.captions) { try { s.captions.destroy(); } catch (_) {} s.captions = null; }
    if (s.status) s.status.textContent = '';
  }

  function pruneBuffer(sb, now, force) {
    return new Promise(function (resolve) {
      if (!sb || !sb.buffered || !sb.buffered.length) return resolve();
      function run() {
        if (sb.updating) { setTimeout(run, 25); return; }
        try {
          var start = sb.buffered.start(0);
          var removeUntil = force ? Math.max(0, now - 10) : (now > 40 ? now - 25 : -1);
          if (removeUntil > start + 2) {
            var onDone = function () { sb.removeEventListener('updateend', onDone); resolve(); };
            sb.addEventListener('updateend', onDone);
            sb.remove(start, removeUntil);
            return;
          }
        } catch (_) {}
        resolve();
      }
      run();
    });
  }

  function appendBuf(sb, data, s, retry) {
    retry = retry || 0;
    return new Promise(function (resolve, reject) {
      if (s.ended || active !== s) return reject(Error('Reproducción cancelada'));
      function waitIdle() {
        if (s.ended || active !== s) return reject(Error('Reproducción cancelada'));
        if (!sb.updating) {
          var onEnd = function () {
            sb.removeEventListener('updateend', onEnd);
            sb.removeEventListener('error', onErr);
            resolve();
          };
          var onErr = function (e) {
            sb.removeEventListener('updateend', onEnd);
            sb.removeEventListener('error', onErr);
            if (retry < 2 && e && (e.name === 'QuotaExceededError' || e.code === 22)) {
              pruneBuffer(sb, (s.video && s.video.currentTime) || 60, true).then(function () {
                return appendBuf(sb, data, s, retry + 1);
              }).then(resolve, reject);
              return;
            }
            reject(e || Error('Error al alimentar buffer MSE'));
          };
          sb.addEventListener('updateend', onEnd);
          sb.addEventListener('error', onErr);
          try { sb.appendBuffer(data); } catch (ex) { onErr(ex); }
        } else {
          setTimeout(waitIdle, 25);
        }
      }
      waitIdle();
    });
  }

  function fallbackToAvplay(player, info, reason) {
    if (!w.CactusAVPlay || !w.CactusAVPlay.available || !w.CactusAVPlay.available()) {
      return Promise.reject(reason);
    }
    var req = player.session && player.session.mediaRequest ? player.session.mediaRequest() : null;
    if (!req || !req.url) return Promise.reject(reason);
    stop();
    return w.CactusAVPlay.start({
      url: req.url,
      headers: req.headers || null,
      userAgent: (req.headers && req.headers['User-Agent']) || 'Ranger/4.9.4-17294ac0',
      title: (info && info.title) || 'Reproducción',
      kind: 'vod',
      subtitles: player.subtitles || [],
      startTime: (info && (info.startTime || info.resume)) || 0,
      resume: (info && (info.startTime || info.resume)) || 0
    });
  }

  function start(player, info) {
    stop();
    if (!MediaSourceCtor) {
      return fallbackToAvplay(player, info, Error('MediaSource no disponible en este navegador Tizen.'));
    }
    var video = d.getElementById('player-video') || d.getElementById('video');
    if (!video) return Promise.reject(Error('Falta el elemento de video.'));
    var status = d.getElementById('player-status');
    var s = {
      session: player.session,
      sessionOpts: player.sessionOpts,
      video: video,
      status: status,
      ended: false,
      segIndex: 0,
      seq: 1,
      feeding: false,
      pendingXhr: null,
      loopTimer: null,
      objectUrl: null,
      captions: null,
      renewSession: function () {
        if (!w.CactusDirect || !s.sessionOpts) return Promise.reject(Error('Sin sesión renovable'));
        return w.CactusDirect.connect().then(function (c) {
          return c.stream.getSlbInfo({ forceRefresh: true }).then(function (slb) {
            s.session = c.stream.createCflSession('vod', s.sessionOpts, slb);
            return s.session;
          });
        });
      }
    };
    active = s;
    if (status) status.textContent = 'Analizando flujo MP4…';

    return locateMoov(s).then(function (infoMoov) {
      if (s.ended || active !== s) throw Error('Reproducción cancelada');
      var buf = infoMoov.moov;
      var boxes = findBoxes(buf, 8, buf.length);
      var hasMvex = !!findBox(buf, 8, buf.length, 'mvex');
      var vTrack = null, aTrack = null;
      for (var i = 0; i < boxes.length; i++) {
        if (boxes[i].type === 'trak') {
          var t = parseTrack(buf, boxes[i]);
          if (t && t.handler === 'vide' && !vTrack) vTrack = t;
          else if (t && t.handler === 'soun' && !aTrack) aTrack = t;
        }
      }
      if (!vTrack) throw Error('El MP4 no contiene una pista de vídeo compatible.');

      var vMime = 'video/mp4; codecs="' + vTrack.codec + '"';
      if (!MediaSourceCtor.isTypeSupported(vMime)) {
        throw Error('Códec de vídeo MP4 no soportado por MSE en este TV: ' + vTrack.codec);
      }
      if (aTrack) {
        var aMime = 'audio/mp4; codecs="' + aTrack.codec + '"';
        if (!MediaSourceCtor.isTypeSupported(aMime)) aTrack = null;
      }

      if (hasMvex || vTrack.sampleCount === 0) {
        throw Error('MP4 fragmentado nativo: intentando reproducción directa.');
      }

      var segments = buildSegments(vTrack, aTrack);
      var totalDuration = vTrack.durationSec || 0;
      var ms = new MediaSourceCtor();
      s.ms = ms;
      s.objectUrl = URL.createObjectURL(ms);

      return new Promise(function (resolve, reject) {
        var started = false;
        ms.addEventListener('sourceopen', function () {
          if (s.ended || active !== s) return;
          try { if (totalDuration > 0) ms.duration = totalDuration; } catch (_) {}
          var vSb = ms.addSourceBuffer(vMime);
          var aSb = aTrack ? ms.addSourceBuffer('audio/mp4; codecs="' + aTrack.codec + '"') : null;

          var initP = appendBuf(vSb, buildTrackInit(vTrack), s).then(function () {
            if (aSb) return appendBuf(aSb, buildTrackInit(aTrack), s);
          });

          initP.then(function () {
            var resumeSec = Number(info && (info.startTime || info.resume) || player && (player.startTime || player.resume) || 0);
            if (resumeSec > 2 && resumeSec < totalDuration - 5) {
              for (var k = 0; k < segments.length; k++) {
                if (segments[k].startTime + segments[k].duration > resumeSec) {
                  s.segIndex = k;
                  break;
                }
              }
            }

            if (player.subtitles && player.subtitles.length && w.CollateralSubtitles) {
              var layer = d.getElementById('subtitle-layer') || d.getElementById('player-subtitles');
              if (layer) s.captions = w.CollateralSubtitles.create(video, layer, player.subtitles);
            }

            s.onTimeUpdate = function () {
              if (w.__xuperUpdateProgress) {
                try { w.__xuperUpdateProgress(video.currentTime, video.duration || totalDuration); } catch (_) {}
              }
            };
            s.onEnded = function () {
              if (w.CactusPlaybackActions && typeof w.CactusPlaybackActions.completed === 'function') {
                try { w.CactusPlaybackActions.completed(); } catch (_) {}
              }
            };
            s.onSeeking = function () {
              var t = video.currentTime || 0;
              var targetSeg = 0;
              for (var k = 0; k < segments.length; k++) {
                if (segments[k].startTime + segments[k].duration > t) { targetSeg = k; break; }
              }
              var isBuf = false;
              for (var b = 0; b < video.buffered.length; b++) {
                if (t >= video.buffered.start(b) && t < video.buffered.end(b) - 0.5) { isBuf = true; break; }
              }
              if (!isBuf) {
                s.segIndex = targetSeg;
                if (s.pendingXhr) { try { s.pendingXhr.abort(); } catch (_) {} s.pendingXhr = null; }
                s.feeding = false;
                pump();
              }
            };

            video.addEventListener('timeupdate', s.onTimeUpdate);
            video.addEventListener('ended', s.onEnded);
            video.addEventListener('seeking', s.onSeeking);

            function pump() {
              if (s.ended || active !== s || s.feeding) return;
              if (s.segIndex >= segments.length) {
                if (ms.readyState === 'open' && !vSb.updating && (!aSb || !aSb.updating)) {
                  try { ms.endOfStream(); } catch (_) {}
                }
                return;
              }
              var ahead = 0;
              var ct = video.currentTime || 0;
              for (var b = 0; b < video.buffered.length; b++) {
                if (ct >= video.buffered.start(b) - 1 && ct <= video.buffered.end(b)) {
                  ahead = video.buffered.end(b) - ct;
                  break;
                }
              }
              if (ahead > 24 && started) {
                s.loopTimer = setTimeout(pump, 1000);
                return;
              }
              s.feeding = true;
              var seg = segments[s.segIndex++];
              var seqNum = s.seq++;
              var vFetch = seg.v ? fetchTrackSamples(s, vTrack, seg.v) : Promise.resolve(null);
              var aFetch = (aSb && seg.a) ? fetchTrackSamples(s, aTrack, seg.a) : Promise.resolve(null);

              Promise.all([vFetch, aFetch]).then(function (samplesPair) {
                if (s.ended || active !== s) return;
                var vFrag = samplesPair[0] ? buildMoofMdat(vTrack, seg.v, seqNum, samplesPair[0]) : null;
                var aFrag = (aSb && samplesPair[1]) ? buildMoofMdat(aTrack, seg.a, seqNum, samplesPair[1]) : null;
                var appP = vFrag ? appendBuf(vSb, vFrag, s) : Promise.resolve();
                return appP.then(function () {
                  if (aFrag) return appendBuf(aSb, aFrag, s);
                });
              }).then(function () {
                if (s.ended || active !== s) return;
                s.feeding = false;
                if (!started) {
                  started = true;
                  if (status) status.textContent = '';
                  if (resumeSec > 2) {
                    try { video.currentTime = resumeSec; } catch (_) {}
                  }
                  video.play().then(function () {
                    if (w.__onStreamPlaying) w.__onStreamPlaying();
                    resolve(true);
                  }, function () {
                    resolve(true);
                  });
                }
                pruneBuffer(vSb, ct, false).then(function () {
                  return aSb ? pruneBuffer(aSb, ct, false) : null;
                }).then(function () {
                  if (!s.ended && active === s) s.loopTimer = setTimeout(pump, 30);
                });
              }).catch(function (err) {
                s.feeding = false;
                if (s.ended || active !== s) return;
                if (!started) {
                  reject(err);
                } else {
                  console.warn('[CactusMP4 pump err]', err);
                  s.loopTimer = setTimeout(pump, 1500);
                }
              });
            }
            pump();
          }).catch(function (err) {
            if (!started) reject(err);
          });
        });
        video.src = s.objectUrl;
      });
    }).catch(function (err) {
      if (s.ended || active !== s) return Promise.reject(err);
      return fallbackToAvplay(player, info, err);
    });
  }

  w.CactusMP4 = {
    start: start,
    stop: stop,
    isActive: function () { return !!active && !active.ended; },
    version: '2.0.37'
  };
})(window, document);
