import { api } from "../../lib/api";
import type { SaisieRow, SaisieStats } from "./types";

export function httpListSaisies(chantierId: string, qualityGroupId: string) {
  const params = new URLSearchParams({ chantierId, qualityGroupId }).toString();
  return api<SaisieRow[]>(`/saisies?${params}`);
}

export function httpCreateSaisie(payload: {
  chantierId: string;
  qualityGroupId: string;
  longueur: number;
  diametre: number;
  annotation?: string | null;
  numero?: number;
  debardeurId?: string;
}) {
  return api<SaisieRow>("/saisies", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function httpUpdateSaisie(
  id: string,
  payload: { longueur: number; diametre: number; annotation?: string | null; numero?: number; debardeurId?: string },
) {
  return api<SaisieRow>(`/saisies/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function httpDeleteSaisie(id: string) {
  return api<{ ok: true }>(`/saisies/${id}`, { method: "DELETE" });
}

export function httpGetSaisiesStats(chantierId: string, qualityGroupId: string, global?: boolean) {
  const params = new URLSearchParams({ chantierId, qualityGroupId });
  if (global) params.set('global', 'true');
  return api<SaisieStats>(`/saisies/stats?${params.toString()}`);
}


