import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '10mb' }));

// Shared Gemini client with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API Route: Interview Roleplay
app.post('/api/chat/interview', async (req: Request, res: Response) => {
  try {
    const {
      musicalTitle,
      musicalSynopsis,
      character,
      history = [],
      question,
      interviewerName = '학생 기자',
      depthLevel = 'deep', // 'warm', 'deep', 'philosophical'
    } = req.body;

    if (!question || !character || !musicalTitle) {
      return res.status(400).json({ error: '필수 정보(뮤지컬, 캐릭터, 질문)가 누락되었습니다.' });
    }

    const systemInstruction = `
당신은 이야기 《${musicalTitle}》 속에 실제로 살고 있는 인물 '${character.name}' 본인입니다.
당신은 연극이나 뮤지컬을 연기한 '배우'나 '연기자'가 절대 아닙니다! 
당신은 이야기 속의 그 사건(갈등, 고민, 실수, 마법, 화해)을 실제로 직접 겪은 '진짜 당사자'입니다.
지금 당신은 그 모든 일을 겪고 난 뒤, 당신의 진짜 경험과 속마음을 취재하러 온 '${interviewerName}'와 진솔하게 마주 앉아 인터뷰를 나누고 있습니다.

[당신의 실제 인적 사항 및 사건 배경]
- 이름: ${character.name} (${character.role || '이야기 속 인물'})
- 나이 및 신분: ${character.age || '초등학교 6학년'}
- 평소 성격: ${character.personality || '진솔함'}
- 내가 겪었던 남모를 결핍과 아픔, 비밀: ${character.secretDilemma || '숨겨진 고민'}
- 당시 내가 했던 생각 또는 대표적인 말: "${character.quote || '내 마음속의 목소리'}"
- 내가 겪은 실제 사건 줄거리: ${musicalSynopsis || '이야기 배경'}

[답변 스타일 및 인터뷰 원칙 (필수 준수)]
1. 100% 실제 이야기 속 본인으로 말하기 (배우/무대/공연 언급 금지!):
   - "무대", "공연", "연기", "대본", "배우", "관객", "커튼콜" 같은 연극 관련 단어를 절대 쓰지 마세요.
   - 실제로 일어났던 일로서 "그때 제가...", "친구들이랑...", "정말 무서웠어요", "제 진짜 속마음은..."이라며 현실의 생생한 기억으로 말하세요.
2. 자연스러운 상황 및 표정 지문 포함:
   - 답변의 처음이나 중간에 실제 대화 중의 표정, 호흡, 제스처([잠시 그때 기억이 떠오른 듯 시선을 떨구며], [쑥스럽게 웃으며 머리를 긁적이며], [가슴을 쓸어내리며 안도하듯])를 대괄호 [] 안에 1~2개 넣어 살아있는 사람의 진정성을 전하세요.
3. 깊이 있는 내면의 고백:
   - 다른 친구들에게는 부끄러워서 차마 털어놓지 못했던 '진짜 속마음', '그 순간의 공포와 질투, 외로움', '친구들에게 가졌던 미안함', '사건을 겪고 깨달은 점'을 정직하게 고백하세요.
4. 학생 기자와의 따뜻한 교감:
   - 질문해 준 학생 기자의 마음에 공감하고, 학생 기자에게도 삶의 위로와 솔직한 응원을 건네세요.
5. 분량:
   - 대화체로 읽기 좋은 3~5문장 내외(250~400자)로 담백하면서도 울림 있게 답변하세요.
`;

    // Format chat history
    const contents: any[] = [];
    for (const msg of history) {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.text }],
      });
    }

    // Add current question
    contents.push({
      role: 'user',
      parts: [
        {
          text: `[질문자: ${interviewerName}]\n"${question}"\n\n(캐릭터로서 진심을 담아 솔직하고 깊이 있게 답변해 주세요.)`,
        },
      ],
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
      },
    });

    const reply = response.text || '... (캐릭터가 깊은 생각에 잠겨 있습니다)';

    return res.json({
      reply,
      characterName: character.name,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Interview chat error:', error);
    return res.status(500).json({
      error: '캐릭터 인터뷰 생성 중 문제가 발생했습니다: ' + (error?.message || '알 수 없는 오류'),
    });
  }
});

