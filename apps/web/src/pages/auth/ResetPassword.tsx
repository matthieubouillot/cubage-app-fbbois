import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { api } from "../../lib/api";
import MobileBack from "../../components/MobileBack";

export default function ResetPassword() {
  const [sp] = useSearchParams();
  const token = sp.get("token") || "";
  const nav = useNavigate();

  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) setErr("Lien invalide");
  }, [token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await api("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      setOk(true);
      setTimeout(() => nav("/login"), 1200);
    } catch (e: any) {
      setErr(e.message || "Lien invalide ou expiré");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-gray-50 px-4">
      <MobileBack fallback="/login" />
      <div className="w-full max-w-sm">
        <div className="bg-white border rounded-2xl shadow-sm p-6 space-y-4 text-center">
          <div className="flex items-center justify-center gap-2">
            <img src="/favicon.png" alt="" className="h-8 w-8" />
            <h1 className="text-xl font-semibold">Gestion de Cubage</h1>
          </div>

          <h2 className="text-lg font-medium mt-1">Réinitialiser le mot de passe</h2>

          {ok ? (
            <p className="text-sm text-green-700">
              Mot de passe mis à jour. Redirection vers la connexion…
            </p>
          ) : (
            <form onSubmit={submit} className="space-y-3 text-left">
              <label className="block">
                <span className="text-sm">Nouveau mot de passe</span>
                <div className="mt-1 relative">
                  <input
                    type={showPwd ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 pr-16 focus:outline-none focus:ring-2 focus:ring-black/20"
                    placeholder="••••••••"
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

              {err && <p className="text-sm text-red-600">{err}</p>}

              <button
                type="submit"
                disabled={loading || !token}
                className="w-full rounded-full bg-black text-white px-4 py-2"
              >
                {loading ? "Validation..." : "Mettre à jour"}
              </button>
            </form>
          )}

          <p className="text-xs text-gray-500">
            <Link to="/login" className="underline">Retour à la connexion</Link>
          </p>
        </div>
      </div>
    </div>
  );
}