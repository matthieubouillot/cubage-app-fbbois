import { Link, Navigate } from "react-router-dom";
import { useState } from "react";
import { getUser } from "../../features/auth/auth";

export default function Home() {
  const u = getUser();
  const [showParams, setShowParams] = useState(false);

  // Protection : seuls les superviseurs voient Home
  if (!u || !u.roles.includes("SUPERVISEUR")) {
    return <Navigate to="/chantiers" replace />;
  }

  const fullName = `${u.firstName} ${u.lastName}`;

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white border rounded-2xl shadow-sm p-6 text-center space-y-4">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
              Tableau de bord
            </h1>
            <p className="text-sm text-gray-600">
              {!showParams 
                ? "Gérez vos chantiers et accédez aux paramètres."
                : "Gérez les utilisateurs et les clients."}
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
            {!showParams ? (
              <>
                <Link
                  to="/chantiers"
                  className="inline-flex items-center justify-center rounded-full bg-black text-white px-5 py-2.5 text-sm h-[36px] min-w-[120px]"
                >
                  Chantiers
                </Link>
                <button
                  onClick={() => setShowParams(true)}
                  className="inline-flex items-center justify-center rounded-full bg-black text-white px-5 py-2.5 text-sm h-[36px] min-w-[120px]"
                >
                  Paramètres
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setShowParams(false)}
                  className="inline-flex items-center justify-center rounded-full bg-white border border-gray-300 text-black w-[36px] h-[36px] text-sm"
                >
                  ←
                </button>
                <Link
                  to="/utilisateurs"
                  className="inline-flex items-center justify-center rounded-full bg-black text-white px-5 py-2.5 text-sm h-[36px] min-w-[120px]"
                >
                  Utilisateurs
                </Link>
                <Link
                  to="/clients"
                  className="inline-flex items-center justify-center rounded-full bg-black text-white px-5 py-2.5 text-sm h-[36px] min-w-[120px]"
                >
                  Clients
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}