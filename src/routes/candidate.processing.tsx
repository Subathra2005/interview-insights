import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useApp, generateMockResult } from "@/lib/store";
import { Loader2, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/candidate/processing")({
  component: ProcessingPage,
});

const STEPS = ["Transcribing audio…", "Analyzing response…", "Generating score…"];

function ProcessingPage() {
  const navigate = useNavigate();
  const { answers, language, setResult } = useApp();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step < STEPS.length) {
      const t = setTimeout(() => setStep((s) => s + 1), 1500);
      return () => clearTimeout(t);
    } else {
      const r = generateMockResult(answers, language);
      setResult(r);
      setTimeout(() => navigate({ to: "/candidate/result" }), 400);
    }
  }, [step]);

  return (
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
  );
}
