import { api } from "../../lib/api";

export type EntrepriseDTO = {
  id: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateEntreprisePayload = {
  name: string;
};

export type UpdateEntreprisePayload = {
  name: string;
};

export async function listEntreprises() {
  return api<EntrepriseDTO[]>("/entreprises");
}

export async function getEntrepriseById(id: string) {
  return api<EntrepriseDTO>(`/entreprises/${id}`);
}

export async function createEntreprise(payload: CreateEntreprisePayload) {
  return api<EntrepriseDTO>("/entreprises", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateEntreprise(id: string, payload: UpdateEntreprisePayload) {
  return api<EntrepriseDTO>(`/entreprises/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteEntreprise(id: string) {
  return api<{ ok: boolean }>(`/entreprises/${id}`, { method: "DELETE" });
}

