import { api } from "../../lib/api";

export type Essence = { id: string; name: string };
export type Qualite = { id: string; name: string; pourcentageEcorce: number; essence: Essence };
export type Bucheron = { id: string; firstName: string; lastName: string };

export type ChantierListItem = {
  id: string;
  referenceLot: string;
  proprietaire: string;
  commune: string;
  lieuDit: string;
  essences: Essence[];
  qualites: { id: string; name: string; essence: { id: string } }[];
};

export type ChantierDetail = {
  id: string;
  referenceLot: string;
  convention: string;
  proprietaire: string;
  commune: string;
  lieuDit: string;
  essences: Essence[];
  qualites: Qualite[];
  bucherons: Bucheron[];
};

export function fetchChantiers() {
  return api<ChantierListItem[]>("/chantiers");
}

export function fetchChantier(id: string) {
  return api<ChantierDetail>(`/chantiers/${id}`);
}