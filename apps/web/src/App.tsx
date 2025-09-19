// apps/web/src/App.tsx
import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useEffect } from "react";
import LoginPage from "./pages/auth/LoginPage";
import Home from "./pages/common/Home";
import NotFound from "./pages/common/NotFound";
import ChantiersList from "./pages/chantiers/ChantiersList";
import Navbar from "./components/Navbar";
import { ProtectedRoute, RoleRoute } from "./features/auth/ProtectedRoute";
import CreateChantier from "./pages/chantiers/CreateChantier";
import EditChantier from "./pages/chantiers/EditChantier";
import ChantierDetail from "./pages/chantiers/ChantierDetail";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";
import UsersPage from "./pages/users/UsersPage";
import { getUser, isAuthenticated } from "./features/auth/auth";

export default function App() {
  // Empêche l’historique de ré-afficher une page protégée après logout (back nav)
  useEffect(() => {
    function onPageShow(e: PageTransitionEvent) {
      if ((e as any).persisted && !isAuthenticated()) {
        window.location.replace("/login");
      }
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Protégé (Navbar + contenu) */}
        <Route element={<ProtectedLayout />}>
          {/* Bloc SUPERVISEUR */}
          <Route element={<RoleRoute allow={["SUPERVISEUR"]} />}>
            <Route path="/home" element={<Home />} />
            <Route path="/chantiers/nouveau" element={<CreateChantier />} />
            <Route path="/chantiers/:id/modifier" element={<EditChantier />} />
            <Route path="/utilisateurs" element={<UsersPage />} />
          </Route>

          {/* Bloc commun SUPERVISEUR + BUCHERON */}
          <Route element={<RoleRoute allow={["SUPERVISEUR", "BUCHERON"]} />}>
            <Route path="/chantiers" element={<ChantiersList />} />
            <Route path="/chantiers/:id" element={<ChantierDetail />} />
          </Route>
        </Route>

        {/* Déconnexion */}
        <Route path="/logout" element={<Navigate to="/login" replace />} />

        {/* Route racine */}
        <Route
          path="/"
          element={
            isAuthenticated() ? (
              getUser()?.role === "SUPERVISEUR" ? (
                <Navigate to="/home" replace />
              ) : (
                <Navigate to="/chantiers" replace />
              )
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

/** Layout protégé : vérifie l’auth et rend la barre + contenu */
function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <Navbar />
      <div className="max-w-5xl mx-auto">
        <Outlet />
      </div>
    </ProtectedRoute>
  );
}
