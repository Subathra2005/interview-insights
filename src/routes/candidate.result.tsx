import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AuthGate } from "@/components/auth-gate";

export const Route = createFileRoute("/candidate/result")({
  component: ResultPage,
});

function ResultPage() {
  return (
    <AuthGate requiredRole="candidate">
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="w-full max-w-sm p-6 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-600" />
          <h1 className="mb-2 text-xl font-semibold">Interview successfully recorded</h1>
          <p className="mb-5 text-sm text-muted-foreground">
            Your submission has been saved. The review details are available to the admin team.
          </p>
          <Link to="/">
            <Button className="w-full">Back to Home</Button>
          </Link>
        </Card>
      </div>
    </AuthGate>
  );
}
