import React, { useState, useEffect, useRef } from 'react';
import { Musical, Character, ChatMessage } from '../types';
import {
  Mic,
  MicOff,
  Send,
  Volume2,
  Bookmark,
  BookmarkCheck,
  Sparkles,
  HelpCircle,
  Music,
  ArrowRight,
  RefreshCw,
  User,
  Quote,
} from 'lucide-react';
import { soundManager, speakCharacterText, stopSpeaking } from '../utils/soundEffects';

interface InterviewRoomProps {
  musical: Musical;
  character: Character;
  onOpenJournal: (savedQA: { question: string; answer: string }[]) => void;
  savedQAItems: { question: string; answer: string }[];
  setSavedQAItems: React.Dispatch<React.SetStateAction<{ question: string; answer: string }[]>>;
  interviewerName: string;
  setInterviewerName: (name: string) => void;
  initialQuestion?: string;
}

export const InterviewRoom: React.FC<InterviewRoomProps> = ({
  musical,
  character,
  onOpenJournal,
  savedQAItems,
  setSavedQAItems,
  interviewerName,
  setInterviewerName,
  initialQuestion,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState<string>(initialQuestion || '');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeQuestionCategory, setActiveQuestionCategory] = useState<'character' | 'emotion' | 'conflict' | 'song' | 'growth'>('character');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize character's opening greeting when entering room
  useEffect(() => {
    soundManager.playTheaterBell();
    const openingGreeting: ChatMessage = {
      id: 'msg-0',
      role: 'model',
      text: `[조금 쑥스러운 듯 머리를 긁적이며 차분하게 눈을 마주치며]\n\n"안녕하세요, ${interviewerName}님! 제 이야기 들으러 와주셔서 고마워요. 그때 그 일들... 저한테는 정말 잊을 수 없는 큰 사건이었거든요. 어떤 점이 궁금하신가요? 솔직하게 제 속마음 다 말씀드릴게요."`,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([openingGreeting]);

    if (initialQuestion) {
      setInputText(initialQuestion);
    }

    return () => {
      stopSpeaking();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, [musical.id, character.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isAiLoading]);

  // Handle Speech Recognition for microphone input
  const handleToggleVoiceInput = () => {
    if (typeof window === 'undefined') return;
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('이 브라우저는 음성 인식을 지원하지 않습니다. 크롬 브라우저를 권장합니다.');
      return;
    }

    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ko-KR';
      recognition.interimResults = true;
      recognition.continuous = false;

      recognition.onstart = () => {
        setIsRecording(true);
        soundManager.playClick();
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputText(transcript);
      };

      recognition.onerror = (e: any) => {
        console.error('Speech error', e);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error(err);
      setIsRecording(false);
    }
  };

  // Submit interview question to Gemini backend
  const handleSendQuestion = async (customQuestion?: string) => {
    const questionToSend = customQuestion || inputText;
    if (!questionToSend.trim() || isAiLoading) return;

    soundManager.playClick();
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: questionToSend.trim(),
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsAiLoading(true);
    setErrorMessage(null);

    try {
      const historyPayload = messages.slice(1).map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch('/api/chat/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          musicalTitle: musical.title,
          musicalSynopsis: musical.synopsis,
          character: {
            name: character.name,
            role: character.role,
            age: character.age,
            personality: character.personality,
            secretDilemma: character.secretDilemma,
            quote: character.quote,
          },
          history: historyPayload,
          question: questionToSend.trim(),
          interviewerName: interviewerName || '학생 기자',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || '답변을 생성하지 못했습니다.');
      }

      const data = await res.json();
      const modelMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'model',
        text: data.reply,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || '인터뷰 대화 중 오류가 발생했습니다.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Save specific Q&A to student's reporter journal
  const handleSaveToJournal = (questionText: string, answerText: string) => {
    const alreadySaved = savedQAItems.some(
      (item) => item.question === questionText && item.answer === answerText
    );

    if (alreadySaved) {
      setSavedQAItems((prev) =>
        prev.filter((item) => !(item.question === questionText && item.answer === answerText))
      );
    } else {
      soundManager.playBookmarkChime();
      setSavedQAItems((prev) => [...prev, { question: questionText, answer: answerText }]);
    }
  };

  // TTS speak answer
  const handleSpeak = (msgId: string, text: string) => {
    if (isSpeakingId === msgId) {
      stopSpeaking();
      setIsSpeakingId(null);
    } else {
      setIsSpeakingId(msgId);
      speakCharacterText(text, () => setIsSpeakingId(null));
    }
  };

  // Category questions database
  const categoryQuestions = {
    character: character.suggestedQuestions,
    emotion: [
      '그 사건이 일어났을 때, 겉으로는 아무렇지 않은 척했지만 속으로는 얼마나 무서웠나요?',
      '그때 가장 외롭고 막막하다고 느꼈던 순간은 언제였나요?',
      '눈물이 터져 나올 뻔했던 그 순간, 속으로 어떤 생각을 삼키고 있었나요?',
    ],
    conflict: [
      '만약 그 순간으로 다시 돌아간다면, 친구에게 다른 행동을 했을까요?',
      '서로의 오해가 깊어졌을 때, 먼저 손 내밀기 망설여졌던 진짜 이유는 무엇이었나요?',
      '자신의 잘못을 인정하고 사과하기 위해 어떤 용기가 필요했나요?',
    ],
    song: [
      `그때 불렀던 노래 《${musical.signatureNumber}》의 가사처럼 가슴에 차올랐던 생각은 무엇이었나요?`,
      '마음속 노래를 부르며 누구에게 그 진심이 가장 닿길 바랐나요?',
      '홀로 눈물 삼키며 고민하던 순간, 내 마음속을 울렸던 진짜 목소리는 무엇이었나요?',
    ],
    growth: [
      '모든 오해와 갈등이 풀린 지금, 당신은 이전의 나와 어떻게 달라져 있나요?',
      `지금 비슷한 고민이나 외로움을 겪고 있는 저(${interviewerName})에게 한마디 전해준다면?`,
      '앞으로 중학교에 진학하거나 일상으로 돌아가면, 어떤 마음가짐으로 살아가고 싶나요?',
    ],
  };

  return (
    <div className="space-y-6">
      {/* Top Theater Dressing Room Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-amber-950/40 to-slate-950 border border-amber-900/40 rounded-2xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            {/* Character Stage Portrait */}
            <div className="relative">
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${
                  character.avatarBg || 'bg-amber-600'
                } flex items-center justify-center text-white font-bold text-xl sm:text-2xl font-serif shadow-xl ring-2 ring-amber-400/50`}
              >
                {character.name.slice(0, 2)}
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-slate-950"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 text-xs text-amber-400 mb-0.5">
                <span>뮤지컬 《{musical.title}》</span>
                <span aria-hidden="true">·</span>
                <span>{character.role}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-serif text-white flex items-center gap-2">
                <span>{character.name}</span>
                <span className="text-xs font-normal text-slate-300 font-sans">
                  ({character.personality})
                </span>
              </h2>
              <div className="text-xs text-amber-200/80 italic mt-0.5 font-serif line-clamp-1">
                "{character.quote}"
              </div>
            </div>
          </div>

          {/* Interviewer identity and Journal shortcut */}
          <div className="flex items-center gap-2.5 bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
            <div className="text-xs">
              <span className="text-slate-400 block text-[10px]">인터뷰어 기자</span>
              <input
                type="text"
                value={interviewerName}
                onChange={(e) => setInterviewerName(e.target.value)}
                placeholder="이름 입력"
                className="bg-transparent text-amber-300 font-bold w-24 text-xs focus:outline-none focus:border-b border-amber-400"
              />
            </div>
            <button
              onClick={() => onOpenJournal(savedQAItems)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors shrink-0 shadow-sm"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>기자수첩 ({savedQAItems.length})</span>
            </button>
          </div>
        </div>

        {/* Secret Dilemma Prompt Pill Bar */}
        <div className="mt-4 pt-3 border-t border-amber-950/60 text-xs text-slate-300 flex items-center gap-2">
          <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span className="text-amber-400/90 font-medium shrink-0">캐릭터의 남모를 속마음:</span>
          <span className="text-slate-300 line-clamp-1">{character.secretDilemma}</span>
        </div>
      </div>

      {/* Main Conversation Stream */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl flex flex-col h-[520px] shadow-inner relative">
        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.map((msg, index) => {
            const isCharacter = msg.role === 'model';
            // Find corresponding question for model answers
            const prevUserQuestion = !isCharacter
              ? ''
              : messages[index - 1]?.role === 'user'
              ? messages[index - 1].text
              : '첫 인사';

            const isSaved = savedQAItems.some(
              (item) => item.question === prevUserQuestion && item.answer === msg.text
            );

            // Format stage directions [지문: ...]
            const parts = msg.text.split(/(\[.*?\])/g);

            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${
                  isCharacter ? 'mr-auto' : 'ml-auto flex-row-reverse'
                }`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                    isCharacter
                      ? `${character.avatarBg || 'bg-amber-600'} text-white ring-1 ring-amber-400/40 font-serif`
                      : 'bg-slate-700 text-slate-200'
                  }`}
                >
                  {isCharacter ? character.name.slice(0, 1) : <User className="w-4 h-4" />}
                </div>

                {/* Message Body */}
                <div className="space-y-1.5 max-w-[85%] sm:max-w-[78%]">
                  <div
                    className={`flex items-center gap-2 text-[11px] ${
                      isCharacter ? 'text-slate-400' : 'text-slate-400 justify-end'
                    }`}
                  >
                    <span className="font-medium text-slate-300">
                      {isCharacter ? character.name : interviewerName || '학생 기자'}
                    </span>
                    <span>·</span>
                    <span className="font-mono">{msg.timestamp}</span>
                  </div>

                  <div
                    className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                      isCharacter
                        ? 'bg-slate-900 border border-slate-800 text-slate-100 shadow-md font-sans'
                        : 'bg-amber-500 text-slate-950 font-medium'
                    }`}
                  >
                    {isCharacter
                      ? parts.map((part, pIdx) => {
                          if (part.startsWith('[') && part.endsWith(']')) {
                            return (
                              <span
                                key={pIdx}
                                className="block text-amber-400/90 italic font-serif my-1 text-xs sm:text-xs"
                              >
                                {part}
                              </span>
                            );
                          }
                          return <span key={pIdx}>{part}</span>;
                        })
                      : msg.text}
                  </div>

                  {/* Character Answer Toolbar (TTS & Save to Journal) */}
                  {isCharacter && index > 0 && (
                    <div className="flex items-center gap-2 pt-0.5 text-xs">
                      <button
                        type="button"
                        onClick={() => handleSpeak(msg.id, msg.text)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                          isSpeakingId === msg.id
                            ? 'bg-amber-500 text-slate-950 font-bold'
                            : 'bg-slate-900 text-slate-400 hover:text-amber-300 border border-slate-800'
                        }`}
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>{isSpeakingId === msg.id ? '음성 중지' : '목소리 듣기'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleSaveToJournal(prevUserQuestion, msg.text)}
                        className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                          isSaved
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-900 text-slate-400 hover:text-amber-300 border border-slate-800'
                        }`}
                      >
                        {isSaved ? (
                          <>
                            <BookmarkCheck className="w-3 h-3 text-amber-400" />
                            <span>기자수첩에 저장됨</span>
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-3 h-3" />
                            <span>기자수첩에 담기</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* AI Thinking Animation */}
          {isAiLoading && (
            <div className="flex items-center gap-3 text-xs text-amber-400/90 font-serif mr-auto animate-pulse pl-11">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" />
              <span>'{character.name}'이(가) 그 순간의 기억과 감정을 떠올리며 생각에 잠겨 있습니다...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="px-4 py-2 bg-rose-950/80 border-t border-rose-900 text-rose-300 text-xs flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs text-rose-200 underline"
            >
              닫기
            </button>
          </div>
        )}

        {/* Deep Question Starters Palette */}
        <div className="border-t border-slate-800 bg-slate-900/90 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-semibold text-slate-200">심층 질문 뱅크</span>
              <span className="text-[11px] text-slate-500">(클릭 시 질문창에 자동 입력)</span>
            </div>

            {/* Category Filter Buttons */}
            <div className="flex items-center gap-1">
              {[
                { id: 'character', label: '캐릭터 맞춤' },
                { id: 'emotion', label: '감정·속마음' },
                { id: 'conflict', label: '갈등·선택' },
                { id: 'song', label: '넘버 비하인드' },
                { id: 'growth', label: '성장·위로' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveQuestionCategory(cat.id as any)}
                  className={`px-2 py-0.5 text-[11px] rounded transition-colors ${
                    activeQuestionCategory === cat.id
                      ? 'bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Questions Horizontal Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categoryQuestions[activeQuestionCategory]?.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  soundManager.playClick();
                  setInputText(q);
                }}
                className="shrink-0 max-w-[280px] sm:max-w-[340px] truncate text-left text-[11px] py-1.5 px-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-amber-500 text-slate-300 hover:text-amber-200 transition-colors"
              >
                "{q}"
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
          {/* Microphone Voice Input Button */}
          <button
            type="button"
            onClick={handleToggleVoiceInput}
            title={isRecording ? '음성 녹음 중지' : '음성으로 질문하기 (마이크)'}
            className={`p-2.5 rounded-xl transition-all ${
              isRecording
                ? 'bg-rose-600 text-white animate-pulse ring-2 ring-rose-400'
                : 'bg-slate-900 text-slate-400 hover:text-amber-400 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendQuestion();
              }
            }}
            placeholder={`'${character.name}'에게 마음속 궁금했던 점을 깊이 있게 질문해보세요...`}
            disabled={isAiLoading}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 disabled:opacity-50"
          />

          {/* Send Button */}
          <button
            type="button"
            onClick={() => handleSendQuestion()}
            disabled={!inputText.trim() || isAiLoading}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-colors flex items-center gap-1.5 disabled:opacity-40 shadow-sm"
          >
            {isAiLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">질문하기</span>
          </button>
        </div>
      </div>

      {/* Bottom Wrap-up Journal Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300">
        <div>
          <span className="font-semibold text-white">인터뷰를 충분히 나누셨나요?</span>
          <span className="text-slate-400 ml-1.5">
            기자수첩에 담긴 문답({savedQAItems.length}개)을 바탕으로 배움 활동지를 완성하고 출력해보세요.
          </span>
        </div>
        <button
          onClick={() => onOpenJournal(savedQAItems)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors shadow-sm shrink-0"
        >
          <span>인터뷰 기록장 & 활동지 작성하러 가기</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