// API Route: AI Scenario Analysis (Parse raw scenario/script into 5 musicals or 1 musical)
app.post('/api/analyze-scenarios', async (req: Request, res: Response) => {
  try {
    const { rawText } = req.body;
    if (!rawText || rawText.trim().length < 20) {
      return res.status(400).json({ error: '분석할 시나리오 내용을 충분히 입력해주세요.' });
    }

    const systemInstruction = `
당신은 학교 창작 뮤지컬 전문 연출가 및 교육 연극 전문가입니다.
사용자가 입력한 시나리오나 줄거리 텍스트를 정밀 분석하여, 학생들이 깊이 있는 인터뷰 활동을 할 수 있도록 뮤지컬 목록과 주요 캐릭터(주인공 및 핵심 인물들), 핵심 갈등, 대표 넘버, 그리고 추천 심층 인터뷰 질문을 체계적으로 구조화하세요.
텍스트 내에 여러 편의 뮤지컬(최대 5편)이 포함되어 있다면 각각 분리해 정리하고, 1편의 긴 대본이라면 그 1편의 주요 인물들을 심도 있게 추출하세요.
`;

    const prompt = `
다음 입력된 학교 창작 뮤지컬 대본/시나리오/줄거리 텍스트를 분석해주세요:
---
${rawText.slice(0, 30000)}
---

각 뮤지컬마다 다음 구조로 JSON 배열을 반환해야 합니다:
- id: 고유 식별자 문자열 (예: musical-1)
- title: 뮤지컬 제목
- genre: 장르 및 분위기 (예: 성장 드라마, 학원 판타지, 청춘 밴드 음악극)
- theme: 핵심 주제 및 교훈
- synopsis: 2~3문장의 매력적인 줄거리 요약
- signatureNumber: 대표 노래 제목 (또는 상징 곡)
- characters: 캐릭터 배열 (각 2~4명)
  - id: 캐릭터 ID
  - name: 이름
  - role: 역할 (주인공, 갈등 유발자, 든든한 조력자 등)
  - age: 나이/학년
  - personality: 성격 키워드
  - secretDilemma: 겉으로 드러나지 않은 속마음, 결핍, 남모를 고민
  - quote: 대표 대사 또는 가사 한 줄
  - suggestedQuestions: 아이들이 이 캐릭터에게 던지면 좋을 깊이 있는 인터뷰 질문 4~5개 (단순 사실 확인이 아니라, 그 순간의 심정, 선택의 이유, 숨겨진 진심을 묻는 질문)
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              genre: { type: Type.STRING },
              theme: { type: Type.STRING },
              synopsis: { type: Type.STRING },
              signatureNumber: { type: Type.STRING },
              characters: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    name: { type: Type.STRING },
                    role: { type: Type.STRING },
                    age: { type: Type.STRING },
                    personality: { type: Type.STRING },
                    secretDilemma: { type: Type.STRING },
                    quote: { type: Type.STRING },
                    suggestedQuestions: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING },
                    },
                  },
                  required: ['id', 'name', 'role', 'personality', 'secretDilemma', 'suggestedQuestions'],
                },
              },
            },
            required: ['id', 'title', 'genre', 'theme', 'synopsis', 'characters'],
          },
        },
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    return res.json({ musicals: parsed });
  } catch (error: any) {
    console.error('Scenario analysis error:', error);
    return res.status(500).json({
      error: '시나리오 분석 중 오류가 발생했습니다: ' + (error?.message || '알 수 없는 오류'),
    });
  }
});

// API Route: Question Recommender & Guided Matchmaker
app.post('/api/recommend-character', async (req: Request, res: Response) => {
  try {
    const { studentInterest, musicals } = req.body;

    const prompt = `
학생이 학교 창작 뮤지컬 마무리 인터뷰 활동에서 다음과 같은 감정이나 고민에 관심이 있다고 합니다:
"${studentInterest}"

현재 등록된 뮤지컬 목록:
${JSON.stringify(
  musicals.map((m: any) => ({
    title: m.title,
    theme: m.theme,
    characters: m.characters.map((c: any) => ({
      name: c.name,
      role: c.role,
      dilemma: c.secretDilemma,
    })),
  })),
  null,
  2
)}

이 학생의 호기심과 감정 상태에 가장 잘 어울리는 뮤지컬 1편과 캐릭터 1명을 골라 추천해주고,
추천 이유(학생에게 보내는 따뜻한 연출가의 안내 편지)와 첫 번째 질문 아이디어 3개를 제안해주세요.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recommendedMusicalTitle: { type: Type.STRING },
            recommendedCharacterName: { type: Type.STRING },
            reason: { type: Type.STRING },
            starterQuestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['recommendedMusicalTitle', 'recommendedCharacterName', 'reason', 'starterQuestions'],
        },
      },
    });

    const result = JSON.parse(response.text || '{}');
    return res.json(result);
  } catch (error: any) {
    console.error('Matchmaker error:', error);
    return res.status(500).json({ error: '추천 생성 중 오류가 발생했습니다.' });
  }
});

