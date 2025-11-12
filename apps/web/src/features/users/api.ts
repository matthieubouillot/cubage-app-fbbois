import { api } from "../../lib/api";

export type Role = "SUPERVISEUR" | "BUCHERON" | "DEBARDEUR";

export type UserDTO = {
  id: string;
  firstName: string;
  lastName: string;
  roles: Role[];
  email: string;
  phone: string;
  numStart: number;
  numEnd: number;
  createdAt?: string;
  companyId?: string | null;
  company?: {
    id: string;
    name: string;
  } | null;
};

export type CreateUserPayload = {
  firstName: string;
  lastName: string;
  roles: Role[];
  email: string;
  phone: string;
  numStart: number;
  numEnd: number;
  /** mot de passe temporaire OBLIGATOIRE côté UI */
  password: string;
  companyId?: string | null;
  companyName?: string; // Si fourni, crée une nouvelle entreprise
};

export type UpdateUserPayload = {
  firstName: string;
  lastName: string;
  roles: Role[];
  phone: string;
  numStart: number;
  numEnd: number;
  // (email non modifiable ici)
  companyId?: string | null;
  companyName?: string; // Si fourni, crée une nouvelle entreprise
};

export async function listUsers() {
  // plus de filtre par rôle
  return api<UserDTO[]>("/users");
}

export async function listDebardeurs() {
  // Liste des débardeurs accessible à tous les utilisateurs authentifiés
  return api<UserDTO[]>("/users/debardeurs");
}

export async function createUser(payload: CreateUserPayload) {
  return api<UserDTO>("/users", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateUser(id: string, payload: UpdateUserPayload) {
  return api<UserDTO>(`/users/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteUser(id: string) {
  return api<{ ok: boolean }>(`/users/${id}`, { method: "DELETE" });
}
