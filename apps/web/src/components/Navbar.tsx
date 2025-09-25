import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getUser, logout } from "../features/auth/auth";

export default function Navbar() {
  const u = getUser();
  const nav = useNavigate();
  const [online, setOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true,
  );
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const onLogout = () => {
    try {
      logout();
    } finally {
      nav("/login", { replace: true });
    }
  };

  const homeHref = u?.role === "SUPERVISEUR" ? "/home" : "/chantiers";

  return (
    <nav className="w-full border-b bg-white shadow-sm sticky top-0 z-50">
      <div className="relative h-14 px-3 sm:px-6 flex items-center justify-between">
        {/* GAUCHE : Logo + titre (mobile) */}
        <div className="flex items-center gap-2">
          <Link to={homeHref} className="flex items-center gap-2">
            <img src="/favicon.png" alt="Accueil" className="h-7 w-7" />
            {/* Titre visible uniquement en mobile */}
            <span className="font-semibold text-gray-800 text-base sm:hidden">
              Gestion de Cubage
            </span>
          </Link>
        </div>

        {/* CENTRE : Titre (desktop uniquement) */}
        <div className="hidden sm:absolute sm:left-1/2 sm:-translate-x-1/2 sm:flex items-center">
          <span className="font-semibold text-gray-800 text-base whitespace-nowrap">
            Gestion de Cubage
          </span>
        </div>

        {/* DROITE : User + Déconnexion */}
        <div className="flex items-center gap-3">
          {u && (
            <div className="flex flex-col items-end leading-tight text-right">
              <span className="text-sm font-medium text-gray-900 truncate max-w-[140px] sm:max-w-none">
                {u.firstName} {u.lastName}
              </span>
              <span className="text-xs text-gray-500 italic">
                {u.role === "SUPERVISEUR" ? "Superviseur" : "Bûcheron"}
              </span>
            </div>
          )}

          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-2 sm:px-3 py-1.5 text-xs font-medium text-gray-700 hover:border-red-500 hover:text-red-600 transition"
            title="Se déconnecter"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span className="hidden xs:inline">Déconnexion</span>
          </button>
        </div>
      </div>
      {!online && (
        <div className="absolute left-1/2 -translate-x-1/2 top-[56px]">
          <div className="inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-900 rounded-full px-3 py-1 shadow-sm">
            <span className="inline-flex h-2 w-2 rounded-full bg-yellow-500 shadow-[0_0_0_2px_rgba(250,204,21,0.25)]" aria-hidden />
            <span className="text-xs sm:text-sm font-medium">Mode hors ligne</span>
          </div>
        </div>
      )}
    </nav>
  );
}
