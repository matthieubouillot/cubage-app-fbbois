import { api } from "../../lib/api";
import { listChantiersOffline, deleteChantierOffline, trySyncChantiersQueue, getChantierOffline } from "./offline";

export type Essence = { id: string; name: string };
export type Qualite = { id: string; name: string };
export type Scieur = { id: string; name: string };
export type QualityGroup = {
  id: string;
  name: string;
  category: string;
  qualiteId: string;
  scieurId: string;
  pourcentageEcorce: number;
  createdAt: string;
  qualite: Qualite;
  scieur: Scieur;
  essences: Essence[];
  lotConventions: LotConvention[];
};
export type LotConvention = {
  id: string;
  lot: string;
  convention: string;
  qualityGroupId: string;
  createdAt: string;
  qualityGroup: QualityGroup;
};
export type Bucheron = { id: string; firstName: string; lastName: string };

export type ChantierListItem = {
  id: string;
  numeroCoupe: string;
  section: string;
  parcel: string;
  createdAt: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    street: string;
    postalCode: string;
    city: string;
  } | null;
  qualityGroups: {
    id: string;
    name: string;
    category: string;
    pourcentageEcorce: number;
    qualite: {
      id: string;
      name: string;
    };
    scieur: {
      id: string;
      name: string;
    };
    essences: {
      id: string;
      name: string;
    }[];
  }[];
  bucherons: { id: string; firstName: string; lastName: string }[];
  debardeurs?: { id: string; firstName: string; lastName: string }[];
};

export type ChantierDetail = {
  id: string;
  numeroCoupe: string;
  section: string;
  parcel: string;
  createdAt: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    street: string;
    postalCode: string;
    city: string;
  } | null;
  property: {
    id: string;
    commune: string | null;
    lieuDit: string | null;
    section: string | null;
    parcelle: string | null;
    surfaceCadastrale: number | null;
  } | null;
  qualityGroups: {
    id: string;
    name: string;
    category: string;
    pourcentageEcorce: number;
    qualite: {
      id: string;
      name: string;
    };
    scieur: {
      id: string;
      name: string;
    };
    essences: {
      id: string;
      name: string;
    }[];
    lotConventions: {
      id: string;
      lot: string;
      convention: string;
      qualityGroupId: string;
    }[];
  }[];
  bucherons: Bucheron[];
  debardeurAssignments?: { id: string; firstName: string; lastName: string }[];
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
  return listChantiersOffline();
}

export function fetchChantier(id: string) {
  return getChantierOffline(id);
}

export function deleteChantier(id: string) {
  return deleteChantierOffline(id);
}

export async function updateChantier(id: string, payload: UpdateChantier) {
  const res = await api(`/chantiers/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
  return res;
}

export async function syncChantiersOfflineNow() {
  await trySyncChantiersQueue();
}

// Nouvelles fonctions pour les entités
export async function getEssences(): Promise<Essence[]> {
  const res = await api("/essences");
  return res;
}

export async function getQualites(): Promise<Qualite[]> {
  const res = await api("/qualites");
  return res;
}

export async function getScieurs(): Promise<Scieur[]> {
  const res = await api("/scieurs");
  return res;
}

export async function getQualityGroups(): Promise<QualityGroup[]> {
  const res = await api("/quality-groups");
  return res;
}

export async function getLotConventionsByQualityGroup(qualityGroupId: string): Promise<LotConvention[]> {
  const res = await api(`/lot-conventions?qualityGroupId=${qualityGroupId}`);
  return res;
}

export async function getChantierById(id: string) {
  const res = await api(`/chantiers/${id}`);
  return res;
}

export async function createChantier(payload: any) {
  const res = await api("/chantiers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return res;
}

export async function getChantiers() {
  const res = await api("/chantiers");
  return res;
}