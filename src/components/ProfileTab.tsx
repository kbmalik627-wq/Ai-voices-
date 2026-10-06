import React from 'react';
import { User, ShieldCheck, Download, Share2, Info, CheckCircle2, Heart } from 'lucide-react';

interface ProfileTabProps {
  onInstallApp: () => void;
  onShareApp: () => void;
  canInstall: boolean;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  onInstallApp,
  onShareApp,
}) => {
  return (
    <div className="space-y-4 pb-20">
      {/* User Card */}
      <div className="bg-white rounded-3xl p-6 border border-emerald-100 shadow-sm text-center relative overflow-hidden">
        <div className="w-20 h-20 rounded-3xl bg-[#01411C] text-white flex items-center justify-center text-3xl font-bold mx-auto mb-3 shadow-md shadow-emerald-950/20">
          🎙️
        </div>
        <div className="flex items-center justify-center gap-1.5 mb-1">
          <h2 className="text-xl font-extrabold text-slate-900">AI Voices</h2>
          <span className="text-xs font-bold text-white bg-[#01411C] px-2.5 py-0.5 rounded-full">
            PRO
          </span>
        </div>
        <p className="text-xs text-slate-500 font-medium">
          اردو اور انگلش آڈیو سٹوڈیو • Professional Voice Studio
        </p>

        <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="bg-slate-50 rounded-2xl p-2.5">
            <span className="block text-base font-extrabold text-[#01411C]">8</span>
            <span className="text-[11px] text-slate-500">Urdu Voices</span>
          </div>
          <div className="bg-slate-50 rounded-2xl p-2.5">
            <span className="block text-base font-extrabold text-[#01411C]">24kHz</span>
            <span className="text-[11px] text-slate-500">Studio Audio</span>
          </div>
          <div className="bg-slate-50 rounded-2xl p-2.5">
            <span className="block text-base font-extrabold text-[#01411C]">100%</span>
            <span className="text-[11px] text-slate-500">Free & Pro</span>
          </div>
        </div>
      </div>

      {/* App Actions */}
      <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-slate-900 mb-1">
          ایپ کی سہولیات (App Features & Tools)
        </h3>

        <button
          onClick={onInstallApp}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200 transition cursor-pointer text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#01411C] text-white flex items-center justify-center">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">
                ایپ انسٹال کریں (Install App on Phone)
              </h4>
              <p className="text-[11px] text-slate-500">
                Install as a standalone app on your home screen
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#01411C]">انسٹال 📲</span>
        </button>

        <button
          onClick={onShareApp}
          className="w-full flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition cursor-pointer text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">
                دوستوں کے ساتھ شیئر کریں (Share with Friends)
              </h4>
              <p className="text-[11px] text-slate-500">
                Share AI Voices with creators and family
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-slate-700">شیئر 🔗</span>
        </button>
      </div>

      {/* Info & Credits */}
      <div className="bg-white rounded-3xl p-5 border border-emerald-100 shadow-sm space-y-2.5 text-xs text-slate-600">
        <div className="flex items-center gap-2 text-slate-900 font-bold">
          <Info className="w-4 h-4 text-[#01411C]" />
          <span>خصوصیات (Highlights)</span>
        </div>
        <p className="leading-relaxed">
          <strong>AI Voices</strong> ایک جدید، تیز رفتار اور ہلکا پھلکا ٹیکسٹ ٹو وائس ٹول ہے جو خصوصی طور پر اردو اور انگریزی بولنے والوں کے لیے ڈیزائن کیا گیا ہے۔ امینہ (Amina)، زیان (Zayan) اور سارہ (Sara) کی قدرتی آوازیں آپ کے مواد کو پیشہ ورانہ بناتی ہیں۔
        </p>
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Version 2.0 (Urdu Premium)</span>
          <span className="flex items-center gap-1 text-[#01411C] font-semibold">
            Made with <Heart className="w-3 h-3 fill-current text-rose-500" /> for Pakistan & World
          </span>
        </div>
      </div>
    </div>
  );
};
