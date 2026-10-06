import React from 'react';
import { X, Download, Smartphone, Monitor, CheckCircle2 } from 'lucide-react';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerInstall: () => void;
  hasNativePrompt: boolean;
}

export const PwaInstallModal: React.FC<PwaInstallModalProps> = ({
  isOpen,
  onClose,
  onTriggerInstall,
  hasNativePrompt,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-3xl bg-white border border-emerald-100 shadow-2xl p-6 text-left space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-11 h-11 rounded-2xl bg-[#01411C] text-white flex items-center justify-center text-xl font-bold shadow-sm">
              🎙️
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                AI Voices انسٹال کریں
              </h3>
              <p className="text-xs text-slate-500">
                اپنے موبائل یا کمپیوٹر پر ایپ کی طرح چلائیں
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

        <div className="space-y-3 text-xs text-slate-600">
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 space-y-1.5">
            <div className="font-bold text-[#01411C] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#01411C]" />
              <span>فائدے (App Benefits)</span>
            </div>
            <ul className="text-slate-600 space-y-1 list-disc list-inside">
              <li>ایک کلک میں ہوم اسکرین سے اوپن کریں</li>
              <li>تیز ترین اور ہلکا پھلکا انٹرفیس</li>
              <li>انٹرنیٹ پر بلا جھنجھٹ آڈیو ڈاؤنلوڈ</li>
            </ul>
          </div>

          {hasNativePrompt ? (
            <button
              onClick={() => {
                onTriggerInstall();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-[#01411C] hover:bg-[#025c27] text-white font-extrabold shadow-md shadow-emerald-950/20 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>ابھی انسٹال کریں (Install Now)</span>
            </button>
          ) : (
            <div className="space-y-2 pt-1">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                <Smartphone className="w-4 h-4 text-[#01411C] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block">
                    موبائل (Chrome / Safari):
                  </span>
                  <span className="text-slate-500">
                    براؤزر کے مینیو پر کلک کریں اور <strong>"Add to Home Screen"</strong> منتخب کریں۔
                  </span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-start gap-2.5">
                <Monitor className="w-4 h-4 text-[#01411C] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 block">
                    کمپیوٹر (Chrome / Edge):
                  </span>
                  <span className="text-slate-500">
                    ایڈریس بار میں دائیں جانب موجود انسٹال بٹن (📥) پر کلک کریں۔
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-1">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition cursor-pointer"
          >
            بند کریں (Close)
          </button>
        </div>
      </div>
    </div>
  );
};
