/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { BottomNav, type TabType } from './components/BottomNav';
import { SimpleAudioPlayer } from './components/SimpleAudioPlayer';
import { VoicesTab } from './components/VoicesTab';
import { ProjectsTab } from './components/ProjectsTab';
import { ProfileTab } from './components/ProfileTab';
import { ShareModal } from './components/ShareModal';
import { PwaInstallModal } from './components/PwaInstallModal';

import type { VoicePersona, VoiceTake } from './types/voice';
import { PRO_VOICES, SAMPLE_SCRIPTS } from './data/voices';
import { studioEngine } from './utils/audioEngine';
import { audioBufferToWav, createDemoAudioBuffer } from './utils/wavEncoder';
import {
  Mic2,
  Sparkles,
  CheckCircle2,
  Play,
  RotateCcw,
  Volume2,
  Loader2,
  Copy,
  Check,
  ChevronRight,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('home');

  // Selected Voice Persona (Defaults to Amina)
  const [selectedVoice, setSelectedVoice] = useState<VoicePersona>(PRO_VOICES[0]);
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null);

  // Script Text (Urdu & English friendly default)
  const [script, setScript] = useState<string>(
    'السلام علیکم! خوش آمدید AI Voices میں۔ یہاں آپ اردو اور انگلش دونوں زبانوں میں بہترین آواز بنا سکتے ہیں۔'
  );
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);

  // Playback & Takes State
  const [takes, setTakes] = useState<VoiceTake[]>([]);
  const [currentTake, setCurrentTake] = useState<VoiceTake | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  // Modals & Install
  const [isShareOpen, setIsShareOpen] = useState<boolean>(false);
  const [isPwaModalOpen, setIsPwaModalOpen] = useState<boolean>(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [engineMode, setEngineMode] = useState<'gemini' | 'local'>('gemini');

  // Load initial demo take safely without blocking autoplay
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (!data.hasApiKey) {
          setEngineMode('local');
        }
      })
      .catch(() => setEngineMode('local'));

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Audio Engine callbacks
    studioEngine.onPlayStateChange = (playing) => {
      setIsPlaying(playing);
    };
    studioEngine.onTimeUpdate = (curr, dur) => {
      setCurrentTime(curr);
      setDuration(dur);
    };
    studioEngine.onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    // Lightweight initial welcome take
    const initDemo = async () => {
      try {
        const demoAudio = await createDemoAudioBuffer(2.5);
        const demoTake: VoiceTake = {
          id: 'welcome-take',
          title: 'Amina - خوش آمدید (Welcome)',
          timestamp: Date.now(),
          duration: demoAudio.buffer.duration,
          voiceId: PRO_VOICES[0].id,
          voiceName: PRO_VOICES[0].name,
          source: 'tts',
          audioBlobUrl: demoAudio.blobUrl,
          audioBuffer: demoAudio.buffer,
          scriptText: 'السلام علیکم! خوش آمدید AI Voices میں۔',
          sizeBytes: demoAudio.blob.size,
        };
        setTakes([demoTake]);
        setCurrentTake(demoTake);
        setDuration(demoAudio.buffer.duration);
      } catch (err) {
        console.warn('Initial demo audio init:', err);
      }
    };
    initDemo();

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // Select Voice
  const handleSelectVoice = (voice: VoicePersona) => {
    setSelectedVoice(voice);
  };

  // Quick preview sample
  const handlePreviewSpeech = async (voice: VoicePersona) => {
    setPreviewingVoiceId(voice.id);
    try {
      await studioEngine.resumeContext();
      await studioEngine.playVoiceSignatureChime(
        voice.pitchOffset,
        voice.speedRate,
        false
      );
      await studioEngine.synthesizeLocalSpeech(voice.samplePhrase, voice);
      await studioEngine.play(0);
    } catch (err) {
      console.error('Preview error:', err);
    } finally {
      setTimeout(() => setPreviewingVoiceId(null), 1200);
    }
  };

  // Generate Voice
  const handleGenerateVoice = async () => {
    if (!script.trim() || isGenerating) return;
    setIsGenerating(true);

    try {
      await studioEngine.resumeContext();

      let generatedBuffer: AudioBuffer | null = null;
      let generatedBlobUrl = '';
      let generatedBlob: Blob | null = null;

      // 1. Try server-side Gemini Neural TTS
      try {
        const resp = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: script,
            voiceId: selectedVoice.id,
          }),
        });

        if (resp.ok) {
          const data = await resp.json();
          if (data.audioBase64) {
            const loaded = await studioEngine.loadAudioFromBase64(
              data.audioBase64,
              data.mimeType || 'audio/wav'
            );
            generatedBuffer = loaded.buffer;
            generatedBlobUrl = loaded.blobUrl;
            generatedBlob = loaded.blob;
            setEngineMode('gemini');
          }
        }
      } catch (err) {
        console.warn('Backend TTS skipped, using local synthesis:', err);
      }

      // 2. Instant client-side fallback
      if (!generatedBuffer) {
        setEngineMode('local');
        const synth = await studioEngine.synthesizeLocalSpeech(script, selectedVoice);
        generatedBuffer = synth.buffer;
        generatedBlobUrl = synth.blobUrl;
        generatedBlob = synth.blob;
      }

      const newTake: VoiceTake = {
        id: `take-${Date.now()}`,
        title: `${selectedVoice.name} - ${script.slice(0, 26)}...`,
        timestamp: Date.now(),
        duration: generatedBuffer.duration,
        voiceId: selectedVoice.id,
        voiceName: selectedVoice.name,
        source: 'tts',
        audioBlobUrl: generatedBlobUrl,
        audioBuffer: generatedBuffer,
        scriptText: script,
        sizeBytes: generatedBlob ? generatedBlob.size : undefined,
      };

      setTakes((prev) => [newTake, ...prev]);
      setCurrentTake(newTake);
      setDuration(generatedBuffer.duration);

      // Play audio automatically
      await studioEngine.play(0);
    } catch (err) {
      console.error('Voice generation error:', err);
      alert('آواز بنانے میں مسئلہ پیش آیا۔ برائے کرم دوبارہ کوشش کریں۔');
    } finally {
      setIsGenerating(false);
    }
  };

  // Play a take from list
  const handlePlayTake = async (take: VoiceTake) => {
    setCurrentTake(take);
    if (take.audioBuffer) {
      if (take.audioBlobUrl !== studioEngine.getCurrentBuffer()?.duration?.toString()) {
        await studioEngine.loadAudioFromUrl(take.audioBlobUrl);
      }
      studioEngine.play(0);
    }
  };

  const handleDownloadTake = (take: VoiceTake) => {
    if (!take.audioBuffer) {
      if (take.audioBlobUrl) {
        const a = document.createElement('a');
        a.href = take.audioBlobUrl;
        a.download = `${take.title.replace(/\s+/g, '_')}.wav`;
        a.click();
      }
      return;
    }
    const wavBlob = audioBufferToWav(take.audioBuffer);
    const url = URL.createObjectURL(wavBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${take.title.replace(/\s+/g, '_')}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteTake = (id: string) => {
    setTakes((prev) => prev.filter((t) => t.id !== id));
    if (currentTake?.id === id) {
      studioEngine.stop();
      setCurrentTake(null);
    }
  };

  const handleCopyScript = () => {
    if (!script) return;
    navigator.clipboard.writeText(script);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  const handleTriggerInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setIsPwaModalOpen(true);
    }
  };

  // 3 Primary Featured Voices (Amina, Zayan, Sara)
  const featuredVoices = PRO_VOICES.slice(0, 3);

  return (
    <div className="min-h-screen bg-[#F6F9F6] text-slate-800 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navbar */}
      <Navbar engineMode={engineMode} />

      {/* Main Content Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-4 pt-4 pb-28 space-y-4">
        {/* TAB 1: HOME */}
        {activeTab === 'home' && (
          <div className="space-y-4">
            {/* Step 1: Select Voice */}
            <div className="bg-white rounded-3xl p-5 border border-emerald-100/90 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#01411C] text-white flex items-center justify-center text-xs font-bold">
                    1
                  </span>
                  <h2 className="text-base font-extrabold text-slate-900">
                    آواز منتخب کریں (Select Voice)
                  </h2>
                </div>

                <button
                  onClick={() => setActiveTab('voices')}
                  className="text-xs font-bold text-[#01411C] hover:text-[#025c27] flex items-center gap-0.5 cursor-pointer"
                >
                  <span>تمام آوازیں ({PRO_VOICES.length})</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 3 Prominent Voice Cards (Amina, Zayan, Sara) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {featuredVoices.map((voice) => {
                  const isSelected = selectedVoice.id === voice.id;
                  const isPreviewing = previewingVoiceId === voice.id;

                  return (
                    <div
                      key={voice.id}
                      onClick={() => handleSelectVoice(voice)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between ${
                        isSelected
                          ? 'bg-emerald-50/80 border-[#01411C] shadow-sm ring-2 ring-[#01411C]/25'
                          : 'bg-white border-slate-200/90 hover:border-emerald-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl">{voice.avatar}</span>
                          <div>
                            <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                              {voice.name}
                            </h3>
                            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/70 px-1.5 py-0.2 rounded-md">
                              {voice.id === 'amina'
                                ? 'Female (خاتون)'
                                : voice.id === 'zayan'
                                ? 'Male (مرد)'
                                : 'Girl (بچی)'}
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-[#01411C] flex-shrink-0" />
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 font-medium mb-3 line-clamp-2">
                        {voice.description}
                      </p>

                      {/* Quick sample preview */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePreviewSpeech(voice);
                        }}
                        className={`w-full py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          isPreviewing
                            ? 'bg-[#01411C] text-white animate-pulse'
                            : 'bg-white hover:bg-emerald-50 text-[#01411C] border border-emerald-200'
                        }`}
                      >
                        {isPreviewing ? (
                          <Volume2 className="w-3.5 h-3.5" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current" />
                        )}
                        <span>سنیں (Sample)</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Script Textarea */}
            <div className="bg-white rounded-3xl p-5 border border-emerald-100/90 shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-[#01411C] text-white flex items-center justify-center text-xs font-bold">
                    2
                  </span>
                  <h2 className="text-base font-extrabold text-slate-900">
                    اپنا متن لکھیں (Enter Text)
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">
                    {script.trim() ? script.trim().split(/\s+/).length : 0} الفاظ (words)
                  </span>
                  <button
                    onClick={handleCopyScript}
                    title="Copy text"
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 transition cursor-pointer"
                  >
                    {copiedScript ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Sample Urdu/English Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">
                  مثالیں (Templates):
                </span>
                {SAMPLE_SCRIPTS.map((item) => (
                  <button
                    key={item.title}
                    onClick={() => setScript(item.text)}
                    className="px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-[#01411C] border border-slate-200 hover:border-emerald-200 text-xs whitespace-nowrap transition cursor-pointer font-medium"
                  >
                    {item.title}
                  </button>
                ))}
              </div>

              {/* Textarea */}
              <textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder="یہاں اردو یا انگلش میں کچھ بھی لکھیں...&#10;مثال: السلام علیکم! میرا نام زیان ہے اور یہ میری آواز ہے۔"
                rows={4}
                className="w-full rounded-2xl bg-slate-50/80 border border-slate-200 focus:border-[#01411C] focus:bg-white focus:ring-2 focus:ring-[#01411C]/15 text-slate-900 placeholder:text-slate-400 text-sm sm:text-base leading-relaxed p-4 transition outline-none resize-none min-h-[120px] font-['Noto_Nastaliq_Urdu','Plus_Jakarta_Sans',sans-serif]"
              />
            </div>

            {/* Step 3: BIG GREEN GENERATE VOICE BUTTON */}
            <div>
              <button
                onClick={handleGenerateVoice}
                disabled={!script.trim() || isGenerating}
                className="w-full rounded-3xl bg-[#01411C] hover:bg-[#025c27] active:scale-[0.99] text-white p-4 sm:p-5 font-extrabold text-base sm:text-lg transition-all shadow-[0_10px_25px_rgba(1,65,28,0.25)] hover:shadow-[0_12px_30px_rgba(1,65,28,0.35)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                    <span>آواز بن رہی ہے... (Synthesizing Voice)</span>
                  </>
                ) : (
                  <>
                    <span className="text-2xl">🎙️</span>
                    <span>Generate Voice | آواز بنائیں ({selectedVoice.name})</span>
                  </>
                )}
              </button>
            </div>

            {/* Step 4: Simple Audio Player (When audio is ready) */}
            {currentTake && (
              <SimpleAudioPlayer
                currentTake={currentTake}
                isPlaying={isPlaying}
                currentTime={currentTime}
                duration={duration}
                onPlay={() => studioEngine.play()}
                onPause={() => studioEngine.pause()}
                onSeek={(time) => studioEngine.seek(time)}
                onDownload={() => handleDownloadTake(currentTake)}
                onShare={() => setIsShareOpen(true)}
              />
            )}
          </div>
        )}

        {/* TAB 2: VOICES */}
        {activeTab === 'voices' && (
          <VoicesTab
            selectedVoice={selectedVoice}
            onSelectVoice={(v) => {
              handleSelectVoice(v);
              setActiveTab('home');
            }}
            onPreviewSpeech={handlePreviewSpeech}
            previewingVoiceId={previewingVoiceId}
          />
        )}

        {/* TAB 3: PROJECTS */}
        {activeTab === 'projects' && (
          <ProjectsTab
            takes={takes}
            currentTakeId={currentTake?.id || null}
            isPlaying={isPlaying}
            onPlayTake={handlePlayTake}
            onPauseTake={() => studioEngine.pause()}
            onDownloadTake={handleDownloadTake}
            onDeleteTake={handleDeleteTake}
            onClearAll={() => {
              studioEngine.stop();
              setTakes([]);
              setCurrentTake(null);
            }}
            onGoToHome={() => setActiveTab('home')}
          />
        )}

        {/* TAB 4: PROFILE */}
        {activeTab === 'profile' && (
          <ProfileTab
            onInstallApp={handleTriggerInstall}
            onShareApp={() => setIsShareOpen(true)}
            canInstall={Boolean(deferredPrompt)}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        projectsCount={takes.length}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        currentTake={currentTake}
      />

      {/* PWA Install Modal */}
      <PwaInstallModal
        isOpen={isPwaModalOpen}
        onClose={() => setIsPwaModalOpen(false)}
        onTriggerInstall={handleTriggerInstall}
        hasNativePrompt={Boolean(deferredPrompt)}
      />
    </div>
  );
}
