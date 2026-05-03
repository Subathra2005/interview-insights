import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { useApp, type UserRole } from "@/lib/store";

type AuthGateProps = {
  children: ReactNode;
  requiredRole?: UserRole;
  redirectTo?: string;
};

export function AuthGate({ children, requiredRole, redirectTo = "/" }: AuthGateProps) {
  const { authUser } = useApp();
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (!authUser) {
      navigate({ to: redirectTo, replace: true });
      return;
    }

    if (requiredRole && authUser.role !== requiredRole) {
      navigate({ to: redirectTo, replace: true });
      return;
    }

    setAuthorized(true);
  }, [authUser, navigate, redirectTo, requiredRole]);

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <Card className="max-w-sm p-6 text-center">
          <p className="text-sm font-medium">Checking your session…</p>
          <p className="mt-1 text-sm text-muted-foreground">Redirecting to sign in.</p>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
