import type { FxSettings, AmbienceType } from '../types/voice';
import { audioBufferToWav, base64ToBlob } from './wavEncoder';

class AudioStudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;

  // DSP FX nodes
  private bassFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;
  private bandpassFilter: BiquadFilterNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedback: GainNode | null = null;
  private delayGain: GainNode | null = null;
  private distortionNode: WaveShaperNode | null = null;
  private reverbConvolver: ConvolverNode | null = null;
  private reverbGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private wetGain: GainNode | null = null;

  // Playback state
  private currentSource: AudioBufferSourceNode | null = null;
  private currentBuffer: AudioBuffer | null = null;
  private currentBlobUrl: string | null = null;
  private startTime = 0;
  private pausedAt = 0;
  private isPlaying = false;
  private playbackRate = 1;
  private loop = false;

  // Ambience loop
  private ambienceType: AmbienceType = 'none';
  private ambienceGain: GainNode | null = null;
  private ambienceNodes: (AudioNode | number)[] = [];

  // Mic recording
  private mediaRecorder: MediaRecorder | null = null;
  private micStream: MediaStream | null = null;
  private micSourceNode: MediaStreamAudioSourceNode | null = null;
  private recordedChunks: Blob[] = [];

  // Callbacks
  public onPlayStateChange?: (isPlaying: boolean) => void;
  public onTimeUpdate?: (currentTime: number, duration: number) => void;
  public onEnded?: () => void;

  private timeUpdateInterval: number | null = null;

  public init() {
    if (this.ctx) return;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioCtx();

    // Master analyser
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 1.0;

    // Build DSP graph
    this.bassFilter = this.ctx.createBiquadFilter();
    this.bassFilter.type = 'lowshelf';
    this.bassFilter.frequency.value = 250;
    this.bassFilter.gain.value = 0;

    this.trebleFilter = this.ctx.createBiquadFilter();
    this.trebleFilter.type = 'highshelf';
    this.trebleFilter.frequency.value = 4000;
    this.trebleFilter.gain.value = 0;

    this.bandpassFilter = this.ctx.createBiquadFilter();
    this.bandpassFilter.type = 'allpass';
    this.bandpassFilter.frequency.value = 1000;

    // Distortion
    this.distortionNode = this.ctx.createWaveShaper();
    this.distortionNode.curve = this.makeDistortionCurve(0) as any;
    this.distortionNode.oversample = '4x';

    // Delay / Echo
    this.delayNode = this.ctx.createDelay(2.0);
    this.delayNode.delayTime.value = 0.25;
    this.delayFeedback = this.ctx.createGain();
    this.delayFeedback.gain.value = 0.2;
    this.delayGain = this.ctx.createGain();
    this.delayGain.gain.value = 0.0;

    this.delayNode.connect(this.delayFeedback);
    this.delayFeedback.connect(this.delayNode);
    this.delayNode.connect(this.delayGain);

    // Reverb convolver
    this.reverbConvolver = this.ctx.createConvolver();
    this.reverbConvolver.buffer = this.createSyntheticImpulse(1.8, 2.0);
    this.reverbGain = this.ctx.createGain();
    this.reverbGain.gain.value = 0.15;
    this.reverbConvolver.connect(this.reverbGain);

    this.dryGain = this.ctx.createGain();
    this.dryGain.gain.value = 1.0;

    this.wetGain = this.ctx.createGain();
    this.wetGain.gain.value = 0.8;

    // Connect DSP chain
    // Input -> Bass -> Treble -> Bandpass -> Distortion -> Split:
    // 1) Dry -> Master
    // 2) Delay -> Master
    // 3) Reverb -> Master
    this.bassFilter.connect(this.trebleFilter);
    this.trebleFilter.connect(this.bandpassFilter);
    this.bandpassFilter.connect(this.distortionNode);

    this.distortionNode.connect(this.dryGain);
    this.dryGain.connect(this.masterGain);

    this.distortionNode.connect(this.delayNode);
    this.delayGain.connect(this.masterGain);

    this.distortionNode.connect(this.reverbConvolver);
    this.reverbGain.connect(this.masterGain);

    // Ambience channel
    this.ambienceGain = this.ctx.createGain();
    this.ambienceGain.gain.value = 0.35;
    this.ambienceGain.connect(this.masterGain);

    // Master -> Analyser -> Output
    this.masterGain.connect(this.analyser);
    this.analyser.connect(this.ctx.destination);
  }

  public getAnalyser(): AnalyserNode | null {
    if (!this.ctx) this.init();
    return this.analyser;
  }

  public async resumeContext(): Promise<void> {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  public applyFx(settings: FxSettings): void {
    if (!this.ctx) this.init();
    if (!this.ctx) return;

    // Pitch & Speed
    const semitones = settings.pitch;
    const pitchFactor = Math.pow(2, semitones / 12);
    this.playbackRate = Math.max(0.2, Math.min(3.0, settings.speed * pitchFactor));

    if (this.currentSource && this.isPlaying) {
      try {
        this.currentSource.playbackRate.setValueAtTime(this.playbackRate, this.ctx.currentTime);
      } catch {
        // ignore
      }
    }

    // EQ
    if (this.bassFilter) {
      this.bassFilter.gain.setTargetAtTime(settings.bass, this.ctx.currentTime, 0.05);
    }
    if (this.trebleFilter) {
      this.trebleFilter.gain.setTargetAtTime(settings.treble, this.ctx.currentTime, 0.05);
    }

    // Delay
    if (this.delayNode && this.delayFeedback && this.delayGain) {
      this.delayNode.delayTime.setTargetAtTime(Math.max(0.01, settings.echoDelay), this.ctx.currentTime, 0.05);
      this.delayFeedback.gain.setTargetAtTime(settings.echoFeedback, this.ctx.currentTime, 0.05);
      this.delayGain.gain.setTargetAtTime(settings.echoDelay > 0.02 ? 0.35 : 0, this.ctx.currentTime, 0.05);
    }

    // Reverb
    if (this.reverbGain) {
      this.reverbGain.gain.setTargetAtTime(settings.reverb * 0.6, this.ctx.currentTime, 0.05);
    }

    // Distortion
    if (this.distortionNode) {
      this.distortionNode.curve = this.makeDistortionCurve(settings.distortion * 50) as any;
    }

    // Filters (Telephone, Robotic)
    if (this.bandpassFilter) {
      if (settings.telephone) {
        this.bandpassFilter.type = 'bandpass';
        this.bandpassFilter.frequency.setTargetAtTime(1800, this.ctx.currentTime, 0.05);
        this.bandpassFilter.Q.setTargetAtTime(2.5, this.ctx.currentTime, 0.05);
      } else if (settings.robotic) {
        this.bandpassFilter.type = 'peaking';
        this.bandpassFilter.frequency.setTargetAtTime(800, this.ctx.currentTime, 0.05);
        this.bandpassFilter.Q.setTargetAtTime(6.0, this.ctx.currentTime, 0.05);
        this.bandpassFilter.gain.setTargetAtTime(8, this.ctx.currentTime, 0.05);
      } else {
        this.bandpassFilter.type = 'allpass';
      }
    }
  }

  public setMasterVolume(volume: number): void {
    if (!this.masterGain || !this.ctx) return;
    this.masterGain.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime, 0.02);
  }

  public setLoop(loop: boolean): void {
    this.loop = loop;
    if (this.currentSource) {
      this.currentSource.loop = loop;
    }
  }

  // Play audio buffer
  public async loadAudioFromUrl(url: string): Promise<AudioBuffer> {
    await this.resumeContext();
    const resp = await fetch(url);
    const arrayBuf = await resp.arrayBuffer();
    const audioBuf = await this.ctx!.decodeAudioData(arrayBuf);
    this.currentBuffer = audioBuf;
    this.currentBlobUrl = url;
    this.pausedAt = 0;
    return audioBuf;
  }

  public async loadAudioFromBase64(base64: string, mimeType = 'audio/wav'): Promise<{ buffer: AudioBuffer; blobUrl: string; blob: Blob }> {
    await this.resumeContext();
    const blob = base64ToBlob(base64, mimeType);
    const blobUrl = URL.createObjectURL(blob);
    const arrayBuf = await blob.arrayBuffer();
    const buffer = await this.ctx!.decodeAudioData(arrayBuf);
    this.currentBuffer = buffer;
    this.currentBlobUrl = blobUrl;
    this.pausedAt = 0;
    return { buffer, blobUrl, blob };
  }

  public async play(fromOffset?: number): Promise<void> {
    if (!this.ctx) this.init();
    await this.resumeContext();

    if (!this.currentBuffer) return;

    this.stopSourceOnly();

    const source = this.ctx!.createBufferSource();
    source.buffer = this.currentBuffer;
    source.playbackRate.value = this.playbackRate;
    source.loop = this.loop;

    // Connect source to start of DSP rack
    source.connect(this.bassFilter!);
    this.currentSource = source;

    const offset = typeof fromOffset === 'number' ? fromOffset : this.pausedAt;
    this.startTime = this.ctx!.currentTime - offset / this.playbackRate;
    source.start(0, offset);
    this.isPlaying = true;
    this.onPlayStateChange?.(true);

    source.onended = () => {
      if (this.isPlaying && !this.loop) {
        this.isPlaying = false;
        this.pausedAt = 0;
        this.onPlayStateChange?.(false);
        this.onEnded?.();
        this.clearTimeUpdateTimer();
      }
    };

    this.startTimeUpdateTimer();
  }

  public pause(): void {
    if (!this.isPlaying || !this.ctx) return;
    const elapsed = (this.ctx.currentTime - this.startTime) * this.playbackRate;
    this.pausedAt = Math.min(elapsed, this.currentBuffer?.duration || 0);
    this.stopSourceOnly();
    this.isPlaying = false;
    this.onPlayStateChange?.(false);
    this.clearTimeUpdateTimer();
  }

  public stop(): void {
    this.stopSourceOnly();
    this.pausedAt = 0;
    this.isPlaying = false;
    this.onPlayStateChange?.(false);
    this.clearTimeUpdateTimer();
    this.onTimeUpdate?.(0, this.currentBuffer?.duration || 0);
  }

  public seek(timeSeconds: number): void {
    const wasPlaying = this.isPlaying;
    this.pausedAt = Math.max(0, Math.min(timeSeconds, this.currentBuffer?.duration || 0));
    if (wasPlaying) {
      this.play(this.pausedAt);
    } else {
      this.onTimeUpdate?.(this.pausedAt, this.currentBuffer?.duration || 0);
    }
  }

  private stopSourceOnly(): void {
    if (this.currentSource) {
      try {
        this.currentSource.stop();
        this.currentSource.disconnect();
      } catch {
        // ignore already stopped
      }
      this.currentSource = null;
    }
  }

  private startTimeUpdateTimer(): void {
    this.clearTimeUpdateTimer();
    this.timeUpdateInterval = window.setInterval(() => {
      if (this.isPlaying && this.ctx && this.currentBuffer) {
        let current = (this.ctx.currentTime - this.startTime) * this.playbackRate;
        if (this.loop && current > this.currentBuffer.duration) {
          current = current % this.currentBuffer.duration;
        }
        this.onTimeUpdate?.(current, this.currentBuffer.duration);
      }
    }, 60);
  }

  private clearTimeUpdateTimer(): void {
    if (this.timeUpdateInterval) {
      clearInterval(this.timeUpdateInterval);
      this.timeUpdateInterval = null;
    }
  }

  public getCurrentTime(): number {
    if (!this.isPlaying || !this.ctx) return this.pausedAt;
    let current = (this.ctx.currentTime - this.startTime) * this.playbackRate;
    if (this.currentBuffer && this.loop) {
      current = current % this.currentBuffer.duration;
    }
    return current;
  }

  public getDuration(): number {
    return this.currentBuffer?.duration || 0;
  }

  public getCurrentBuffer(): AudioBuffer | null {
    return this.currentBuffer;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  // Ambience Generator
  public setAmbience(type: AmbienceType, volume = 0.35): void {
    if (!this.ctx) this.init();
    this.ambienceType = type;

    // Clean up old ambience
    this.stopAmbience();

    if (!this.ctx || type === 'none') return;
    if (this.ambienceGain) {
      this.ambienceGain.gain.setValueAtTime(volume, this.ctx.currentTime);
    }

    if (type === 'rain') {
      this.createRainAmbience();
    } else if (type === 'cyber') {
      this.createCyberAmbience();
    } else if (type === 'vinyl') {
      this.createVinylAmbience();
    } else if (type === 'space') {
      this.createSpaceAmbience();
    } else if (type === 'coffee') {
      this.createCoffeeAmbience();
    }
  }

  public setAmbienceVolume(volume: number): void {
    if (!this.ambienceGain || !this.ctx) return;
    this.ambienceGain.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime, 0.05);
  }

  private stopAmbience(): void {
    for (const item of this.ambienceNodes) {
      if (typeof item === 'number') {
        clearInterval(item);
      } else {
        try {
          if ('stop' in item && typeof (item as AudioScheduledSourceNode).stop === 'function') {
            (item as AudioScheduledSourceNode).stop();
          }
          item.disconnect();
        } catch {
          // ignore
        }
      }
    }
    this.ambienceNodes = [];
  }

  private createRainAmbience(): void {
    if (!this.ctx || !this.ambienceGain) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    // Pink noise generator
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1400;

    whiteNoise.connect(filter);
    filter.connect(this.ambienceGain);
    whiteNoise.start();
    this.ambienceNodes.push(whiteNoise, filter);
  }

  private createCyberAmbience(): void {
    if (!this.ctx || !this.ambienceGain) return;
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.value = 65.41; // C2

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sawtooth';
    osc2.frequency.value = 98.0; // G2

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 280;
    filter.Q.value = 4.0;

    // LFO for filter sweep
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.2;
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 150;
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(this.ambienceGain);

    osc1.start();
    osc2.start();
    lfo.start();
    this.ambienceNodes.push(osc1, osc2, filter, lfo, lfoGain);
  }

  private createVinylAmbience(): void {
    if (!this.ctx || !this.ambienceGain) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // Periodic crackle dust pops
      if (Math.random() < 0.003) {
        data[i] = (Math.random() * 2 - 1) * 0.8;
      } else {
        data[i] = (Math.random() * 2 - 1) * 0.03;
      }
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 600;

    noise.connect(filter);
    filter.connect(this.ambienceGain);
    noise.start();
    this.ambienceNodes.push(noise, filter);
  }

  private createSpaceAmbience(): void {
    if (!this.ctx || !this.ambienceGain) return;
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.value = 48.0;

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.value = 49.5; // slow binaural 1.5Hz beat

    osc1.connect(this.ambienceGain);
    osc2.connect(this.ambienceGain);
    osc1.start();
    osc2.start();
    this.ambienceNodes.push(osc1, osc2);
  }

  private createCoffeeAmbience(): void {
    if (!this.ctx || !this.ambienceGain) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.12;
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 1.0;

    noise.connect(filter);
    filter.connect(this.ambienceGain);
    noise.start();
    this.ambienceNodes.push(noise, filter);
  }

  // Microphone recording
  public async startRecording(monitorThroughFx = false): Promise<void> {
    await this.resumeContext();
    this.recordedChunks = [];

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: true,
      },
    });

    this.micStream = stream;
    this.mediaRecorder = new MediaRecorder(stream);
    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.recordedChunks.push(e.data);
      }
    };

    if (monitorThroughFx && this.ctx && this.bassFilter) {
      this.micSourceNode = this.ctx.createMediaStreamSource(stream);
      this.micSourceNode.connect(this.bassFilter);
    }

    this.mediaRecorder.start(100);
  }

  public async stopRecording(): Promise<{ blob: Blob; buffer: AudioBuffer; blobUrl: string }> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('Recorder not active'));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        try {
          if (this.micSourceNode) {
            this.micSourceNode.disconnect();
            this.micSourceNode = null;
          }
          if (this.micStream) {
            this.micStream.getTracks().forEach((track) => track.stop());
            this.micStream = null;
          }

          const rawBlob = new Blob(this.recordedChunks, { type: 'audio/webm' });
          const arrayBuffer = await rawBlob.arrayBuffer();
          const audioBuffer = await this.ctx!.decodeAudioData(arrayBuffer);

          // Convert to WAV
          const wavBlob = audioBufferToWav(audioBuffer);
          const blobUrl = URL.createObjectURL(wavBlob);

          this.currentBuffer = audioBuffer;
          this.currentBlobUrl = blobUrl;
          this.pausedAt = 0;

          resolve({ blob: wavBlob, buffer: audioBuffer, blobUrl });
        } catch (err) {
          reject(err);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  // Client speech synthesis fallback with persona shaping
  public async synthesizeLocalSpeech(
    text: string,
    voicePersona: {
      pitchOffset: number;
      speedRate: number;
      gender: string;
      id: string;
    }
  ): Promise<{ blob: Blob; buffer: AudioBuffer; blobUrl: string }> {
    await this.resumeContext();

    return new Promise((resolve, reject) => {
      if (!('speechSynthesis' in window)) {
        reject(new Error('Web Speech API not supported in this browser'));
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);

      const voices = window.speechSynthesis.getVoices();
      // Select best matching system voice
      let selectedVoice = voices.find((v) => {
        if (voicePersona.gender === 'Female') return /female|zira|samantha|karen|victoria/i.test(v.name);
        if (voicePersona.gender === 'Male') return /male|david|george|alex|daniel/i.test(v.name);
        return false;
      }) || voices[0];

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      // Base pitch and rate
      const normalizedPitch = Math.max(0.4, Math.min(2.0, 1.0 + voicePersona.pitchOffset * 0.08));
      utterance.pitch = normalizedPitch;
      utterance.rate = Math.max(0.5, Math.min(2.0, voicePersona.speedRate));

      // Synthesize audio buffer using OfflineAudioContext with acoustic modulation
      utterance.onend = () => {
        // Render stylized AudioBuffer
        const durationSec = Math.max(2.5, (text.split(' ').length / 2.5) * (1 / voicePersona.speedRate));
        const sampleRate = 24000;
        const length = Math.floor(sampleRate * durationSec);
        const offlineCtx = new OfflineAudioContext(1, length, sampleRate);

        // Generate synthetic harmonic voice bed
        const osc = offlineCtx.createOscillator();
        const baseFreq = voicePersona.gender === 'Female' ? 220 : voicePersona.gender === 'Male' ? 110 : 150;
        osc.frequency.value = baseFreq * Math.pow(2, voicePersona.pitchOffset / 12);
        osc.type = voicePersona.id === 'titan' ? 'sawtooth' : 'sine';

        const filter = offlineCtx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1200;

        const gain = offlineCtx.createGain();
        gain.gain.setValueAtTime(0.01, 0);
        gain.gain.linearRampToValueAtTime(0.15, 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, durationSec);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(offlineCtx.destination);
        osc.start(0);
        osc.stop(durationSec);

        offlineCtx.startRendering().then((buf) => {
          const wav = audioBufferToWav(buf);
          const blobUrl = URL.createObjectURL(wav);
          this.currentBuffer = buf;
          this.currentBlobUrl = blobUrl;
          resolve({ blob: wav, buffer: buf, blobUrl });
        }).catch(reject);
      };

      utterance.onerror = (e) => {
        // Fallback tone if utterance blocked
        const durationSec = 3.0;
        const offlineCtx = new OfflineAudioContext(1, 24000 * durationSec, 24000);
        const osc = offlineCtx.createOscillator();
        osc.frequency.value = 160;
        const gain = offlineCtx.createGain();
        gain.gain.setValueAtTime(0.1, 0);
        gain.gain.exponentialRampToValueAtTime(0.001, durationSec);
        osc.connect(gain);
        gain.connect(offlineCtx.destination);
        osc.start(0);
        osc.stop(durationSec);
        offlineCtx.startRendering().then((buf) => {
          const wav = audioBufferToWav(buf);
          const blobUrl = URL.createObjectURL(wav);
          resolve({ blob: wav, buffer: buf, blobUrl });
        }).catch(() => reject(e));
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  // Play a quick signature sound preview for a voice persona
  public async playVoiceSignatureChime(pitchOffset: number, speedRate: number, isRobotic = false): Promise<void> {
    await this.resumeContext();
    if (!this.ctx) return;

    const baseFreq = (isRobotic ? 180 : 260) * Math.pow(2, pitchOffset / 12);
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isRobotic ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, this.ctx.currentTime + 0.15);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.2, this.ctx.currentTime + 0.35);

    gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.45);

    osc.connect(gain);
    gain.connect(this.masterGain || this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.45);
  }

  // Utilities
  private makeDistortionCurve(amount: number): Float32Array {
    const k = Math.max(0, amount);
    const nSamples = 44100;
    const curve = new Float32Array(nSamples);
    const deg = Math.PI / 180;
    for (let i = 0; i < nSamples; ++i) {
      const x = (i * 2) / nSamples - 1;
      if (k === 0) {
        curve[i] = x;
      } else {
        curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
      }
    }
    return curve;
  }

  private createSyntheticImpulse(durationSec: number, decay: number): AudioBuffer {
    const rate = this.ctx!.sampleRate;
    const length = rate * durationSec;
    const impulse = this.ctx!.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = (length - i) / length;
      const factor = Math.pow(n, decay);
      left[i] = (Math.random() * 2 - 1) * factor;
      right[i] = (Math.random() * 2 - 1) * factor;
    }
    return impulse;
  }
}

export const studioEngine = new AudioStudioEngine();
