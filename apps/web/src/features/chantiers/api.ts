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
  lot?: string | null;
  convention?: string | null;
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
    lot?: string | null;
    convention?: string | null;
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
    lot?: string | null;
    convention?: string | null;
  }[];
  bucherons: Bucheron[];
  debardeurs: { id: string; firstName: string; lastName: string }[];
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
  return api<Essence[]>("/essences");
}

export async function getQualites(): Promise<Qualite[]> {
  return api<Qualite[]>("/qualites");
}

export async function getScieurs(): Promise<Scieur[]> {
  return api<Scieur[]>("/scieurs");
}

export async function getQualityGroups(): Promise<QualityGroup[]> {
  return api<QualityGroup[]>("/quality-groups");
}

export async function getChantierById(id: string) {
  return api(`/chantiers/${id}`);
}

export async function createChantier(payload: any) {
  return api("/chantiers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getChantiers() {
  return api("/chantiers");
}

export type ChantierFicheData = {
  aFacturerValues: Record<string, { abattage: string; debardage: string }>;
  fraisGestionValues: Record<string, string>; // Les clés sont des strings dans l'API
  prixUHT: { aba: string; deb: string };
  volumeMoulinValues?: Record<string, string>; // Les clés sont des strings dans l'API
  facturationValues?: Record<string, boolean>; // Les clés sont des strings dans l'API
};

export async function getChantierFiche(chantierId: string): Promise<ChantierFicheData | null> {
  try {
    return await api<ChantierFicheData>(`/chantiers/${chantierId}/fiche`);
  } catch (e: any) {
    // 404 est normal si la fiche n'existe pas encore
    if (e.message?.includes("404") || e.message?.includes("introuvable") || e.message?.includes("Not Found")) {
      return null;
    }
    throw e;
  }
}

export async function saveChantierFiche(chantierId: string, data: ChantierFicheData): Promise<ChantierFicheData> {
  return api<ChantierFicheData>(`/chantiers/${chantierId}/fiche`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}