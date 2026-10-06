import React from 'react';
import { Sparkles, Download, ShieldCheck, Share2 } from 'lucide-react';

interface HeaderProps {
  onOpenGrantAccess: () => void;
  onOpenShare: () => void;
  onInstallApp: () => void;
  canInstall: boolean;
  engineMode: 'gemini' | 'local';
}

export const Header: React.FC<HeaderProps> = ({
  onOpenGrantAccess,
  onOpenShare,
  onInstallApp,
  canInstall,
  engineMode,
}) => {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-3.5 transition-all">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-purple-600 to-indigo-500 flex items-center justify-center text-xl shadow-lg shadow-violet-500/25 ring-1 ring-violet-400/30">
            🎙️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-white font-['Inter']">
                App dozine
              </h1>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/40">
                PRO • 8 VOICES
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
              <span>AI Voice Studio</span>
              <span className="w-1 h-1 rounded-full bg-slate-600"></span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                {engineMode === 'gemini' ? 'Gemini Neural TTS' : 'Web Audio Engine'}
              </span>
            </p>
          </div>
        </div>

        {/* Top actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          <button
            onClick={onOpenGrantAccess}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition cursor-pointer"
            title="Grant Access & Licenses"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden sm:inline">Grant Access</span>
          </button>

          <button
            onClick={onOpenShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium transition cursor-pointer"
            title="Share Audio Studio"
          >
            <Share2 className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Share</span>
          </button>

          <button
            onClick={onInstallApp}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-violet-600/20 border border-violet-400/30 transition cursor-pointer hover:scale-102 active:scale-98"
          >
            <Download className="w-3.5 h-3.5" />
            <span>📲 Install App</span>
          </button>
        </div>
      </div>
    </header>
  );
};
