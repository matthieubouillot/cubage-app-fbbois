import {
  cacheSaisiesList,
  readCachedSaisiesList,
  enqueueSaisieOp,
  clearQueueItem,
  readQueue,
  upsertCachedSaisie,
  removeCachedSaisie,
  isOnline,
  readCachedSaisie,
  cacheDebardeursList,
  readCachedDebardeursList,
} from "../../lib/offlineDb";
import {
  httpListSaisies as httpList,
  httpCreateSaisie as httpCreate,
  httpUpdateSaisie as httpUpdate,
  httpDeleteSaisie as httpDelete,
  httpGetSaisiesStats,
} from "./http";
import { listDebardeurs as httpListDebardeurs } from "../users/api";
import type { SaisieRow, SaisieStats } from "./types";
import type { UserDTO } from "../users/api";
import { getUser } from "../auth/auth";

// List debardeurs with online->cache, offline->cache strategy
export async function listDebardeursOffline(): Promise<UserDTO[]> {
  if (isOnline()) {
    try {
      const rows = await httpListDebardeurs();
      await cacheDebardeursList(rows);
      return rows;
    } catch {
      // fallback to cache
    }
  }
  const cached = await readCachedDebardeursList();
  return (cached as UserDTO[] | null) ?? [];
}

// List with online->cache, offline->cache strategy
export async function listSaisiesOffline(
  chantierId: string,
  qualityGroupId: string,
  forceRefresh: boolean = false,
): Promise<SaisieRow[]> {
  if (isOnline()) {
    try {
      const rows = await httpList(chantierId, qualityGroupId);
      await cacheSaisiesList(chantierId, qualityGroupId, rows);
      return rows;
    } catch {
      // fallback to cache only if not forcing refresh
      if (!forceRefresh) {
        const cached = await readCachedSaisiesList(chantierId, qualityGroupId);
        return (cached as SaisieRow[] | null) ?? [];
      }
      // If forceRefresh is true and we're online but the request failed, throw the error
      throw new Error("Impossible de rafraîchir les données depuis le serveur");
    }
  }
  const cached = await readCachedSaisiesList(chantierId, qualityGroupId);
  return (cached as SaisieRow[] | null) ?? [];
}

