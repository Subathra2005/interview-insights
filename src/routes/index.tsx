import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useApp, type UserRole } from "@/lib/store";
import { BarChart3, ShieldCheck, Sparkles, Video } from "lucide-react";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  const { authUser, login, signupCandidate, logout } = useApp();
  const navigate = useNavigate();
  const [audience, setAudience] = useState<UserRole>("candidate");
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setNotice(null);

    const trimmedEmail = email.trim();

    if (audience === "admin") {
      const result = login({ email: trimmedEmail, password });
      if (!result.ok || !result.user) {
        setError(result.message ?? "Unable to sign in.");
        return;
      }

      setNotice("Admin login successful.");
      navigate({ to: "/admin", replace: true });
      return;
    }

    if (mode === "signup") {
      if (!name.trim()) {
        setError("Enter your name to create a candidate account.");
        return;
      }

      const result = signupCandidate({
        name,
        email: trimmedEmail,
        password,
      });

      if (!result.ok || !result.user) {
        setError(result.message ?? "Unable to create account.");
        return;
      }

      setNotice("Candidate account created. Choose your interview role after login.");
      navigate({ to: "/candidate/language", replace: true });
      return;
    }

    const result = login({ email: trimmedEmail, password });
    if (!result.ok || !result.user) {
      setError(result.message ?? "Unable to sign in.");
      return;
    }

    setNotice("Candidate login successful.");
    navigate({ to: "/candidate/language", replace: true });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.15),_transparent_42%),linear-gradient(180deg,_#fafafa_0%,_#f1f5f9_100%)]">
      <div className="mx-auto grid min-h-screen max-w-6xl gap-10 px-4 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-6 lg:py-12">
        <section className="space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border bg-white/80 px-3 py-1 text-xs font-medium text-slate-700 shadow-sm backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-blue-600" />
            Structured video interviews with centralized review
          </div>

          <header className="max-w-xl space-y-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-900 text-white shadow-lg shadow-slate-900/20">
              <Video className="h-8 w-8" />
            </div>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              AI Video Interview
            </h1>
            <p className="max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
              Run role-based video interviews, capture candidate responses, and review submissions
              from one focused assessment workspace.
            </p>
          </header>

          <div className="grid gap-4 sm:grid-cols-3">
            <Feature icon={<Video className="h-5 w-5" />} label="Video interviews" />
            <Feature icon={<BarChart3 className="h-5 w-5" />} label="AI scoring" />
            <Feature icon={<ShieldCheck className="h-5 w-5" />} label="Admin gated" />
          </div>

          {authUser && (
            <Card className="max-w-xl border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Signed in as</p>
                  <h2 className="text-xl font-semibold text-slate-950">{authUser.name}</h2>
                  <p className="text-sm text-slate-600">{authUser.email}</p>
                </div>
                <Badge variant="secondary" className="capitalize">
                  {authUser.role}
                </Badge>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  onClick={() =>
                    navigate({ to: authUser.role === "admin" ? "/admin" : "/candidate/language" })
                  }
                >
                  Continue
                </Button>
                <Button variant="outline" onClick={logout}>
                  Logout
                </Button>
              </div>
            </Card>
          )}
        </section>

        <Card className="border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-slate-950">Sign in</h2>
              <p className="mt-1 text-sm text-slate-600">Choose candidate or admin access.</p>
            </div>
            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
              Secure flow
            </Badge>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
            <AuthToggle
              active={audience === "candidate"}
              onClick={() => {
                setAudience("candidate");
                setMode("signup");
              }}
            >
              Candidate
            </AuthToggle>
            <AuthToggle
              active={audience === "admin"}
              onClick={() => {
                setAudience("admin");
                setMode("login");
              }}
            >
              Admin
            </AuthToggle>
          </div>

          {audience === "candidate" && (
            <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
              <AuthToggle active={mode === "signup"} onClick={() => setMode("signup")}>
                Sign up
              </AuthToggle>
              <AuthToggle active={mode === "login"} onClick={() => setMode("login")}>
                Login
              </AuthToggle>
            </div>
          )}

          <form className="mt-6 space-y-4" onSubmit={submit}>
            {audience === "candidate" && mode === "signup" && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Full name</label>
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="Jane Candidate"
                  autoComplete="name"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Email</label>
              <Input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={audience === "admin" ? "Admin email" : "you@example.com"}
                type="email"
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Password</label>
              <Input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={audience === "admin" ? "Admin password" : "Choose a password"}
                type="password"
                autoComplete={audience === "admin" ? "current-password" : "new-password"}
              />
            </div>

            {audience === "admin" && (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                Admin access is restricted to authorized reviewers.
              </div>
            )}

            {error && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {error}
              </div>
            )}

            {notice && !error && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {notice}
              </div>
            )}

            <Button className="h-11 w-full text-base" type="submit">
              {audience === "admin"
                ? "Login as admin"
                : mode === "signup"
                  ? "Create candidate account"
                  : "Login as candidate"}
            </Button>

            <Separator />

            <p className="text-xs leading-5 text-slate-500">
              Candidates complete one guided submission per role. Reviewers can monitor submissions,
              playback recordings, and manage selection decisions from the admin dashboard.
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}

function AuthToggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl px-3 py-2 text-sm font-medium transition ${
        active ? "bg-white text-slate-950 shadow-sm" : "text-slate-600 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur">
      <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-white">
        {icon}
      </div>
      <p className="text-center text-sm font-medium text-slate-600">{label}</p>
    </div>
  );
}
