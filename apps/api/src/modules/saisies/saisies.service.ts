import { prisma } from "../../prisma";

/* =========================
 * Types
 * ========================= */
type Role = "BUCHERON" | "SUPERVISEUR";

type Auth = {
  userId: string;
  role: Role;
};

type CreateSaisieInput = {
  chantierId: string;
  qualiteId: string;
  longueur: number; // m
  diametre: number; // cm
  annotation?: string | null;
};

type UpdateSaisieInput = {
  longueur: number; // m
  diametre: number; // cm
  annotation?: string | null;
};

/* =========================
 * Constantes métier
 * ========================= */
const V1 = 0.25;
const V2 = 0.5;

/* =========================
 * Utils
 * ========================= */
function round3(n: number) {
  return Number(n.toFixed(3));
}

// E14 (volume brut) selon circonf/quart
function volumeBrut(
  longueurM: number,
  diametreCm: number,
  circonf: boolean,
  quart: boolean,
): number {
  const C = longueurM;
  const D = diametreCm;
  if (!circonf) {
    return quart
      ? ((Math.PI * Math.PI * D * D) / 160000) * C
      : (Math.PI * D * D * C) / 40000;
  } else {
    return quart ? ((D * D) / 160000) * C : (D * D * C) / (Math.PI * 40000);
  }
}

// contrôle d'accès chantier (BUCHERON seulement si assigné)
async function assertAccessToChantier(auth: Auth, chantierId: string) {
  const canAccess = await prisma.chantier.findFirst({
    where:
      auth.role === "SUPERVISEUR"
        ? { id: chantierId }
        : { id: chantierId, assignments: { some: { userId: auth.userId } } },
    select: { id: true },
  });
  if (!canAccess) throw new Error("Accès refusé au chantier");
}

/**
 * Vérifie l’existence des 3 FKs utilisées par NumberingState upsert,
 * ce qui permet d’éviter des erreurs FK opaques.
 */
async function assertFKs(
  userId: string,
  chantierId: string,
  qualiteId: string,
) {
  const [u, ch, q] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
    prisma.chantier.findUnique({
      where: { id: chantierId },
      select: { id: true },
    }),
    prisma.qualite.findUnique({
      where: { id: qualiteId },
      select: { id: true },
    }),
  ]);
  if (!u) throw new Error("Utilisateur inconnu (reconnecte-toi).");
  if (!ch) throw new Error("Chantier introuvable.");
  if (!q) throw new Error("Qualité inexistante.");
}

// Numérotation auto par (user, chantier, qualité)
// =================== NUMÉROTATION ATOMIQUE ===================
async function ensureNumberingAndGetNext(
  userId: string,
  chantierId: string,
  qualiteId: string,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { numStart: true },
  });
  const start = user?.numStart ?? 1;

  return prisma.$transaction(async (tx) => {
    const existing = await tx.numberingState.findUnique({
      where: {
        userId_chantierId_qualiteId: { userId, chantierId, qualiteId },
      },
      select: { nextNumber: true },
    });

    if (!existing) {
      // Première saisie pour (user, chantier, qualité) → crée l’état à start
      await tx.numberingState.create({
        data: { userId, chantierId, qualiteId, nextNumber: start + 1 },
      });
      // Numéro attribué = start
      return start;
    }

    // Incrémente et récupère la valeur après incrément
    const updated = await tx.numberingState.update({
      where: { userId_chantierId_qualiteId: { userId, chantierId, qualiteId } },
      data: { nextNumber: { increment: 1 } },
      select: { nextNumber: true },
    });

    // La valeur stockée est "prochain numéro" → on attribue "updated - 1"
    return updated.nextNumber - 1;
  });
}

/**
 * Calcule volumes + récupère essenceId à partir de (chantierId, qualiteId).
 * Retourne aussi longueur/diametre arrondis.
 */
async function computeFor(
  chantierId: string,
  qualiteId: string,
  longueur: number,
  diametre: number,
) {
  const qx = await prisma.qualiteOnChantier.findFirst({
    where: { chantierId, qualiteId },
    select: {
      circonf: true,
      quart: true,
      qualite: { select: { pourcentageEcorce: true, essenceId: true } },
    },
  });
  if (!qx) throw new Error("Qualité non activée pour ce chantier");

  const volBrut = volumeBrut(longueur, diametre, !!qx.circonf, !!qx.quart);
  const volSousEcorce =
    volBrut * (1 - (qx.qualite.pourcentageEcorce ?? 0) / 100);

  let volLtV1: number | null = null;
  let volBetweenV1V2: number | null = null;
  let volGeV2: number | null = null;

  if (volSousEcorce < V1) volLtV1 = round3(volSousEcorce);
  else if (volSousEcorce >= V2) volGeV2 = round3(volSousEcorce);
  else volBetweenV1V2 = round3(volSousEcorce);

  return {
    essenceId: qx.qualite.essenceId,
    volumeCalc: round3(volSousEcorce),
    volLtV1,
    volBetweenV1V2,
    volGeV2,
    longueur: round3(longueur),
    diametre: round3(diametre),
  };
}

/* =========================
 * Create
 * ========================= */
