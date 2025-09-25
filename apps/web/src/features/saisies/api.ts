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

export function listSaisies(chantierId: string, qualiteId: string) {
  return listSaisiesOffline(chantierId, qualiteId);
}

export function createSaisie(payload: {
  chantierId: string;
  qualiteId: string;
  longueur: number;
  diametre: number;
  annotation?: string | null;
}) {
  return createSaisieOffline(payload);
}

export function updateSaisie(
  id: string,
  payload: {
    longueur: number;
    diametre: number;
    annotation?: string | null;
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
  qualiteId: string,
  payload: { longueur: number; diametre: number; annotation?: string | null },
) {
  return updateSaisieOffline(id, chantierId, qualiteId, payload);
}

export function deleteSaisie(
  id: string,
  chantierId: string,
  qualiteId: string,
) {
  return deleteSaisieOffline(id, chantierId, qualiteId);
}

export type { SaisieStats } from "./types";

export async function getSaisiesStats(
  chantierId: string,
  qualiteId: string,
  ecorcePercent?: number,
) {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return await getSaisiesStatsOffline(chantierId, qualiteId, ecorcePercent);
  }
  try {
    return await httpGetSaisiesStats(chantierId, qualiteId);
  } catch {
    // offline fallback from cache
    return await getSaisiesStatsOffline(chantierId, qualiteId, ecorcePercent);
  }
}

// Best-effort sync trigger for app startup / network regain
export async function syncOfflineQueueNow() {
  await trySyncQueue();
}
