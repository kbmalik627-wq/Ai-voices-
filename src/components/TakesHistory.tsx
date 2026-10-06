import React from 'react';
import type { VoiceTake } from '../types/voice';
import { Play, Pause, Download, Trash2, History, Clock } from 'lucide-react';

interface TakesHistoryProps {
  takes: VoiceTake[];
  currentTakeId: string | null;
  isPlaying: boolean;
  onPlayTake: (take: VoiceTake) => void;
  onPauseTake: () => void;
  onDownloadTake: (take: VoiceTake) => void;
  onDeleteTake: (id: string) => void;
  onClearAll: () => void;
}

export const TakesHistory: React.FC<TakesHistoryProps> = ({
  takes,
  currentTakeId,
  isPlaying,
  onPlayTake,
  onPauseTake,
  onDownloadTake,
  onDeleteTake,
  onClearAll,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-xl backdrop-blur-sm p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-white flex items-center gap-2 font-['Inter']">
            <History className="w-4 h-4 text-violet-400" />
            <span>Studio Takes & History</span>
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
            {takes.length} takes
          </span>
        </div>

        {takes.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs text-slate-500 hover:text-rose-400 transition cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>

      {takes.length === 0 ? (
        <div className="py-8 text-center text-slate-500 text-xs">
          <div className="text-2xl mb-2">🎙️</div>
          <p>No audio takes created yet.</p>
          <p className="text-slate-600 mt-1">Generate text-to-speech or record a mic take above!</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {takes.map((take) => {
            const isThisPlaying = currentTakeId === take.id && isPlaying;
            return (
              <div
                key={take.id}
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition ${
                  currentTakeId === take.id
                    ? 'bg-violet-950/30 border-violet-500/60'
                    : 'bg-slate-950/70 border-slate-800/80 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => (isThisPlaying ? onPauseTake() : onPlayTake(take))}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition cursor-pointer flex-shrink-0 ${
                      isThisPlaying
                        ? 'bg-violet-500 text-white shadow-md shadow-violet-500/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                    }`}
                  >
                    {isThisPlaying ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{take.title}</h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono mt-0.5">
                      <span className="text-violet-400">{take.voiceName}</span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {formatTime(take.duration)}
                      </span>
                      <span>•</span>
                      <span>{formatDate(take.timestamp)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => onDownloadTake(take)}
                    title="Download WAV"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteTake(take.id)}
                    title="Delete take"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-400 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
