import React, { useState } from 'react';
import type { VoiceTake } from '../types/voice';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Repeat,
  Download,
  Share2,
} from 'lucide-react';

interface TransportBarProps {
  currentTake: VoiceTake | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (time: number) => void;
  onDownload: () => void;
  onShare: () => void;
  loop: boolean;
  onToggleLoop: () => void;
  masterVolume: number;
  onVolumeChange: (vol: number) => void;
}

export const TransportBar: React.FC<TransportBarProps> = ({
  currentTake,
  isPlaying,
  currentTime,
  duration,
  onPlay,
  onPause,
  onSeek,
  onDownload,
  onShare,
  loop,
  onToggleLoop,
  masterVolume,
  onVolumeChange,
}) => {
  const [prevVolume, setPrevVolume] = useState(1);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '00:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleMute = () => {
    if (masterVolume > 0) {
      setPrevVolume(masterVolume);
      onVolumeChange(0);
    } else {
      onVolumeChange(prevVolume || 0.8);
    }
  };

  if (!currentTake) {
    return (
      <div className="fixed bottom-0 inset-x-0 bg-slate-950/90 border-t border-slate-800/80 backdrop-blur-md px-4 py-3 z-30 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-600"></span>
            <span>App dozine Studio Ready • Generate voice or record microphone to preview audio</span>
          </div>
          <span className="font-mono text-slate-500 hidden sm:inline">24kHz • 16-bit PCM • Pro Studio</span>
        </div>
      </div>
    );
  }

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 inset-x-0 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-xl px-4 py-3 z-30 shadow-2xl transition-all">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6">
        {/* Left: Take Info */}
        <div className="flex items-center gap-3 w-full sm:w-auto min-w-[200px]">
          <div className="w-10 h-10 rounded-xl bg-violet-950/80 border border-violet-800/60 flex items-center justify-center text-lg shadow-sm">
            🎙️
          </div>
          <div className="truncate flex-1">
            <h4 className="text-xs sm:text-sm font-bold text-white truncate">
              {currentTake.title}
            </h4>
            <p className="text-[11px] text-slate-400 truncate flex items-center gap-1.5">
              <span className="text-violet-400 font-medium">{currentTake.voiceName}</span>
              <span>•</span>
              <span className="capitalize">{currentTake.source} take</span>
            </p>
          </div>
        </div>

        {/* Center: Transport Controls & Scrubber */}
        <div className="flex-1 max-w-2xl w-full flex flex-col items-center gap-1.5">
          {/* Main Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => onSeek(0)}
              title="Restart from beginning"
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={isPlaying ? onPause : onPlay}
              className="w-10 h-10 rounded-full bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center shadow-lg shadow-violet-600/30 hover:scale-105 active:scale-95 transition cursor-pointer"
              title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 fill-current" />
              ) : (
                <Play className="w-5 h-5 fill-current ml-0.5" />
              )}
            </button>

            <button
              onClick={onToggleLoop}
              title={loop ? 'Looping enabled' : 'Looping disabled'}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                loop
                  ? 'text-violet-400 bg-violet-950/60 border border-violet-800/60'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Repeat className="w-4 h-4" />
            </button>
          </div>

          {/* Scrubber Timeline */}
          <div className="w-full flex items-center gap-2.5 text-[11px] font-mono text-slate-400">
            <span className="w-10 text-right">{formatTime(currentTime)}</span>
            <div className="relative flex-1 flex items-center">
              <input
                type="range"
                min="0"
                max={duration || 1}
                step="0.05"
                value={currentTime}
                onChange={(e) => onSeek(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
              />
            </div>
            <span className="w-10">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Right: Volume & Export Buttons */}
        <div className="flex items-center justify-end gap-2.5 w-full sm:w-auto">
          {/* Volume */}
          <div className="hidden lg:flex items-center gap-1.5 mr-2">
            <button
              onClick={toggleMute}
              className="text-slate-400 hover:text-white p-1 rounded transition cursor-pointer"
            >
              {masterVolume === 0 ? (
                <VolumeX className="w-4 h-4 text-red-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={masterVolume}
              onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
              className="w-16 accent-violet-500 cursor-pointer"
            />
          </div>

          <button
            onClick={onShare}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold transition cursor-pointer"
            title="Share this take"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>

          <button
            onClick={onDownload}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition cursor-pointer hover:scale-102"
            title="Download uncompressed 16-bit WAV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download WAV</span>
          </button>
        </div>
      </div>
    </div>
  );
};
