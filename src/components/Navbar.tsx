import React from 'react';
import { Volume2, Sparkles } from 'lucide-react';

interface NavbarProps {
  engineMode: 'gemini' | 'local';
}

export const Navbar: React.FC<NavbarProps> = ({ engineMode }) => {
  return (
    <header className="sticky top-0 z-30 bg-[#01411C] text-white shadow-md border-b border-emerald-900/40">
      <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-white text-[#01411C] flex items-center justify-center text-xl font-bold shadow-sm">
            🎙️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold tracking-tight text-white leading-tight">
                AI Voices
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-800 text-emerald-100 border border-emerald-600/50">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-emerald-200/80 font-medium">
              اردو اور انگلش آوازیں • Ultra-Realistic Voices
            </p>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-900/60 border border-emerald-700/50 text-[11px] text-emerald-200 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{engineMode === 'gemini' ? 'Neural AI' : 'Fast Engine'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
