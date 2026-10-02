/**
 * Fully synthesised soundscape (Web Audio API), no audio files:
 *  - ocean bed: brown noise through a slowly swept low-pass, the deep "room tone"
 *  - pad: detuned sine/triangle drone on a minor chord, breathing filter
 *  - bubbles: short sine chirps with rising pitch at random intervals
 *  - whale-like calls: rare, long gliding tones far in the reverb
 *  - UI: soft hover tick and select chime
 * A convolution reverb built from a decaying noise impulse puts everything "in water".
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private reverb!: ConvolverNode;
  private wet!: GainNode;
  private ui!: GainNode;
  private started = false;
  private muted = true;
  private timers: number[] = [];
  private oceanFilter!: BiquadFilterNode;
  private padFilter!: BiquadFilterNode;
  /** 0..1, raised while swimming fast to brighten the noise a little */
  private motion = 0;

  /** Must be called from a user gesture (autoplay policy). */
  async start() {
    if (this.started) return this.ctx?.resume();
    this.started = true;
    const ctx = (this.ctx = new AudioContext());
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(ctx.destination);

    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this.impulse(4.5, 2.6);
    this.wet = ctx.createGain();
    this.wet.gain.value = 0.55;
    this.reverb.connect(this.wet).connect(this.master);

    this.ui = ctx.createGain();
    this.ui.gain.value = 0.35;
    this.ui.connect(this.master);
    this.ui.connect(this.reverb);

    this.buildOcean();
    this.buildPad();
    this.scheduleBubbles();
    this.scheduleCalls();
    this.applyMute(0.01);
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.ctx) this.applyMute(1.2);
  }

  private applyMute(time: number) {
    const ctx = this.ctx!;
    const g = this.master.gain;
    g.cancelScheduledValues(ctx.currentTime);
    g.setTargetAtTime(this.muted ? 0 : 0.8, ctx.currentTime, time / 3);
  }

  setMotion(v: number) {
    this.motion = v;
    if (this.ctx) this.oceanFilter.frequency.setTargetAtTime(260 + v * 500, this.ctx.currentTime, 0.4);
  }

  private impulse(seconds: number, decay: number) {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }

  private noiseBuffer(seconds: number) {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      // brown noise: integrated white noise
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      d[i] = last * 3.5;
    }
    return buf;
  }

  private buildOcean() {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(8);
    src.loop = true;
    this.oceanFilter = ctx.createBiquadFilter();
    this.oceanFilter.type = 'lowpass';
    this.oceanFilter.frequency.value = 260;
    this.oceanFilter.Q.value = 0.6;
    const gain = ctx.createGain();
    gain.gain.value = 0.55;
    // slow swell: LFO on gain, like distant surf
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.22;
    lfo.connect(lfoGain).connect(gain.gain);
    src.connect(this.oceanFilter).connect(gain);
    gain.connect(this.master);
    gain.connect(this.reverb);
    src.start();
    lfo.start();
  }

  private buildPad() {
    const ctx = this.ctx!;
    this.padFilter = ctx.createBiquadFilter();
    this.padFilter.type = 'lowpass';
    this.padFilter.frequency.value = 600;
    this.padFilter.Q.value = 2;
    const padGain = ctx.createGain();
    padGain.gain.value = 0.05;
    this.padFilter.connect(padGain);
    padGain.connect(this.reverb);
    padGain.connect(this.master);

    // D minor add9, spread across octaves
    const notes = [73.42, 110.0, 146.83, 174.61, 220.0, 329.63];
    notes.forEach((f, i) => {
      for (const detune of [-6, 5]) {
        const o = ctx.createOscillator();
        o.type = i < 2 ? 'sine' : 'triangle';
        o.frequency.value = f;
        o.detune.value = detune + (Math.random() - 0.5) * 4;
        const g = ctx.createGain();
        g.gain.value = i < 2 ? 0.5 : 0.18;
        // each voice swells independently
        const l = ctx.createOscillator();
        l.frequency.value = 0.03 + Math.random() * 0.05;
        const lg = ctx.createGain();
        lg.gain.value = g.gain.value * 0.8;
        l.connect(lg).connect(g.gain);
        o.connect(g).connect(this.padFilter);
        o.start();
        l.start();
      }
    });
    const sweep = ctx.createOscillator();
    sweep.frequency.value = 0.02;
    const sweepGain = ctx.createGain();
    sweepGain.gain.value = 380;
    sweep.connect(sweepGain).connect(this.padFilter.frequency);
    sweep.start();
  }

  private bubble(when: number, pan: number) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = 'sine';
    const f0 = 300 + Math.random() * 700;
    o.frequency.setValueAtTime(f0, when);
    o.frequency.exponentialRampToValueAtTime(f0 * (2.2 + Math.random()), when + 0.06);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(0.05 + Math.random() * 0.05, when + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.09);
    const p = ctx.createStereoPanner();
    p.pan.value = pan;
    o.connect(g).connect(p);
    p.connect(this.master);
    p.connect(this.reverb);
    o.start(when);
    o.stop(when + 0.12);
  }

  private scheduleBubbles() {
    const loop = () => {
      if (this.ctx && !this.muted) {
        const t = this.ctx.currentTime + 0.05;
        const n = 1 + Math.floor(Math.random() * (3 + this.motion * 4));
        const pan = Math.random() * 1.6 - 0.8;
        for (let i = 0; i < n; i++) this.bubble(t + i * (0.05 + Math.random() * 0.12), pan + (Math.random() - 0.5) * 0.2);
      }
      this.timers.push(window.setTimeout(loop, 1500 + Math.random() * 4500 * (1 - this.motion * 0.6)));
    };
    loop();
  }

  private scheduleCalls() {
    const loop = () => {
      if (this.ctx && !this.muted) {
        const ctx = this.ctx;
        const t = ctx.currentTime + 0.1;
        const o = ctx.createOscillator();
        o.type = 'sine';
        const base = 180 + Math.random() * 120;
        o.frequency.setValueAtTime(base, t);
        o.frequency.linearRampToValueAtTime(base * 1.5, t + 1.4);
        o.frequency.linearRampToValueAtTime(base * 0.8, t + 3.6);
        const vib = ctx.createOscillator();
        vib.frequency.value = 5;
        const vg = ctx.createGain();
        vg.gain.value = 6;
        vib.connect(vg).connect(o.frequency);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.025, t + 1);
        g.gain.linearRampToValueAtTime(0, t + 3.8);
        o.connect(g).connect(this.reverb);
        o.start(t); vib.start(t);
        o.stop(t + 4); vib.stop(t + 4);
      }
      this.timers.push(window.setTimeout(loop, 25000 + Math.random() * 35000));
    };
    this.timers.push(window.setTimeout(loop, 12000));
  }

  hover() {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(1400, t);
    o.frequency.exponentialRampToValueAtTime(900, t + 0.05);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.06, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    o.connect(g).connect(this.ui);
    o.start(t);
    o.stop(t + 0.1);
  }

  select() {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    [587.33, 880].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0, t + i * 0.07);
      g.gain.linearRampToValueAtTime(0.08, t + i * 0.07 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.07 + 0.9);
      o.connect(g).connect(this.ui);
      o.start(t + i * 0.07);
      o.stop(t + i * 0.07 + 1);
    });
  }

  /** Low whoosh for section transitions. */
  whoosh() {
    if (!this.ctx || this.muted) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer(2);
    const f = ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 1.2;
    f.frequency.setValueAtTime(200, t);
    f.frequency.exponentialRampToValueAtTime(900, t + 0.5);
    f.frequency.exponentialRampToValueAtTime(150, t + 1.5);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.5, t + 0.4);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    src.connect(f).connect(g);
    g.connect(this.master);
    g.connect(this.reverb);
    src.start(t);
    src.stop(t + 1.7);
  }

  dispose() {
    this.timers.forEach((t) => clearTimeout(t));
    this.ctx?.close();
  }
}

export const audio = new AudioEngine();