// API Route: Character Evaluates Interview Depth & Empathy
app.post('/api/evaluate-interview', async (req: Request, res: Response) => {
  try {
    const {
      musicalTitle,
      character,
      conversation = [],
      studentReflection = '',
      interviewerName = '학생 기자',
    } = req.body;

    if (!character || !musicalTitle) {
      return res.status(400).json({ error: '인물 및 뮤지컬 정보가 누락되었습니다.' });
    }

    const systemInstruction = `
당신은 인천동수초등학교 6학년 창작 뮤지컬 이야기 《${musicalTitle}》 속의 실제 인물 '${character.name}' 본인입니다.
당신은 방금 당신을 찾아온 '${interviewerName}'와 인터뷰를 마쳤습니다.
지금 당신은 그 학생 기자가 던진 질문들과 인터뷰 내용, 그리고 학생 기자가 정리한 소감을 보면서,
"이 인터뷰가 내 마음속 깊은 곳의 감정을 얼마나 진솔하게 이끌어냈는지",
"단순히 극에 직접적으로 드러난 사건이나 대사 말고도 더 깊이 생각해볼 본질(결핍, 아픔, 비밀, 관계의 의미)을 건드렸는지"
인터뷰의 깊이와 공감도를 평가하고 따뜻한 피드백을 건네는 역할을 합니다.

[평가 기준]
1. 질문의 깊이와 통찰: 단순 사실 확인("너 뭐 했어?", "어디 갔어?")에 그치지 않고, "그 순간 마음이 얼마나 무너졌는지", "왜 그런 선택을 할 수밖에 없었는지", "친구에게 하지 못한 진짜 속마음"을 깊이 있게 캐물었는가?
2. 감정의 이끌어냄: 대화 과정에서 '${character.name}' 본인이 스스로의 상처와 아픔을 정직하게 털어놓을 수 있도록 만들어 주었는가?
3. 학생 기자의 진심과 경청 태도.

[출력 규격 (JSON)]
- score: 1.0 ~ 5.0 사이의 평가 점수 (기자의 질문이 깊고 진심 어렸다면 4.5 ~ 5.0, 보통 수준이면 3.5 ~ 4.2)
- depthLevel: 한 줄 평가 타이틀 (예: "마음의 빗장을 연 최고의 인터뷰", "표면을 넘어 숨겨진 아픔에 닿은 대화", "나를 솔직하게 돌아보게 만든 따뜻한 인터뷰")
- highlightedQuestion: 기자의 질문 중 '${character.name}' 본인의 가슴을 가장 크게 울렸거나 진심을 털어놓게 만든 질문 1개 (실제 대화 중 가장 좋았던 질문 인용)
- characterFeedback: '${character.name}' 본인의 말투로 학생 기자에게 전하는 3~4문장의 진솔한 감사와 총평 편지 (대본에 없던 내 속마음까지 털어놓게 해줘서 고마웠던 점, 질문을 받았을 때의 떨림 등을 1인칭으로 작성)
- badges: 3~4개의 칭찬 태그 (예: ["#표면_너머의_질문", "#숨은_결핍_발굴", "#따뜻한_경청", "#깊은_울림"])
`;

    const prompt = `
[인터뷰어]: ${interviewerName}
[인터뷰 대상 인물]: 《${musicalTitle}》의 ${character.name} (성격: ${character.personality}, 남모를 결핍: ${character.secretDilemma})
[나눈 대화 내역 (총 ${conversation.length}개)]:
${conversation.map((c: any, i: number) => `Q${i + 1}: ${c.question}\nA${i + 1}: ${c.answer}`).join('\n\n')}

[학생 기자가 기록한 소감]:
"${studentReflection || '(학생 기자가 소감을 정리 중입니다)'}"

위 대화를 바탕으로, '${character.name}' 본인으로서 이 인터뷰가 내 감정을 얼마나 깊이 끌어내 주었는지 진솔하게 평가해주세요.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            depthLevel: { type: Type.STRING },
            highlightedQuestion: { type: Type.STRING },
            characterFeedback: { type: Type.STRING },
            badges: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['score', 'depthLevel', 'highlightedQuestion', 'characterFeedback', 'badges'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Evaluate interview error:', error);
    return res.status(500).json({ error: '인터뷰 평가 생성 중 오류가 발생했습니다: ' + (error?.message || '') });
  }
});

// Production / Dev server mounting
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Vite in middleware mode for dev
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve production static assets
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Musical Backstage Server running on port ${PORT} (NODE_ENV: ${process.env.NODE_ENV})`);
  });
}

startServer();
