export interface Character {
  id: string;
  name: string;
  role: string; // e.g. "주인공", "갈등의 중심", "비밀을 품은 조력자"
  age?: string; // e.g. "13세 (초등 6학년)"
  personality: string; // e.g. "겉은 털털하지만 내면은 섬세하고 상처받기 쉬움"
  secretDilemma: string; // 겉으로 다 드러내지 못한 속마음, 결핍, 남모를 고민
  quote: string; // 대표 대사 또는 넘버 가사
  suggestedQuestions: string[]; // 깊이 있는 추천 질문 4~5개
  accentColor?: string;
  avatarBg?: string;
}

export interface Musical {
  id: string;
  title: string;
  genre: string;
  theme: string;
  synopsis: string;
  signatureNumber: string;
  coverGradient?: string;
  characters: Character[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  isSavedToJournal?: boolean;
}

export interface CharacterEvaluation {
  score: number; // 1 to 5
  depthLevel: string; // e.g. "마음의 빗장을 푼 최고의 인터뷰"
  highlightedQuestion: string; // 가장 가슴을 울렸던 질문
  characterFeedback: string; // 인물이 기자에게 건네는 직접적인 평가 총평
  badges: string[]; // e.g. ["#진심_발굴", "#표면_너머의_질문", "#깊은_공감"]
}

export interface JournalEntry {
  id: string;
  musicalTitle: string;
  characterName: string;
  interviewerName: string;
  schoolGrade: string;
  conversation: {
    question: string;
    answer: string;
  }[];
  studentReflection: string; // 인터뷰를 통해 깨달은 점 / 내 생각
  unspokenQuestion: string; // 다음번에 꼭 더 물어보고 싶은 것
  rating: number; // 1 to 5 (주인공이 매긴 인터뷰 깊이 평가 점수)
  characterEvaluation?: CharacterEvaluation;
  createdAt: string;
}

export interface MatchmakerRecommendation {
  recommendedMusicalTitle: string;
  recommendedCharacterName: string;
  reason: string;
  starterQuestions: string[];
}
