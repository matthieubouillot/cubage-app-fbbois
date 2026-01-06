import {
  cacheChantiersList,
  readCachedChantiersList,
  enqueueChantierOp,
  clearChantierQueueItem,
  readChantiersQueue,
  removeCachedChantier,
  isOnline,
  upsertCachedChantier,
  readCachedChantier,
} from "../../lib/offlineDb";
import { api } from "../../lib/api";
import type { ChantierDetail, ChantierListItem } from "./api";

export async function listChantiersOffline(forceRefresh: boolean = false): Promise<ChantierListItem[]> {
  if (isOnline()) {
    try {
      const rows = await api<ChantierListItem[]>("/chantiers");
      await cacheChantiersList(rows);
      return rows;
    } catch {
      // fall back to cache only if not forcing refresh
      if (!forceRefresh) {
        return (await readCachedChantiersList()) as ChantierListItem[] | null ?? [];
      }
      throw new Error("Impossible de rafraîchir les données depuis le serveur");
    }
  }
  return (await readCachedChantiersList()) as ChantierListItem[] | null ?? [];
}

export async function deleteChantierOffline(id: string) {
  if (isOnline()) {
    // best effort server delete, if fails fallback to cache-only + queue
    try {
      await api<{ ok: boolean }>(`/chantiers/${id}`, { method: "DELETE" });
      await removeCachedChantier(id);
      dispatchSyncEvent();
      return { ok: true } as const;
    } catch {
      // fallback to queue below
    }
  }
  await removeCachedChantier(id);
  await enqueueChantierOp({ kind: "delete", id });
  dispatchSyncEvent();
  return { ok: true } as const;
}

export async function trySyncChantiersQueue() {
  if (!isOnline()) return;
  const all = await readChantiersQueue();
  for (const item of all) {
    try {
      if (item.op.kind === "delete") {
        await api<{ ok: boolean }>(`/chantiers/${item.op.id}`, {
          method: "DELETE",
        });
      }
      await clearChantierQueueItem(item.id!);
    } catch {
      break;
    }
  }
  dispatchSyncEvent();
}

export async function getChantierOffline(id: string, forceRefresh: boolean = false): Promise<ChantierDetail> {
  if (isOnline()) {
    try {
      const d = await api<ChantierDetail>(`/chantiers/${id}`);
      await upsertCachedChantier(d);
      return d;
    } catch {
      // fallback to cache only if not forcing refresh
      if (!forceRefresh) {
        const cached = (await readCachedChantier(id)) as ChantierDetail | null;
        if (cached) return cached;
      }
      throw new Error("Impossible de rafraîchir les données depuis le serveur");
    }
  }
  const cached = (await readCachedChantier(id)) as ChantierDetail | null;
  if (!cached) throw new Error("Données hors-ligne indisponibles pour ce chantier");
  return cached;
}

function dispatchSyncEvent() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("cubage:offline-updated"));
  }
}


