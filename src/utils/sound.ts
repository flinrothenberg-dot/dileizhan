// Web Audio API procedural sound effects for 《抗日：地雷战》 HD Remaster

class SoundEngine {
  private ctx: AudioContext | null = null;
  public muted = false;

  private ensureContext(): AudioContext | null {
    if (this.muted) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  private playSingleCrack(ctx: AudioContext, startTime: number, pitchHz = 780, vol = 0.32, dur = 0.14) {
    const bufferSize = Math.floor(ctx.sampleRate * dur);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(pitchHz, startTime);
    filter.Q.setValueAtTime(0.8, startTime);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start(startTime);

    // Punchy low-end body thump
    const thump = ctx.createOscillator();
    const tGain = ctx.createGain();
    thump.type = 'triangle';
    thump.frequency.setValueAtTime(190, startTime);
    thump.frequency.exponentialRampToValueAtTime(48, startTime + 0.08);
    tGain.gain.setValueAtTime(vol * 0.75, startTime);
    tGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.09);
    thump.connect(tGain).connect(ctx.destination);
    thump.start(startTime);
    thump.stop(startTime + 0.095);
  }

  public playClick() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.06);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  public playStep() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.08);
    gain.gain.setValueAtTime(0.16, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  public playLayMine() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const bufferSize = Math.floor(ctx.sampleRate * 0.18);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.35));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(600, now);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start(now);

    const click = ctx.createOscillator();
    const cGain = ctx.createGain();
    click.type = 'square';
    click.frequency.setValueAtTime(880, now + 0.12);
    click.frequency.exponentialRampToValueAtTime(340, now + 0.19);
    cGain.gain.setValueAtTime(0.08, now + 0.12);
    cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    click.connect(cGain).connect(ctx.destination);
    click.start(now + 0.12);
    click.stop(now + 0.2);
  }

  // 双枪（大队长 / 李向阳）：两声清脆连射枪响！
  public playDualPistol() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    this.playSingleCrack(ctx, now, 980, 0.34, 0.13);
    this.playSingleCrack(ctx, now + 0.14, 1080, 0.36, 0.15);
  }

  // 大刀 / 指挥刀：刀风呼啸 + 利刃劈砍清脆金属颤音！
  public playBladeSlash() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    // 1. Air-cutting blade whoosh
    const dur = 0.24;
    const bufSize = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) {
      const env = Math.sin((i / bufSize) * Math.PI);
      data[i] = (Math.random() * 2 - 1) * env;
    }
    const whoosh = ctx.createBufferSource();
    whoosh.buffer = buf;

    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.setValueAtTime(2.6, now);
    bp.frequency.setValueAtTime(280, now);
    bp.frequency.exponentialRampToValueAtTime(2400, now + 0.09);
    bp.frequency.exponentialRampToValueAtTime(420, now + dur);

    const wGain = ctx.createGain();
    wGain.gain.setValueAtTime(0.45, now);
    wGain.gain.exponentialRampToValueAtTime(0.01, now + dur);
    whoosh.connect(bp).connect(wGain).connect(ctx.destination);
    whoosh.start(now);

    // 2. Sharp metallic steel ring + cut impact at t+0.07s
    const hitT = now + 0.07;
    [1640, 2480].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, hitT);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.88, hitT + 0.22);
      g.gain.setValueAtTime(idx === 0 ? 0.16 : 0.1, hitT);
      g.gain.exponentialRampToValueAtTime(0.001, hitT + 0.23);
      osc.connect(g).connect(ctx.destination);
      osc.start(hitT);
      osc.stop(hitT + 0.24);
    });

    const thud = ctx.createOscillator();
    const tGain = ctx.createGain();
    thud.type = 'triangle';
    thud.frequency.setValueAtTime(160, hitT);
    thud.frequency.exponentialRampToValueAtTime(42, hitT + 0.11);
    tGain.gain.setValueAtTime(0.28, hitT);
    tGain.gain.exponentialRampToValueAtTime(0.001, hitT + 0.12);
    thud.connect(tGain).connect(ctx.destination);
    thud.start(hitT);
    thud.stop(hitT + 0.12);
  }

  // 步枪（汉阳造 / 三八式）
  public playRifleShot() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.playSingleCrack(ctx, ctx.currentTime, 1250, 0.36, 0.18);
  }

  // 轻机枪（歪把子 3 连发）
  public playMachineGun() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    this.playSingleCrack(ctx, now, 1080, 0.28, 0.09);
    this.playSingleCrack(ctx, now + 0.085, 1140, 0.28, 0.09);
    this.playSingleCrack(ctx, now + 0.17, 1060, 0.3, 0.11);
  }

  // 铁弹弓（张嘎）
  public playSlingshot() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(240, now);
    osc.frequency.exponentialRampToValueAtTime(760, now + 0.05);
    osc.frequency.exponentialRampToValueAtTime(340, now + 0.13);
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  // 老火铳 / 抬枪（九爷重轰击）
  public playCannonShot() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    this.playSingleCrack(ctx, now, 340, 0.46, 0.28);
    const sub = ctx.createOscillator();
    const sg = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(110, now);
    sub.frequency.exponentialRampToValueAtTime(32, now + 0.34);
    sg.gain.setValueAtTime(0.42, now);
    sg.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    sub.connect(sg).connect(ctx.destination);
    sub.start(now);
    sub.stop(now + 0.36);
  }

  // 最高攻击 / 暴击震击音效
  public playMaxCritImpact() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime + 0.05;

    const boom = ctx.createOscillator();
    const bGain = ctx.createGain();
    boom.type = 'sine';
    boom.frequency.setValueAtTime(140, now);
    boom.frequency.exponentialRampToValueAtTime(36, now + 0.28);
    bGain.gain.setValueAtTime(0.42, now);
    bGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    boom.connect(bGain).connect(ctx.destination);
    boom.start(now);
    boom.stop(now + 0.31);

    // Golden critical chime
    [880, 1318.5].forEach((freq, i) => {
      const ch = ctx.createOscillator();
      const cg = ctx.createGain();
      ch.type = 'triangle';
      ch.frequency.setValueAtTime(freq, now + i * 0.03);
      cg.gain.setValueAtTime(0.14, now + i * 0.03);
      cg.gain.exponentialRampToValueAtTime(0.001, now + 0.24 + i * 0.03);
      ch.connect(cg).connect(ctx.destination);
      ch.start(now + i * 0.03);
      ch.stop(now + 0.26 + i * 0.03);
    });
  }

  public playGunshot() {
    this.playRifleShot();
  }

  public playExplosion(heavy = false) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const duration = heavy ? 0.65 : 0.48;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.28));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(heavy ? 360 : 480, now);
    filter.frequency.exponentialRampToValueAtTime(60, now + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(heavy ? 0.55 : 0.42, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start(now);

    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(heavy ? 95 : 120, now);
    sub.frequency.exponentialRampToValueAtTime(28, now + duration * 0.8);
    subGain.gain.setValueAtTime(heavy ? 0.45 : 0.3, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.8);
    sub.connect(subGain).connect(ctx.destination);
    sub.start(now);
    sub.stop(now + duration * 0.85);
  }

  public playDetectorBeep() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [0, 0.11].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1320, now + offset);
      gain.gain.setValueAtTime(0.11, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.08);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.08);
    });
  }

  public playHeal() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    [440, 554, 659].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.07);
      gain.gain.setValueAtTime(0.12, now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.18);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.18);
    });
  }

  public playVictory() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const notes = [392, 523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.12);
      gain.gain.setValueAtTime(0.16, now + i * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.12 + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + i * 0.12);
      osc.stop(now + i * 0.12 + 0.36);
    });
  }
}

export const sound = new SoundEngine();
