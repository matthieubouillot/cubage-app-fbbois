import { logout } from "../features/auth/auth";

export const API_URL = (import.meta.env.VITE_API_URL as string) || "";

function joinUrl(base: string, path: string) {
  const b = base.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  // En développement, utiliser localhost:4000 par défaut si VITE_API_URL n'est pas défini
  const isLocalhost =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "0.0.0.0");
  const defaultDevUrl = isLocalhost ? "http://localhost:4000" : "";
  
  const base =
    API_URL ||
    defaultDevUrl ||
    (typeof window !== "undefined" ? window.location.origin.replace(/\/$/, "") : "");

  if (typeof window !== "undefined" && !API_URL && !window.location.hostname.includes("localhost")) {
    throw new Error("VITE_API_URL doit être configuré en production");
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
      // Déconnecter l'utilisateur et rediriger vers la page de login
      if (typeof window !== "undefined") {
        logout();
        // Éviter la redirection si on est déjà sur la page de login
        if (!window.location.pathname.includes("/login")) {
          // Utiliser replace pour éviter le retour en arrière
          window.location.replace("/login");
        }
      }
      throw new Error("Session expirée - Veuillez vous reconnecter");
    }
    
    throw new Error(msg);
  }
  return res.json();
}