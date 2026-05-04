import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { selectRandomInterviewQuestions, type InterviewQuestion } from "@/lib/interview-flow";

export type UserRole = "candidate" | "admin";

export type CandidateInterviewRole = "Engineering" | "Product" | "Design" | "Sales" | "Support";

export type AuthUser = {
  name: string;
  email: string;
  role: UserRole;
};

type SavedAccount = AuthUser & { password: string };

type AuthResult = {
  ok: boolean;
  message?: string;
  user?: AuthUser;
};

export type InterviewResult = {
  language: string;
  relevance: number;
  clarity: number;
  confidence: number;
  overall: number;
  classification: string;
  transcripts: Array<{
    questionIndex: number;
    question: string;
    videoUrl?: string;
    transcript: string;
  }>;
  validation: {
    faceDetected: boolean;
    audioQuality: string;
    duplicateSuspected: boolean;
  };
};

export type AdminCandidateRecord = {
  id: string;
  name: string;
  email?: string;
  language: string;
  score: number;
  classification: string;
  flags: string[];
  category: string;
  source: "mock" | "submission";
  interviewRole?: CandidateInterviewRole;
  submittedAt?: string;
  result?: InterviewResult;
  selected?: boolean;
  selectedAt?: string;
};

type InterviewControl = {
  isOpen: boolean;
  acceptingUntil: string | null;
};

type InterviewControlByRole = Record<CandidateInterviewRole, InterviewControl>;

type SubmissionEligibility = {
  allowed: boolean;
  reason?: string;
};

type SubmitInterviewResult = {
  ok: boolean;
  message?: string;
  record?: AdminCandidateRecord;
};

type AppNotification = {
  id: string;
  kind: "admin:new-interview" | "candidate:selected";
  recipientRole: UserRole;
  recipientEmail?: string;
  message: string;
  createdAt: string;
  read: boolean;
};

const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "12345";
const AUTH_STORAGE_KEY = "interview-insights-auth-user";
const ACCOUNTS_STORAGE_KEY = "interview-insights-candidate-accounts";
const SUBMISSIONS_STORAGE_KEY = "interview-insights-submitted-candidates";
const RESULT_STORAGE_KEY = "interview-insights-current-result";
const INTERVIEW_CONTROL_STORAGE_KEY = "interview-insights-interview-control";
const NOTIFICATION_STORAGE_KEY = "interview-insights-notifications";

const CANDIDATE_INTERVIEW_ROLES: CandidateInterviewRole[] = [
  "Engineering",
  "Product",
  "Design",
  "Sales",
  "Support",
];

const DEFAULT_INTERVIEW_CONTROL: InterviewControl = {
  isOpen: true,
  acceptingUntil: null,
};

const DEFAULT_INTERVIEW_CONTROL_BY_ROLE: InterviewControlByRole = {
  Engineering: { ...DEFAULT_INTERVIEW_CONTROL },
  Product: { ...DEFAULT_INTERVIEW_CONTROL },
  Design: { ...DEFAULT_INTERVIEW_CONTROL },
  Sales: { ...DEFAULT_INTERVIEW_CONTROL },
  Support: { ...DEFAULT_INTERVIEW_CONTROL },
};

export const QUESTIONS = [
  "Tell us about yourself and your background.",
  "Why are you interested in this role?",
  "Describe a challenge you faced and how you solved it.",
  "What are your key strengths?",
  "Where do you see yourself in 3 years?",
];

export type Answer = {
  questionIndex: number;
  question: string;
  videoUrl: string;
  durationSec: number;
};

