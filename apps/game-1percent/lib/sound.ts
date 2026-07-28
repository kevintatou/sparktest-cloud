// Tiny WebAudio beep generator — no audio assets to load or bundle.
// Every operation is wrapped defensively since audio can be blocked or
// unsupported entirely (iOS Safari before a user gesture, etc.); the game
// must keep working either way.

export interface SoundManager {
  playStart(): void;
  playLaserWarning(): void;
  playCollision(): void;
  setMuted(muted: boolean): void;
  isMuted(): boolean;
  dispose(): void;
}

export function createSoundManager(initialMuted: boolean): SoundManager {
  let ctx: AudioContext | null = null;
  let muted = initialMuted;

  function ensureContext(): AudioContext | null {
    if (muted || typeof window === "undefined") return null;
    try {
      if (!ctx) {
        const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return null;
        ctx = new AudioCtx();
      }
      if (ctx.state === "suspended") {
        void ctx.resume();
      }
      return ctx;
    } catch {
      return null;
    }
  }

  function beep(frequency: number, durationMs: number, type: OscillatorType, gain: number) {
    const audioCtx = ensureContext();
    if (!audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = frequency;
      gainNode.gain.value = gain;
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      const stopAt = audioCtx.currentTime + durationMs / 1000;
      gainNode.gain.exponentialRampToValueAtTime(0.0001, stopAt);
      osc.start();
      osc.stop(stopAt + 0.02);
    } catch {
      // Audio blocked or unsupported — silently continue without sound.
    }
  }

  return {
    playStart() {
      beep(440, 120, "sine", 0.06);
    },
    playLaserWarning() {
      beep(880, 90, "square", 0.03);
    },
    playCollision() {
      beep(120, 220, "sawtooth", 0.08);
    },
    setMuted(next: boolean) {
      muted = next;
    },
    isMuted() {
      return muted;
    },
    dispose() {
      if (ctx) {
        void ctx.close();
        ctx = null;
      }
    },
  };
}
