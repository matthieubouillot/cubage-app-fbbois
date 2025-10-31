import {
  createSaisieOffline,
  deleteSaisieOffline,
  listSaisiesOffline,
  updateSaisieOffline,
  trySyncQueue,
  getSaisiesStatsOffline,
} from "./offline";
import { httpGetSaisiesStats } from "./http";
import type { SaisieRow, SaisieStats } from "./types";

export type { SaisieRow } from "./types";

export function listSaisies(chantierId: string, qualityGroupId: string) {
  return listSaisiesOffline(chantierId, qualityGroupId);
}

export function createSaisie(payload: {
  chantierId: string;
  qualityGroupId: string;
  longueur: number;
  diametre: number;
  annotation?: string | null;
  numero?: number;
  debardeurId?: string;
}) {
  return createSaisieOffline(payload);
}

export function updateSaisie(
  id: string,
  payload: {
    longueur: number;
    diametre: number;
    annotation?: string | null;
    numero?: number;
  },
) {
  // We need chantierId/qualiteId to update cache when offline; callers in SaisieTab know them
  // so we expose an overload-like helper below.
  throw new Error(
    "Use updateSaisieWithContext(id, chantierId, qualiteId, payload) in offline mode.",
  );
}

export function updateSaisieWithContext(
  id: string,
  chantierId: string,
  qualityGroupId: string,
  payload: { longueur: number; diametre: number; annotation?: string | null; numero?: number; debardeurId?: string },
) {
  return updateSaisieOffline(id, chantierId, qualityGroupId, payload);
}

export function deleteSaisie(
  id: string,
  chantierId: string,
  qualityGroupId: string,
) {
  return deleteSaisieOffline(id, chantierId, qualityGroupId);
}

export type { SaisieStats } from "./types";

export async function getSaisiesStats(
  chantierId: string,
  qualityGroupId: string,
  ecorcePercent?: number,
  global?: boolean,
) {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return await getSaisiesStatsOffline(chantierId, qualityGroupId, ecorcePercent);
  }
  try {
    return await httpGetSaisiesStats(chantierId, qualityGroupId, global);
  } catch {
    // offline fallback from cache
    return await getSaisiesStatsOffline(chantierId, qualityGroupId, ecorcePercent);
  }
}

// Best-effort sync trigger for app startup / network regain
export async function syncOfflineQueueNow() {
  await trySyncQueue();
}
