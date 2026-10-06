import React from 'react';
import { Play, Pause, Download, Share2, Volume2, RotateCcw } from 'lucide-react';
import type { VoiceTake } from '../types/voice';

interface SimpleAudioPlayerProps {
  currentTake: VoiceTake | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onDownload: () => void;
  onShare: () => void;
}

export const SimpleAudioPlayer: React.FC<SimpleAudioPlayerProps> = ({
  currentTake,
  isPlaying,
  currentTime,
  duration,
  onPlay,
  onPause,
  onSeek,
  onDownload,
  onShare,
}) => {
  if (!currentTake) return null;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-[0_10px_30px_rgba(1,65,28,0.08)] border border-emerald-100 transition-all">
      {/* Title & Voice Info */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#01411C] border border-emerald-100 flex items-center justify-center text-xl shadow-inner flex-shrink-0">
            🎙️
          </div>
          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full inline-block mb-0.5">
              آواز تیار ہے (Audio Ready)
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 truncate">
              {currentTake.title}
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              آواز: <strong className="text-[#01411C]">{currentTake.voiceName}</strong>
            </p>
          </div>
        </div>

        {/* Lightweight animated waveform indicator */}
        <div className="flex items-center gap-1 h-6 px-2.5 py-1 rounded-full bg-emerald-50/80">
          {[40, 75, 55, 90, 60, 45].map((h, i) => (
            <span
              key={i}
              className={`w-1 rounded-full bg-[#01411C] transition-all duration-300 ${
                isPlaying ? 'animate-pulse' : 'opacity-40'
              }`}
              style={{
                height: isPlaying ? `${h}%` : '25%',
                animationDelay: `${i * 120}ms`,
              }}
            ></span>
          ))}
        </div>
      </div>

      {/* Scrubber & Controls */}
      <div className="pt-4 space-y-3">
        <div className="flex items-center gap-3 text-xs font-mono text-slate-500">
          <span className="w-10 text-slate-700 font-semibold">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 1}
            step="0.05"
            value={currentTime}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="flex-1 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#01411C]"
          />
          <span className="w-10 text-right">{formatTime(duration)}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          {/* Play/Pause Button */}
          <button
            onClick={isPlaying ? onPause : onPlay}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-[#01411C] font-bold text-sm transition cursor-pointer border border-emerald-200"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pause | روکیں</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current ml-0.5" />
                <span>Play | سنیں</span>
              </>
            )}
          </button>

          {/* Big Green Download Button */}
          <button
            onClick={onDownload}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-[#01411C] hover:bg-[#025c27] text-white font-bold text-sm transition cursor-pointer shadow-md shadow-emerald-950/20"
          >
            <Download className="w-4 h-4" />
            <span>Download WAV | ڈاؤنلوڈ</span>
          </button>

          {/* Share */}
          <button
            onClick={onShare}
            className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
            title="Share Audio"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
