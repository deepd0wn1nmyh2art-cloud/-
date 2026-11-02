import React from 'react';
import { Sparkles, BookOpen, Mic, FileText, Volume2, VolumeX } from 'lucide-react';
import { soundManager } from '../utils/soundEffects';

export type ActiveTab = 'showcase' | 'interview' | 'journal';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  selectedCharacterName?: string;
  selectedMusicalTitle?: string;
  savedJournalCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedCharacterName,
  selectedMusicalTitle,
  savedJournalCount,
}) => {
  const [isMuted, setIsMuted] = React.useState(soundManager.getIsMuted());

  const handleToggleSound = () => {
    const muted = soundManager.toggleMute();
    setIsMuted(muted);
    if (!muted) {
      soundManager.playClick();
    }
  };

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'showcase',
      label: '5편의 뮤지컬 & 캐릭터 선택',
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      id: 'interview',
      label: selectedCharacterName ? `${selectedCharacterName} 인터뷰룸` : '백스테이지 인터뷰',
      icon: <Mic className="w-4 h-4" />,
    },
    {
      id: 'journal',
      label: '기자수첩 & 배움 기록장',
      icon: <FileText className="w-4 h-4" />,
      badge: savedJournalCount,
    },
  ];

  return (
    <header className="border-b border-amber-950/20 bg-slate-950 text-slate-100 sticky top-0 z-40 backdrop-blur-md">
      {/* Top Banner with Theater Ambience */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 border-b border-slate-800/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-900/30 text-slate-950 font-bold">
              <Sparkles className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white font-serif">
                  동수초 백스테이지 <span className="text-amber-400 font-sans font-normal text-sm sm:text-base">프레스룸</span>
                </h1>
                <span className="hidden sm:inline-block text-xs text-amber-300/80 font-mono">
                  6학년 1~5반
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>인천동수초 창작 뮤지컬 5편 피날레</span>
                <span aria-hidden="true">·</span>
                <span className="text-slate-300">주인공 심층 인터뷰 & 배움 기록장</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedCharacterName && (
              <div className="hidden md:flex items-center gap-2 text-xs text-amber-200/90 bg-amber-950/40 px-3 py-1.5 rounded border border-amber-800/40">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>대기실 인터뷰 중:</span>
                <strong className="text-amber-300">{selectedCharacterName}</strong>
                <span className="text-amber-400/60 font-light">({selectedMusicalTitle})</span>
              </div>
            )}

            <button
              onClick={handleToggleSound}
              className="p-2 rounded-md text-slate-400 hover:text-amber-300 hover:bg-slate-800/60 transition-colors"
              title={isMuted ? '음향 켜기' : '음향 끄기'}
              aria-label="효과음 토글"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <nav className="flex items-center gap-1 sm:gap-2 py-2.5 overflow-x-auto scrollbar-none" aria-label="메인 탭 네비게이션">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  soundManager.playClick();
                  setActiveTab(item.id);
                }}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 text-[11px] font-semibold bg-amber-500 text-slate-950 rounded">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
