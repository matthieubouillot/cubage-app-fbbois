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
  allow: Array<"BUCHERON" | "SUPERVISEUR">;
  children?: React.ReactNode;
}) {
  const user = getUser();
  if (!user) return <Navigate to="/login" replace />;

  if (!allow.includes(user.role)) {
    const fallback = user.role === "SUPERVISEUR" ? "/home" : "/chantiers";
    return <Navigate to={fallback} replace />; 
  }
  return children ? <>{children}</> : <Outlet />;
}
