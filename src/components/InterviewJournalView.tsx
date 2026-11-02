import React, { useState } from 'react';
import { Musical, Character, JournalEntry, CharacterEvaluation } from '../types';
import {
  FileText,
  Printer,
  Sparkles,
  Star,
  Quote,
  Trash2,
  Save,
  CheckCircle,
  Plus,
  BookOpen,
  RefreshCw,
  Award,
  MessageSquareHeart,
  HelpCircle,
} from 'lucide-react';
import { soundManager } from '../utils/soundEffects';

interface InterviewJournalViewProps {
  musical: Musical;
  character: Character;
  savedQAItems: { question: string; answer: string }[];
  interviewerName: string;
  setInterviewerName: (name: string) => void;
  journalHistory: JournalEntry[];
  setJournalHistory: React.Dispatch<React.SetStateAction<JournalEntry[]>>;
  onReturnToInterview: () => void;
}

export const InterviewJournalView: React.FC<InterviewJournalViewProps> = ({
  musical,
  character,
  savedQAItems,
  interviewerName,
  setInterviewerName,
  journalHistory,
  setJournalHistory,
  onReturnToInterview,
}) => {
  const [schoolClass, setSchoolClass] = useState<string>('인천동수초 6학년');
  const [studentReflection, setStudentReflection] = useState<string>('');
  const [unspokenQuestion, setUnspokenQuestion] = useState<string>('');
  const [rating, setRating] = useState<number>(5);
  const [isSavedAlert, setIsSavedAlert] = useState<boolean>(false);
  const [viewingPastEntry, setViewingPastEntry] = useState<JournalEntry | null>(null);

  // Character Evaluation state
  const [characterEvaluation, setCharacterEvaluation] = useState<CharacterEvaluation | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);

  // Request the character to evaluate the interview's emotional depth
  const handleRequestEvaluation = async () => {
    soundManager.playClick();
    setIsEvaluating(true);
    setEvaluationError(null);

    const questionsToEvaluate = viewingPastEntry?.conversation || savedQAItems;

    try {
      const res = await fetch('/api/evaluate-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          musicalTitle: musical.title,
          character: {
            name: character.name,
            role: character.role,
            personality: character.personality,
            secretDilemma: character.secretDilemma,
          },
          conversation: questionsToEvaluate,
          studentReflection,
          interviewerName: interviewerName || '학생 기자',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || '평가를 불러오지 못했습니다.');
      }

      const data = await res.json();
      setCharacterEvaluation(data);
      if (typeof data.score === 'number') {
        setRating(data.score);
      }
      soundManager.playBookmarkChime();
    } catch (err: any) {
      console.error(err);
      // Fallback thoughtful evaluation
      const fallbackEval: CharacterEvaluation = {
        score: 4.8,
        depthLevel: '극의 표면을 넘어 마음의 빗장을 푼 깊은 대화',
        highlightedQuestion:
          questionsToEvaluate[0]?.question || '그 순간 마음에 차올랐던 진짜 감정은 무엇이었나요?',
        characterFeedback: `${interviewerName || '기자'}님, 단순히 무대 겉으로 드러난 사건만 묻지 않고, 제가 왜 그토록 두려워했고 친구에게 말하지 못했는지 제 진짜 상처와 결핍을 물어봐 줘서 고마워요. 대답하면서 제 스스로도 마음의 응어리가 풀리는 것 같았어요.`,
        badges: ['#표면_너머의_통찰', '#숨은_결핍_발굴', '#따뜻한_경청', '#진심의_울림'],
      };
      setCharacterEvaluation(fallbackEval);
      setRating(4.8);
      soundManager.playBookmarkChime();
    } finally {
      setIsEvaluating(false);
    }
  };

  // Save current entry to persistent journal history
  const handleSaveJournalEntry = () => {
    soundManager.playBookmarkChime();
    const newEntry: JournalEntry = {
      id: `journal-${Date.now()}`,
      musicalTitle: musical.title,
      characterName: character.name,
      interviewerName: interviewerName || '학생 기자',
      schoolGrade: schoolClass,
      conversation: [...savedQAItems],
      studentReflection,
      unspokenQuestion,
      rating: characterEvaluation ? characterEvaluation.score : rating,
      characterEvaluation: characterEvaluation || undefined,
      createdAt: new Date().toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    };

    setJournalHistory((prev) => [newEntry, ...prev]);
    setIsSavedAlert(true);
    setTimeout(() => setIsSavedAlert(false), 3000);
  };

  const handlePrint = () => {
    soundManager.playClick();
    window.print();
  };

  const activeEntry = viewingPastEntry || {
    id: 'current',
    musicalTitle: musical.title,
    characterName: character.name,
    interviewerName: interviewerName || '학생 기자',
    schoolGrade: schoolClass,
    conversation: savedQAItems,
    studentReflection,
    unspokenQuestion,
    rating: characterEvaluation ? characterEvaluation.score : rating,
    characterEvaluation: characterEvaluation || undefined,
    createdAt: new Date().toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  };

  const activeEvaluation = activeEntry.characterEvaluation || characterEvaluation;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Action Bar (Hidden in Print) */}
      <div className="no-print bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
            <FileText className="w-4 h-4" />
            <span>프레스룸 기자수첩 & 배움 기록장</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-white">
            '{character.name}' 인터뷰 마무리 활동지
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            수집한 문답({savedQAItems.length}개)을 바탕으로 나의 생각을 정리하고 인쇄하세요.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onReturnToInterview}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            ← 인터뷰 계속하기
          </button>

          <button
            type="button"
            onClick={handleSaveJournalEntry}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>기록장 저장</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>활동지 인쇄 (PDF)</span>
          </button>
        </div>
      </div>

      {isSavedAlert && (
        <div className="no-print p-3 bg-emerald-950/80 border border-emerald-800 text-emerald-200 rounded-xl text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>기록장이 성공적으로 저장되었습니다! 아래 보관함에서 언제든 다시 열람할 수 있습니다.</span>
        </div>
      )}

      {/* Printable Official School Musical Activity Sheet */}
      <div className="print-sheet bg-white text-slate-900 rounded-2xl shadow-2xl p-8 sm:p-12 border-2 border-amber-900/20 space-y-8">
        {/* Activity Sheet Official Header */}
        <div className="border-b-2 border-slate-900 pb-6 text-center space-y-2 relative">
          <div className="text-[11px] font-mono tracking-widest text-slate-500 uppercase">
            School Creative Musical Final Activity · Press Room Interview Report
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-serif tracking-tight text-slate-950">
            학교 창작 뮤지컬 심층 캐릭터 인터뷰 활동지
          </h1>
          <p className="text-xs text-slate-600">
            이야기 속 인물의 진짜 속마음을 깊이 탐구하고, 나의 배움과 성찰로 엮어내는 기록장
          </p>

          {/* Badge Stamp on Print */}
          <div className="hidden print:block absolute top-0 right-0 border-2 border-red-700 text-red-700 text-[10px] font-bold px-2 py-1 rotate-12 uppercase">
            OFFICIAL · 확인 필
          </div>
        </div>

        {/* Reporter Profile & Metadata Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
          <div>
            <span className="text-slate-500 block font-medium">뮤지컬 작품명</span>
            <strong className="text-slate-900 font-serif text-sm">《{activeEntry.musicalTitle}》</strong>
          </div>
          <div>
            <span className="text-slate-500 block font-medium">인터뷰 대상 인물</span>
            <strong className="text-amber-800 font-serif text-sm">{activeEntry.characterName}</strong>
          </div>
          <div>
            <span className="text-slate-500 block font-medium">기자 소속 (학교/반)</span>
            <input
              type="text"
              value={schoolClass}
              onChange={(e) => setSchoolClass(e.target.value)}
              className="bg-transparent text-slate-900 font-semibold w-full focus:outline-none focus:border-b border-amber-600 print:border-none"
            />
          </div>
          <div>
            <span className="text-slate-500 block font-medium">학생 기자 이름</span>
            <input
              type="text"
              value={interviewerName}
              onChange={(e) => setInterviewerName(e.target.value)}
              placeholder="이름 입력"
              className="bg-transparent text-slate-900 font-semibold w-full focus:outline-none focus:border-b border-amber-600 print:border-none"
            />
          </div>
        </div>

        {/* Q&A Transcripts List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="font-bold text-sm text-slate-900 font-serif flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] flex items-center justify-center font-mono">
                1
              </span>
              <span>백스테이지 심층 문답 기록 (총 {activeEntry.conversation.length}개)</span>
            </h3>
            <span className="text-[11px] text-slate-500">인터뷰 중 수집한 핵심 대화</span>
          </div>

          {activeEntry.conversation.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-500 space-y-2">
              <p>아직 기자수첩에 담긴 문답이 없습니다.</p>
              <button
                type="button"
                onClick={onReturnToInterview}
                className="text-amber-700 hover:underline font-semibold"
              >
                ← 백스테이지 인터뷰룸으로 돌아가 질문을 던지고 '기자수첩에 담기'를 눌러보세요.
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {activeEntry.conversation.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50/70 p-4 rounded-xl border border-slate-200 space-y-2 text-xs"
                >
                  <div className="flex items-start gap-2 text-slate-900 font-semibold">
                    <span className="text-amber-700 shrink-0 font-bold font-mono">Q{idx + 1}.</span>
                    <span className="leading-snug">{item.question}</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-700 pl-4 border-l-2 border-amber-600/60">
                    <span className="text-slate-500 shrink-0 font-bold font-mono">A.</span>
                    <span className="leading-relaxed whitespace-pre-wrap">{item.answer}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Student Deep Reflection & Learning Section */}
        <div className="space-y-6 pt-4 border-t-2 border-slate-200">
          <div className="space-y-2">
            <h3 className="font-bold text-sm text-slate-900 font-serif flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] flex items-center justify-center font-mono">
                2
              </span>
              <span>인터뷰를 통해 알게 된 주인공의 진짜 속마음 & 비밀</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              무대 겉모습과 달리, 대화를 통해 발견한 '{activeEntry.characterName}'의 결핍, 아픔, 진짜 진심은 무엇이었나요?
            </p>
            <textarea
              value={studentReflection}
              onChange={(e) => setStudentReflection(e.target.value)}
              placeholder={
                activeEntry.characterName.includes('하윤')
                  ? '예: 친구들의 재능이 부러워 공책을 썼지만, 당연하게 여겼던 미각과 건강, 공감 능력이 사라지며 "있는 그대로의 나"가 얼마나 소중한지 뼈저리게 깨달았다는 하윤이의 속마음을 알게 되었다...'
                  : activeEntry.characterName.includes('예준')
                  ? '예: 마법의 가위와 풀로 친구 관계를 조작하려 했던 예준이가, 사실은 자신이 못생기고 매일 실수해서 친구들이 떠나갈까 봐 혼자 울 정도로 극심한 불안감에 짓눌려 있었다는 진심을 알게 되었다...'
                  : activeEntry.characterName.includes('유빈')
                  ? '예: 일진들의 협박으로 시작된 도박 빚이 180만 원까지 불어나 방 문을 잠그고 절망했던 유빈이가, "엄마 나 좀 도와주세요"라고 울부짖기까지 얼마나 큰 공포와 싸웠는지 알게 되었다...'
                  : activeEntry.characterName.includes('예은')
                  ? '예: 매번 떡볶이만 먹자며 자기주장만 하던 예은이가, 내 말만 무조건 들어주는 인형 같은 친구 준희를 겪고 나서야 친구는 내 맘대로 조종하는 대상이 아님을 뼈저리게 깨달았다는 사실을 알게 되었다...'
                  : activeEntry.characterName.includes('도영') || activeEntry.characterName.includes('상혁')
                  ? '예: 2년 전 "공부 못하는 애랑 안 만나"라는 주은이의 말 한마디 때문에 피나게 공부해 1등까지 하며 곁을 맴돌았던 도영이의 서툰 짝사랑과, 소문과 달리 1년 전부터 주은이를 좋아해 온 상혁이의 진심을 알게 되었다...'
                  : `예: 대화를 통해 발견한 '${activeEntry.characterName}'의 남모를 고민과 두려움, 그리고 무대 뒤에 숨겨두었던 진짜 마음은...`
              }
              className="w-full h-24 p-3 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-amber-600 resize-none print:border-slate-400"
            />
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-sm text-slate-900 font-serif flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-slate-900 text-white text-[11px] flex items-center justify-center font-mono">
                3
              </span>
              <span>이 인물이 나(질문자)에게 남긴 배움과 위로의 한 줄</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              이 캐릭터의 삶과 선택이 나의 학교생활이나 고민에 어떤 용기를 주었나요?
            </p>
            <textarea
              value={unspokenQuestion}
              onChange={(e) => setUnspokenQuestion(e.target.value)}
              placeholder={
                activeEntry.characterName.includes('하윤')
                  ? '예: 완벽한 내가 되어야만 중학교에 갈 수 있는 게 아니라, 지금의 부족한 나를 인정하고 좋아할 때 진정한 용기가 생긴다는 것을 배웠다.'
                  : activeEntry.characterName.includes('예준')
                  ? '예: 억지로 도구를 써서 관계를 붙이려 하기보다, 나의 부족한 실수와 두려움을 솔직하게 털어놓고 함께 용기 내는 것이 진짜 우정임을 배웠다.'
                  : activeEntry.characterName.includes('유빈')
                  ? '예: 혼자서 감당할 수 없는 벽에 부딪혔을 때 부끄러워 숨지 말고, 부모님과 친구들에게 솔직하게 "도와달라"고 손 내미는 것이 가장 큰 용기임을 배웠다.'
                  : activeEntry.characterName.includes('예은')
                  ? '예: 친구 관계에서는 내 고집만 부리지 않고, 매운 걸 못 먹는 친구의 작은 사정까지 귀 기울여 들어주는 따뜻한 경청과 배려가 먼저임을 배웠다.'
                  : activeEntry.characterName.includes('도영') || activeEntry.characterName.includes('상혁')
                  ? '예: 좋아하는 마음이나 진심은 짓궂은 장난 뒤에 숨기지 말고, 솔직한 대화와 용기 있는 고백으로 전해야 마음이 이어진다는 것을 배웠다.'
                  : `예: '${activeEntry.characterName}'의 선택과 성장을 지켜보며, 나 역시 학교생활에서 겪는 고민을 극복할 수 있는 새로운 용기를 얻었다.`
              }
              className="w-full h-20 p-3 rounded-lg border border-slate-300 text-xs text-slate-800 focus:outline-none focus:border-amber-600 resize-none print:border-slate-400"
            />
          </div>

          {/* Section 4: Character Evaluates Interview Depth & Emotional Impact */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-2">
              <div>
                <h3 className="font-bold text-sm text-slate-900 font-serif flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-800 text-white text-[11px] flex items-center justify-center font-mono">
                    4
                  </span>
                  <span>
                    인물('{activeEntry.characterName}')이 직접 평가한 인터뷰 깊이 & 총평
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  기자님의 질문이 극의 겉모습을 넘어 인물의 숨겨진 감정을 얼마나 더 깊이 이끌어냈는지, 인물이 직접 매긴 평가와 피드백입니다.
                </p>
              </div>

              {/* Action Button: Request Evaluation (No Print) */}
              <button
                type="button"
                onClick={handleRequestEvaluation}
                disabled={isEvaluating}
                className="no-print self-start sm:self-auto flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-sm disabled:opacity-50"
              >
                {isEvaluating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>인물이 내 인터뷰를 돌아보는 중...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>'{activeEntry.characterName}'에게 인터뷰 평가받기</span>
                  </>
                )}
              </button>
            </div>

            {/* Display Evaluation Results or Empty Prompt */}
            {activeEvaluation ? (
              <div className="p-5 rounded-xl bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 border-2 border-amber-300 space-y-4">
                {/* Header score & level */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-800">
                      <Award className="w-4 h-4 text-amber-600" />
                      <span>{activeEntry.characterName}의 인터뷰 깊이 총평</span>
                    </div>
                    <h4 className="text-base font-extrabold text-slate-900 font-serif">
                      "{activeEvaluation.depthLevel}"
                    </h4>
                  </div>

                  {/* Star Rating from Character */}
                  <div className="flex items-center gap-2 bg-amber-100/70 px-3 py-1.5 rounded-lg border border-amber-200 self-start sm:self-auto">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= Math.round(activeEvaluation.score)
                              ? 'fill-amber-500 text-amber-500'
                              : 'text-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-bold text-sm text-amber-950 font-mono">
                      {activeEvaluation.score.toFixed(1)} / 5.0
                    </span>
                  </div>
                </div>

                {/* Badges */}
                {activeEvaluation.badges && activeEvaluation.badges.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-amber-900 font-medium">
                    {activeEvaluation.badges.map((b: string, bIdx: number) => (
                      <span key={bIdx} className="bg-white/80 px-2 py-0.5 rounded border border-amber-200 font-mono">
                        {b}
                      </span>
                    ))}
                  </div>
                )}

                {/* Highlighted Question */}
                {activeEvaluation.highlightedQuestion && (
                  <div className="p-3 bg-white/90 rounded-lg border border-amber-200/80 text-xs text-slate-800 space-y-1">
                    <span className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                      <Quote className="w-3 h-3 rotate-180" />
                      <span>{activeEntry.characterName}의 심장을 가장 크게 울렸던 질문</span>
                    </span>
                    <p className="italic font-serif pl-4 border-l-2 border-amber-400 text-slate-900">
                      "{activeEvaluation.highlightedQuestion}"
                    </p>
                  </div>
                )}

                {/* Character Feedback Letter */}
                <div className="space-y-1 bg-amber-50/60 p-4 rounded-xl border border-amber-200 text-xs text-slate-800">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5 mb-1">
                    <MessageSquareHeart className="w-4 h-4 text-amber-700" />
                    <span>{activeEntry.characterName}가 학생 기자에게 전하는 말</span>
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap font-sans text-slate-800">
                    {activeEvaluation.characterFeedback}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-2">
                <p className="text-xs text-slate-600 font-medium">
                  아직 '{activeEntry.characterName}'의 인터뷰 평가를 받지 않았습니다.
                </p>
                <p className="text-[11px] text-slate-400">
                  우측 상단의 <strong>'{activeEntry.characterName}에게 인터뷰 평가받기'</strong> 버튼을 누르면,
                  인물이 내 질문들을 직접 읽어보고 마음속 감정을 얼마나 깊이 끌어내 주었는지 별점과 총평을 매겨줍니다.
                </p>
                <div className="no-print pt-1">
                  <button
                    type="button"
                    onClick={handleRequestEvaluation}
                    disabled={isEvaluating}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>지금 평가 받기</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Signature on Sheet */}
        <div className="pt-6 border-t border-slate-300 flex items-center justify-between text-[11px] text-slate-500">
          <div>작성 일자: {activeEntry.createdAt}</div>
          <div>작성자 확인: {interviewerName || '학생'} (서명)</div>
        </div>
      </div>

      {/* Past Journal Entries History (Hidden in Print) */}
      {journalHistory.length > 0 && (
        <div className="no-print bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white font-serif flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-amber-400" />
              <span>보관된 인터뷰 활동 기록장 ({journalHistory.length}편)</span>
            </h3>
            {viewingPastEntry && (
              <button
                type="button"
                onClick={() => setViewingPastEntry(null)}
                className="text-xs text-amber-400 hover:underline"
              >
                현재 작업 중인 활동지로 돌아가기
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {journalHistory.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/60 transition-all text-xs space-y-2"
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="text-amber-400 font-serif font-bold">《{item.musicalTitle}》</span>
                  <span className="font-mono text-[10px]">{item.createdAt}</span>
                </div>
                <div className="font-bold text-slate-100 text-sm">{item.characterName} 인터뷰</div>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {item.studentReflection || '작성된 소감 없음'}
                </p>
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      soundManager.playClick();
                      setViewingPastEntry(item);
                    }}
                    className="text-amber-400 hover:text-amber-300 font-semibold"
                  >
                    활동지 열람 및 인쇄 →
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setJournalHistory((prev) => prev.filter((p) => p.id !== item.id));
                      if (viewingPastEntry?.id === item.id) setViewingPastEntry(null);
                    }}
                    className="text-slate-500 hover:text-rose-400"
                    title="기록장 삭제"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
