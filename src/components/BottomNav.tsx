import React from 'react';
import { Home, Mic2, FolderKanban, User } from 'lucide-react';

export type TabType = 'home' | 'voices' | 'projects' | 'profile';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  projectsCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  projectsCount,
}) => {
  const tabs = [
    {
      id: 'home' as TabType,
      label: 'Home',
      urdu: 'ہوم',
      icon: Home,
    },
    {
      id: 'voices' as TabType,
      label: 'Voices',
      urdu: 'آوازیں',
      icon: Mic2,
    },
    {
      id: 'projects' as TabType,
      label: 'Projects',
      urdu: 'پروجیکٹس',
      icon: FolderKanban,
      badge: projectsCount > 0 ? projectsCount : undefined,
    },
    {
      id: 'profile' as TabType,
      label: 'Profile',
      urdu: 'پروفائل',
      icon: User,
    },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-emerald-100 shadow-[0_-4px_20px_rgba(1,65,28,0.06)] px-2 py-1.5 transition-all">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-2 rounded-2xl transition-all cursor-pointer relative ${
                isActive
                  ? 'text-[#01411C] font-bold'
                  : 'text-slate-500 hover:text-[#01411C] font-medium'
              }`}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div className="w-8 h-1 bg-[#01411C] rounded-full absolute -top-1.5 animate-in fade-in zoom-in-75"></div>
              )}

              <div className="relative">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-[#01411C] scale-105'
                      : 'text-slate-500'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                </div>

                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-4 text-[10px] rounded-full bg-[#01411C] text-white font-bold text-center">
                    {tab.badge}
                  </span>
                )}
              </div>

              <span className="text-[11px] leading-tight mt-0.5">
                {tab.label}
              </span>
              <span className="text-[9px] text-slate-400 font-['Noto_Nastaliq_Urdu',sans-serif] leading-none">
                {tab.urdu}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
