import { Link, Navigate } from "react-router-dom";
import { getUser } from "../../features/auth/auth";

export default function Home() {
  const u = getUser();

  // Protection : seuls les superviseurs voient Home
  if (!u || u.role !== "SUPERVISEUR") {
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
              Accédez à vos chantiers et à la gestion des utilisateurs.
            </p>
          </div>

          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              to="/chantiers"
              className="inline-flex items-center justify-center rounded-full bg-black text-white px-5 py-2 text-sm"
            >
              Chantiers
            </Link>
            <Link
              to="/utilisateurs" 
              className="inline-flex items-center justify-center rounded-full border border-gray-300 px-5 py-2 text-sm hover:bg-gray-50"
            >
              Utilisateurs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}