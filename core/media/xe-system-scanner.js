/* Xuper Eclectic Tizen OS System Scanner & Adaptive Engine Loader v2.1.0
 * Escanea al inicio la versión exacta de Tizen OS, motor WebKit/Chromium y capacidades
 * de hardware/MSE para cargar el perfil de motor multimedia compatible con cada Smart TV.
 */
(function (w, d) {
  'use strict';

  function detectSystem() {
    var ua = (w.navigator && w.navigator.userAgent) ? String(w.navigator.userAgent) : '';
    var platform = (w.navigator && w.navigator.platform) ? String(w.navigator.platform) : '';

    // 1. Detectar versión de Tizen OS
    var tizenMatch = /Tizen\s+(\d+(?:\.\d+)?)/i.exec(ua);
    var tizenVersion = tizenMatch ? parseFloat(tizenMatch[1]) : 0;

    // 2. Detectar versión de Chromium / WebKit
    var chromeMatch = /(?:Chrome|CriOS)\/(\d+)/i.exec(ua) || /(\d+)\.\d+\.\d+\.\d+\/\d+\.\d+\s+TV\s+Safari/i.exec(ua);
    var chromiumMajor = chromeMatch ? parseInt(chromeMatch[1], 10) : 0;
    var webkitMatch = /AppleWebKit\/(\d+(?:\.\d+)?)/i.exec(ua);
    var webkitVersion = webkitMatch ? parseFloat(webkitMatch[1]) : 0;
    var isWebKitLegacy = (!chromiumMajor && webkitVersion > 0 && webkitVersion < 600) || (tizenVersion > 0 && tizenVersion < 4.0);

    // Si no reporta Tizen en UA pero es navegador de pruebas, inferir por motor
    if (!tizenVersion) {
      if (isWebKitLegacy) tizenVersion = 3.0;
      else if (chromiumMajor >= 108) tizenVersion = 8.0;
      else if (chromiumMajor >= 90) tizenVersion = 7.0;
      else if (chromiumMajor >= 76) tizenVersion = 6.0;
      else if (chromiumMajor >= 63) tizenVersion = 5.0;
      else if (chromiumMajor > 0) tizenVersion = 4.0;
      else tizenVersion = 7.0;
    }

    // 3. Detectar modelo físico vs Emulador
    var modelCode = '';
    var firmware = '';
    try {
      if (w.webapis && w.webapis.productinfo) {
        if (typeof w.webapis.productinfo.getModelCode === 'function') {
          modelCode = String(w.webapis.productinfo.getModelCode() || '');
        }
        if (typeof w.webapis.productinfo.getFirmware === 'function') {
          firmware = String(w.webapis.productinfo.getFirmware() || '');
        }
      }
    } catch (_) {}

    var isEmulator = /x86|i686|emulator/i.test(platform + ' ' + modelCode + ' ' + ua);

    // 4. Sondear capacidades MSE y AudioContext
    var msClass = w.MediaSource || w.WebKitMediaSource;
    var checkMime = function (mime) {
      try {
        return !!(msClass && typeof msClass.isTypeSupported === 'function' && msClass.isTypeSupported(mime));
      } catch (_) {
        return false;
      }
    };

    var capabilities = {
      hasMSE: !!msClass,
      hasWebAudio: !!(w.AudioContext || w.webkitAudioContext),
      hasAVPlay: !!(w.webapis && w.webapis.avplay),
      mseHevc: checkMime('video/mp4; codecs="hvc1.1.6.L93.B0"'),
      mseAvc: checkMime('video/mp4; codecs="avc1.640028"') || checkMime('video/mp4; codecs="avc1.42E01E"'),
      mseAac: checkMime('audio/mp4; codecs="mp4a.40.2"')
    };

    // 5. Seleccionar el Perfil de Motor según la generación de Tizen OS
    var engineProfile;
    if (tizenVersion <= 4.0 || isWebKitLegacy) {
      engineProfile = {
        id: 'engine-tizen-legacy',
        name: 'Motor Tizen Legacy (OS 3.0 - 4.0)',
        tier: 'legacy',
        tizenVersion: tizenVersion,
        chromiumMajor: chromiumMajor,
        isWebKitLegacy: isWebKitLegacy,
        isEmulator: isEmulator,
        videoMode: 'fmp4-single-sb',
        audioMode: 'webaudio-adts-closedloop',
        preferAdtsDecode: true,
        disableDualSourceBuffer: true,
        raslFilter: true,
        trimAudioToVideoKey: true,
        maxBufferAheadSec: 14,
        syncToleranceSec: 0.065,
        syncIntervalMs: 100
      };
    } else if (tizenVersion <= 7.5 || (chromiumMajor > 0 && chromiumMajor <= 96)) {
      engineProfile = {
        id: 'engine-tizen-mid',
        name: 'Motor Tizen Mid-Gen (OS 5.0 - 7.0)',
        tier: 'mid',
        tizenVersion: tizenVersion,
        chromiumMajor: chromiumMajor,
        isWebKitLegacy: false,
        isEmulator: isEmulator,
        videoMode: 'fmp4-mse-fastseek',
        audioMode: 'webaudio-adts-closedloop',
        preferAdtsDecode: true,
        disableDualSourceBuffer: true,
        raslFilter: true,
        trimAudioToVideoKey: true,
        maxBufferAheadSec: 20,
        syncToleranceSec: 0.050,
        syncIntervalMs: 90
      };
    } else {
      engineProfile = {
        id: 'engine-tizen-modern',
        name: 'Motor Tizen Modern (OS 8.0 - 10.0)',
        tier: 'modern',
        tizenVersion: tizenVersion,
        chromiumMajor: chromiumMajor,
        isWebKitLegacy: false,
        isEmulator: isEmulator,
        videoMode: 'fmp4-mse-modern',
        audioMode: 'webaudio-adts-closedloop',
        preferAdtsDecode: true,
        disableDualSourceBuffer: true,
        raslFilter: true,
        trimAudioToVideoKey: true,
        autoUnlockAudioContext: true,
        maxBufferAheadSec: 24,
        syncToleranceSec: 0.050,
        syncIntervalMs: 90
      };
    }

    engineProfile.capabilities = capabilities;
    engineProfile.modelCode = modelCode || (isEmulator ? 'Tizen-Emulator' : 'Samsung-SmartTV');
    engineProfile.firmware = firmware;
    engineProfile.userAgent = ua;

    w.XuperEngineConfig = engineProfile;
    console.log('[XuperSystemScanner v2.1.0] Sistema detectado: Tizen ' + tizenVersion +
      ' (Chromium ' + chromiumMajor + ') -> Cargando ' + engineProfile.name + ' [' + engineProfile.id + ']');
    return engineProfile;
  }

  var activeProfile = detectSystem();

  // Desbloqueador global de AudioContext para políticas Autoplay en Tizen 7.0 / 8.0 / 9.0 / 10.0
  function unlockGlobalAudio() {
    try {
      var s = w.__cactusActive;
      if (s && s.webAudio && s.webAudio.ac && s.webAudio.ac.state === 'suspended') {
        if (s.video && !s.video.paused) {
          s.webAudio.ac.resume().catch(function () {});
        }
      }
    } catch (_) {}
  }

  if (d && d.addEventListener) {
    d.addEventListener('keydown', unlockGlobalAudio, true);
    d.addEventListener('click', unlockGlobalAudio, true);
  }

  w.XuperSystemScanner = {
    version: '2.1.0',
    scan: detectSystem,
    getProfile: function () {
      return w.XuperEngineConfig || activeProfile;
    }
  };
})(window, document);
