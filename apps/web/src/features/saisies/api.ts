import { api } from "../../lib/api";

export type SaisieRow = {
  id: string;
  date: string;
  numero: number;
  longueur: number;
  diametre: number;
  volLtV1?: number | null;
  volBetweenV1V2?: number | null;
  volGeV2?: number | null;
  volumeCalc: number;
  annotation?: string | null;
  user?: { id: string; firstName: string; lastName: string };
};

export function listSaisies(chantierId: string, qualiteId: string) {
  const params = new URLSearchParams({ chantierId, qualiteId }).toString();
  return api<SaisieRow[]>(`/saisies?${params}`);
}

export function createSaisie(payload: {
  chantierId: string;
  qualiteId: string;
  longueur: number;
  diametre: number;
  annotation?: string | null;
}) {
  return api<SaisieRow>("/saisies", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateSaisie(
  id: string,
  payload: {
    longueur: number;
    diametre: number;
    annotation?: string | null;
  },
) {
  return api<SaisieRow>(`/saisies/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function deleteSaisie(id: string) {
  return api<{ ok: true }>(`/saisies/${id}`, { method: "DELETE" });
}

export type SaisieStats = {
  columns: {
    ltV1: { sum: number; count: number; avg: number };
    between: { sum: number; count: number; avg: number };
    geV2: { sum: number; count: number; avg: number };
  };
  total: { sum: number; count: number; avg: number };
};

export async function getSaisiesStats(chantierId: string, qualiteId: string) {
  return api<SaisieStats>(
    `/saisies/stats?chantierId=${chantierId}&qualiteId=${qualiteId}`,
  );
}
