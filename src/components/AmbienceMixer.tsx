import React from 'react';
import type { AmbienceType } from '../types/voice';
import { AMBIENCE_OPTIONS } from '../data/voices';
import { Music, Volume2 } from 'lucide-react';
import { studioEngine } from '../utils/audioEngine';

interface AmbienceMixerProps {
  currentAmbience: AmbienceType;
  ambienceVolume: number;
  onAmbienceChange: (type: AmbienceType) => void;
  onVolumeChange: (volume: number) => void;
}

export const AmbienceMixer: React.FC<AmbienceMixerProps> = ({
  currentAmbience,
  ambienceVolume,
  onAmbienceChange,
  onVolumeChange,
}) => {
  const handleSelect = (type: AmbienceType) => {
    onAmbienceChange(type);
    studioEngine.setAmbience(type, ambienceVolume);
  };

  const handleVolume = (vol: number) => {
    onVolumeChange(vol);
    studioEngine.setAmbienceVolume(vol);
  };

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-xl backdrop-blur-sm p-4 sm:p-5 space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/60 pb-2.5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 font-['Inter']">
            <Music className="w-4 h-4 text-cyan-400" />
            <span>Studio Ambience & Soundscapes</span>
          </h3>
          <span className="text-[10px] text-cyan-300 bg-cyan-950/80 border border-cyan-800/60 px-2 py-0.5 rounded-full font-semibold">
            Procedural Bed
          </span>
        </div>

        {/* Volume Fader */}
        <div className="flex items-center gap-2 text-xs">
          <Volume2 className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 font-mono text-[11px]">Bed Vol:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={ambienceVolume}
            onChange={(e) => handleVolume(parseFloat(e.target.value))}
            className="w-20 sm:w-28 accent-cyan-400 cursor-pointer"
          />
          <span className="font-mono text-cyan-400 text-[11px] w-8">
            {Math.round(ambienceVolume * 100)}%
          </span>
        </div>
      </div>

      {/* Grid of ambience options */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {AMBIENCE_OPTIONS.map((opt) => {
          const isSelected = currentAmbience === opt.id;
          return (
            <button
              key={opt.id}
              onClick={() => handleSelect(opt.id)}
              className={`p-3 rounded-xl border text-left transition flex flex-col justify-between cursor-pointer ${
                isSelected
                  ? 'bg-cyan-950/40 border-cyan-500 text-white shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/40'
                  : 'bg-slate-950/70 hover:bg-slate-800/60 border-slate-800 text-slate-300'
              }`}
            >
              <div className="text-xl mb-1.5">{opt.icon}</div>
              <div>
                <div className="text-xs font-bold leading-tight truncate">{opt.name}</div>
                <div className="text-[10px] text-slate-500 line-clamp-1">{opt.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
