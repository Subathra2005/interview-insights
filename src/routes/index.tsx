import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Video, ShieldCheck, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      <div className="mx-auto max-w-md px-4 py-10 sm:max-w-2xl sm:py-16">
        <header className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Video className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">AI Video Interview</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Smart, fair and fast candidate assessment
          </p>
        </header>

        <div className="grid gap-4">
          <Card className="p-5">
            <h2 className="mb-1 text-lg font-semibold">I'm a Candidate</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Take a short video interview in your preferred language.
            </p>
            <Link to="/candidate/language">
              <Button className="w-full">Start Interview</Button>
            </Link>
          </Card>

          <Card className="p-5">
            <h2 className="mb-1 text-lg font-semibold">I'm an Admin</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Review candidates, scores and AI evaluations.
            </p>
            <Link to="/admin">
              <Button variant="outline" className="w-full">
                Open Admin Dashboard
              </Button>
            </Link>
          </Card>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-3 text-center">
          <Feature icon={<Video className="h-5 w-5" />} label="Video" />
          <Feature icon={<BarChart3 className="h-5 w-5" />} label="AI Scoring" />
          <Feature icon={<ShieldCheck className="h-5 w-5" />} label="Fraud Check" />
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
