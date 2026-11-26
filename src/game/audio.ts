import { AmbientAudioProfile } from './locations';

/**
 * 零外部資產的輕量級 Web Audio API 區域環境音合成器。
 * 修正：頭尾 1024-sample 交叉淡化消除 2 秒接縫爆音、統一 masterGain（初始為 0 避免啟動 click）、
 * 切換前 cancelScheduledValues 防排程衝突、支援靜音切換與分頁背景自動暫停。
 */
export class AmbientAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private noiseGain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private droneOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private currentProfile: AmbientAudioProfile | null = null;
  private muted = false;

  constructor() {
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.hidden) {
        void this.ctx.suspend();
      } else if (!this.muted) {
        void this.ctx.resume();
      }
    });
  }

  public unlock(): void {
    if (this.ctx) {
      if (this.ctx.state === 'suspended' && !this.muted) {
        void this.ctx.resume();
      }
      return;
    }

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    this.ctx = ctx;

    // 粉紅雜訊緩衝（頭尾 1024-sample 交叉淡化，無縫循環）
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0,
      b1 = 0,
      b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + white * 0.029;
      b1 = 0.985 * b1 + white * 0.032;
      b2 = 0.95 * b2 + white * 0.048;
      data[i] = (b0 + b1 + b2 + white * 0.02) * 0.4;
    }
    const fadeLen = Math.min(1024, Math.floor(bufferSize / 8));
    for (let i = 0; i < fadeLen; i++) {
      const t = i / fadeLen;
      const tailIdx = bufferSize - fadeLen + i;
      data[tailIdx] = data[tailIdx] * (1 - t) + data[i] * t;
    }

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0; // 初始為 0，避免啟動瞬間爆音
    masterGain.connect(ctx.destination);

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 380;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.035;

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noise.start();

    const droneOsc = ctx.createOscillator();
    droneOsc.type = 'sine';
    droneOsc.frequency.value = 196;
    const droneGain = ctx.createGain();
    droneGain.gain.value = 0;
    droneOsc.connect(droneGain);
    droneGain.connect(masterGain);
    droneOsc.start();

    this.masterGain = masterGain;
    this.noiseGain = noiseGain;
    this.filter = filter;
    this.droneOsc = droneOsc;
    this.droneGain = droneGain;

    const now = ctx.currentTime;
    masterGain.gain.setTargetAtTime(this.muted ? 0 : 1, now, 0.35);

    if (this.currentProfile) {
      this.applyProfile(this.currentProfile);
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 1, now, 0.15);
    }
    return this.muted;
  }

  public setProfile(profile: AmbientAudioProfile): void {
    if (this.currentProfile === profile) return;
    this.currentProfile = profile;
    this.applyProfile(profile);
  }

  private rampParam(param: AudioParam, target: number, now: number, tc = 0.6): void {
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.setTargetAtTime(target, now, tc);
  }

  private applyProfile(profile: AmbientAudioProfile): void {
    if (!this.ctx || !this.filter || !this.noiseGain || !this.droneOsc || !this.droneGain) return;
    const now = this.ctx.currentTime;

    const presets: Record<
      AmbientAudioProfile,
      { freq: number; noiseVol: number; droneFreq: number; droneVol: number }
    > = {
      lobby: { freq: 240, noiseVol: 0.02, droneFreq: 220, droneVol: 0.015 },
      meadow: { freq: 420, noiseVol: 0.035, droneFreq: 196, droneVol: 0.0 },
      town: { freq: 520, noiseVol: 0.03, droneFreq: 246, droneVol: 0.004 },
      canyon: { freq: 680, noiseVol: 0.065, droneFreq: 130, droneVol: 0.008 },
      magic: { freq: 480, noiseVol: 0.028, droneFreq: 329.6, droneVol: 0.014 },
      harbor: { freq: 310, noiseVol: 0.075, droneFreq: 164, droneVol: 0.004 },
      capital: { freq: 390, noiseVol: 0.04, droneFreq: 261.6, droneVol: 0.01 },
      forest: { freq: 360, noiseVol: 0.045, droneFreq: 174, droneVol: 0.003 },
    };

    const p = presets[profile];
    this.rampParam(this.filter.frequency, p.freq, now);
    this.rampParam(this.noiseGain.gain, p.noiseVol, now);
    this.rampParam(this.droneOsc.frequency, p.droneFreq, now);
    this.rampParam(this.droneGain.gain, p.droneVol, now);
  }
}
