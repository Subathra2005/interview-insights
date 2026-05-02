import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MOCK_CANDIDATES, QUESTIONS } from "@/lib/store";
import { CheckCircle2, XCircle } from "lucide-react";

export const Route = createFileRoute("/admin/$id")({
  component: CandidateDetail,
});

const classColor: Record<string, string> = {
  "Job-ready": "bg-emerald-100 text-emerald-700",
  "Requires training": "bg-amber-100 text-amber-700",
  "Low confidence": "bg-orange-100 text-orange-700",
  "Fraud suspected": "bg-red-100 text-red-700",
};

function CandidateDetail() {
  const { id } = Route.useParams();
  const candidate = MOCK_CANDIDATES.find((c) => c.id === id);

  if (!candidate) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="p-6 text-center">
          <p className="mb-4">Candidate not found.</p>
          <Link to="/admin"><Button>Back to Dashboard</Button></Link>
        </Card>
      </div>
    );
  }

  const breakdown = {
    relevance: Math.min(100, candidate.score + 5),
    clarity: Math.max(20, candidate.score - 3),
    confidence: candidate.score - 8,
  };

  const duplicate = candidate.flags.includes("Duplicate");
  const audioGood = !candidate.flags.includes("Low confidence");
  const faceDetected = !candidate.flags.includes("Fraud");

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-2xl space-y-4">
        <Link to="/admin" className="text-sm text-primary">← Back to Dashboard</Link>

        <Card className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{candidate.name}</h1>
              <p className="text-sm text-muted-foreground">{candidate.id} • {candidate.language} • {candidate.category}</p>
            </div>
            <span className="text-3xl font-bold">{candidate.score}</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge className={classColor[candidate.classification]}>{candidate.classification}</Badge>
            {candidate.flags.map((f) => (
              <Badge key={f} variant="destructive">{f}</Badge>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 font-semibold">Validation</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <ValidationRow label="Face detected" ok={faceDetected} />
            <ValidationRow label={`Audio: ${audioGood ? "Good" : "Low"}`} ok={audioGood} />
            <ValidationRow label="Duplicate suspected" ok={!duplicate} negative={duplicate} />
          </div>
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 font-semibold">Score Breakdown</h3>
          <Bar label="Relevance" value={breakdown.relevance} />
          <Bar label="Clarity" value={breakdown.clarity} />
          <Bar label="Confidence" value={breakdown.confidence} />
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 font-semibold">Answers</h3>
          <div className="space-y-4">
            {QUESTIONS.slice(0, 3).map((q, i) => (
              <div key={i} className="border-l-2 border-primary/40 pl-3">
                <p className="text-xs font-medium text-muted-foreground">Q{i + 1}: {q}</p>
                <div className="mt-2 flex aspect-video w-full items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                  [ Video playback placeholder ]
                </div>
                <p className="mt-2 text-sm">
                  Mock transcript: The candidate provided a clear and structured answer covering the main points expected for this question.
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function ValidationRow({ label, ok, negative }: { label: string; ok: boolean; negative?: boolean }) {
  const color = negative ? "text-red-600" : ok ? "text-emerald-600" : "text-amber-600";
  return (
    <div className={`flex items-center gap-2 rounded-md border p-2 text-sm ${color}`}>
      {ok && !negative ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
      <span>{label}</span>
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">{value}/100</span>
      </div>
      <Progress value={value} className="h-2" />
    </div>
  );
}
