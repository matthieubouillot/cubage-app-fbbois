import { api } from "../../lib/api";
import type { SaisieRow, SaisieStats } from "./types";

export function httpListSaisies(chantierId: string, qualiteId: string) {
  const params = new URLSearchParams({ chantierId, qualiteId }).toString();
  return api<SaisieRow[]>(`/saisies?${params}`);
}

export function httpCreateSaisie(payload: {
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

export function httpUpdateSaisie(
  id: string,
  payload: { longueur: number; diametre: number; annotation?: string | null },
) {
  return api<SaisieRow>(`/saisies/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function httpDeleteSaisie(id: string) {
  return api<{ ok: true }>(`/saisies/${id}`, { method: "DELETE" });
}

export function httpGetSaisiesStats(chantierId: string, qualiteId: string) {
  return api<SaisieStats>(
    `/saisies/stats?chantierId=${chantierId}&qualiteId=${qualiteId}`,
  );
}


