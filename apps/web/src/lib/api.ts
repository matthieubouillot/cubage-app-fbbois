export const API_URL = (import.meta.env.VITE_API_URL as string) || "";

function joinUrl(base: string, path: string) {
  const b = base.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const base =
    API_URL ||
    (typeof window !== "undefined" ? window.location.origin.replace(/\/$/, "") : "");

  if (typeof window !== "undefined" && !API_URL && !window.location.hostname.includes("localhost")) {
    throw new Error(
    );
  }

  const headers = new Headers(options.headers as HeadersInit);
  headers.set("Content-Type", "application/json");
  
  // Éviter le cache en développement
  if (import.meta.env.DEV) {
    headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    headers.set("Pragma", "no-cache");
    headers.set("Expires", "0");
  }
  
  const token = localStorage.getItem("auth_token");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  } else {
    // Si pas de token, on peut quand même essayer (pour les routes publiques)
    // mais on va gérer l'erreur 401 spécifiquement
  }

  const url = joinUrl(base, path);
  const res = await fetch(url, { ...options, headers });

  if (!res.ok) {
    let msg = "Erreur API";
    try {
      const j = await res.json();
      msg = j.error || msg;
    } catch {}
    
    // Gestion spéciale pour les erreurs d'authentification
    if (res.status === 401) {
      if (!token) {
        throw new Error("Token manquant");
      } else {
        throw new Error("Token expiré - reconnexion nécessaire");
      }
    }
    
    throw new Error(msg);
  }
  return res.json();
}