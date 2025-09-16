import { api } from "../../lib/api";
import type { User } from "./auth";

export function loginRequest(email: string, password: string) {
  return api<{ token: string; user: User }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}