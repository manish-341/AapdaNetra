// Real-time disaster acoustic alarm generator
// Dual-engine: Web Audio API synth + HTML5 Audio fallback
// Operates 100% offline, cross-browser compliant with Autoplay Policy handling

let audioCtx = null;
let activeOscillator = null;
let activeModulator = null;
let activeGain = null;
let activeAudioElement = null;
let autoStopTimer = null;
let isPlaying = false;
let pendingTriggerRegistered = false;

// Generate in-memory 2-second looping emergency siren WAV PCM
function createSirenWavBlob() {
  const sampleRate = 22050;
  const duration = 2.0; // 2.0s looping cycle
  const numSamples = Math.floor(sampleRate * duration);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  let phase = 0;
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    // 2 Hz warble between 550 Hz and 880 Hz (civil defense acoustic pattern)
    const freq = 715 + 165 * Math.sin(2 * Math.PI * 2 * t);
    phase += (2 * Math.PI * freq) / sampleRate;
    const sample = Math.sin(phase) > 0 ? 0.65 : -0.65;
    view.setInt16(offset, Math.floor(sample * 16000), true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

let sirenBlobUrl = null;
function getSirenAudioElement() {
  if (typeof window === 'undefined') return null;
  if (!activeAudioElement) {
    try {
      if (!sirenBlobUrl) {
        const blob = createSirenWavBlob();
        sirenBlobUrl = URL.createObjectURL(blob);
      }
      activeAudioElement = new Audio(sirenBlobUrl);
      activeAudioElement.loop = true;
      activeAudioElement.volume = 0.85;
    } catch (e) {
      console.warn('[AapdaNetra Audio] Fallback audio element init failed:', e);
    }
  }
  return activeAudioElement;
}

export function getAudioContext() {
  if (typeof window === 'undefined') return null;
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

// Automatically unlock AudioContext on ANY user micro-interaction
export function initAudioUnlock() {
  if (typeof window === 'undefined') return;

  const unlock = () => {
    try {
      const ctx = getAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().then(() => {
          console.log('[AapdaNetra Audio] AudioContext unlocked.');
        }).catch(() => {});
      }
    } catch {}

    window.removeEventListener('pointerdown', unlock, true);
    window.removeEventListener('click', unlock, true);
    window.removeEventListener('keydown', unlock, true);
    window.removeEventListener('touchstart', unlock, true);
  };

  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('click', unlock, true);
  window.addEventListener('keydown', unlock, true);
  window.addEventListener('touchstart', unlock, true);
}

if (typeof window !== 'undefined') {
  initAudioUnlock();
}

/**
 * Play high-priority Civil Defense Emergency Siren
 * @param {number} durationMs - Auto-stop duration in milliseconds (default: 7000ms - 7 seconds)
 * @returns {boolean} true if audio playback was initiated
 */
export function playEmergencySiren(durationMs = 7000) {
  if (typeof window === 'undefined') return false;

  try {
    // Clear any previous stop timers
    if (autoStopTimer) {
      clearTimeout(autoStopTimer);
      autoStopTimer = null;
    }

    // Stop existing nodes cleanly without race conditions
    stopEmergencySirenInternal(false);

    const ctx = getAudioContext();

    // If browser suspended the AudioContext, attempt resume & arm one-touch trigger
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
      armImmediateInteractionSiren(durationMs);
    }

    if (ctx) {
      const now = ctx.currentTime;

      // Master volume gain
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, now);
      gain.gain.exponentialRampToValueAtTime(0.4, now + 0.2);

      // Primary carrier oscillator (Sawtooth tone for penetrating warning)
      const carrier = ctx.createOscillator();
      carrier.type = 'sawtooth';
      carrier.frequency.setValueAtTime(750, now);

      // LFO modulator for warbling siren effect (2 Hz cycle)
      const modulator = ctx.createOscillator();
      modulator.type = 'sine';
      modulator.frequency.setValueAtTime(2.0, now);

      const modGain = ctx.createGain();
      modGain.gain.setValueAtTime(220, now); // Swing +/- 220Hz

      modulator.connect(modGain);
      modGain.connect(carrier.frequency);

      carrier.connect(gain);
      gain.connect(ctx.destination);

      modulator.start(now);
      carrier.start(now);

      activeGain = gain;
      activeOscillator = carrier;
      activeModulator = modulator;
      isPlaying = true;
    }

    // Fallback: Also trigger HTML5 Audio element
    const audioElem = getSirenAudioElement();
    if (audioElem) {
      audioElem.currentTime = 0;
      audioElem.play().then(() => {
        isPlaying = true;
      }).catch(() => {
        // Autoplay policy prevented immediate playback; arm on-touch listener
        armImmediateInteractionSiren(durationMs);
      });
    }

    // Auto-stop after specified duration (7 seconds default)
    if (durationMs > 0) {
      autoStopTimer = setTimeout(() => {
        stopEmergencySiren();
      }, durationMs);
    }

    return true;
  } catch (err) {
    console.warn('[AapdaNetra Audio] Emergency siren start warning:', err);
    armImmediateInteractionSiren(durationMs);
    return false;
  }
}