// Create with optimistic local insert + queue when offline
export async function createSaisieOffline(payload: {
  chantierId: string;
  qualityGroupId: string;
  longueur: number;
  diametre: number;
  annotation?: string | null;
  numero?: number;
  debardeurId?: string;
}): Promise<SaisieRow> {
  const { chantierId, qualityGroupId } = payload;
  if (isOnline()) {
    const row = await httpCreate(payload);
    await upsertCachedSaisie(chantierId, qualityGroupId, row);
    dispatchSyncEvent();
    return row;
  }
  const tempId = `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const nowIso = new Date().toISOString();
  // Calculer le numéro
  let numero: number;
  if (payload.numero !== undefined) {
    // Numéro fourni : valider la plage et l'unicité localement
    const me = getUser();
    if (!me) {
      throw new Error("Utilisateur non connecté");
    }
    const canBypassRange = me.roles?.includes("SUPERVISEUR");
    if (!canBypassRange) {
      if (me.numStart && payload.numero < me.numStart) {
        throw new Error(`Le numéro doit être supérieur ou égal à ${me.numStart}`);
      }
      if (me.numEnd && payload.numero > me.numEnd) {
        throw new Error(`Le numéro doit être inférieur ou égal à ${me.numEnd}`);
      }
    }
    
    const existing = await readCachedSaisiesList(chantierId, qualityGroupId);
    const isDuplicate = existing?.some(r => 
      r.numero === payload.numero && 
      r.user?.id === me.id
    );
    if (isDuplicate) {
      throw new Error(`Le numéro ${payload.numero} est déjà utilisé`);
    }
    numero = payload.numero;
  } else {
    // Numéro automatique : prendre le dernier + 1
    numero = await nextLocalNumero(chantierId, qualityGroupId);
  }

  // Récupérer les informations du débardeur depuis la liste des débardeurs
  // En mode offline, on essaie de récupérer depuis le localStorage ou la mémoire
  let debardeur = null;
  if (payload.debardeurId) {
    try {
      // Essayer d'abord depuis localStorage (selectedDebardeur)
      const storedDebardeur = localStorage.getItem('selectedDebardeur');
      if (storedDebardeur) {
        try {
          const parsed = JSON.parse(storedDebardeur);
          if (parsed.id === payload.debardeurId) {
            debardeur = {
              id: parsed.id,
              firstName: parsed.firstName,
              lastName: parsed.lastName,
            };
          }
        } catch (e) {
          // Ignorer l'erreur de parsing
        }
      }
      
      // Si pas trouvé dans localStorage, essayer via cache offline
      if (!debardeur) {
        const debardeurs = await listDebardeursOffline();
        const debardeurUser = debardeurs.find((u: any) => u.id === payload.debardeurId);
        if (debardeurUser) {
          debardeur = {
            id: debardeurUser.id,
            firstName: debardeurUser.firstName,
            lastName: debardeurUser.lastName,
          };
        }
      }
    } catch (error) {
      // En mode offline, on peut ne pas avoir les infos du débardeur
      // On laissera debardeur à null, ce qui signifie qu'il sera affiché mais sans détails
      console.warn('Impossible de récupérer les informations du débardeur:', error);
    }
  }

  const optimistic: SaisieRow = {
    id: tempId,
    date: nowIso,
    numero,
    longueur: payload.longueur,
    diametre: payload.diametre,
    volumeCalc: 0,
    annotation: payload.annotation ?? null,
    user: getUser() ? { id: getUser()!.id, firstName: getUser()!.firstName, lastName: getUser()!.lastName } : undefined,
    debardeur: debardeur || null,
  };
  await upsertCachedSaisie(chantierId, qualityGroupId, optimistic as any);
  await enqueueSaisieOp(chantierId, qualityGroupId, {
    kind: "create",
    payload: { ...payload, clientTempId: tempId },
  });
  dispatchSyncEvent();
  return optimistic;
}

// Update with local upsert and queue when offline
export async function updateSaisieOffline(
  id: string,
  chantierId: string,
  qualityGroupId: string,
  payload: { longueur: number; diametre: number; annotation?: string | null; numero?: number; debardeurId?: string },
): Promise<SaisieRow> {
  if (isOnline()) {
    const row = await httpUpdate(id, payload);
    await upsertCachedSaisie(chantierId, qualityGroupId, row);
    dispatchSyncEvent();
    return row;
  }
  const existing = (await readCachedSaisie(chantierId, qualityGroupId, id)) || {};
  
  // Validation du numéro si fourni
  if (payload.numero !== undefined) {
    const me = getUser();
    if (!me) {
      throw new Error("Utilisateur non connecté");
    }
    const canBypassRange = me.roles?.includes("SUPERVISEUR");
    if (!canBypassRange) {
      if (me.numStart && payload.numero < me.numStart) {
        throw new Error(`Le numéro doit être supérieur ou égal à ${me.numStart}`);
      }
      if (me.numEnd && payload.numero > me.numEnd) {
        throw new Error(`Le numéro doit être inférieur ou égal à ${me.numEnd}`);
      }
    }
    
    const allRows = await readCachedSaisiesList(chantierId, qualityGroupId);
    const isDuplicate = allRows?.some(r => 
      r.numero === payload.numero && 
      r.user?.id === me.id &&
      r.id !== id // Exclure l'élément en cours de modification
    );
    if (isDuplicate) {
      throw new Error(`Le numéro ${payload.numero} est déjà utilisé`);
    }
  }

  // Récupérer les informations du débardeur si debardeurId est fourni
  let debardeur = existing.debardeur || null;
  if (payload.debardeurId !== undefined) {
    if (payload.debardeurId) {
      try {
        // Essayer d'abord depuis localStorage (selectedDebardeur)
        const storedDebardeur = localStorage.getItem('selectedDebardeur');
        if (storedDebardeur) {
          try {
            const parsed = JSON.parse(storedDebardeur);
            if (parsed.id === payload.debardeurId) {
              debardeur = {
                id: parsed.id,
                firstName: parsed.firstName,
                lastName: parsed.lastName,
              };
            }
          } catch (e) {
            // Ignorer l'erreur de parsing
          }
        }
        
        // Si pas trouvé dans localStorage, essayer via cache offline
        if (!debardeur) {
          const debardeurs = await listDebardeursOffline();
          const debardeurUser = debardeurs.find((u: any) => u.id === payload.debardeurId);
          if (debardeurUser) {
            debardeur = {
              id: debardeurUser.id,
              firstName: debardeurUser.firstName,
              lastName: debardeurUser.lastName,
            };
          } else {
            debardeur = null;
          }
        }
      } catch (error) {
        // En mode offline, conserver le débardeur existant si disponible
        console.warn('Impossible de récupérer les informations du débardeur:', error);
        debardeur = existing.debardeur || null;
      }
    } else {
      debardeur = null;
    }
  }

  const optimistic: any = {
    ...existing,
    id,
    // preserve numero/date if present, otherwise keep existing
    numero: payload.numero !== undefined ? payload.numero : existing.numero,
    date: existing.date ?? new Date().toISOString(),
    longueur: payload.longueur,
    diametre: payload.diametre,
    annotation: payload.annotation ?? null,
    debardeur,
  };
  await upsertCachedSaisie(chantierId, qualityGroupId, optimistic);
  await enqueueSaisieOp(chantierId, qualityGroupId, { kind: "update", id, payload });
  dispatchSyncEvent();
  return optimistic as SaisieRow;
}

// Delete with local remove and queue when offline
export async function deleteSaisieOffline(
  id: string,
  chantierId: string,
  qualityGroupId: string,
): Promise<{ ok: true }> {
  if (isOnline()) {
    // If it's a temporary client id, do not call server, just remove from cache
    if (id.startsWith("tmp_")) {
      await removeCachedSaisie(chantierId, qualityGroupId, id);
      dispatchSyncEvent();
      return { ok: true };
    }
    const res = await httpDelete(id);
    await removeCachedSaisie(chantierId, qualityGroupId, id);
    dispatchSyncEvent();
    return res;
  }
  await removeCachedSaisie(chantierId, qualityGroupId, id);
  await enqueueSaisieOp(chantierId, qualityGroupId, { kind: "delete", id });
  dispatchSyncEvent();
  return { ok: true };
}

// Simple sync routine to replay the queue when back online
export async function trySyncQueue() {
  if (!isOnline()) return;
  if (syncing) return;
  
  // Vérifier qu'on a un token avant de commencer la sync
  const token = localStorage.getItem("auth_token");
  if (!token) {
    return;
  }
  
  syncing = true;
  try {
    const all = await readQueue();
    for (const item of all) {
      try {
        if (item.op.kind === "create") {
          const { clientTempId, ...payload } = (item.op as any).payload || {};
          try {
            const row = await httpCreate(payload);
            await removeCachedSaisie(item.chantierId, item.qualityGroupId, clientTempId);
            await upsertCachedSaisie(item.chantierId, item.qualityGroupId, row);
          } catch (error: any) {
            // Si le numéro est déjà utilisé, créer avec numérotation automatique
            if (error.message.includes('déjà utilisé')) {
              const { numero, ...payloadWithoutNumero } = payload;
              const row = await httpCreate(payloadWithoutNumero);
              await removeCachedSaisie(item.chantierId, item.qualityGroupId, clientTempId);
              await upsertCachedSaisie(item.chantierId, item.qualityGroupId, row);
            } else {
              throw error; // Re-lancer les autres erreurs
            }
          }
        } else if (item.op.kind === "update") {
          // Si c'est un ID temporaire, on doit d'abord créer l'élément
          if (item.op.id.startsWith('tmp_')) {
            // C'est un élément temporaire qui n'existe pas encore sur le serveur
            // On le traite comme une création
            const payload = (item.op as any).payload || {};
            // Essayer d'abord avec le numéro original
            try {
              const row = await httpCreate({
                chantierId: item.chantierId,
                qualityGroupId: item.qualityGroupId,
                longueur: payload.longueur,
                diametre: payload.diametre,
                annotation: payload.annotation,
                numero: payload.numero,
              });
              await removeCachedSaisie(item.chantierId, item.qualityGroupId, item.op.id);
              await upsertCachedSaisie(item.chantierId, item.qualityGroupId, row);
            } catch (error: any) {
              // Si le numéro est déjà utilisé, créer avec numérotation automatique
              if (error.message.includes('déjà utilisé')) {
                const row = await httpCreate({
                  chantierId: item.chantierId,
                  qualityGroupId: item.qualityGroupId,
                  longueur: payload.longueur,
                  diametre: payload.diametre,
                  annotation: payload.annotation,
                  // Pas de numero -> numérotation automatique
                });
                await removeCachedSaisie(item.chantierId, item.qualityGroupId, item.op.id);
                await upsertCachedSaisie(item.chantierId, item.qualityGroupId, row);
              } else {
                throw error; // Re-lancer les autres erreurs
              }
            }
          } else {
            // C'est un élément existant, on peut le mettre à jour
            const row = await httpUpdate(item.op.id, (item.op as any).payload);
            await upsertCachedSaisie(item.chantierId, item.qualityGroupId, row);
          }
        } else if (item.op.kind === "delete") {
          // Si c'est un ID temporaire, on peut juste le supprimer du cache local
          if (item.op.id.startsWith('tmp_')) {
            await removeCachedSaisie(item.chantierId, item.qualityGroupId, item.op.id);
          } else {
            // C'est un élément existant, on peut le supprimer du serveur
            await httpDelete(item.op.id);
            await removeCachedSaisie(item.chantierId, item.qualityGroupId, item.op.id);
          }
        }
        await clearQueueItem(item.id!);
      } catch (error: any) {
        // Si erreur d'authentification, arrêter complètement la synchronisation
        // Note: La déconnexion et redirection sont déjà gérées dans api.ts
        if (error?.status === 401 || 
            error?.message?.includes('401') || 
            error?.message?.includes('Token manquant') ||
            error?.message?.includes('Token expiré') ||
            error?.message?.includes('Session expirée')) {
          break;
        }
        // Pour les autres erreurs, continuer avec l'item suivant
        continue;
      }
    }
    dispatchSyncEvent();
  } finally {
    syncing = false;
  }
}

async function nextLocalNumero(chantierId: string, qualityGroupId: string) {
  const rows = ((await readCachedSaisiesList(chantierId, qualityGroupId)) || []) as {
    numero?: number;
    user?: { id: string };
  }[];
  const me = getUser();
  const myStart = me?.numStart ?? 1;
  // Numérotation par (utilisateur courant, chantier, qualite)
  let maxForMe = 0;
  for (const r of rows) {
    if (!r || typeof r.numero !== "number") continue;
    // Si la ligne existante est à mon nom, utilise son numéro directement
    if (r.user?.id === me?.id) {
      if (r.numero > maxForMe) maxForMe = r.numero;
    }
  }
  // Si aucune ligne à moi, repartir du numStart-1 pour que +1 donne numStart
  if (maxForMe === 0) return myStart;
  return maxForMe + 1;
}

function dispatchSyncEvent() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("cubage:offline-updated"));
  }
}

let syncing = false;

// Compute basic stats from cached rows when offline
export async function getSaisiesStatsOffline(
  chantierId: string,
  qualityGroupId: string,
  ecorcePercent?: number,
): Promise<SaisieStats> {
  const rows = ((await readCachedSaisiesList(
    chantierId,
    qualityGroupId,
  )) || []) as SaisieRow[];

  let ltV1Sum = 0,
    ltV1Count = 0;
  let betweenSum = 0,
    betweenCount = 0;
  let geV2Sum = 0,
    geV2Count = 0;

  for (const r of rows) {
    let a = Number(r.volLtV1 || 0);
    let b = Number(r.volBetweenV1V2 || 0);
    let c = Number(r.volGeV2 || 0);
    if (!a && !b && !c && ecorcePercent != null) {
      const vol = computeVolumeNet(r.longueur, r.diametre, ecorcePercent);
      if (vol < 0.25) a = vol;
      else if (vol < 0.5) b = vol;
      else c = vol;
    }
    if (a > 0) ltV1Count += 1;
    if (b > 0) betweenCount += 1;
    if (c > 0) geV2Count += 1;
    ltV1Sum += a;
    betweenSum += b;
    geV2Sum += c;
  }

  const totalSum = ltV1Sum + betweenSum + geV2Sum;
  const totalCount = ltV1Count + betweenCount + geV2Count;

  function mk(sum: number, count: number) {
    return { sum, count, avg: count ? sum / count : 0 };
  }

  return {
    columns: {
      ltV1: mk(ltV1Sum, ltV1Count),
      between: mk(betweenSum, betweenCount),
      geV2: mk(geV2Sum, geV2Count),
    },
    total: mk(totalSum, totalCount),
  };
}

function computeVolumeNet(longueurM: number, diametreCm: number, ecorcePercent: number) {
  const dM = Math.max(0, Number(diametreCm)) / 100; // cm -> m
  const base = Math.PI * Math.pow(dM / 2, 2) * Math.max(0, Number(longueurM));
  const factor = 1 - Math.max(0, Math.min(100, ecorcePercent)) / 100;
  return base * factor;
}


