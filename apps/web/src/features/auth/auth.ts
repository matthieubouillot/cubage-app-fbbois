export type Role = "BUCHERON" | "SUPERVISEUR" | "DEBARDEUR";

export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: Role[];
  numStart?: number;
  numEnd?: number;
};

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

function normalizeRoles(raw: unknown): Role[] {
  if (Array.isArray(raw)) {
    return raw
      .filter((r): r is Role => r === "BUCHERON" || r === "SUPERVISEUR" || r === "DEBARDEUR");
  }
  if (typeof raw === "string") {
    return normalizeRoles([raw]);
  }
  if (raw && typeof raw === "object" && "role" in (raw as Record<string, unknown>)) {
    return normalizeRoles((raw as Record<string, unknown>).role);
  }
  return [];
}

export function setSession(token: string, user: User) {
  const sanitizedUser: User = {
    ...user,
    roles: normalizeRoles((user as any)?.roles),
  };
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(sanitizedUser));
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<User>;
    return {
      ...parsed,
      roles: normalizeRoles((parsed as any)?.roles),
    } as User;
  } catch {
    return null;
  }
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
export function hasRole(user: User | null, role: Role): boolean {
  return user?.roles?.includes(role) ?? false;
}

export function hasAnyRole(user: User | null, roles: Role[]): boolean {
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
