import { openDB, type DBSchema, type IDBPDatabase } from "idb";

type PendingOp =
  | { kind: "create"; payload: any }
  | { kind: "update"; id: string; payload: any }
  | { kind: "delete"; id: string };

interface CubageDB extends DBSchema {
  // Cached saisies per chantier/qualité
  saisies: {
    key: string; // `${chantierId}:${qualiteId}:${saisieId}`
    value: any;
    indexes: { byCQ: string; byId: string };
  };
  // Per (chantier,qualite) list snapshot
  saisiesIndex: {
    key: string; // `${chantierId}:${qualiteId}`
    value: { ids: string[]; updatedAt: number };
  };
  // Pending mutations to replay online
  saisiesQueue: {
    key: number; // auto-increment
    value: {
      id?: number;
      chantierId: string;
      qualiteId: string;
      cq: string;
      op: PendingOp;
      createdAt: number;
    };
    indexes: { byCQ: string };
  };
}

let dbPromise: Promise<IDBPDatabase<CubageDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<CubageDB>("cubage-offline", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("saisies")) {
          const store = db.createObjectStore("saisies");
          store.createIndex("byCQ", "cq");
          store.createIndex("byId", "id");
        }
        if (!db.objectStoreNames.contains("saisiesIndex")) {
          db.createObjectStore("saisiesIndex");
        }
        if (!db.objectStoreNames.contains("saisiesQueue")) {
          const q = db.createObjectStore("saisiesQueue", {
            autoIncrement: true,
            keyPath: "id",
          });
          q.createIndex("byCQ", "cq");
        }
      },
    });
  }
  return dbPromise;
}

export async function cacheSaisiesList(
  chantierId: string,
  qualiteId: string,
  rows: any[],
) {
  const db = await getDB();
  const tx = db.transaction(["saisies", "saisiesIndex"], "readwrite");
  const indexKey = `${chantierId}:${qualiteId}`;
  const ids: string[] = [];
  for (const r of rows) {
    const key = `${chantierId}:${qualiteId}:${r.id}`;
    ids.push(r.id);
    await tx.store.put({ ...r, id: r.id, cq: indexKey }, key);
  }
  await tx.db.put("saisiesIndex", { ids, updatedAt: Date.now() }, indexKey);
  await tx.done;
}

export async function upsertCachedSaisie(
  chantierId: string,
  qualiteId: string,
  row: any,
) {
  const db = await getDB();
  const indexKey = `${chantierId}:${qualiteId}`;
  const key = `${indexKey}:${row.id}`;
  const tx = db.transaction(["saisies", "saisiesIndex"], "readwrite");
  await tx.db.put("saisies", { ...row, cq: indexKey }, key);
  const meta = (await tx.db.get("saisiesIndex", indexKey)) as
    | { ids: string[]; updatedAt: number }
    | undefined;
  const ids = new Set(meta?.ids ?? []);
  ids.add(row.id);
  await tx.db.put(
    "saisiesIndex",
    { ids: Array.from(ids), updatedAt: Date.now() },
    indexKey,
  );
  await tx.done;
}

export async function removeCachedSaisie(
  chantierId: string,
  qualiteId: string,
  id: string,
) {
  const db = await getDB();
  const indexKey = `${chantierId}:${qualiteId}`;
  const key = `${indexKey}:${id}`;
  const tx = db.transaction(["saisies", "saisiesIndex"], "readwrite");
  await tx.db.delete("saisies", key);
  const meta = (await tx.db.get("saisiesIndex", indexKey)) as
    | { ids: string[]; updatedAt: number }
    | undefined;
  if (meta) {
    await tx.db.put(
      "saisiesIndex",
      {
        ids: meta.ids.filter((x) => x !== id),
        updatedAt: Date.now(),
      },
      indexKey,
    );
  }
  await tx.done;
}

export async function readCachedSaisiesList(
  chantierId: string,
  qualiteId: string,
) {
  const db = await getDB();
  const indexKey = `${chantierId}:${qualiteId}`;
  const meta = await db.get("saisiesIndex", indexKey);
  if (!meta) return null;
  const rows: any[] = [];
  for (const id of meta.ids) {
    const row = await db.get(
      "saisies",
      `${chantierId}:${qualiteId}:${id}`,
    );
    if (row) rows.push(row);
  }
  return rows;
}

export async function enqueueSaisieOp(
  chantierId: string,
  qualiteId: string,
  op: PendingOp,
) {
  const db = await getDB();
  const cq = `${chantierId}:${qualiteId}`;
  await db.add("saisiesQueue", {
    chantierId,
    qualiteId,
    cq,
    op,
    createdAt: Date.now(),
  } as any);
}

export async function readQueue() {
  const db = await getDB();
  return db.getAll("saisiesQueue");
}

export async function clearQueueItem(id: number) {
  const db = await getDB();
  await db.delete("saisiesQueue", id);
}

export function isOnline() {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

export async function updateQueueItem(item: any) {
  const db = await getDB();
  await db.put("saisiesQueue", item);
}

export async function readCachedSaisie(
  chantierId: string,
  qualiteId: string,
  id: string,
) {
  const db = await getDB();
  const key = `${chantierId}:${qualiteId}:${id}`;
  return db.get("saisies", key);
}


