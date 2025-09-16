export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "BUCHERON" | "SUPERVISEUR";
};

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export function setSession(token: string, user: User) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}
export function getToken() { return localStorage.getItem(TOKEN_KEY); }
export function getUser(): User | null {
  const raw = localStorage.getItem(USER_KEY);
  return raw ? JSON.parse(raw) as User : null;
}
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}
export function isAuthenticated() { return !!getToken(); }