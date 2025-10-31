import { useState } from "react";
import { Link } from "react-router-dom";
import { loginRequest } from "../../features/auth/api";
import { setSession } from "../../features/auth/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const { token, user } = await loginRequest(email.trim(), password);
      setSession(token, user);
      window.location.href =
        user.roles.includes("SUPERVISEUR") ? "/home" : "/chantiers"; 
    } catch (e: any) {
      setErr(e.message || "Identifiants invalides");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo + titre */}
        <div className="flex flex-col items-center mb-6">
          <img src="/favicon.png" alt="Logo" className="h-14 w-14 mb-2" />
          <span className="text-xl font-semibold text-gray-900">
            Gestion de Cubage
          </span>
        </div>

        {/* Carte de connexion */}
        <form
          onSubmit={onSubmit}
          className="bg-white rounded-2xl shadow-sm border p-6 space-y-4"
        >
          <h1 className="text-xl font-semibold text-center">Connexion</h1>

          <label className="block">
            <span className="text-sm text-gray-700">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              required
              className="mt-1 w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
            />
          </label>

          <label className="block">
            <span className="text-sm text-gray-700">Mot de passe</span>
            <div className="mt-1 relative">
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full rounded-lg border px-3 py-2 pr-16 focus:outline-none focus:ring-2 focus:ring-black/20"
              />
              <button
                type="button"
                onClick={() => setShowPwd((s) => !s)}
                className="absolute inset-y-0 right-2 px-2 text-xs text-gray-500 hover:text-black"
              >
                {showPwd ? "Masquer" : "Afficher"}
              </button>
            </div>
          </label>

          {err && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {err}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-black text-white py-2.5 font-medium disabled:opacity-60"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>

          {/* Mot de passe oublié centré */}
          <div className="text-center">
            <Link
              to="/forgot-password"
              className="text-xs text-gray-600 hover:text-black underline underline-offset-4"
            >
              Mot de passe oublié ?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
