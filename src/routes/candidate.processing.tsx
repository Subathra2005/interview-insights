import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";
import { useApp, generateMockResult } from "@/lib/store";
import { AuthGate } from "@/components/auth-gate";
import { Loader2, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/candidate/processing")({
  component: ProcessingPage,
});

const STEPS = ["Saving recordings…", "Submitting interview…", "Finishing…"];

function ProcessingPage() {
  const navigate = useNavigate();
  const { answers, language, setResult, authUser, submitInterviewResult, activeInterviewRole } =
    useApp();
  const [step, setStep] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const savedRef = useRef(false);

  useEffect(() => {
    if (!activeInterviewRole) {
      setSubmitError("Choose an interview role before submitting.");
      return;
    }

    if (!authUser) {
      setSubmitError("Please log in to submit your interview.");
      return;
    }

    if (step < STEPS.length) {
      const t = setTimeout(() => setStep((s) => s + 1), 1500);
      return () => clearTimeout(t);
    }

    if (savedRef.current) return;

    savedRef.current = true;

    (async () => {
      try {
        const { toPlayableUploadUrl } = await import("@/lib/upload");
        const serverBackedAnswers = answers.map((a) => ({
          ...a,
          videoUrl: toPlayableUploadUrl(a.videoUrl),
        }));

        const r = generateMockResult(serverBackedAnswers, language);
        setResult(r);

        const submitState = submitInterviewResult({
          user: authUser,
          result: r,
          interviewRole: activeInterviewRole,
        });

        if (!submitState.ok) {
          setSubmitError(submitState.message ?? "Submission failed.");
          return;
        }
      } catch (error) {
        setSubmitError(
          error instanceof Error
            ? error.message
            : "An unexpected error occurred during submission.",
        );
        return;
      }

      setTimeout(() => navigate({ to: "/candidate/result" }), 400);
    })();
  }, [
    step,
    answers,
    language,
    setResult,
    submitInterviewResult,
    authUser,
    navigate,
    activeInterviewRole,
  ]);

  if (submitError) {
    return (
      <AuthGate requiredRole="candidate">
        <div className="flex min-h-screen items-center justify-center bg-background px-4">
          <Card className="w-full max-w-sm p-6 text-center">
            <h2 className="mb-2 text-lg font-semibold">Unable to submit interview</h2>
            <p className="mb-4 text-sm text-muted-foreground">{submitError}</p>
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
              onClick={() => navigate({ to: "/candidate/language" })}
            >
              Back to Role Selection
            </button>
          </Card>
        </div>
      </AuthGate>
    );
  }

  return (
    <AuthGate requiredRole="candidate">
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-sm p-6">
          <h2 className="mb-4 text-center text-lg font-semibold">Processing your interview</h2>
          <ul className="space-y-3">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-3">
                {i < step ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : i === step ? (
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-muted" />
                )}
                <span className={i <= step ? "text-foreground" : "text-muted-foreground"}>{s}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </AuthGate>
  );
}
