import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AuthGate } from "@/components/auth-gate";
import { Lightbulb, Eye, Mic } from "lucide-react";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/candidate/instructions")({
  component: InstructionsPage,
});

function InstructionsPage() {
  const { language, beginInterviewSession, activeInterviewRole, canCandidateSubmitRole } = useApp();
  const navigate = useNavigate();
  const eligibility = activeInterviewRole
    ? canCandidateSubmitRole(activeInterviewRole, undefined, language)
    : { allowed: false, reason: "Choose an interview role before starting." };

  return (
    <AuthGate requiredRole="candidate">
      <div className="min-h-screen bg-background px-4 py-8">
        <div className="mx-auto max-w-md">
          <h1 className="mb-1 text-2xl font-bold">Before you start</h1>
          <p className="mb-2 text-sm text-muted-foreground">
            Language: <span className="font-medium text-foreground">{language}</span>
          </p>
          {activeInterviewRole && (
            <p className="mb-6 text-sm text-muted-foreground">
              Role: <span className="font-medium text-foreground">{activeInterviewRole}</span>
            </p>
          )}

          <div className="space-y-3">
            <Tip
              icon={<Lightbulb className="h-5 w-5" />}
              title="Sit in good lighting"
              desc="Make sure your face is well lit, no backlight."
            />
            <Tip
              icon={<Eye className="h-5 w-5" />}
              title="Ensure your face is visible"
              desc="Keep camera at eye level. Look straight."
            />
            <Tip
              icon={<Mic className="h-5 w-5" />}
              title="Speak clearly"
              desc="Find a quiet place. Don't rush. Be natural."
            />
          </div>

          <Button
            className="mt-8 w-full"
            size="lg"
            disabled={!eligibility.allowed}
            onClick={() => {
              beginInterviewSession();
              navigate({ to: "/candidate/interview" });
            }}
          >
            Start Interview
          </Button>
          {!eligibility.allowed && (
            <p className="mt-2 text-sm text-rose-600">{eligibility.reason}</p>
          )}
        </div>
      </div>
    </AuthGate>
  );
}

function Tip({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Card className="flex items-start gap-3 p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </Card>
  );
}
