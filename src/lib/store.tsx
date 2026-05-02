import { createContext, useContext, useState, ReactNode } from "react";

export const QUESTIONS = [
  "Tell us about yourself and your background.",
  "Why are you interested in this role?",
  "Describe a challenge you faced and how you solved it.",
  "What are your key strengths?",
  "Where do you see yourself in 3 years?",
];

export type Answer = {
  questionIndex: number;
  videoUrl: string;
  durationSec: number;
};

type AppState = {
  language: string;
  setLanguage: (l: string) => void;
  answers: Answer[];
  addAnswer: (a: Answer) => void;
  resetAnswers: () => void;
  result: any;
  setResult: (r: any) => void;
};

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState("English");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [result, setResult] = useState<any>(null);

  const addAnswer = (a: Answer) =>
    setAnswers((prev) => {
      const filtered = prev.filter((p) => p.questionIndex !== a.questionIndex);
      return [...filtered, a].sort((x, y) => x.questionIndex - y.questionIndex);
    });

  const resetAnswers = () => setAnswers([]);

  return (
    <Ctx.Provider
      value={{ language, setLanguage, answers, addAnswer, resetAnswers, result, setResult }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useApp() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useApp must be used within AppProvider");
  return c;
}

// Mock candidate data for admin
export const MOCK_CANDIDATES = [
  {
    id: "C001",
    name: "Aarav Sharma",
    language: "Hindi",
    score: 86,
    classification: "Job-ready",
    flags: [],
    category: "Engineering",
  },
  {
    id: "C002",
    name: "Priya Iyer",
    language: "English",
    score: 72,
    classification: "Requires training",
    flags: [],
    category: "Sales",
  },
  {
    id: "C003",
    name: "Kiran Gowda",
    language: "Kannada",
    score: 48,
    classification: "Low confidence",
    flags: ["Low confidence"],
    category: "Support",
  },
  {
    id: "C004",
    name: "Rohit Mehta",
    language: "English",
    score: 33,
    classification: "Fraud suspected",
    flags: ["Fraud", "Duplicate"],
    category: "Engineering",
  },
];

export function generateMockResult(answers: Answer[], language: string) {
  const relevance = 70 + Math.floor(Math.random() * 25);
  const clarity = 65 + Math.floor(Math.random() * 30);
  const confidence = 60 + Math.floor(Math.random() * 35);
  const overall = Math.round((relevance + clarity + confidence) / 3);
  let classification = "Job-ready";
  if (overall < 50) classification = "Low confidence";
  else if (overall < 70) classification = "Requires training";
  if (confidence < 65 && relevance < 75) classification = "Fraud suspected";

  return {
    language,
    relevance,
    clarity,
    confidence,
    overall,
    classification,
    transcripts: answers.map((a, i) => ({
      questionIndex: a.questionIndex,
      question: QUESTIONS[a.questionIndex],
      transcript:
        "This is a simulated transcript of the candidate's response to question " +
        (i + 1) +
        ". The candidate spoke clearly and addressed the key points.",
    })),
    validation: {
      faceDetected: true,
      audioQuality: "Good",
      duplicateSuspected: false,
    },
  };
}
