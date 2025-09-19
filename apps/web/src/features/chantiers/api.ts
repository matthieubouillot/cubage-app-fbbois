import { api } from "../../lib/api";

export type Essence = { id: string; name: string };
export type Qualite = {
  id: string;
  name: string;
  pourcentageEcorce: number;
  essence: Essence;
};
export type Bucheron = { id: string; firstName: string; lastName: string };

export type ChantierListItem = {
  id: string;
  referenceLot: string;
  proprietaire: string;
  proprietaireFirstName: string ;
  commune: string;
  lieuDit: string ;
  section: string ;
  parcel: string ;
  essences: { id: string; name: string }[];
  qualites: { id: string; name: string; essence: { id: string } }[];
  bucherons: { id: string; firstName: string; lastName: string }[];
};

export type ChantierDetail = {
  id: string;
  referenceLot: string;
  convention: string;
  proprietaire: string;
  proprietaireFirstName: string;
  commune: string;
  lieuDit: string;
  section: string ;
  parcel: string;
  essences: Essence[];
  qualites: Qualite[];
  bucherons: Bucheron[];
};

export type UpdateChantier = {
  referenceLot: string;
  convention: string;
  proprietaire: string;
  proprietaireFirstName: string;
  commune: string;
  lieuDit: string;
  section: string;
  parcel: string;
  qualiteIds: string[];
  bucheronIds: string[];
};



export function fetchChantiers() {
  return api<ChantierListItem[]>("/chantiers");
}

export function fetchChantier(id: string) {
  return api<ChantierDetail>(`/chantiers/${id}`);
}

export function deleteChantier(id: string) {
  return api<{ ok: boolean }>(`/chantiers/${id}`, { method: "DELETE" });
}

export async function updateChantier(id: string, payload: UpdateChantier) {
  const res = await api(`/chantiers/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return res;
}