import React, { useState, useRef, useEffect } from 'react';
import type { FxSettings } from '../types/voice';
import { studioEngine } from '../utils/audioEngine';
import {
  Mic,
  Square,
  Upload,
  Sliders,
  RotateCcw,
  Sparkles,
  Zap,
  Radio,
  Ghost,
  Cpu,
  Flame,
  Volume2,
} from 'lucide-react';

interface VoiceChangerRackProps {
  fxSettings: FxSettings;
  onFxChange: (newSettings: FxSettings) => void;
  onAudioRecorded: (blob: Blob, buffer: AudioBuffer, blobUrl: string, title: string) => void;
  onAudioUploaded: (blob: Blob, buffer: AudioBuffer, blobUrl: string, fileName: string) => void;
  isPlaying: boolean;
  onPlayCurrent: () => void;
  hasAudioLoaded: boolean;
}

const PRESETS: {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  settings: FxSettings;
}[] = [
  {
    id: 'clean',
    name: 'Natural Studio',
    icon: <Sparkles className="w-4 h-4 text-emerald-400" />,
    description: 'Crisp unprocessed vocal with subtle warmth',
    settings: {
      pitch: 0,
      speed: 1.0,
      reverb: 0.1,
      echoDelay: 0,
      echoFeedback: 0,
      bass: 1,
      treble: 1.5,
      distortion: 0,
      robotic: false,
      telephone: false,
    },
  },
  {
    id: 'demon',
    name: 'Deep Demon',
    icon: <Ghost className="w-4 h-4 text-red-500" />,
    description: 'Subterranean villain pitch with heavy sub-bass',
    settings: {
      pitch: -7,
      speed: 0.88,
      reverb: 0.45,
      echoDelay: 0.12,
      echoFeedback: 0.25,
      bass: 8.5,
      treble: -3,
      distortion: 0.15,
      robotic: false,
      telephone: false,
    },
  },
  {
    id: 'chipmunk',
    name: 'Helium Chipmunk',
    icon: <Zap className="w-4 h-4 text-amber-400" />,
    description: 'High-pitched cartoon helium effect',
    settings: {
      pitch: 8,
      speed: 1.25,
      reverb: 0.1,
      echoDelay: 0,
      echoFeedback: 0,
      bass: -5,
      treble: 6,
      distortion: 0,
      robotic: false,
      telephone: false,
    },
  },
  {
    id: 'robot',
    name: 'Robot Vocoder',
    icon: <Cpu className="w-4 h-4 text-purple-400" />,
    description: 'Metallic cybernetic synthetic resonance',
    settings: {
      pitch: -3,
      speed: 1.0,
      reverb: 0.35,
      echoDelay: 0.08,
      echoFeedback: 0.4,
      bass: 4,
      treble: 4,
      distortion: 0.3,
      robotic: true,
      telephone: false,
    },
  },
  {
    id: 'radio',
    name: 'Walkie-Talkie',
    icon: <Radio className="w-4 h-4 text-cyan-400" />,
    description: 'Bandpass filtered military comms transceiver',
    settings: {
      pitch: 0,
      speed: 1.0,
      reverb: 0.05,
      echoDelay: 0,
      echoFeedback: 0,
      bass: -8,
      treble: 5,
      distortion: 0.25,
      robotic: false,
      telephone: true,
    },
  },
  {
    id: 'cave',
    name: 'Cathedral Cave',
    icon: <Volume2 className="w-4 h-4 text-blue-400" />,
    description: 'Massive atmospheric acoustic space & reverb',
    settings: {
      pitch: -1,
      speed: 0.95,
      reverb: 0.9,
      echoDelay: 0.38,
      echoFeedback: 0.45,
      bass: 3,
      treble: 0,
      distortion: 0,
      robotic: false,
      telephone: false,
    },
  },
  {
    id: 'megaphone',
    name: 'Megaphone',
    icon: <Flame className="w-4 h-4 text-orange-400" />,
    description: 'Distorted mid-frequency street bullhorn',
    settings: {
      pitch: 1,
      speed: 1.02,
      reverb: 0.1,
      echoDelay: 0.05,
      echoFeedback: 0.2,
      bass: -6,
      treble: 7,
      distortion: 0.4,
      robotic: false,
      telephone: true,
    },
  },
];

