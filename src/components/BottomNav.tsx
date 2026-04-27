import React from 'react';
import { Calendar, ReceiptText, Info, Settings } from 'lucide-react';
import { TabType } from '../types';
import { cn } from '../lib/utils';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const tabs = [
    { id: 'timeline', icon: Calendar, label: '行程' },
    { id: 'budget', icon: ReceiptText, label: '記帳' },
    { id: 'info', icon: Info, label: '資訊' },
    { id: 'settings', icon: Settings, label: '設定' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-zen-border px-6 pb-8 pt-3 z-50">
      <div className="max-w-md mx-auto flex justify-between items-center">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={cn(
                "flex flex-col items-center gap-1 transition-all duration-300",
                isActive ? "text-zen-accent scale-110" : "text-zen-muted hover:text-zen-ink"
              )}
            >
              <Icon size={isActive ? 24 : 20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-bold uppercase tracking-widest">{tab.label}</span>
              {isActive && (
                <div className="w-1 h-1 rounded-full bg-zen-accent mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
