import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/login/LoginPage";
import Home from "./pages/common/Home";
import NotFound from "./pages/common/NotFound";
import ChantiersList from "./pages/chantiers/ChantiersList";
import MesChantiers from "./pages/chantiers/MesChantiers";
import Topbar from "./components/Topbar";
import { ProtectedRoute, RoleRoute } from "./features/auth/ProtectedRoute";
import CreateChantier from "./pages/chantiers/CreateChantier";
import ChantierDetail from "./pages/chantiers/ChantierDetail";

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protégé (affiche Topbar seulement une fois connecté) */}
        <Route element={<ProtectedLayout />}>
          <Route path="/" element={<Home />} />

          {/* Rôle: SUPERVISEUR */}
          <Route element={<RoleRoute allow={["SUPERVISEUR"]} />}>
            <Route path="/chantiers" element={<ChantiersList />} />
            <Route path="/chantiers/nouveau" element={<CreateChantier />} />
            <Route path="/chantiers/:id" element={<ChantierDetail />} />
          </Route>

          {/* Rôle: BUCHERON */}
          <Route element={<RoleRoute allow={["BUCHERON"]} />}>
            <Route path="/mes-chantiers" element={<MesChantiers />} />
            <Route path="/chantiers/:id" element={<ChantierDetail />} />
          </Route>
        </Route>

        {/* Divers */}
        <Route path="/logout" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

/** Layout protégé : vérifie l’auth et rend la barre haute + contenu */
import { Outlet } from "react-router-dom";
function ProtectedLayout() {
  return (
    <ProtectedRoute>
      <Topbar />
      <div className="max-w-5xl mx-auto">
        <Outlet />
      </div>
    </ProtectedRoute>
  );
}
