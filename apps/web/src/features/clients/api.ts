import { api } from "../../lib/api";

export type PropertyDTO = {
  id: string;
  commune: string | null;
  lieuDit: string | null;
  section: string | null;
  parcelle: string | null;
  surfaceCadastrale: number | null;
};

export type CreatePropertyPayload = {
  commune?: string;
  lieuDit?: string;
  section?: string;
  parcelle?: string;
  surfaceCadastrale?: number;
};

export type ClientDTO = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  postalCode: string;
  city: string;
  properties: PropertyDTO[];
  createdAt: string;
};

export type CreateClientPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  postalCode: string;
  city: string;
  properties?: CreatePropertyPayload[];
};

export type UpdateClientPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  postalCode: string;
  city: string;
  properties?: CreatePropertyPayload[];
};

export async function listClients() {
  return api<ClientDTO[]>("/clients");
}

export async function getClient(id: string) {
  return api<ClientDTO>(`/clients/${id}`);
}

export async function createClient(payload: CreateClientPayload) {
  return api<ClientDTO>("/clients", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateClient(id: string, payload: UpdateClientPayload) {
  return api<ClientDTO>(`/clients/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function deleteClient(id: string) {
  return api<{ ok: boolean }>(`/clients/${id}`, { method: "DELETE" });
}
