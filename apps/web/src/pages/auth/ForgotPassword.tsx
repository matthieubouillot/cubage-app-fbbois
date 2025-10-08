import { useState } from "react";
import { api } from "../../lib/api";
import MobileBack from "../../components/MobileBack";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await api("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setOk(true);
    } catch (e: any) {
      setErr(e.message || "Erreur");
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

          <h2 className="text-lg font-medium mt-1">Mot de passe oublié</h2>

          {ok ? (
            <p className="text-sm text-gray-600">
              Si un compte existe pour <strong>{email}</strong>, un lien de
              réinitialisation a été envoyé. Consultez votre boîte mail.
            </p>
          ) : (
            <form onSubmit={submit} className="space-y-3 text-left">
              <label className="block">
                <span className="text-sm">Email</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black/20"
                  placeholder="vous@exemple.com"
                />
              </label>

              {err && <p className="text-sm text-red-600">{err}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-black text-white px-4 py-2"
              >
                {loading ? "Envoi..." : "Envoyer le lien"}
              </button>
            </form>
          )}

          {!ok && (
            <p className="text-xs text-gray-500">
              Vous recevrez un lien valable {60} minutes.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}