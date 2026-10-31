/**
 * Web Audio API synthesizer for clean, zero-dependency chime alerts.
 * Works offline, in any modern browser, without external audio assets.
 */

export function playChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;

    // Pleasant two-tone chime: E5 (659.25Hz) followed by A5 (880Hz)
    const tones = [
      { freq: 659.25, time: now, dur: 0.35, gain: 0.2 },
      { freq: 880.0, time: now + 0.16, dur: 0.55, gain: 0.28 },
    ];

    tones.forEach(({ freq, time, dur, gain: peakGain }) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);

      // Smooth attack and natural exponential decay
      gainNode.gain.setValueAtTime(0.0001, time);
      gainNode.gain.exponentialRampToValueAtTime(peakGain, time + 0.03);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, time + dur);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(time);
      osc.stop(time + dur);
    });
  } catch (e) {
    // AudioContext suspended or blocked by browser policy
  }
}

