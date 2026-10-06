import React, { useState } from 'react';
import type { VoiceTake } from '../types/voice';
import { X, Copy, Check, Share2, Code, Globe } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTake: VoiceTake | null;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, currentTake }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);

  if (!isOpen) return null;

  const currentUrl = window.location.href;
  const takeTitle = currentTake?.title || 'AI Voices Audio Take';
  const embedCode = `<iframe src="${currentUrl}" width="100%" height="300" frameborder="0" allow="autoplay; microphone"></iframe>`;

  const copyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    setTimeout(() => setCopiedEmbed(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-white border border-emerald-100 shadow-2xl p-6 text-left space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-[#01411C] flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                شیئر کریں (Share Voice)
              </h3>
              <p className="text-xs text-slate-500 truncate max-w-[220px]">
                {takeTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Share Link */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-[#01411C]" />
            <span>ویب سائٹ لنک (Share Link)</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={currentUrl}
              className="flex-1 rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-700 font-mono select-all focus:outline-none"
            />
            <button
              onClick={copyLink}
              className="flex items-center gap-1 px-3.5 py-2 rounded-xl bg-[#01411C] hover:bg-[#025c27] text-white text-xs font-bold transition cursor-pointer shadow-sm"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedLink ? 'کاپی ہوا' : 'کاپی'}</span>
            </button>
          </div>
        </div>

        {/* Embed Player */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Code className="w-3.5 h-3.5 text-[#01411C]" />
            <span>ویب سائٹ ایمبیڈ کوڈ (Embed Code)</span>
          </label>
          <div className="relative">
            <textarea
              readOnly
              rows={2}
              value={embedCode}
              className="w-full rounded-xl bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-600 font-mono resize-none focus:outline-none"
            />
            <button
              onClick={copyEmbed}
              className="absolute top-2 right-2 p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-[#01411C] transition cursor-pointer"
              title="Copy embed snippet"
            >
              {copiedEmbed ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
          <span>Format: 16-bit PCM WAV</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition cursor-pointer"
          >
            بند کریں (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
