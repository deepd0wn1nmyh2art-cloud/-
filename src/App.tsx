/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Musical, Character, JournalEntry } from './types';
import { DEFAULT_MUSICALS } from './data/defaultMusicals';
import { Header, ActiveTab } from './components/Header';
import { MusicalShowcase } from './components/MusicalShowcase';
import { InterviewRoom } from './components/InterviewRoom';
import { InterviewJournalView } from './components/InterviewJournalView';

export default function App() {
  // Fixed designated school musicals (Dongsu Elementary School 6th Grade 1-5 Classes)
  const musicals: Musical[] = DEFAULT_MUSICALS;

  // Current active navigation tab
  const [activeTab, setActiveTab] = useState<ActiveTab>('showcase');

  // Currently selected musical & character for interview
  const [selectedMusical, setSelectedMusical] = useState<Musical>(musicals[0] || DEFAULT_MUSICALS[0]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character>(
    musicals[0]?.characters[0] || DEFAULT_MUSICALS[0].characters[0]
  );
  const [initialQuestion, setInitialQuestion] = useState<string>('');

  // Interviewer name (default: 학생 기자)
  const [interviewerName, setInterviewerName] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('interviewer_name');
      if (saved && saved !== '김하늘 학생 기자') {
        return saved;
      }
    }
    return '학생 기자';
  });

  // Saved Q&A items in the current interview session
  const [savedQAItems, setSavedQAItems] = useState<{ question: string; answer: string }[]>([]);

  // Persistent journal history
  const [journalHistory, setJournalHistory] = useState<JournalEntry[]>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('musical_journal_history');
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {}
      }
    }
    return [];
  });

  // Sync to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('musical_scripts_5_dongsu', JSON.stringify(musicals));
    }
  }, [musicals]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('interviewer_name', interviewerName);
    }
  }, [interviewerName]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('musical_journal_history', JSON.stringify(journalHistory));
    }
  }, [journalHistory]);

  // Handler for selecting character
  const handleSelectCharacter = (
    musical: Musical,
    character: Character,
    starterQuestion?: string
  ) => {
    setSelectedMusical(musical);
    setSelectedCharacter(character);
    if (starterQuestion) {
      setInitialQuestion(starterQuestion);
    } else {
      setInitialQuestion('');
    }
    // Switch to interview tab
    setActiveTab('interview');
  };

  const handleOpenJournal = (items: { question: string; answer: string }[]) => {
    setSavedQAItems(items);
    setActiveTab('journal');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950">
      {/* Header with Navigation & Live Status */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedCharacterName={selectedCharacter?.name}
        selectedMusicalTitle={selectedMusical?.title}
        savedJournalCount={savedQAItems.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'showcase' && (
          <MusicalShowcase
            musicals={musicals}
            onSelectCharacter={handleSelectCharacter}
          />
        )}

        {activeTab === 'interview' && selectedCharacter && selectedMusical && (
          <InterviewRoom
            key={`${selectedMusical.id}-${selectedCharacter.id}`}
            musical={selectedMusical}
            character={selectedCharacter}
            onOpenJournal={handleOpenJournal}
            savedQAItems={savedQAItems}
            setSavedQAItems={setSavedQAItems}
            interviewerName={interviewerName}
            setInterviewerName={setInterviewerName}
            initialQuestion={initialQuestion}
          />
        )}

        {activeTab === 'journal' && selectedCharacter && selectedMusical && (
          <InterviewJournalView
            musical={selectedMusical}
            character={selectedCharacter}
            savedQAItems={savedQAItems}
            interviewerName={interviewerName}
            setInterviewerName={setInterviewerName}
            journalHistory={journalHistory}
            setJournalHistory={setJournalHistory}
            onReturnToInterview={() => setActiveTab('interview')}
          />
        )}
      </main>

      {/* Subtle Educational Footer */}
      <footer className="no-print border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span>학교 창작 뮤지컬 5편 피날레 워크스페이스</span>
            <span className="mx-2" aria-hidden="true">·</span>
            <span>심층 인터뷰 & 배움 성찰 활동</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>총 {musicals.length}편의 뮤지컬 탑재</span>
            <span aria-hidden="true">·</span>
            <span>등장인물 메소드 롤플레잉 연계</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
