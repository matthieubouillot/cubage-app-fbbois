import { openDB, type DBSchema, type IDBPDatabase } from "idb";

type PendingOp =
  | { kind: "create"; payload: any }
  | { kind: "update"; id: string; payload: any }
  | { kind: "delete"; id: string };

interface CubageDB extends DBSchema {
  // Cached saisies per chantier/qualité
  saisies: {
    key: string; // `${chantierId}:${qualityGroupId}:${saisieId}`
    value: any;
    indexes: { byCQ: string; byId: string };
  };
  // Per (chantier,qualite) list snapshot
  saisiesIndex: {
    key: string; // `${chantierId}:${qualityGroupId}`
    value: { ids: string[]; updatedAt: number };
  };
  // Pending mutations to replay online
  saisiesQueue: {
    key: number; // auto-increment
    value: {
      id?: number;
      chantierId: string;
      qualityGroupId: string;
      cq: string;
      op: PendingOp;
      createdAt: number;
    };
    indexes: { byCQ: string };
  };
  // Cached chantiers list and items
  chantiers: {
    key: string; // chantierId
    value: any;
  };
  chantiersIndex: {
    key: string; // constant key "list"
    value: { ids: string[]; updatedAt: number };
  };
  // Pending chantier mutations (currently: delete)
  chantiersQueue: {
    key: number; // auto-increment
    value: {
      id?: number;
      op: { kind: "delete"; id: string };
      createdAt: number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<CubageDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<CubageDB>("cubage-offline", 2, {
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
        // Chantiers stores (v2)
        if (!db.objectStoreNames.contains("chantiers")) {
          db.createObjectStore("chantiers");
        }
        if (!db.objectStoreNames.contains("chantiersIndex")) {
          db.createObjectStore("chantiersIndex");
        }
        if (!db.objectStoreNames.contains("chantiersQueue")) {
          db.createObjectStore("chantiersQueue", {
            autoIncrement: true,
            keyPath: "id",
          });
        }
      },
    });
  }
  return dbPromise;
}

export async function cacheSaisiesList(
  chantierId: string,
  qualityGroupId: string,
  rows: any[],
) {
  const db = await getDB();
  const tx = db.transaction(["saisies", "saisiesIndex"], "readwrite");
  const indexKey = `${chantierId}:${qualityGroupId}`;
  const ids: string[] = [];
  for (const r of rows) {
    const key = `${chantierId}:${qualityGroupId}:${r.id}`;
    ids.push(r.id);
    await tx.db.put(
      "saisies",
      {
        ...r,
        id: r.id,
        cq: indexKey,
        // Ensure user object is present for offline UI display
        user: r.user && r.user.id
          ? { id: r.user.id, firstName: r.user.firstName, lastName: r.user.lastName }
          : r.user || null,
        // Ensure debardeur object is present for offline UI display
        debardeur: r.debardeur && r.debardeur.id
          ? { id: r.debardeur.id, firstName: r.debardeur.firstName, lastName: r.debardeur.lastName }
          : r.debardeur || null,
      },
      key,
    );
  }
  await tx.db.put("saisiesIndex", { ids, updatedAt: Date.now() }, indexKey);
  await tx.done;
}

export async function upsertCachedSaisie(
  chantierId: string,
  qualityGroupId: string,
  row: any,
) {
  const db = await getDB();
  const indexKey = `${chantierId}:${qualityGroupId}`;
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
  qualityGroupId: string,
  id: string,
) {
  const db = await getDB();
  const indexKey = `${chantierId}:${qualityGroupId}`;
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
  qualityGroupId: string,
) {
  const db = await getDB();
  const indexKey = `${chantierId}:${qualityGroupId}`;
  const meta = await db.get("saisiesIndex", indexKey);
  if (!meta) return null;
  const rows: any[] = [];
  for (const id of meta.ids) {
    const row = await db.get(
      "saisies",
      `${chantierId}:${qualityGroupId}:${id}`,
    );
    if (row) rows.push(row);
  }
  // Trier par numéro décroissant (même ordre que l'API)
  rows.sort((a, b) => {
    return (b.numero || 0) - (a.numero || 0); // Numéro décroissant
  });
  return rows;
}

export async function enqueueSaisieOp(
  chantierId: string,
  qualityGroupId: string,
  op: PendingOp,
) {
  const db = await getDB();
  const cq = `${chantierId}:${qualityGroupId}`;
  await db.add("saisiesQueue", {
    chantierId,
    qualityGroupId,
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
  qualityGroupId: string,
  id: string,
) {
  const db = await getDB();
  const key = `${chantierId}:${qualityGroupId}:${id}`;
  return db.get("saisies", key);
}

// ───── Chantiers offline helpers ─────

export async function cacheChantiersList(rows: any[]) {
  const db = await getDB();
  const tx = db.transaction(["chantiers", "chantiersIndex"], "readwrite");
  const ids: string[] = [];
  for (const r of rows) {
    ids.push(r.id);
    const existing = await tx.db.get("chantiers", r.id);
    // Préserver les champs enrichis déjà présents (ex: qualites complètes depuis le détail)
    const merged = existing ? { ...r, ...existing } : r;
    await tx.db.put("chantiers", merged, r.id);
  }
  await tx.db.put(
    "chantiersIndex",
    { ids, updatedAt: Date.now() },
    "list",
  );
  await tx.done;
}

export async function upsertCachedChantier(row: any) {
  const db = await getDB();
  const tx = db.transaction(["chantiers", "chantiersIndex"], "readwrite");
  await tx.db.put("chantiers", row, row.id);
  const meta = (await tx.db.get("chantiersIndex", "list")) as
    | { ids: string[]; updatedAt: number }
    | undefined;
  const ids = new Set(meta?.ids ?? []);
  ids.add(row.id);
  await tx.db.put("chantiersIndex", { ids: Array.from(ids), updatedAt: Date.now() }, "list");
  await tx.done;
}

export async function removeCachedChantier(id: string) {
  const db = await getDB();
  const tx = db.transaction(["chantiers", "chantiersIndex"], "readwrite");
  await tx.db.delete("chantiers", id);
  const meta = (await tx.db.get("chantiersIndex", "list")) as
    | { ids: string[]; updatedAt: number }
    | undefined;
  if (meta) {
    await tx.db.put(
      "chantiersIndex",
      { ids: (meta.ids || []).filter((x) => x !== id), updatedAt: Date.now() },
      "list",
    );
  }
  await tx.done;
}

export async function readCachedChantiersList() {
  const db = await getDB();
  const meta = await db.get("chantiersIndex", "list");
  if (!meta) return null;
  const rows: any[] = [];
  for (const id of (meta as any).ids || []) {
    const row = await db.get("chantiers", id);
    if (row) rows.push(row);
  }
  return rows;
}

export async function readCachedChantier(id: string) {
  const db = await getDB();
  return db.get("chantiers", id);
}

export async function enqueueChantierOp(op: { kind: "delete"; id: string }) {
  const db = await getDB();
  await db.add("chantiersQueue", { op, createdAt: Date.now() } as any);
}

export async function readChantiersQueue() {
  const db = await getDB();
  return db.getAll("chantiersQueue");
}

export async function clearChantierQueueItem(id: number) {
  const db = await getDB();
  await db.delete("chantiersQueue", id);
}


