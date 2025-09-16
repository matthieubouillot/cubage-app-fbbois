import { useState } from "react";
import { loginRequest } from "../../features/auth/api";
import { setSession } from "../../features/auth/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const { token, user } = await loginRequest(email, password);
      setSession(token, user);
      // redirige : si superviseur → /chantiers ; si bûcheron → /mes-chantiers
      window.location.href = user.role === "SUPERVISEUR" ? "/chantiers" : "/mes-chantiers";
    } catch (e: any) {
      setErr(e.message || "Identifiants invalides");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm bg-white p-6 rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-4">Connexion</h1>
        <label className="block mb-2">
          <span className="text-sm">Email</span>
          <input
            className="mt-1 w-full border rounded-lg px-3 py-2"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
          />
        </label>
        <label className="block mb-4">
          <span className="text-sm">Mot de passe</span>
          <input
            className="mt-1 w-full border rounded-lg px-3 py-2"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {err && <p className="text-red-600 text-sm mb-3">{err}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg px-3 py-2 border bg-black text-white"
        >
          {loading ? "Connexion..." : "Se connecter"}
        </button>
        <p className="text-xs text-gray-500 mt-3">
          Astuce : utilise un compte seedé (ex. <code>fb.bois43@gmail.com</code> / <code>fbbois2025!</code>)
        </p>
      </form>
    </div>
  );
}