// Real-time disaster acoustic alarm generator
// Dual-engine: Web Audio API synth + HTML5 Audio fallback
// Operates 100% offline, cross-browser compliant with Autoplay Policy handling

let audioCtx = null;
let activeOscillator = null;
let activeHarmonic = null;
let activeModulator = null;
let activeGain = null;
let activeAudioElement = null;
let autoStopTimer = null;
let isPlaying = false;
let pendingSirenDuration = 0;
let gestureUnlockArmed = false;

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
      activeAudioElement.volume = 0.9;
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

export function unlockAudioContext() {
  const ctx = getAudioContext();
  if (ctx && ctx.state === 'suspended') {
    return ctx.resume().catch(() => {});
  }
  return Promise.resolve();
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
          if (pendingSirenDuration > 0) {
            const dur = pendingSirenDuration;
            pendingSirenDuration = 0;
            playEmergencySiren(dur, true);
          }
        }).catch(() => {});
      } else if (pendingSirenDuration > 0) {
        const dur = pendingSirenDuration;
        pendingSirenDuration = 0;
        playEmergencySiren(dur, true);
      }
    } catch {}
  };

  window.addEventListener('pointerdown', unlock, { capture: true, passive: true });
  window.addEventListener('click', unlock, { capture: true, passive: true });
  window.addEventListener('keydown', unlock, { capture: true, passive: true });
  window.addEventListener('touchstart', unlock, { capture: true, passive: true });
}

if (typeof window !== 'undefined') {
  initAudioUnlock();
}

function startWebAudioSirenNodes(durationMs = 8000) {
  const ctx = getAudioContext();
  if (!ctx) return false;

  stopEmergencySirenInternal(false);

  try {
    const now = ctx.currentTime;

    // Master volume gain
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.001, now);
    masterGain.gain.linearRampToValueAtTime(0.55, now + 0.15);

    // Primary carrier oscillator (Sawtooth tone for penetrating warning)
    const carrier = ctx.createOscillator();
    carrier.type = 'sawtooth';
    carrier.frequency.setValueAtTime(720, now);

    // Harmonic sub-oscillator for mechanical civil defense weight
    const harmonic = ctx.createOscillator();
    harmonic.type = 'square';
    harmonic.frequency.setValueAtTime(1440, now);

    const harmonicGain = ctx.createGain();
    harmonicGain.gain.setValueAtTime(0.2, now);
    harmonic.connect(harmonicGain);
    harmonicGain.connect(masterGain);

    // LFO modulator for warbling siren effect (1.8 Hz cycle)
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(1.8, now);

    const modGain = ctx.createGain();
    modGain.gain.setValueAtTime(240, now); // Swing +/- 240Hz
    lfo.connect(modGain);
    modGain.connect(carrier.frequency);

    const modGainHarmonic = ctx.createGain();
    modGainHarmonic.gain.setValueAtTime(480, now);
    lfo.connect(modGainHarmonic);
    modGainHarmonic.connect(harmonic.frequency);

    carrier.connect(masterGain);
    masterGain.connect(ctx.destination);

    lfo.start(now);
    carrier.start(now);
    harmonic.start(now);

    activeGain = masterGain;
    activeOscillator = carrier;
    activeHarmonic = harmonic;
    activeModulator = lfo;
    isPlaying = true;

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('emergency-siren-started'));
    }

    // Auto-stop after specified duration (8 seconds default)
    if (durationMs > 0) {
      if (autoStopTimer) clearTimeout(autoStopTimer);
      autoStopTimer = setTimeout(() => {
        stopEmergencySiren();
      }, durationMs);
    }

    return true;
  } catch (err) {
    console.warn('[AapdaNetra Audio] Web Audio node creation failed:', err);
    return false;
  }
}

function armOneTouchSirenUnlock(durationMs = 8000) {
  if (gestureUnlockArmed || typeof window === 'undefined') return;
  gestureUnlockArmed = true;

  const onUserGesture = () => {
    gestureUnlockArmed = false;
    window.removeEventListener('pointerdown', onUserGesture, true);
    window.removeEventListener('click', onUserGesture, true);
    window.removeEventListener('keydown', onUserGesture, true);
    window.removeEventListener('touchstart', onUserGesture, true);

    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().then(() => {
        startWebAudioSirenNodes(durationMs);
      }).catch(() => {
        startWebAudioSirenNodes(durationMs);
      });
    } else {
      startWebAudioSirenNodes(durationMs);
    }
  };

  window.addEventListener('pointerdown', onUserGesture, true);
  window.addEventListener('click', onUserGesture, true);
  window.addEventListener('keydown', onUserGesture, true);
  window.addEventListener('touchstart', onUserGesture, true);
}

/**
 * Play high-priority Civil Defense Emergency Siren
 * @param {number} durationMs - Auto-stop duration in milliseconds (default: 8000ms - 8 seconds)
 * @param {boolean} userInitiated - true if triggered directly by user gesture
 * @returns {boolean} true if audio playback was initiated
 */
export function playEmergencySiren(durationMs = 8000, userInitiated = false) {
  if (typeof window === 'undefined') return false;

  try {
    if (autoStopTimer) {
      clearTimeout(autoStopTimer);
      autoStopTimer = null;
    }

    const ctx = getAudioContext();

    if (userInitiated && ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    // If context is running, synthesize immediately
    if (ctx && ctx.state === 'running') {
      pendingSirenDuration = 0;
      return startWebAudioSirenNodes(durationMs);
    }

    // If suspended by browser autoplay policy
    if (ctx && ctx.state === 'suspended') {
      pendingSirenDuration = durationMs;
      armOneTouchSirenUnlock(durationMs);

      // Attempt resume in case policy allows
      ctx.resume().then(() => {
        if (ctx.state === 'running') {
          pendingSirenDuration = 0;
          startWebAudioSirenNodes(durationMs);
        }
      }).catch(() => {});

      // Also trigger HTML5 Audio element fallback
      const audioElem = getSirenAudioElement();
      if (audioElem) {
        audioElem.currentTime = 0;
        audioElem.play().then(() => {
          isPlaying = true;
          pendingSirenDuration = 0;
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('emergency-siren-started'));
          }
          if (durationMs > 0) {
            if (autoStopTimer) clearTimeout(autoStopTimer);
            autoStopTimer = setTimeout(() => {
              stopEmergencySiren();
            }, durationMs);
          }
        }).catch(() => {
          // Autoplay blocked fallback audio as well; armed for 1st touch
        });
      }

      return false;
    }

    return startWebAudioSirenNodes(durationMs);
  } catch (err) {
    console.warn('[AapdaNetra Audio] Emergency siren start warning:', err);
    armOneTouchSirenUnlock(durationMs);
    return false;
  }
}

function stopEmergencySirenInternal(resetState = true) {
  pendingSirenDuration = 0;
  gestureUnlockArmed = false;

  if (autoStopTimer) {
    clearTimeout(autoStopTimer);
    autoStopTimer = null;
  }

  // Fade out and stop Web Audio nodes
  const prevOsc = activeOscillator;
  const prevHarmonic = activeHarmonic;
  const prevMod = activeModulator;
  const prevGain = activeGain;

  activeOscillator = null;
  activeHarmonic = null;
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
    try { prevHarmonic?.stop(); prevHarmonic?.disconnect(); } catch {}
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