let pendingTriggerHandler = null;

function disarmImmediateInteractionSiren() {
  if (pendingTriggerHandler && typeof window !== 'undefined') {
    window.removeEventListener('pointerdown', pendingTriggerHandler, true);
    window.removeEventListener('click', pendingTriggerHandler, true);
    window.removeEventListener('keydown', pendingTriggerHandler, true);
    window.removeEventListener('touchstart', pendingTriggerHandler, true);
    pendingTriggerHandler = null;
  }
  pendingTriggerRegistered = false;
}

// Arm immediate start on the very next user gesture if autoplay was deferred
function armImmediateInteractionSiren(durationMs = 7000) {
  if (pendingTriggerRegistered || typeof window === 'undefined') return;
  pendingTriggerRegistered = true;

  pendingTriggerHandler = () => {
    disarmImmediateInteractionSiren();

    if (!isPlaying) return;

    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const audioElem = getSirenAudioElement();
    if (audioElem && isPlaying) {
      audioElem.play().catch(() => {});
    }
  };

  window.addEventListener('pointerdown', pendingTriggerHandler, true);
  window.addEventListener('click', pendingTriggerHandler, true);
  window.addEventListener('keydown', pendingTriggerHandler, true);
  window.addEventListener('touchstart', pendingTriggerHandler, true);
}

function stopEmergencySirenInternal(resetState = true) {
  disarmImmediateInteractionSiren();

  if (autoStopTimer) {
    clearTimeout(autoStopTimer);
    autoStopTimer = null;
  }

  // Fade out and stop Web Audio nodes via local closure references
  const prevOsc = activeOscillator;
  const prevMod = activeModulator;
  const prevGain = activeGain;

  activeOscillator = null;
  activeModulator = null;
  activeGain = null;

  if (prevGain && audioCtx) {
    try {
      const now = audioCtx.currentTime;
      prevGain.gain.setValueAtTime(prevGain.gain.value, now);
      prevGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    } catch {}
  }

  setTimeout(() => {
    try { prevOsc?.stop(); prevOsc?.disconnect(); } catch {}
    try { prevMod?.stop(); prevMod?.disconnect(); } catch {}
  }, 180);

  // Stop HTML5 audio element
  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
    } catch {}
  }

  if (resetState) {
    isPlaying = false;
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('emergency-siren-stopped'));
    }
  }
}

/**
 * Stop active emergency siren immediately
 */
export function stopEmergencySiren() {
  stopEmergencySirenInternal(true);
}

/**
 * Check if siren is currently active
 */
export function isSirenActive() {
  return isPlaying;
}

/**
 * Play brief emergency chirp
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

    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  } catch (err) {
    console.warn('[AapdaNetra Audio] Chirp error:', err);
  }
}
