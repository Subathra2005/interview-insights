import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AuthGate } from "@/components/auth-gate";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MOCK_CANDIDATES, useApp, type CandidateInterviewRole } from "@/lib/store";
import { AlertTriangle, Bell } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: AdminDashboard,
});

const classColor: Record<string, string> = {
  "Job-ready": "bg-emerald-100 text-emerald-700",
  "Requires training": "bg-amber-100 text-amber-700",
  "Low confidence": "bg-orange-100 text-orange-700",
  "Fraud suspected": "bg-red-100 text-red-700",
};

function AdminDashboard() {
  const [lang, setLang] = useState("all");
  const [cat, setCat] = useState("all");
  const [controlRole, setControlRole] = useState<CandidateInterviewRole>("Engineering");
  const {
    submittedCandidates,
    candidateInterviewRoles,
    getInterviewControlForRole,
    isInterviewAcceptingForRole,
    updateInterviewControlForRole,
    closeInterviewWindowForRole,
    reopenInterviewWindowForRole,
    myNotifications,
    unreadMyNotifications,
    markMyNotificationsRead,
  } = useApp();
  const [acceptingUntilInput, setAcceptingUntilInput] = useState("");
  const selectedControl = getInterviewControlForRole(controlRole);
  const isInterviewAccepting = isInterviewAcceptingForRole(controlRole);

  useEffect(() => {
    if (!selectedControl.acceptingUntil) {
      setAcceptingUntilInput("");
      return;
    }

    const dt = new Date(selectedControl.acceptingUntil);
    const offset = dt.getTimezoneOffset();
    const local = new Date(dt.getTime() - offset * 60000).toISOString().slice(0, 16);
    setAcceptingUntilInput(local);
  }, [selectedControl.acceptingUntil]);

  const allCandidates = useMemo(
    () => [...submittedCandidates, ...MOCK_CANDIDATES],
    [submittedCandidates]
  );

  const filtered = useMemo(() => {
    return allCandidates.filter(
      (c) => (lang === "all" || c.language === lang) && (cat === "all" || c.category === cat)
    );
  }, [lang, cat, allCandidates]);

  const saveInterviewWindow = () => {
    updateInterviewControlForRole(controlRole, {
      isOpen: true,
      acceptingUntil: acceptingUntilInput
        ? new Date(acceptingUntilInput).toISOString()
        : null,
    });
  };

  return (
    <AuthGate requiredRole="admin">
      <div className="min-h-screen bg-background px-4 py-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Review all candidates</p>
            </div>
            <Link to="/">
              <Button variant="outline" size="sm">Home</Button>
            </Link>
          </div>

          <Card className="mb-4 p-4">
            <h2 className="text-base font-semibold">Interview Submission Controls</h2>
            <div className="mt-2 max-w-xs">
              <Select value={controlRole} onValueChange={(value) => setControlRole(value as CandidateInterviewRole)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {candidateInterviewRoles.map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className={`mt-1 text-sm ${isInterviewAccepting ? "text-emerald-700" : "text-rose-700"}`}>
              {controlRole} status: {isInterviewAccepting ? "Open" : "Closed"}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
              <Input
                type="datetime-local"
                value={acceptingUntilInput}
                onChange={(event) => setAcceptingUntilInput(event.target.value)}
              />
              <Button onClick={saveInterviewWindow}>Save & Open Role</Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => reopenInterviewWindowForRole(controlRole)}>
                Reopen Role
              </Button>
              <Button variant="destructive" onClick={() => closeInterviewWindowForRole(controlRole)}>
                Close Role Now
              </Button>
            </div>
            {selectedControl.acceptingUntil && (
              <p className="mt-2 text-xs text-muted-foreground">
                {controlRole} deadline: {new Date(selectedControl.acceptingUntil).toLocaleString()}
              </p>
            )}
          </Card>

          <Card className="mb-4 p-4">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Bell className="h-4 w-4" /> Notifications
              </h2>
              {unreadMyNotifications > 0 && (
                <Button size="sm" variant="outline" onClick={markMyNotificationsRead}>
                  Mark all read ({unreadMyNotifications})
                </Button>
              )}
            </div>
            {myNotifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notifications yet.</p>
            ) : (
              <div className="space-y-2">
                {myNotifications.slice(0, 6).map((notification) => (
                  <div key={notification.id} className="rounded-md border p-2">
                    <p className="text-sm font-medium">{notification.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

        <div className="mb-4 grid grid-cols-2 gap-2 sm:max-w-md">
          <Select value={lang} onValueChange={setLang}>
            <SelectTrigger><SelectValue placeholder="Language" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Languages</SelectItem>
              <SelectItem value="English">English</SelectItem>
              <SelectItem value="Hindi">Hindi</SelectItem>
              <SelectItem value="Kannada">Kannada</SelectItem>
            </SelectContent>
          </Select>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Engineering">Engineering</SelectItem>
              <SelectItem value="Product">Product</SelectItem>
              <SelectItem value="Design">Design</SelectItem>
              <SelectItem value="Sales">Sales</SelectItem>
              <SelectItem value="Support">Support</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Mobile cards */}
        <div className="grid gap-3 sm:hidden">
          {filtered.map((c) => (
            <Link key={c.id} to="/admin/$id" params={{ id: c.id }}>
              <Card className="p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.id} • {c.language}</p>
                  </div>
                  <span className="text-2xl font-bold">{c.score}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={classColor[c.classification]}>{c.classification}</Badge>
                  {c.selected && <Badge className="bg-blue-100 text-blue-700">Selected</Badge>}
                  {c.flags.map((f) => (
                    <Badge key={f} variant="destructive" className="text-xs">
                      <AlertTriangle className="mr-1 h-3 w-3" />{f}
                    </Badge>
                  ))}
                </div>
              </Card>
            </Link>
          ))}
        </div>

        {/* Desktop table */}
        <Card className="hidden overflow-hidden sm:block">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase">
              <tr>
                <th className="p-3 text-left">Candidate</th>
                <th className="p-3 text-left">Language</th>
                <th className="p-3 text-left">Role</th>
                <th className="p-3 text-left">Score</th>
                <th className="p-3 text-left">Classification</th>
                <th className="p-3 text-left">Flags</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-t">
                  <td className="p-3">
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.id}</p>
                  </td>
                  <td className="p-3">{c.language}</td>
                  <td className="p-3">{c.category}</td>
                  <td className="p-3 font-semibold">{c.score}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={classColor[c.classification]}>{c.classification}</Badge>
                      {c.selected && <Badge className="bg-blue-100 text-blue-700">Selected</Badge>}
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {c.flags.map((f) => (
                        <Badge key={f} variant="destructive" className="text-xs">{f}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="p-3">
                    <Link to="/admin/$id" params={{ id: c.id }}>
                      <Button size="sm" variant="outline">View</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

          {filtered.length === 0 && (
            <p className="mt-8 text-center text-sm text-muted-foreground">No candidates match filters.</p>
          )}
        </div>
      </div>
    </AuthGate>
  );
}
