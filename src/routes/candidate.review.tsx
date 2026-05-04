import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AuthGate } from "@/components/auth-gate";
import { useApp } from "@/lib/store";
import { toPlayableUploadUrl } from "@/lib/upload";

export const Route = createFileRoute("/candidate/review")({
  component: ReviewPage,
});

function ReviewPage() {
  const { answers, activeInterviewRole, canCandidateSubmitRole, language } = useApp();
  const navigate = useNavigate();
  const eligibility = activeInterviewRole
    ? canCandidateSubmitRole(activeInterviewRole, undefined, language)
    : { allowed: false, reason: "Choose an interview role before submitting." };

  if (answers.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="max-w-sm p-6 text-center">
          <p className="mb-4">No answers recorded yet.</p>
          <Link to="/candidate/interview">
            <Button>Go to Interview</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <AuthGate requiredRole="candidate">
      <div className="min-h-screen bg-background px-4 py-6">
        <div className="mx-auto max-w-md">
          <h1 className="mb-1 text-2xl font-bold">Review your answers</h1>
          <p className="mb-6 text-sm text-muted-foreground">
            Watch your responses before final submission.
          </p>

          <div className="space-y-4">
            {answers.map((a) => (
              <Card key={a.questionIndex} className="overflow-hidden">
                <div className="border-b p-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Question {a.questionIndex + 1}
                  </p>
                  <p className="text-sm font-medium">{a.question}</p>
                </div>
                <video
                  src={toPlayableUploadUrl(a.videoUrl)}
                  controls
                  playsInline
                  preload="metadata"
                  className="aspect-video w-full bg-black"
                />
                <div className="px-3 py-2 text-xs text-muted-foreground">
                  Duration: {a.durationSec}s
                </div>
              </Card>
            ))}
          </div>

          <Button
            className="mt-6 w-full"
            size="lg"
            disabled={!eligibility.allowed}
            onClick={() => navigate({ to: "/candidate/processing" })}
          >
            Submit Interview
          </Button>
          {!eligibility.allowed && (
            <p className="mt-2 text-sm text-rose-600">{eligibility.reason}</p>
          )}
        </div>
      </div>
    </AuthGate>
  );
}