export const VoiceChangerRack: React.FC<VoiceChangerRackProps> = ({
  fxSettings,
  onFxChange,
  onAudioRecorded,
  onAudioUploaded,
  isPlaying,
  onPlayCurrent,
  hasAudioLoaded,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [activePresetId, setActivePresetId] = useState<string>('clean');
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleStartRecord = async () => {
    try {
      await studioEngine.startRecording(false);
      setIsRecording(true);
      setRecordSeconds(0);
      timerRef.current = window.setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting recording:', err);
      alert('Microphone access was denied or not available. Please allow microphone permissions.');
    }
  };

  const handleStopRecord = async () => {
    if (!isRecording) return;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);

    try {
      const result = await studioEngine.stopRecording();
      studioEngine.applyFx(fxSettings);
      onAudioRecorded(result.blob, result.buffer, result.blobUrl, `Mic Voice Take (${recordSeconds}s)`);
    } catch (err) {
      console.error('Error stopping recording:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = URL.createObjectURL(file);
      const buffer = await studioEngine.loadAudioFromUrl(url);
      studioEngine.applyFx(fxSettings);
      onAudioUploaded(file, buffer, url, file.name);
    } catch (err) {
      console.error('Error uploading audio:', err);
      alert('Could not decode audio file. Please try a valid MP3, WAV, or OGG file.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const selectPreset = (preset: typeof PRESETS[0]) => {
    setActivePresetId(preset.id);
    onFxChange(preset.settings);
    studioEngine.applyFx(preset.settings);
  };

  const updateParam = (key: keyof FxSettings, value: any) => {
    const updated = { ...fxSettings, [key]: value };
    setActivePresetId('custom');
    onFxChange(updated);
    studioEngine.applyFx(updated);
  };

  const resetFx = () => {
    const defaultFx: FxSettings = {
      pitch: 0,
      speed: 1.0,
      reverb: 0.1,
      echoDelay: 0,
      echoFeedback: 0,
      bass: 0,
      treble: 0,
      distortion: 0,
      robotic: false,
      telephone: false,
    };
    setActivePresetId('clean');
    onFxChange(defaultFx);
    studioEngine.applyFx(defaultFx);
  };

  const formatSecs = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-xl backdrop-blur-sm p-4 sm:p-5 space-y-5">
      {/* Rack Title */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/60">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2 font-['Inter']">
            <span>🎛️</span>
            <span>Microphone Voice Changer & DSP Rack</span>
          </h3>
          <p className="text-xs text-slate-400">
            Record or import voice audio, then reshape with real-time hardware-grade filters
          </p>
        </div>

        <button
          onClick={resetFx}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs transition cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Rack</span>
        </button>
      </div>

      {/* Input Source Actions (Record Mic / Upload Audio) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Record Mic */}
        <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                isRecording
                  ? 'bg-red-500/20 text-red-400 ring-2 ring-red-500 animate-pulse'
                  : 'bg-violet-950/60 text-violet-400 border border-violet-800/50'
              }`}
            >
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">
                {isRecording ? 'Recording Voice...' : 'Record Microphone'}
              </h4>
              <p className="text-xs text-slate-400 font-mono">
                {isRecording ? (
                  <span className="text-red-400 font-bold">{formatSecs(recordSeconds)}</span>
                ) : (
                  'Speak into your mic'
                )}
              </p>
            </div>
          </div>

          {isRecording ? (
            <button
              onClick={handleStopRecord}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-lg shadow-red-600/30 transition cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              onClick={handleStartRecord}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-violet-600/20 transition cursor-pointer"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>Record</span>
            </button>
          )}
        </div>

        {/* Upload Audio */}
        <div className="rounded-xl bg-slate-950/80 border border-slate-800 p-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/60 text-cyan-400 border border-cyan-800/50 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Import Audio File</h4>
              <p className="text-xs text-slate-400 font-mono">MP3, WAV, M4A, OGG</p>
            </div>
          </div>

          <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Browse</span>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Preset Buttons */}
      <div>
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-violet-400" />
          <span>Instant Voice Changer Presets</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {PRESETS.map((preset) => {
            const isSelected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => selectPreset(preset)}
                className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-violet-950/40 border-violet-500 text-white shadow-md shadow-violet-500/10 ring-1 ring-violet-500/40'
                    : 'bg-slate-950/70 hover:bg-slate-800/60 border-slate-800 text-slate-300'
                }`}
              >
                <div className="mb-1">{preset.icon}</div>
                <div className="text-xs font-bold leading-tight truncate">{preset.name}</div>
                <div className="text-[10px] text-slate-500 line-clamp-1">{preset.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fine-Tuning DSP Controls Sliders */}
      <div className="rounded-xl bg-slate-950/60 border border-slate-800/80 p-3.5 sm:p-4 space-y-4">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-300 uppercase tracking-wider border-b border-slate-800/60 pb-2">
          <span>DSP Tone & Harmonizer Controls</span>
          <span className="text-[11px] text-violet-400 font-mono">
            {hasAudioLoaded ? 'Active on Current Track' : 'Applies on playback'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3.5 text-xs">
          {/* Pitch */}
          <div className="space-y-1">
            <div className="flex justify-between text-slate-300 font-medium">
              <span>Pitch Shifter</span>
              <span className="font-mono text-violet-400">
                {fxSettings.pitch > 0 ? `+${fxSettings.pitch}` : fxSettings.pitch} semitones
              </span>
            </div>
            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={fxSettings.pitch}
              onChange={(e) => updateParam('pitch', parseFloat(e.target.value))}
              className="w-full accent-violet-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>-12st (Deep)</span>
              <span>0 (Natural)</span>
              <span>+12st (High)</span>
            </div>
          </div>

          {/* Speed */}
          <div className="space-y-1">
            <div className="flex justify-between text-slate-300 font-medium">
              <span>Speed / Tempo</span>
              <span className="font-mono text-cyan-400">{fxSettings.speed.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={fxSettings.speed}
              onChange={(e) => updateParam('speed', parseFloat(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0.5x Slow</span>
              <span>1.0x Normal</span>
              <span>2.0x Fast</span>
            </div>
          </div>

          {/* Reverb */}
          <div className="space-y-1">
            <div className="flex justify-between text-slate-300 font-medium">
              <span>Reverb Room Size</span>
              <span className="font-mono text-emerald-400">
                {Math.round(fxSettings.reverb * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={fxSettings.reverb}
              onChange={(e) => updateParam('reverb', parseFloat(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Dry (0%)</span>
              <span>Chamber</span>
              <span>Cathedral (100%)</span>
            </div>
          </div>

          {/* Echo Delay */}
          <div className="space-y-1">
            <div className="flex justify-between text-slate-300 font-medium">
              <span>Echo Delay</span>
              <span className="font-mono text-purple-400">
                {Math.round(fxSettings.echoDelay * 1000)}ms
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="0.8"
              step="0.02"
              value={fxSettings.echoDelay}
              onChange={(e) => updateParam('echoDelay', parseFloat(e.target.value))}
              className="w-full accent-purple-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Off</span>
              <span>Slapback</span>
              <span>800ms Echo</span>
            </div>
          </div>

          {/* Bass EQ */}
          <div className="space-y-1">
            <div className="flex justify-between text-slate-300 font-medium">
              <span>Bass Warmth</span>
              <span className="font-mono text-amber-400">
                {fxSettings.bass > 0 ? `+${fxSettings.bass}` : fxSettings.bass} dB
              </span>
            </div>
            <input
              type="range"
              min="-10"
              max="10"
              step="0.5"
              value={fxSettings.bass}
              onChange={(e) => updateParam('bass', parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>-10dB Cut</span>
              <span>0dB Flat</span>
              <span>+10dB Boost</span>
            </div>
          </div>

          {/* Distortion / Drive */}
          <div className="space-y-1">
            <div className="flex justify-between text-slate-300 font-medium">
              <span>Distortion / Crunch</span>
              <span className="font-mono text-rose-400">
                {Math.round(fxSettings.distortion * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="0.8"
              step="0.05"
              value={fxSettings.distortion}
              onChange={(e) => updateParam('distortion', parseFloat(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>Clean</span>
              <span>Saturation</span>
              <span>Heavy Drive</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
