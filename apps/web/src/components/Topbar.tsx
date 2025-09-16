import { Link, useNavigate } from "react-router-dom";
import { clearSession, getUser } from "../features/auth/auth";

export default function Topbar() {
  const nav = useNavigate();
  const u = getUser();

  return (
    <div className="w-full bg-white border-b px-4 py-2 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <Link to="/" className="font-semibold">🌲 Cubage</Link>
        {u?.role === "SUPERVISEUR" && (
          <>
            <Link to="/chantiers">Chantiers</Link>
            <button
              onClick={() => nav("/chantiers/nouveau")}
              className="text-sm border rounded px-2 py-1"
            >
              Nouveau chantier
            </button>
          </>
        )}
        {u?.role === "BUCHERON" && <Link to="/mes-chantiers">Mes chantiers</Link>}
      </div>
      <div className="flex items-center gap-3">
        {u && <span className="text-sm text-gray-600">{u.firstName} {u.lastName} · {u.role}</span>}
        {u && (
          <button
            onClick={() => { clearSession(); nav("/login", { replace: true }); }}
            className="text-sm border rounded px-2 py-1"
          >
            Déconnexion
          </button>
        )}
      </div>
    </div>
  );
}