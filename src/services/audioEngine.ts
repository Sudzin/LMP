import { EqualizerBand, EqPresetName } from '../types';

export const EQ_FREQUENCIES = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

export const EQ_PRESETS: Record<EqPresetName, number[]> = {
  'Flat': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  'Рок': [4.5, 3.2, 1.0, -1.5, -2.0, 1.2, 3.0, 4.2, 4.5, 5.0],
  'Поп': [-1.0, 1.0, 3.5, 4.5, 3.0, -1.0, -1.5, 1.5, 3.0, 3.5],
  'Джаз': [3.0, 2.0, 1.0, 1.5, -1.0, -1.0, 0, 1.5, 3.0, 3.5],
  'Электронная': [5.5, 4.5, 2.0, 0, -2.5, 1.5, 0.5, 3.5, 5.0, 5.5],
  'Бас-буст': [7.0, 6.0, 5.0, 3.0, 1.0, 0, 0, 0, 0, 0],
  'Кастомный': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private currentElement: HTMLMediaElement | null = null;
  private filters: BiquadFilterNode[] = [];
  private gainNode: GainNode | null = null;
  private analyserNode: AnalyserNode | null = null;
  private isEqEnabled: boolean = true;
  private currentGains: number[] = [...EQ_PRESETS.Flat];

  public init(mediaElement: HTMLMediaElement) {
    if (this.currentElement === mediaElement && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }

    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtx();
      }

      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }

      // If switching media elements, disconnect previous
      if (this.sourceNode) {
        try {
          this.sourceNode.disconnect();
        } catch {
          // ignore
        }
      }

      this.currentElement = mediaElement;

      // Note: createMediaElementSource can only be called once per element in some browsers.
      // Store on element property if already created.
      const elWithSource = mediaElement as unknown as { __audioSourceNode?: MediaElementAudioSourceNode };
      if (elWithSource.__audioSourceNode) {
        this.sourceNode = elWithSource.__audioSourceNode;
      } else {
        this.sourceNode = this.ctx.createMediaElementSource(mediaElement);
        elWithSource.__audioSourceNode = this.sourceNode;
      }

      // Build 10 BiquadFilter nodes
      this.filters = EQ_FREQUENCIES.map((freq, index) => {
        const filter = this.ctx!.createBiquadFilter();
        if (index === 0) {
          filter.type = 'lowshelf';
        } else if (index === EQ_FREQUENCIES.length - 1) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
          filter.Q.value = 1.4;
        }
        filter.frequency.value = freq;
        filter.gain.value = this.isEqEnabled ? this.currentGains[index] : 0;
        return filter;
      });

      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.value = 1.0;

      this.analyserNode = this.ctx.createAnalyser();
      this.analyserNode.fftSize = 128;
      this.analyserNode.smoothingTimeConstant = 0.8;

      // Connect pipeline:
      // source -> filter0 -> ... -> filter9 -> gain -> analyser -> destination
      let previousNode: AudioNode = this.sourceNode;
      for (const filter of this.filters) {
        previousNode.connect(filter);
        previousNode = filter;
      }
      previousNode.connect(this.gainNode);
      this.gainNode.connect(this.analyserNode);
      this.analyserNode.connect(this.ctx.destination);
    } catch (err) {
      console.warn('AudioEngine init error (fallback to native media audio):', err);
    }
  }

  public setBandGain(bandIndex: number, gainDb: number) {
    this.currentGains[bandIndex] = gainDb;
    if (this.filters[bandIndex] && this.ctx) {
      this.filters[bandIndex].gain.setTargetAtTime(
        this.isEqEnabled ? gainDb : 0,
        this.ctx.currentTime,
        0.01
      );
    }
  }

  public setAllBands(gains: number[]) {
    this.currentGains = [...gains];
    if (this.filters.length && this.ctx) {
      this.filters.forEach((filter, idx) => {
        const target = this.isEqEnabled ? (gains[idx] ?? 0) : 0;
        filter.gain.setTargetAtTime(target, this.ctx!.currentTime, 0.01);
      });
    }
  }

  public setEqEnabled(enabled: boolean) {
    this.isEqEnabled = enabled;
    if (this.filters.length && this.ctx) {
      this.filters.forEach((filter, idx) => {
        const target = enabled ? this.currentGains[idx] : 0;
        filter.gain.setTargetAtTime(target, this.ctx!.currentTime, 0.01);
      });
    }
  }

  public getFrequencyData(dataArray: Uint8Array<ArrayBuffer> | Uint8Array): void {
    if (this.analyserNode) {
      // Cast to satisfy TS 5.7+ strict ArrayBufferLike vs ArrayBuffer DOM typing
      this.analyserNode.getByteFrequencyData(dataArray as Uint8Array<ArrayBuffer>);
    } else {
      dataArray.fill(0);
    }
  }

  public getTimeDomainData(dataArray: Uint8Array<ArrayBuffer> | Uint8Array): void {
    if (this.analyserNode) {
      this.analyserNode.getByteTimeDomainData(dataArray as Uint8Array<ArrayBuffer>);
    } else {
      dataArray.fill(128);
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public getContext(): AudioContext | null {
    return this.ctx;
  }
}

export const audioEngine = new AudioEngine();
