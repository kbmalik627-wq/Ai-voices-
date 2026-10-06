import React from 'react';
import type { VoiceTake } from '../types/voice';
import { Play, Pause, Download, Trash2, FolderKanban, Clock } from 'lucide-react';

interface ProjectsTabProps {
  takes: VoiceTake[];
  currentTakeId: string | null;
  isPlaying: boolean;
  onPlayTake: (take: VoiceTake) => void;
  onPauseTake: () => void;
  onDownloadTake: (take: VoiceTake) => void;
  onDeleteTake: (id: string) => void;
  onClearAll: () => void;
  onGoToHome: () => void;
}

export const ProjectsTab: React.FC<ProjectsTabProps> = ({
  takes,
  currentTakeId,
  isPlaying,
  onPlayTake,
  onPauseTake,
  onDownloadTake,
  onDeleteTake,
  onClearAll,
  onGoToHome,
}) => {
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="p-2 rounded-xl bg-emerald-50 text-[#01411C]">
            <FolderKanban className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              محفوظ شدہ پروجیکٹس (My Projects)
            </h2>
            <p className="text-xs text-slate-500">
              {takes.length} آڈیو فائلز محفوظ ہیں
            </p>
          </div>
        </div>

        {takes.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-xl transition cursor-pointer"
          >
            سب ڈیلیٹ کریں (Clear All)
          </button>
        )}
      </div>

      {takes.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-100 text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-[#01411C] flex items-center justify-center text-3xl mx-auto shadow-sm">
            🎙️
          </div>
          <h3 className="text-base font-bold text-slate-900">
            ابھی تک کوئی پروجیکٹ نہیں بنا
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            ہوم پیج پر جا کر اپنا پسندیدہ متن لکھیں اور ایک کلک میں آواز بنائیں۔
          </p>
          <button
            onClick={onGoToHome}
            className="mt-2 inline-flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#01411C] text-white text-xs font-bold shadow-md hover:bg-[#025c27] transition cursor-pointer"
          >
            <span>نئی آواز بنائیں (Create Voice)</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {takes.map((take) => {
            const isThisPlaying = currentTakeId === take.id && isPlaying;

            return (
              <div
                key={take.id}
                className={`bg-white rounded-2xl p-4 border transition-all flex items-center justify-between gap-3 shadow-xs ${
                  currentTakeId === take.id
                    ? 'border-[#01411C] bg-emerald-50/40'
                    : 'border-slate-100 hover:border-emerald-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={() => (isThisPlaying ? onPauseTake() : onPlayTake(take))}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition cursor-pointer flex-shrink-0 shadow-sm ${
                      isThisPlaying
                        ? 'bg-[#01411C] text-white shadow-emerald-950/20'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-[#01411C]'
                    }`}
                  >
                    {isThisPlaying ? (
                      <Pause className="w-5 h-5 fill-current" />
                    ) : (
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-900 truncate">
                      {take.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md text-[10px]">
                        {take.voiceName}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-0.5 font-mono text-[11px]">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatTime(take.duration)}
                      </span>
                      <span>•</span>
                      <span className="text-[11px] text-slate-400">
                        {formatDate(take.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => onDownloadTake(take)}
                    title="Download WAV"
                    className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-[#01411C] transition cursor-pointer border border-emerald-200"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDeleteTake(take.id)}
                    title="Delete project"
                    className="p-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
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
