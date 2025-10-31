import { Navigate, Outlet } from "react-router-dom";
import { getUser, isAuthenticated } from "./auth";

export function ProtectedRoute({ children }: { children?: React.ReactNode }) {
  if (!isAuthenticated()) return <Navigate to="/login" replace />;
  return children ? <>{children}</> : <Outlet />;
}

export function RoleRoute({
  allow,
  children,
}: {
  allow: Array<"BUCHERON" | "SUPERVISEUR" | "DEBARDEUR">;
  children?: React.ReactNode;
}) {
  const user = getUser();
  if (!user) return <Navigate to="/login" replace />;

  if (!user.roles.some(role => allow.includes(role))) {
    const fallback = user.roles.includes("SUPERVISEUR") ? "/home" : "/chantiers";
    return <Navigate to={fallback} replace />;
  }
  return children ? <>{children}</> : <Outlet />;
}