export async function createSaisieService(
  auth: Auth,
  input: CreateSaisieInput,
) {
  await assertAccessToChantier(auth, input.chantierId);

  if (!input.longueur || !input.diametre)
    throw new Error("Longueur et diamètre requis");
  if (input.longueur <= 0 || input.diametre <= 0)
    throw new Error("Longueur et diamètre doivent être > 0");

  const computed = await computeFor(
    input.chantierId,
    input.qualiteId,
    input.longueur,
    input.diametre,
  );

  const numero = await ensureNumberingAndGetNext(
    auth.userId,
    input.chantierId,
    input.qualiteId,
  );

  return prisma.saisie.create({
    data: {
      chantier: { connect: { id: input.chantierId } },
      essence: { connect: { id: computed.essenceId } },
      qualite: { connect: { id: input.qualiteId } },
      user: { connect: { id: auth.userId } },

      longueur: computed.longueur,
      diametre: computed.diametre,
      volumeCalc: computed.volumeCalc,
      volLtV1: computed.volLtV1,
      volBetweenV1V2: computed.volBetweenV1V2,
      volGeV2: computed.volGeV2,
      annotation: (input.annotation ?? "").trim() || null,
      numero,
    },
    select: {
      id: true,
      date: true,
      numero: true,
      longueur: true,
      diametre: true,
      volLtV1: true,
      volBetweenV1V2: true,
      volGeV2: true,
      volumeCalc: true,
      annotation: true,
    },
  });
}

/* =========================
 * List
 * ========================= */
export async function listSaisiesService(
  auth: { userId: string; role: "BUCHERON" | "SUPERVISEUR" },
  filters: { chantierId: string; qualiteId: string },
) {
  await assertAccessToChantier(auth, filters.chantierId);

  // Filtrage par rôle
  const where: any = {
    chantierId: filters.chantierId,
    qualiteId: filters.qualiteId,
  };
  if (auth.role === "BUCHERON") {
    where.userId = auth.userId; // ← ne voit que ses lignes
  }

  return prisma.saisie.findMany({
    where,
    orderBy: [{ numero: "asc" }, { date: "asc" }],
    select: {
      id: true,
      date: true,
      numero: true,
      longueur: true,
      diametre: true,
      volLtV1: true,
      volBetweenV1V2: true,
      volGeV2: true,
      volumeCalc: true,
      annotation: true,
      user: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

/* =========================
 * Stats (tableau des totaux)
 * ========================= */
export async function getSaisiesStatsService(
  auth: { userId: string; role: "BUCHERON" | "SUPERVISEUR" },
  filters: { chantierId: string; qualiteId: string; global?: boolean },
) {
  await assertAccessToChantier(auth, filters.chantierId);

  const where: any = {
    chantierId: filters.chantierId,
    qualiteId: filters.qualiteId,
  };
  // Les bûcherons ne voient leurs stats que si global=false (par défaut)
  // Les superviseurs voient toujours les stats globales
  if (auth.role === "BUCHERON" && !filters.global) {
    where.userId = auth.userId; // ← stats filtrées à l'utilisateur
  }

  const rows = await prisma.saisie.findMany({
    where,
    select: { volLtV1: true, volBetweenV1V2: true, volGeV2: true },
  });

  const toNum = (x: any) => (x == null ? null : Number(x));
  const ltV1Vals = rows
    .map((r) => toNum(r.volLtV1))
    .filter((v): v is number => v != null);
  const betweenVals = rows
    .map((r) => toNum(r.volBetweenV1V2))
    .filter((v): v is number => v != null);
  const geV2Vals = rows
    .map((r) => toNum(r.volGeV2))
    .filter((v): v is number => v != null);

  const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
  const avg = (a: number[]) => (a.length ? sum(a) / a.length : 0);

  const ltV1 = {
    sum: sum(ltV1Vals),
    count: ltV1Vals.length,
    avg: avg(ltV1Vals),
  };
  const between = {
    sum: sum(betweenVals),
    count: betweenVals.length,
    avg: avg(betweenVals),
  };
  const geV2 = {
    sum: sum(geV2Vals),
    count: geV2Vals.length,
    avg: avg(geV2Vals),
  };

  return {
    columns: { ltV1, between, geV2 },
    total: {
      sum: ltV1.sum + between.sum + geV2.sum,
      count: ltV1.count + between.count + geV2.count,
      avg: avg([...ltV1Vals, ...betweenVals, ...geV2Vals]),
    },
  };
}

/* =========================
 * Update (édition inline)
 * ========================= */
export async function updateSaisieService(
  auth: Auth,
  saisieId: string,
  payload: UpdateSaisieInput,
) {
  const s = await prisma.saisie.findUnique({
    where: { id: saisieId },
    select: { id: true, chantierId: true, qualiteId: true },
  });
  if (!s) throw new Error("Saisie introuvable");

  await assertAccessToChantier(auth, s.chantierId);

  if (payload.longueur <= 0 || payload.diametre <= 0) {
    throw new Error("Longueur et diamètre doivent être > 0");
  }

  const computed = await computeFor(
    s.chantierId,
    s.qualiteId,
    payload.longueur,
    payload.diametre,
  );

  return prisma.saisie.update({
    where: { id: s.id },
    data: {
      longueur: computed.longueur,
      diametre: computed.diametre,
      essence: { connect: { id: computed.essenceId } },
      volumeCalc: computed.volumeCalc,
      volLtV1: computed.volLtV1,
      volBetweenV1V2: computed.volBetweenV1V2,
      volGeV2: computed.volGeV2,
      annotation: (payload.annotation ?? "").trim() || null,
      version: { increment: 1 },
    },
    select: {
      id: true,
      date: true,
      numero: true,
      longueur: true,
      diametre: true,
      volLtV1: true,
      volBetweenV1V2: true,
      volGeV2: true,
      volumeCalc: true,
      annotation: true,
    },
  });
}

/* =========================
 * Delete
 * ========================= */
export async function deleteSaisieService(auth: Auth, saisieId: string) {
  const s = await prisma.saisie.findUnique({
    where: { id: saisieId },
    select: { id: true, chantierId: true },
  });
  if (!s) throw new Error("Saisie introuvable");

  await assertAccessToChantier(auth, s.chantierId);

  await prisma.saisie.delete({ where: { id: s.id } });
  return { ok: true };
}
