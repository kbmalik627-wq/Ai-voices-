import React, { useState } from 'react';
import type { VoicePersona } from '../types/voice';
import { PRO_VOICES } from '../data/voices';
import { Play, Check, Sparkles, Volume2 } from 'lucide-react';
import { studioEngine } from '../utils/audioEngine';

interface VoiceSelectorProps {
  selectedVoice: VoicePersona;
  onSelectVoice: (voice: VoicePersona) => void;
  onPreviewSpeech: (voice: VoicePersona) => void;
  previewingVoiceId: string | null;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  selectedVoice,
  onSelectVoice,
  onPreviewSpeech,
  previewingVoiceId,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categories = ['All', 'Narrator', 'Cinematic', 'Character', 'Lifestyle'];

  const filteredVoices = PRO_VOICES.filter((v) =>
    activeCategory === 'All' ? true : v.category === activeCategory
  );

  return (
    <div className="space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span>Select Voice Persona</span>
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-violet-950/80 text-violet-300 border border-violet-800/60 font-semibold">
            {PRO_VOICES.length} Studio Pro
          </span>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2.5 py-1 rounded-lg transition text-xs font-medium cursor-pointer ${
                activeCategory === cat
                  ? 'bg-violet-600 text-white shadow-sm shadow-violet-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of 8 Pro Voices */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {filteredVoices.map((voice) => {
          const isSelected = selectedVoice.id === voice.id;
          const isPreviewing = previewingVoiceId === voice.id;

          return (
            <div
              key={voice.id}
              onClick={() => onSelectVoice(voice)}
              className={`group relative rounded-xl p-3.5 transition-all duration-200 cursor-pointer border text-left flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-b from-slate-900 via-violet-950/20 to-slate-900 border-violet-500 shadow-lg shadow-violet-500/10 ring-1 ring-violet-500/50'
                  : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Top Row: Avatar & Tags */}
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-gradient-to-tr ${voice.color} shadow-md shadow-black/40 ring-1 ring-white/10`}
                    >
                      {voice.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="text-sm font-bold text-white group-hover:text-violet-200 transition">
                          {voice.name}
                        </h4>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-violet-500 text-white flex items-center justify-center text-[10px]">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {voice.gender} • {voice.category}
                      </span>
                    </div>
                  </div>

                  {/* Preview audio demo button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreviewSpeech(voice);
                    }}
                    title="Play voice preview sample"
                    className={`p-1.5 rounded-lg border transition cursor-pointer ${
                      isPreviewing
                        ? 'bg-emerald-500 text-white border-emerald-400 animate-pulse'
                        : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
                    }`}
                  >
                    {isPreviewing ? (
                      <Volume2 className="w-3.5 h-3.5" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                  </button>
                </div>

                {/* Tagline */}
                <p className="text-xs text-slate-300 font-medium line-clamp-1 mb-1">
                  {voice.tagline}
                </p>
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {voice.description}
                </p>
              </div>

              {/* Bottom Specs */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>Speed: {voice.speedRate}x</span>
                <span>
                  Pitch: {voice.pitchOffset >= 0 ? `+${voice.pitchOffset}` : voice.pitchOffset}st
                </span>
                <span className="text-violet-400/90 font-medium">
                  {voice.geminiVoice}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
