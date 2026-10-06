import React from 'react';
import type { VoicePersona } from '../types/voice';
import { PRO_VOICES } from '../data/voices';
import { Play, Volume2, CheckCircle2, Sparkles } from 'lucide-react';

interface VoicesTabProps {
  selectedVoice: VoicePersona;
  onSelectVoice: (voice: VoicePersona) => void;
  onPreviewSpeech: (voice: VoicePersona) => void;
  previewingVoiceId: string | null;
}

export const VoicesTab: React.FC<VoicesTabProps> = ({
  selectedVoice,
  onSelectVoice,
  onPreviewSpeech,
  previewingVoiceId,
}) => {
  return (
    <div className="space-y-4 pb-20">
      {/* Title */}
      <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm">
        <div className="flex items-center gap-2.5 mb-1">
          <span className="p-2 rounded-xl bg-emerald-50 text-[#01411C]">
            <Sparkles className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              آوازیں منتخب کریں (Urdu & English Voices)
            </h2>
            <p className="text-xs text-slate-500">
              Choose from natural human-like voices: Amina, Zayan, Sara & more
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Voices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {PRO_VOICES.map((voice) => {
          const isSelected = selectedVoice.id === voice.id;
          const isPreviewing = previewingVoiceId === voice.id;

          return (
            <div
              key={voice.id}
              onClick={() => onSelectVoice(voice)}
              className={`rounded-3xl p-5 transition-all cursor-pointer border flex flex-col justify-between ${
                isSelected
                  ? 'bg-emerald-50/70 border-[#01411C] shadow-md ring-2 ring-[#01411C]/20'
                  : 'bg-white border-slate-200/80 hover:border-emerald-300 hover:shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-2xl">
                      {voice.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-base font-extrabold text-slate-900">
                          {voice.name}
                        </h3>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-[#01411C] fill-emerald-100" />
                        )}
                      </div>
                      <span className="text-xs font-semibold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded-full inline-block mt-0.5">
                        {voice.gender === 'Female' && voice.id === 'sara'
                          ? 'بچی / Girl'
                          : voice.gender === 'Female'
                          ? 'خاتون / Female'
                          : 'مرد / Male'}
                      </span>
                    </div>
                  </div>

                  {/* Sample Listen button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreviewSpeech(voice);
                    }}
                    title="نمونہ سنیں (Listen sample)"
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                      isPreviewing
                        ? 'bg-[#01411C] text-white animate-pulse'
                        : 'bg-emerald-50 text-[#01411C] hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    {isPreviewing ? (
                      <Volume2 className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                    <span>سنیں</span>
                  </button>
                </div>

                <p className="text-xs font-bold text-slate-800 font-['Noto_Nastaliq_Urdu',sans-serif] leading-relaxed mb-1">
                  {voice.tagline}
                </p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  {voice.description}
                </p>
              </div>

              {/* Bottom Card CTA */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 font-medium">
                  اسپیڈ: {voice.speedRate}x
                </span>
                <button
                  type="button"
                  onClick={() => onSelectVoice(voice)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    isSelected
                      ? 'bg-[#01411C] text-white'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {isSelected ? 'منتخب شدہ (Selected)' : 'یہ آواز منتخب کریں'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
