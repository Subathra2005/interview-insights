import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AuthGate } from "@/components/auth-gate";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp, type CandidateInterviewRole } from "@/lib/store";
import { Bell, Languages } from "lucide-react";

export const Route = createFileRoute("/candidate/language")({
  component: LanguagePage,
});

const OPTIONS = [
  { code: "Kannada", native: "ಕನ್ನಡ" },
  { code: "Hindi", native: "हिन्दी" },
  { code: "English", native: "English" },
];

function LanguagePage() {
  const {
    setLanguage,
    activeInterviewRole,
    setActiveInterviewRole,
    candidateInterviewRoles,
    canCandidateSubmitRole,
    myNotifications,
    unreadMyNotifications,
    markMyNotificationsRead,
    getInterviewControlForRole,
    isInterviewAcceptingForRole,
  } = useApp();
  const navigate = useNavigate();
  const selectedRoleControl = activeInterviewRole
    ? getInterviewControlForRole(activeInterviewRole)
    : null;
  const isInterviewAccepting = activeInterviewRole
    ? isInterviewAcceptingForRole(activeInterviewRole)
    : false;
  const currentEligibility = activeInterviewRole
    ? canCandidateSubmitRole(activeInterviewRole)
    : { allowed: false, reason: "Select a role to continue." };

  const choose = (lang: string) => {
    if (!activeInterviewRole) return;

    const eligibility = canCandidateSubmitRole(activeInterviewRole, undefined, lang);
    if (!eligibility.allowed) return;

    setLanguage(lang);
    navigate({ to: "/candidate/instructions" });
  };

  return (
    <AuthGate requiredRole="candidate">
      <div className="min-h-screen bg-background px-4 py-8">
        <div className="mx-auto max-w-md">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Languages className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold">Choose your language</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Select your interview role first, then choose your language
            </p>
          </div>

          <Card className="mb-4 p-4">
            <p className="mb-2 text-sm font-medium text-foreground">Interview role</p>
            <Select
              value={activeInterviewRole || undefined}
              onValueChange={(value) => setActiveInterviewRole(value as CandidateInterviewRole)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select the role you are applying for" />
              </SelectTrigger>
              <SelectContent>
                {candidateInterviewRoles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {activeInterviewRole && !currentEligibility.allowed && (
              <p className="mt-2 text-xs text-rose-600">{currentEligibility.reason}</p>
            )}
            {activeInterviewRole && currentEligibility.allowed && (
              <p className="mt-2 text-xs text-emerald-600">
                You can submit one interview for {activeInterviewRole}.
              </p>
            )}
          </Card>

          <Card className="mb-4 p-4">
            <p className="text-sm font-medium">Interview window status</p>
            <p
              className={`mt-1 text-sm ${isInterviewAccepting ? "text-emerald-700" : "text-rose-700"}`}
            >
              {isInterviewAccepting ? "Open" : "Closed"}
            </p>
            {selectedRoleControl?.acceptingUntil && (
              <p className="mt-1 text-xs text-muted-foreground">
                Accepting until: {new Date(selectedRoleControl.acceptingUntil).toLocaleString()}
              </p>
            )}
          </Card>

          <Card className="mb-4 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="flex items-center gap-2 text-sm font-medium">
                <Bell className="h-4 w-4" /> Notifications
              </p>
              {unreadMyNotifications > 0 && (
                <button
                  type="button"
                  className="text-xs text-primary"
                  onClick={markMyNotificationsRead}
                >
                  Mark all read
                </button>
              )}
            </div>
            {myNotifications.length === 0 ? (
              <p className="text-xs text-muted-foreground">No notifications yet.</p>
            ) : (
              <div className="space-y-2">
                {myNotifications.slice(0, 4).map((notification) => (
                  <div key={notification.id} className="rounded-md border p-2 text-xs">
                    <p className="font-medium text-foreground">{notification.message}</p>
                    <p className="text-muted-foreground">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <div className="space-y-3">
            {OPTIONS.map((opt) => (
              <Card
                key={opt.code}
                className="cursor-pointer p-4 transition hover:border-primary hover:shadow-md"
                onClick={() => choose(opt.code)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold">{opt.native}</p>
                    <p className="text-xs text-muted-foreground">{opt.code}</p>
                  </div>
                  <Button
                    size="sm"
                    disabled={
                      !activeInterviewRole || !currentEligibility.allowed || !isInterviewAccepting
                    }
                  >
                    Select
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </AuthGate>
  );
}
