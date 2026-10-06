export interface VoicePersona {
  id: string;
  name: string;
  tagline: string;
  category: 'Narrator' | 'Character' | 'Cinematic' | 'Lifestyle';
  gender: 'Female' | 'Male' | 'Synthetic';
  avatar: string;
  color: string;
  geminiVoice: string;
  samplePhrase: string;
  pitchOffset: number; // semitones (-12 to +12)
  speedRate: number; // 0.5 to 2.0
  reverbAmount: number; // 0 to 1
  bassBoost: number; // dB
  trebleBoost: number; // dB
  distortion: number; // 0 to 1
  description: string;
}

export interface FxSettings {
  pitch: number; // -12 to 12
  speed: number; // 0.5 to 2.0
  reverb: number; // 0 to 1
  echoDelay: number; // 0 to 0.8s
  echoFeedback: number; // 0 to 0.8
  bass: number; // -10 to +10 dB
  treble: number; // -10 to +10 dB
  distortion: number; // 0 to 1
  robotic: boolean;
  telephone: boolean;
}

export interface VoiceTake {
  id: string;
  title: string;
  timestamp: number;
  duration: number; // seconds
  voiceId: string;
  voiceName: string;
  source: 'tts' | 'record' | 'upload';
  audioBlobUrl: string;
  audioBuffer?: AudioBuffer;
  scriptText?: string;
  sizeBytes?: number;
}

export type AmbienceType = 'none' | 'rain' | 'cyber' | 'vinyl' | 'space' | 'coffee';

export interface AmbienceOption {
  id: AmbienceType;
  name: string;
  icon: string;
  description: string;
}