type AppState = {
  language: string;
  setLanguage: (l: string) => void;
  activeInterviewRole: CandidateInterviewRole | "";
  setActiveInterviewRole: (role: CandidateInterviewRole | "") => void;
  answers: Answer[];
  addAnswer: (a: Answer) => void;
  resetAnswers: () => void;
  selectedQuestions: InterviewQuestion[];
  beginInterviewSession: () => void;
  result: InterviewResult | null;
  setResult: (r: InterviewResult | null) => void;
  authUser: AuthUser | null;
  login: (args: { email: string; password: string }) => AuthResult;
  signupCandidate: (args: { name: string; email: string; password: string }) => AuthResult;
  logout: () => void;
  candidateInterviewRoles: CandidateInterviewRole[];
  submittedCandidates: AdminCandidateRecord[];
  submitInterviewResult: (args: {
    user: AuthUser;
    result: InterviewResult;
    interviewRole: CandidateInterviewRole;
  }) => SubmitInterviewResult;
  canCandidateSubmitRole: (
    role: CandidateInterviewRole,
    email?: string,
    language?: string,
  ) => SubmissionEligibility;
  interviewControlsByRole: InterviewControlByRole;
  getInterviewControlForRole: (role: CandidateInterviewRole) => InterviewControl;
  isInterviewAcceptingForRole: (role: CandidateInterviewRole) => boolean;
  updateInterviewControlForRole: (role: CandidateInterviewRole, next: InterviewControl) => void;
  closeInterviewWindowForRole: (role: CandidateInterviewRole) => void;
  reopenInterviewWindowForRole: (role: CandidateInterviewRole) => void;
  notifications: AppNotification[];
  myNotifications: AppNotification[];
  unreadMyNotifications: number;
  markMyNotificationsRead: () => void;
  markCandidateSelected: (candidateId: string, selected: boolean) => boolean;
};

function safeReadJson<T>(storageKey: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function safeWriteJson(storageKey: string, value: unknown) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(storageKey, JSON.stringify(value));
  } catch (error) {
    // Handle quota exceeded errors by clearing old submissions
    if (
      error instanceof Error &&
      (error.name === "QuotaExceededError" || error.message.includes("quota"))
    ) {
      console.warn("localStorage quota exceeded, clearing old submissions...");
      // Clear submissions to free up space
      if (storageKey === SUBMISSIONS_STORAGE_KEY) {
        try {
          window.localStorage.setItem(storageKey, JSON.stringify([]));
        } catch {
          // If still can't write, give up silently
          console.error("Failed to clear submissions from storage");
        }
      } else {
        // For other keys, try removing submissions storage as last resort
        try {
          window.localStorage.removeItem(SUBMISSIONS_STORAGE_KEY);
          window.localStorage.setItem(storageKey, JSON.stringify(value));
        } catch {
          console.error("Failed to write to storage after clearing submissions");
        }
      }
    } else {
      console.error("Failed to write to localStorage:", error);
    }
  }
}

function toPublicUser(account: SavedAccount): AuthUser {
  const { password: _password, ...user } = account;
  return user;
}

function buildFlags(result: InterviewResult): string[] {
  const flags: string[] = [];

  if (!result.validation.faceDetected) {
    flags.push("Face missing");
  }

  if (result.validation.audioQuality !== "Good") {
    flags.push(`Audio: ${result.validation.audioQuality}`);
  }

  if (result.validation.duplicateSuspected) {
    flags.push("Duplicate suspected");
  }

  if (result.classification === "Fraud suspected") {
    flags.push("Fraud suspected");
  }

  return flags;
}

function isInterviewCurrentlyAccepting(control: InterviewControl) {
  if (!control.isOpen) return false;
  if (!control.acceptingUntil) return true;

  const until = new Date(control.acceptingUntil).getTime();
  if (Number.isNaN(until)) return true;

  return Date.now() <= until;
}

function normalizeInterviewControls(value: unknown): InterviewControlByRole {
  if (!value || typeof value !== "object") {
    return DEFAULT_INTERVIEW_CONTROL_BY_ROLE;
  }

  const raw = value as Partial<Record<CandidateInterviewRole, Partial<InterviewControl>>>;

  return {
    Engineering: {
      isOpen: raw.Engineering?.isOpen ?? DEFAULT_INTERVIEW_CONTROL.isOpen,
      acceptingUntil: raw.Engineering?.acceptingUntil ?? DEFAULT_INTERVIEW_CONTROL.acceptingUntil,
    },
    Product: {
      isOpen: raw.Product?.isOpen ?? DEFAULT_INTERVIEW_CONTROL.isOpen,
      acceptingUntil: raw.Product?.acceptingUntil ?? DEFAULT_INTERVIEW_CONTROL.acceptingUntil,
    },
    Design: {
      isOpen: raw.Design?.isOpen ?? DEFAULT_INTERVIEW_CONTROL.isOpen,
      acceptingUntil: raw.Design?.acceptingUntil ?? DEFAULT_INTERVIEW_CONTROL.acceptingUntil,
    },
    Sales: {
      isOpen: raw.Sales?.isOpen ?? DEFAULT_INTERVIEW_CONTROL.isOpen,
      acceptingUntil: raw.Sales?.acceptingUntil ?? DEFAULT_INTERVIEW_CONTROL.acceptingUntil,
    },
    Support: {
      isOpen: raw.Support?.isOpen ?? DEFAULT_INTERVIEW_CONTROL.isOpen,
      acceptingUntil: raw.Support?.acceptingUntil ?? DEFAULT_INTERVIEW_CONTROL.acceptingUntil,
    },
  };
}

