// Real-time disaster acoustic alarm generator using Web Audio API
// Requires no external audio files, operates 100% offline, cross-browser compatible

let audioCtx = null;
let sirenOscillator = null;
let sirenModulator = null;
let sirenGain = null;
let isPlaying = false;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Automatically unlock AudioContext on the very first user interaction
export function initAudioUnlock() {
  if (typeof window === 'undefined') return;

  const unlock = () => {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().then(() => {
          console.log('[AapdaNetra Audio] Emergency AudioContext unlocked for automated disaster alerts.');
        });
      }
    } catch {}

    window.removeEventListener('click', unlock, true);
    window.removeEventListener('keydown', unlock, true);
    window.removeEventListener('touchstart', unlock, true);
  };

  window.addEventListener('click', unlock, true);
  window.addEventListener('keydown', unlock, true);
  window.addEventListener('touchstart', unlock, true);
}

// Warm up immediately
if (typeof window !== 'undefined') {
  initAudioUnlock();
}

/**
 * Play high-priority Civil Defense Emergency Siren
 * @param {number} durationMs - Auto-stop after milliseconds (default: 8000ms)
 */
export function playEmergencySiren(durationMs = 8000) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return false;

    stopEmergencySiren();

    const now = ctx.currentTime;

    // Master volume gain
    sirenGain = ctx.createGain();
    sirenGain.gain.setValueAtTime(0.01, now);
    sirenGain.gain.exponentialRampToValueAtTime(0.25, now + 0.3);

    // Primary carrier oscillator
    sirenOscillator = ctx.createOscillator();
    sirenOscillator.type = 'sawtooth';
    sirenOscillator.frequency.setValueAtTime(800, now);

    // LFO modulator for warbling siren effect
    sirenModulator = ctx.createOscillator();
    sirenModulator.type = 'sine';
    sirenModulator.frequency.setValueAtTime(2.2, now); // 2.2 Hz pulse

    const modGain = ctx.createGain();
    modGain.gain.setValueAtTime(220, now); // Modulate +/- 220Hz

    sirenModulator.connect(modGain);
    modGain.connect(sirenOscillator.frequency);

    sirenOscillator.connect(sirenGain);
    sirenGain.connect(ctx.destination);

    sirenModulator.start(now);
    sirenOscillator.start(now);
    isPlaying = true;

    if (durationMs > 0) {
      setTimeout(() => {
        stopEmergencySiren();
      }, durationMs);
    }

    return true;
  } catch (err) {
    console.warn('[AapdaNetra Audio] Could not start emergency siren:', err);
    return false;
  }
}

/**
 * Play a short emergency ping
 */
export function playEmergencyChirp() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.15);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  } catch (err) {
    console.warn('[AapdaNetra Audio] Chirp error:', err);
  }
}

/**
 * Stop active siren immediately
 */
export function stopEmergencySiren() {
  try {
    if (sirenGain && audioCtx) {
      const now = audioCtx.currentTime;
      sirenGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      setTimeout(() => {
        if (sirenOscillator) {
          try { sirenOscillator.stop(); sirenOscillator.disconnect(); } catch {}
          sirenOscillator = null;
        }
        if (sirenModulator) {
          try { sirenModulator.stop(); sirenModulator.disconnect(); } catch {}
          sirenModulator = null;
        }
        isPlaying = false;
      }, 250);
    }
  } catch (err) {
    isPlaying = false;
  }
}

export function isSirenActive() {
  return isPlaying;
}
