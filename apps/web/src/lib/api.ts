export const API_URL = import.meta.env.VITE_API_URL as string;

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  // Construire des headers sûrs
  const finalHeaders = new Headers(options.headers as HeadersInit);
  finalHeaders.set("Content-Type", "application/json");
  const token = localStorage.getItem("auth_token");
  if (token) finalHeaders.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: finalHeaders,
  });

  if (!res.ok) {
    let msg = "Erreur API";
    try {
      const j = await res.json();
      msg = j.error || msg;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}