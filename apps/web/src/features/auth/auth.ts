export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: ("BUCHERON" | "SUPERVISEUR" | "DEBARDEUR")[];
  numStart?: number;
  numEnd?: number;
};

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export function setSession(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? (JSON.parse(raw) as User) : null;
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  sessionStorage.clear();
}

export function isAuthenticated() {
  return !!getToken();
}

export function logout() {
  clearSession();
}

// Fonctions utilitaires pour gérer les rôles
export function hasRole(user: User | null, role: "BUCHERON" | "SUPERVISEUR" | "DEBARDEUR"): boolean {
  return user?.roles?.includes(role) ?? false;
}

export function hasAnyRole(user: User | null, roles: ("BUCHERON" | "SUPERVISEUR" | "DEBARDEUR")[]): boolean {
  return user?.roles?.some(role => roles.includes(role)) ?? false;
}

export function isSuperviseur(user: User | null): boolean {
  return hasRole(user, "SUPERVISEUR");
}

export function isBucheron(user: User | null): boolean {
  return hasRole(user, "BUCHERON");
}

export function isDebardeur(user: User | null): boolean {
  return hasRole(user, "DEBARDEUR");
}

export function canWrite(user: User | null): boolean {
  return hasAnyRole(user, ["SUPERVISEUR", "BUCHERON"]);
}

export function canRead(user: User | null): boolean {
  return hasAnyRole(user, ["SUPERVISEUR", "BUCHERON", "DEBARDEUR"]);
}
