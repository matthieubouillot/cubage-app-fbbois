import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center space-y-4">
        <div className="bg-white border rounded-2xl shadow-sm p-6 space-y-3">
          <div className="text-5xl">🗺️</div>
          <h1 className="text-xl md:text-2xl font-semibold">
            Page introuvable
          </h1>
          <p className="text-sm text-gray-600">
            La page que vous cherchez n’existe pas ou a été déplacée.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              to="/chantiers"
              className="inline-flex items-center justify-center rounded-full bg-black text-white px-5 py-2 text-sm"
            >
              Revenir à l’accueil
            </Link>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-gray-400">
          Code d’erreur : 404
        </p>
      </div>
    </div>
  );
}
