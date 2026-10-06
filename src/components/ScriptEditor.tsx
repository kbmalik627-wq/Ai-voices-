import React, { useState } from 'react';
import { SAMPLE_SCRIPTS } from '../data/voices';
import { Wand2, Loader2, Sparkles, Clock, FileText, Trash2, Copy, Check } from 'lucide-react';

interface ScriptEditorProps {
  script: string;
  onScriptChange: (newScript: string) => void;
  onGenerateVoice: () => void;
  isGenerating: boolean;
  selectedVoiceName: string;
}

export const ScriptEditor: React.FC<ScriptEditorProps> = ({
  script,
  onScriptChange,
  onGenerateVoice,
  isGenerating,
  selectedVoiceName,
}) => {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [enhanceTone, setEnhanceTone] = useState<'punchy' | 'dramatic' | 'podcast' | 'calm'>('punchy');

  // Words calculation
  const trimmed = script.trim();
  const wordCount = trimmed ? trimmed.split(/\s+/).length : 0;
  const charCount = script.length;
  // Average speaking rate: ~140 words per minute (2.3 words per second)
  const estSeconds = wordCount ? Math.max(1, Math.round(wordCount / 2.3)) : 0;

  const handleCopy = () => {
    if (!script) return;
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEnhanceScript = async () => {
    if (!script.trim() || isEnhancing) return;
    setIsEnhancing(true);

    try {
      const resp = await fetch('/api/enhance-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script, tone: enhanceTone }),
      });
      const data = await resp.json();
      if (data.enhancedScript) {
        onScriptChange(data.enhancedScript);
      }
    } catch (err) {
      console.error('Failed to enhance script:', err);
    } finally {
      setIsEnhancing(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 shadow-xl backdrop-blur-sm p-4 sm:p-5 space-y-4">
      {/* Card Head */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-bold text-white flex items-center gap-2 font-['Inter']">
            <span>✍️</span>
            <span>Your Script</span>
          </h3>
          <span className="text-[11px] text-slate-400 font-mono px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-800">
            {wordCount} words
          </span>
        </div>

        {/* Telemetry info & quick actions */}
        <div className="flex items-center gap-2.5 text-xs text-slate-400">
          <span className="flex items-center gap-1 font-mono text-[11px]">
            <Clock className="w-3.5 h-3.5 text-violet-400" />
            <span>~{estSeconds}s audio</span>
          </span>
          <span className="text-slate-700">•</span>
          <span className="font-mono text-[11px] text-slate-500">
            {charCount} chars
          </span>

          <div className="flex items-center gap-1 ml-1 border-l border-slate-800 pl-2.5">
            <button
              onClick={handleCopy}
              disabled={!script}
              title="Copy text"
              className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition disabled:opacity-40 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={() => onScriptChange('')}
              disabled={!script}
              title="Clear script"
              className="p-1 rounded-md text-slate-400 hover:text-rose-300 hover:bg-slate-800/60 transition disabled:opacity-40 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Script Samples Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap mr-1 flex items-center gap-1">
          <FileText className="w-3 h-3 text-cyan-400" />
          <span>Presets:</span>
        </span>
        {SAMPLE_SCRIPTS.map((item) => (
          <button
            key={item.title}
            onClick={() => onScriptChange(item.text)}
            className="px-2.5 py-1 rounded-lg bg-slate-950/80 hover:bg-slate-800/80 text-slate-300 hover:text-white border border-slate-800/80 text-[11px] whitespace-nowrap transition cursor-pointer"
          >
            {item.title}
          </button>
        ))}
      </div>

      {/* Main Textarea */}
      <div className="relative">
        <textarea
          id="textInput"
          value={script}
          onChange={(e) => onScriptChange(e.target.value)}
          placeholder={`Type anything here...\nExample: Hello, welcome to App dozine. This is a professional AI voice changer and speech synthesis studio designed for content creators, game developers, and voice actors.`}
          rows={5}
          className="w-full rounded-xl bg-slate-950/90 border border-slate-800 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 text-slate-100 placeholder:text-slate-500 text-sm sm:text-base leading-relaxed p-4 resize-y transition shadow-inner font-sans outline-none min-h-[140px]"
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault();
              onGenerateVoice();
            }
          }}
        />

        {/* AI Script Polish Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-slate-800/40 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>AI Polish Tone:</span>
            </span>
            <select
              value={enhanceTone}
              onChange={(e) => setEnhanceTone(e.target.value as any)}
              className="bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-violet-500 cursor-pointer"
            >
              <option value="punchy">⚡ Punchy & High Energy</option>
              <option value="dramatic">🎬 Dramatic & Cinematic</option>
              <option value="podcast">🎙️ Conversational Podcast</option>
              <option value="calm">🌿 Soothing & Relaxed</option>
            </select>
          </div>

          <button
            onClick={handleEnhanceScript}
            disabled={!script.trim() || isEnhancing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-amber-300 hover:text-amber-200 border border-amber-500/30 hover:border-amber-400/50 text-xs font-medium transition disabled:opacity-50 cursor-pointer"
          >
            {isEnhancing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Polishing...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-3.5 h-3.5" />
                <span>Polish Script with AI</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="pt-2">
        <button
          onClick={onGenerateVoice}
          disabled={!script.trim() || isGenerating}
          className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 hover:from-violet-500 hover:via-purple-500 hover:to-indigo-500 p-[1px] transition-all duration-300 shadow-lg shadow-violet-600/30 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed hover:shadow-violet-600/50 hover:scale-[1.008] active:scale-[0.995]"
        >
          <div className="relative flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 font-semibold text-white text-sm sm:text-base">
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-white" />
                <span>Synthesizing Voice with {selectedVoiceName}...</span>
              </>
            ) : (
              <>
                <span className="text-xl">🎙️</span>
                <span>Generate AI Voice with {selectedVoiceName}</span>
                <span className="text-xs px-2 py-0.5 rounded-md bg-white/20 text-white/90 font-mono hidden sm:inline ml-2">
                  Ctrl + Enter
                </span>
              </>
            )}
          </div>
        </button>
      </div>
    </div>
  );
};
