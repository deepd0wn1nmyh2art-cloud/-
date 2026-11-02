import React, { useState } from 'react';
import { Musical, Character } from '../types';
import { MessageSquare, Sparkles, ChevronRight, HelpCircle, Music, Star } from 'lucide-react';
import { soundManager } from '../utils/soundEffects';

interface MusicalShowcaseProps {
  musicals: Musical[];
  onSelectCharacter: (musical: Musical, character: Character) => void;
}

export const MusicalShowcase: React.FC<MusicalShowcaseProps> = ({
  musicals,
  onSelectCharacter,
}) => {
  const [selectedMusicalId, setSelectedMusicalId] = useState<string>(musicals[0]?.id || '');
  const [expandedQuestionCharId, setExpandedQuestionCharId] = useState<string | null>(null);

  const activeMusical = musicals.find((m) => m.id === selectedMusicalId) || musicals[0];

  const handleCharacterClick = (musical: Musical, character: Character) => {
    soundManager.playTheaterBell();
    onSelectCharacter(musical, character);
  };

  return (
    <div className="space-y-8">
      {/* Hero Welcome Card */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-900/30 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium text-amber-400">
            <Sparkles className="w-4 h-4" />
            <span>2026 인천동수초등학교 6학년 창작 뮤지컬 5편 프로젝트 피날레</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-serif text-white">
            6학년 1반부터 5반까지! 무대 뒤에서 만나는 주인공들의 진짜 속마음
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans">
            공연에서는 시간 관계상 다 하지 못했던 대사, 노래의 마지막 소절 속에 숨겨두었던 눈물과 고민을
            직접 인터뷰해 보세요. 6-1반 〈뺏어뺏어 공책〉의 하윤이부터 6-5반 〈작전명 가짜사랑〉의 상혁이와 도영이까지,
            원하는 뮤지컬과 인물을 선택하여 백스테이지 인터뷰룸으로 입장하세요.
          </p>
        </div>

        {/* Ambient Stage Lighting Glow */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </section>

      {/* Musical Selection Grid / Tabs */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white font-serif flex items-center gap-2">
              <span>우리 학교 창작 뮤지컬 5편</span>
              <span className="text-xs text-amber-400 font-sans font-normal">({musicals.length}편 준비됨)</span>
            </h3>
            <p className="text-xs text-slate-400">뮤지컬을 선택하여 시놉시스와 등장인물들을 살펴보세요.</p>
          </div>
        </div>

        {/* 5 Musicals Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {musicals.map((musical, idx) => {
            const isSelected = musical.id === selectedMusicalId;
            return (
              <button
                key={musical.id}
                onClick={() => {
                  soundManager.playClick();
                  setSelectedMusicalId(musical.id);
                }}
                className={`text-left p-3.5 rounded-xl border transition-all relative overflow-hidden group ${
                  isSelected
                    ? 'bg-slate-900 border-amber-500 shadow-md shadow-amber-950/40 ring-1 ring-amber-500/50'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/90'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span className="font-mono text-amber-400/90">0{idx + 1}</span>
                  <span className="truncate max-w-[100px]">{musical.genre.split('·')[0]}</span>
                </div>
                <h4 className="font-bold text-sm text-slate-100 group-hover:text-amber-300 transition-colors line-clamp-1 font-serif">
                  《{musical.title}》
                </h4>
                <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-snug">
                  {musical.theme}
                </p>
                <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-amber-300/80 font-medium">인물 {musical.characters.length}명</span>
                  <span className="text-slate-500 group-hover:text-amber-400">보기 →</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Musical Detailed Stage & Character Roster */}
      {activeMusical && (
        <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-8">
          {/* Musical Playbill Overview */}
          <div className="border-b border-slate-800 pb-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-amber-400 mb-1">
                  <span>{activeMusical.genre}</span>
                  <span aria-hidden="true">·</span>
                  <span>상영 창작 뮤지컬</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-white font-serif tracking-tight">
                  《{activeMusical.title}》
                </h3>
              </div>

              {/* Signature Musical Number */}
              <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-lg bg-amber-950/30 border border-amber-900/40 text-amber-200 text-xs max-w-md">
                <Music className="w-4 h-4 text-amber-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px]">대표 상징 넘버</span>
                  <strong className="text-amber-300 font-serif">♪ {activeMusical.signatureNumber}</strong>
                </div>
              </div>
            </div>

            {/* Synopsis & Core Theme */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="md:col-span-2 space-y-1">
                <h5 className="text-xs font-semibold text-slate-400">무대 줄거리 (시놉시스)</h5>
                <p className="text-sm text-slate-200 leading-relaxed font-sans">
                  {activeMusical.synopsis}
                </p>
              </div>
              <div className="space-y-1 bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80">
                <h5 className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5" />
                  <span>극의 중심 탐구 주제</span>
                </h5>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeMusical.theme}
                </p>
              </div>
            </div>
          </div>

          {/* Character Cards Roster */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-base font-bold text-white font-serif">
                  인터뷰 대상 캐릭터 ({activeMusical.characters.length}명)
                </h4>
                <p className="text-xs text-slate-400">
                  궁금한 캐릭터를 선택해 백스테이지 인터뷰룸으로 이동하세요.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {activeMusical.characters.map((character) => {
                const isQuestionsExpanded = expandedQuestionCharId === character.id;

                return (
                  <div
                    key={character.id}
                    className="flex flex-col justify-between bg-slate-950 border border-slate-800 rounded-xl p-5 hover:border-amber-500/50 transition-all group"
                  >
                    <div className="space-y-4">
                      {/* Character Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-11 h-11 rounded-full ${
                              character.avatarBg || 'bg-amber-600'
                            } text-white flex items-center justify-center font-bold text-base shadow-md font-serif shrink-0`}
                          >
                            {character.name.slice(0, 2)}
                          </div>
                          <div>
                            <h5 className="font-bold text-base text-white group-hover:text-amber-300 transition-colors font-serif">
                              {character.name}
                            </h5>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400">
                              <span>{character.role}</span>
                              {character.age && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span>{character.age}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Personality */}
                      <div className="text-xs text-slate-400 leading-snug">
                        <span className="text-slate-500 font-medium">성격: </span>
                        <span>{character.personality}</span>
                      </div>

                      {/* Secret Dilemma / Inner Hurt */}
                      <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-900/30 text-xs text-amber-200/90 space-y-1">
                        <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>남모를 속마음 & 비밀 (결핍)</span>
                        </div>
                        <p className="leading-relaxed text-slate-300">
                          {character.secretDilemma}
                        </p>
                      </div>

                      {/* Character Signature Quote */}
                      <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs italic text-slate-300 font-serif">
                        "{character.quote}"
                      </div>

                      {/* Suggested Questions Drawer */}
                      <div>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedQuestionCharId(isQuestionsExpanded ? null : character.id)
                          }
                          className="text-[11px] font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors"
                        >
                          <span>{isQuestionsExpanded ? '추천 질문 숨기기 ▲' : '심층 질문 아이디어 미리보기 ▼'}</span>
                        </button>

                        {isQuestionsExpanded && (
                          <ul className="mt-2.5 space-y-1.5 pl-3 border-l-2 border-amber-600/40 text-xs text-slate-300 animate-fadeIn">
                            {character.suggestedQuestions.map((q, qIdx) => (
                              <li key={qIdx} className="leading-snug py-0.5">
                                • {q}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    {/* Interview Action Button */}
                    <div className="pt-5 mt-4 border-t border-slate-800/80">
                      <button
                        onClick={() => handleCharacterClick(activeMusical, character)}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-sm"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>'{character.name}' 인터뷰룸 입장하기</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
