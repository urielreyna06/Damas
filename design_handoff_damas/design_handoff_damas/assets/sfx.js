/* ============================================================
   DAMAS — SFX Module (Web Audio API synthesis, no external files)
   Exposed as window.SFX. Persists mute pref in localStorage.
   ============================================================ */
(function (global) {
  'use strict';
  var SFX = (function () {
    var ctx = null;
    var muted = localStorage.getItem('damas-sfx-muted') === '1';

    function getCtx() {
      if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }

    /* freq Hz, oscillator type, duration s, peak volume 0-1, delay s */
    function tone(freq, type, duration, vol, delay) {
      if (muted) return;
      var ac = getCtx();
      var t0 = ac.currentTime + (delay || 0);
      var osc = ac.createOscillator();
      var gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
      osc.start(t0);
      osc.stop(t0 + duration + 0.02);
    }

    return {
      isMuted: function () { return muted; },
      toggleMute: function () {
        muted = !muted;
        localStorage.setItem('damas-sfx-muted', muted ? '1' : '0');
        return muted;
      },
      /* soft thud for normal move */
      move: function () {
        tone(420, 'sine', 0.12, 0.22);
      },
      /* low crunch on capture */
      capture: function () {
        tone(160, 'square', 0.18, 0.28);
        tone(105, 'square', 0.14, 0.18, 0.06);
      },
      /* ascending arpeggio on crowning */
      coronation: function () {
        [261, 330, 392, 523].forEach(function (f, i) { tone(f, 'triangle', 0.22, 0.32, i * 0.1); });
      },
      /* fanfare on victory */
      victory: function () {
        [261, 329, 392, 523, 659].forEach(function (f, i) { tone(f, 'triangle', 0.28, 0.38, i * 0.11); });
        tone(784, 'sine', 0.45, 0.32, 0.6);
      },
      /* descending tones on defeat */
      defeat: function () {
        [392, 349, 311, 261].forEach(function (f, i) { tone(f, 'sawtooth', 0.26, 0.28, i * 0.15); });
      },
    };
  })();

  global.SFX = SFX;
})(window);
