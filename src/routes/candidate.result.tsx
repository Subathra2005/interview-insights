import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/candidate/result")({
  component: ResultPage,
});

const classColor: Record<string, string> = {
  "Job-ready": "bg-emerald-100 text-emerald-700",
  "Requires training": "bg-amber-100 text-amber-700",
  "Low confidence": "bg-orange-100 text-orange-700",
  "Fraud suspected": "bg-red-100 text-red-700",
};

function ResultPage() {
  const { result } = useApp();

  if (!result) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="max-w-sm p-6 text-center">
          <p className="mb-4">No result available.</p>
          <Link to="/">
            <Button>Go Home</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="mx-auto max-w-md space-y-4">
        <div>
          <h1 className="text-2xl font-bold">Your Results</h1>
          <p className="text-sm text-muted-foreground">Language: {result.language}</p>
        </div>

        <Card className="p-5 text-center">
          <p className="text-xs uppercase text-muted-foreground">Overall Score</p>
          <p className="my-1 text-5xl font-bold">{result.overall}</p>
          <Badge className={classColor[result.classification] || ""}>
            {result.classification}
          </Badge>
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 font-semibold">Score Breakdown</h3>
          <ScoreBar label="Relevance" value={result.relevance} />
          <ScoreBar label="Clarity" value={result.clarity} />
          <ScoreBar label="Confidence" value={result.confidence} />
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 font-semibold">Transcripts</h3>
          <div className="space-y-3">
            {result.transcripts.map((t: any) => (
              <div key={t.questionIndex} className="border-l-2 border-primary/40 pl-3">
                <p className="text-xs font-medium text-muted-foreground">
                  Q{t.questionIndex + 1}: {t.question}
                </p>
                <p className="mt-1 text-sm">{t.transcript}</p>
              </div>
            ))}
          </div>
        </Card>

        <Link to="/">
          <Button variant="outline" className="w-full">
            Back to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}

function ScoreBar({ label, value }: { label: string; value: number }) {
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
