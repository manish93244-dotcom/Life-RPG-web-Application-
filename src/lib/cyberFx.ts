import confetti from 'canvas-confetti';

class CyberAudio {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  constructor() {
    // Sound can be toggled by user
    const saved = localStorage.getItem('liferpg_sound');
    if (saved !== null) {
      this.soundEnabled = saved === 'true';
    }
  }

  public toggleSound(): boolean {
    this.soundEnabled = !this.soundEnabled;
    localStorage.setItem('liferpg_sound', String(this.soundEnabled));
    if (this.soundEnabled) {
      this.playClick();
    }
    return this.soundEnabled;
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  private getContext(): AudioContext | null {
    if (!this.soundEnabled) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public playClick() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.04);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.04);
    } catch {}
  }

  public playQuestComplete(isBoss: boolean = false) {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = isBoss ? 'sawtooth' : 'triangle';
      osc2.type = 'sine';

      const baseFreq = isBoss ? 440 : 587.33; // D5
      osc1.frequency.setValueAtTime(baseFreq, now);
      osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.15);

      osc2.frequency.setValueAtTime(baseFreq * 2, now + 0.05);
      osc2.frequency.exponentialRampToValueAtTime(baseFreq * 2.5, now + 0.25);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (isBoss ? 0.45 : 0.28));

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now + 0.05);
      osc1.stop(now + 0.3);
      osc2.stop(now + (isBoss ? 0.45 : 0.3));
    } catch {}
  }

  public playCreditsGained() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const freqs = [987.77, 1318.51, 1975.53]; // B5, E6, B6
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.04);
        gain.gain.setValueAtTime(0.09, now + idx * 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.04);
        osc.stop(now + idx * 0.04 + 0.12);
      });
    } catch {}
  }

  public playLevelUp() {
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Futuristic ascending arpeggio
      const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        const start = now + idx * 0.06;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.35);
      });
    } catch {}
  }
}

export const cyberAudio = new CyberAudio();

export function triggerNeonConfetti() {
  try {
    // Cyberpunk neon colors: cyan, magenta, amber, electric purple
    const colors = ['#00f2fe', '#ff007f', '#f59e0b', '#7928ca', '#00ff88'];

    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.7 },
      colors,
      disableForReducedMotion: true,
    });

    setTimeout(() => {
      confetti({
        particleCount: 40,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors,
      });
      confetti({
        particleCount: 40,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors,
      });
    }, 150);
  } catch {}
}

export function triggerScreenShake() {
  const root = document.getElementById('rpg-terminal-root') || document.body;
  root.classList.remove('screen-shake-anim');
  // Trigger reflow
  void root.offsetWidth;
  root.classList.add('screen-shake-anim');
  setTimeout(() => {
    root.classList.remove('screen-shake-anim');
  }, 450);
}
