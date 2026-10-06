import React, { useState } from 'react';
import { X, ShieldCheck, Key, UserPlus, Check, Copy, AlertCircle } from 'lucide-react';

interface GrantAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GrantAccessModal: React.FC<GrantAccessModalProps> = ({ isOpen, onClose }) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<'Producer' | 'Editor' | 'Viewer'>('Producer');
  const [invitedMembers, setInvitedMembers] = useState<
    { email: string; role: string; addedAt: string }[]
  >([
    { email: 'khateebmalik50@gmail.com', role: 'Studio Owner', addedAt: 'Primary Admin' },
    { email: 'audio-producer@dozine.studio', role: 'Producer', addedAt: 'Today' },
  ]);
  const [apiKey] = useState('dz_pro_9d99f150_live_access_token_8voices');
  const [copiedKey, setCopiedKey] = useState(false);
  const [grantedNotice, setGrantedNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGrant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail || !inviteEmail.includes('@')) return;

    setInvitedMembers([
      ...invitedMembers,
      { email: inviteEmail, role: selectedRole, addedAt: 'Just now' },
    ]);
    setGrantedNotice(`Access successfully granted to ${inviteEmail} as ${selectedRole}!`);
    setInviteEmail('');
    setTimeout(() => setGrantedNotice(null), 3500);
  };

  const copyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-left space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-950/80 text-violet-400 border border-violet-800/60 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Grant Studio Access & Rights</h3>
              <p className="text-xs text-slate-400">Manage voice permissions, collaborators & commercial tokens</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {grantedNotice && (
          <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{grantedNotice}</span>
          </div>
        )}

        {/* Commercial Rights Banner */}
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-violet-950/40 via-purple-950/20 to-slate-950 border border-violet-800/50 flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">PRO Commercial License Active</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                ROYALTY FREE
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Full worldwide monetization rights for podcasts, games, YouTube, and commercial ads.
            </p>
          </div>
        </div>

        {/* Grant Access Form */}
        <form onSubmit={handleGrant} className="space-y-3">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <UserPlus className="w-3.5 h-3.5 text-violet-400" />
            <span>Grant Voice Studio Access to Team Member</span>
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="email"
              required
              placeholder="colleague@domain.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-violet-500"
            />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as any)}
              className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-violet-500 cursor-pointer"
            >
              <option value="Producer">Producer (Full Generation)</option>
              <option value="Editor">Editor (Voice Changer & Export)</option>
              <option value="Viewer">Viewer (Listen Only)</option>
            </select>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold transition cursor-pointer shadow-md shadow-violet-600/30"
            >
              Grant Access
            </button>
          </div>
        </form>

        {/* Active Members List */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-slate-400">Current Access Holders</span>
          <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
            {invitedMembers.map((m, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-xs"
              >
                <span className="text-slate-200 font-mono">{m.email}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-800/60 font-semibold">
                    {m.role}
                  </span>
                  <span className="text-[10px] text-slate-500">{m.addedAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API Access Token */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span>Studio Pro API Token</span>
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={apiKey}
              className="flex-1 rounded-xl bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-400 font-mono select-all focus:outline-none"
            />
            <button
              onClick={copyKey}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition cursor-pointer"
            >
              {copiedKey ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
