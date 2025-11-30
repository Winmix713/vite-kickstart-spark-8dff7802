import { Fragment, useEffect, type ReactNode } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import type { UserRole } from "@/providers/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
interface RoleGateProps {
  allowedRoles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
  loadingMessage?: string;
}
const DefaultFallback = () => <Card className="mx-auto max-w-lg border-destructive/40 bg-destructive/10 shadow-none">
    <CardHeader className="flex flex-row items-center gap-3">
      <div className="rounded-full bg-destructive/20 p-2 text-destructive">
        <ShieldAlert className="h-5 w-5" />
      </div>
      <CardTitle className="text-lg">Access denied</CardTitle>
    </CardHeader>
    <CardContent className="text-sm text-muted-foreground">
      You do not have permission to view this section. Please contact an administrator if you believe this is an
      error.
    </CardContent>
  </Card>;
const RoleGate = ({
  allowedRoles,
  children,
  fallback,
  loadingMessage = "Checking permissions"
}: RoleGateProps) => {
  const {
    profile,
    loading
  } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading && profile && !allowedRoles.includes(profile.role)) {
      navigate("/unauthorized", {
        replace: true
      });
    }
  }, [loading, profile, allowedRoles, navigate]);
  if (loading) {
    return <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
        <span className="text-sm font-medium">{loadingMessage}…</span>
      </div>;
  }
  if (!profile || !allowedRoles.includes(profile.role)) {
    return <Fragment>{fallback ?? <DefaultFallback />}</Fragment>;
  }
  return <Fragment>{children}</Fragment>;
};
export default RoleGate;