const Ctx = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState("English");
  const [activeInterviewRole, setActiveInterviewRole] = useState<CandidateInterviewRole | "">("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<InterviewQuestion[]>([]);
  const [result, setResult] = useState<InterviewResult | null>(null);
  // Initialize to stable server-friendly defaults to avoid hydration mismatches.
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [candidateAccounts, setCandidateAccounts] = useState<SavedAccount[]>([]);
  const [submittedCandidates, setSubmittedCandidates] = useState<AdminCandidateRecord[]>([]);
  const [interviewControlsByRole, setInterviewControlsByRole] = useState<InterviewControlByRole>(
    DEFAULT_INTERVIEW_CONTROL_BY_ROLE,
  );
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // On client mount, hydrate from localStorage. This runs only in the browser
  // and ensures server-rendered HTML matches the initial client render.
  useEffect(() => {
    if (typeof window === "undefined") return;

    setAuthUser(safeReadJson<AuthUser | null>(AUTH_STORAGE_KEY, null));
    setCandidateAccounts(safeReadJson<SavedAccount[]>(ACCOUNTS_STORAGE_KEY, []));
    setSubmittedCandidates(safeReadJson<AdminCandidateRecord[]>(SUBMISSIONS_STORAGE_KEY, []));
    setResult(safeReadJson<InterviewResult | null>(RESULT_STORAGE_KEY, null));
    setInterviewControlsByRole(
      normalizeInterviewControls(
        safeReadJson<unknown>(INTERVIEW_CONTROL_STORAGE_KEY, DEFAULT_INTERVIEW_CONTROL_BY_ROLE),
      ),
    );
    setNotifications(safeReadJson<AppNotification[]>(NOTIFICATION_STORAGE_KEY, []));
  }, []);

  useEffect(() => {
    safeWriteJson(AUTH_STORAGE_KEY, authUser);
  }, [authUser]);

  useEffect(() => {
    safeWriteJson(ACCOUNTS_STORAGE_KEY, candidateAccounts);
  }, [candidateAccounts]);

  useEffect(() => {
    // Keep only the most recent 100 submissions to prevent localStorage bloat
    const trimmed =
      submittedCandidates.length > 100 ? submittedCandidates.slice(0, 100) : submittedCandidates;
    safeWriteJson(SUBMISSIONS_STORAGE_KEY, trimmed);
  }, [submittedCandidates]);

  useEffect(() => {
    safeWriteJson(INTERVIEW_CONTROL_STORAGE_KEY, interviewControlsByRole);
  }, [interviewControlsByRole]);

  useEffect(() => {
    safeWriteJson(NOTIFICATION_STORAGE_KEY, notifications);
  }, [notifications]);

  useEffect(() => {
    safeWriteJson(RESULT_STORAGE_KEY, result);
  }, [result]);

  const myNotifications = useMemo(() => {
    if (!authUser) return [];

    if (authUser.role === "admin") {
      return notifications.filter((n) => n.recipientRole === "admin");
    }

    return notifications.filter(
      (n) => n.recipientRole === "candidate" && n.recipientEmail === authUser.email,
    );
  }, [authUser, notifications]);

  const unreadMyNotifications = useMemo(
    () => myNotifications.filter((n) => !n.read).length,
    [myNotifications],
  );

  const addNotification = (notification: Omit<AppNotification, "id" | "createdAt" | "read">) => {
    const entry: AppNotification = {
      ...notification,
      id: `NTF-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      read: false,
    };

    setNotifications((prev) => [entry, ...prev]);
  };

  const markMyNotificationsRead = () => {
    if (!authUser) return;

    setNotifications((prev) =>
      prev.map((n) => {
        if (authUser.role === "admin" && n.recipientRole === "admin") {
          return { ...n, read: true };
        }

        if (
          authUser.role === "candidate" &&
          n.recipientRole === "candidate" &&
          n.recipientEmail === authUser.email
        ) {
          return { ...n, read: true };
        }

        return n;
      }),
    );
  };

  const addAnswer = (a: Answer) =>
    setAnswers((prev) => {
      const filtered = prev.filter((p) => p.questionIndex !== a.questionIndex);
      return [...filtered, a].sort((x, y) => x.questionIndex - y.questionIndex);
    });

  const resetAnswers = () => setAnswers([]);

  const beginInterviewSession = () => {
    if (!activeInterviewRole) return;

    setSelectedQuestions(selectRandomInterviewQuestions(activeInterviewRole, language, 5));
    setAnswers([]);
    setResult(null);
  };

  const login = ({ email, password }: { email: string; password: string }): AuthResult => {
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const user: AuthUser = { name: "Admin", email: ADMIN_EMAIL, role: "admin" };
      setAuthUser(user);
      return { ok: true, user };
    }

    const candidate = candidateAccounts.find(
      (account) => account.email.toLowerCase() === normalizedEmail && account.password === password,
    );

    if (!candidate) {
      return {
        ok: false,
        message: "Invalid credentials. Check your email and password.",
      };
    }

    const user = toPublicUser(candidate);
    setAuthUser(user);
    return { ok: true, user };
  };

  const signupCandidate = ({
    name,
    email,
    password,
  }: {
    name: string;
    email: string;
    password: string;
  }): AuthResult => {
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail === ADMIN_EMAIL) {
      return {
        ok: false,
        message: "That email is reserved for the single admin account.",
      };
    }

    if (candidateAccounts.some((account) => account.email.toLowerCase() === normalizedEmail)) {
      return {
        ok: false,
        message: "An account already exists with this email.",
      };
    }

    const newAccount: SavedAccount = {
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: "candidate",
    };

    const user = toPublicUser(newAccount);
    setCandidateAccounts((prev) => [...prev, newAccount]);
    setAuthUser(user);
    return { ok: true, user };
  };

  const logout = () => {
    setAuthUser(null);
    setActiveInterviewRole("");
    setSelectedQuestions([]);
    setAnswers([]);
    setResult(null);
  };

  const canCandidateSubmitRole = (
    role: CandidateInterviewRole,
    email = authUser?.email,
    currentLanguage = language,
  ): SubmissionEligibility => {
    if (!email) {
      return { allowed: false, reason: "Please login to continue." };
    }

    const roleControl = interviewControlsByRole[role];
    const roleOpen = isInterviewCurrentlyAccepting(roleControl);

    if (!roleOpen) {
      return {
        allowed: false,
        reason: roleControl.acceptingUntil
          ? `${role} interviews are closed after ${new Date(roleControl.acceptingUntil).toLocaleString()}.`
          : `${role} interviews are currently closed by admin.`,
      };
    }

    const alreadySubmitted = submittedCandidates.some(
      (candidate) => candidate.email === email && candidate.interviewRole === role,
    );

    if (alreadySubmitted) {
      return {
        allowed: false,
        reason: `You already submitted an interview for ${role}. Multiple submissions for the same role are not allowed.`,
      };
    }

    return { allowed: true };
  };

  const submitInterviewResult = ({
    user,
    result,
    interviewRole,
  }: {
    user: AuthUser;
    result: InterviewResult;
    interviewRole: CandidateInterviewRole;
  }): SubmitInterviewResult => {
    if (user.role !== "candidate") {
      return { ok: false, message: "Only candidates can submit interviews." };
    }

    if (!interviewRole || interviewRole.length === 0) {
      return { ok: false, message: "Invalid interview role. Please select a valid role." };
    }

    if (!user.email || user.email.trim().length === 0) {
      return { ok: false, message: "User email is missing. Please log in again." };
    }

    const eligibility = canCandidateSubmitRole(interviewRole, user.email, result.language);
    if (!eligibility.allowed) {
      return { ok: false, message: eligibility.reason };
    }

    try {
      const record: AdminCandidateRecord = {
        id: `INT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
        name: user.name,
        email: user.email,
        language: result.language,
        score: result.overall,
        classification: result.classification,
        flags: buildFlags(result),
        category: interviewRole,
        source: "submission",
        interviewRole,
        submittedAt: new Date().toISOString(),
        result,
        selected: false,
      };

      setSubmittedCandidates((prev) => [record, ...prev]);

      addNotification({
        kind: "admin:new-interview",
        recipientRole: "admin",
        message: `New interview submitted by ${record.name} for ${interviewRole}.`,
      });

      return { ok: true, record };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Submission failed due to an unexpected error.";
      return { ok: false, message: errorMessage };
    }
  };

  const getInterviewControlForRole = (role: CandidateInterviewRole) =>
    interviewControlsByRole[role];

  const isInterviewAcceptingForRole = (role: CandidateInterviewRole) =>
    isInterviewCurrentlyAccepting(interviewControlsByRole[role]);

  const updateInterviewControlForRole = (role: CandidateInterviewRole, next: InterviewControl) => {
    setInterviewControlsByRole((prev) => ({ ...prev, [role]: next }));
  };

  const closeInterviewWindowForRole = (role: CandidateInterviewRole) => {
    setInterviewControlsByRole((prev) => ({
      ...prev,
      [role]: { ...prev[role], isOpen: false },
    }));
  };

  const reopenInterviewWindowForRole = (role: CandidateInterviewRole) => {
    setInterviewControlsByRole((prev) => ({
      ...prev,
      [role]: { ...prev[role], isOpen: true },
    }));
  };

  const markCandidateSelected = (candidateId: string, selected: boolean) => {
    let changedRecord: AdminCandidateRecord | null = null;

    setSubmittedCandidates((prev) =>
      prev.map((candidate) => {
        if (candidate.id !== candidateId) return candidate;

        if (candidate.selected === selected) return candidate;

        changedRecord = {
          ...candidate,
          selected,
          selectedAt: selected ? new Date().toISOString() : undefined,
        };

        return changedRecord;
      }),
    );

    if (!changedRecord) return false;

    if (selected && changedRecord.email) {
      addNotification({
        kind: "candidate:selected",
        recipientRole: "candidate",
        recipientEmail: changedRecord.email,
        message: `You have been shortlisted for the ${changedRecord.interviewRole ?? changedRecord.category} role.`,
      });
    }

    return true;
  };

  return (
    <Ctx.Provider
      value={{
        language,
        setLanguage,
        activeInterviewRole,
        setActiveInterviewRole,
        answers,
        addAnswer,
        resetAnswers,
        selectedQuestions,
        beginInterviewSession,
        result,
        setResult,
        authUser,
        login,
        signupCandidate,
        logout,
        candidateInterviewRoles: CANDIDATE_INTERVIEW_ROLES,
        submittedCandidates,
        submitInterviewResult,
        canCandidateSubmitRole,
        interviewControlsByRole,
        getInterviewControlForRole,
        isInterviewAcceptingForRole,
        updateInterviewControlForRole,
        closeInterviewWindowForRole,
        reopenInterviewWindowForRole,
        notifications,
        myNotifications,
        unreadMyNotifications,
        markMyNotificationsRead,
        markCandidateSelected,
      }}
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

export const MOCK_CANDIDATES: AdminCandidateRecord[] = [
  {
    id: "C001",
    name: "Aarav Sharma",
    language: "Hindi",
    score: 86,
    classification: "Job-ready",
    flags: [],
    category: "Engineering",
    source: "mock",
  },
  {
    id: "C002",
    name: "Priya Iyer",
    language: "English",
    score: 72,
    classification: "Requires training",
    flags: [],
    category: "Sales",
    source: "mock",
  },
  {
    id: "C003",
    name: "Kiran Gowda",
    language: "Kannada",
    score: 48,
    classification: "Low confidence",
    flags: ["Low confidence"],
    category: "Support",
    source: "mock",
  },
  {
    id: "C004",
    name: "Rohit Mehta",
    language: "English",
    score: 33,
    classification: "Fraud suspected",
    flags: ["Fraud", "Duplicate"],
    category: "Engineering",
    source: "mock",
  },
];

export function generateMockResult(answers: Answer[], language: string): InterviewResult {
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
      question: a.question,
      videoUrl: a.videoUrl,
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
