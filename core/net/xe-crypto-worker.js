/**
 * Xuper Eclectic v3.0.0 - Web Worker de Descifrado 3DES en Segundo Plano
 * Compatible con Samsung Tizen 3.0 (WebKit 538.1 / ES5 estricto) hasta Tizen 10.0.
 * Zero dependencias externas: reutiliza xe-cipher.js sin CryptoJS ni TextDecoder obligatorio.
 */
(function (scope) {
  'use strict';

  if (typeof scope.globalThis === 'undefined') {
    scope.globalThis = scope;
  }

  try {
    importScripts('xe-cipher.js');
  } catch (e1) {
    try {
      importScripts('/core/net/xe-cipher.js');
    } catch (e2) {
      scope.postMessage({
        id: -1,
        ok: false,
        fatal: true,
        error: 'No se pudo cargar xe-cipher.js en el Worker: ' + String(e2 && e2.message || e2)
      });
      return;
    }
  }

  function safePost(msg, transfer) {
    if (transfer && transfer.length) {
      try {
        scope.postMessage(msg, transfer);
        return;
      } catch (e) {
        // Algunos WebKit antiguos de Tizen 3.0 rechazan transferables en ciertas condiciones;
        // reintentar con structured clone estándar.
      }
    }
    scope.postMessage(msg);
  }

  scope.onmessage = function (ev) {
    var msg = ev && ev.data;
    if (!msg || typeof msg.id === 'undefined') return;
    var id = msg.id;

    try {
      var cryptoApi = scope.XuperCrypto;
      if (!cryptoApi) {
        throw new Error('XuperCrypto no inicializado en Worker');
      }

      if (msg.op === 'ping') {
        safePost({ id: id, ok: true, pong: true });
        return;
      }

      if (msg.op === 'decryptSlice') {
        var cipherBytes = msg.bytes instanceof Uint8Array
          ? msg.bytes
          : new Uint8Array(msg.bytes);
        var dec = cryptoApi._decryptRaw(cipherBytes, msg.keyHint);
        var out = msg.isLast ? cryptoApi._stripPad(dec) : dec;
        // Asegurar ArrayBuffer compacto para transferencia segura
        var copy = new Uint8Array(out.length);
        copy.set(out);
        safePost({ id: id, ok: true, bytes: copy.buffer }, [copy.buffer]);
        return;
      }

      if (msg.op === 'unwrapJson') {
        var plain = cryptoApi.unwrap(msg.hex, msg.keyHint);
        var parsed = plain;
        var isJson = false;
        try {
          parsed = JSON.parse(plain);
          isJson = true;
        } catch (_) {
          isJson = false;
        }
        safePost({ id: id, ok: true, isJson: isJson, data: parsed });
        return;
      }

      throw new Error('Operacion de Worker desconocida: ' + String(msg.op));
    } catch (err) {
      safePost({
        id: id,
        ok: false,
        error: String(err && err.message || err || 'Error en Worker de descifrado')
      });
    }
  };
})(self);
