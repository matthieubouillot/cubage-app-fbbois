import { prisma } from "../../prisma";

type CreateSaisieInput = {
  chantierId: string;
  qualiteId: string;
  longueur: number; // mètres
  diametre: number; // cm
  annotation?: string | null;
};

function round3(n: number) {
  return Number(n.toFixed(3));
}

// Volume brut (E14 dans ton Excel) suivant circonf/quart
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

// Numérotation auto par (user, chantier)
async function ensureNumberingAndGetNext(userId: string, chantierId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { numStart: true },
  });
  const start = user?.numStart ?? 1;

  const st = await prisma.numberingState.upsert({
    where: { userId_chantierId: { userId, chantierId } },
    create: { userId, chantierId, nextNumber: start },
    update: {},
    select: { nextNumber: true },
  });

  await prisma.numberingState.update({
    where: { userId_chantierId: { userId, chantierId } },
    data: { nextNumber: st.nextNumber + 1 },
  });

  return st.nextNumber;
}

export async function createSaisieService(
  auth: { userId: string; role: "BUCHERON" | "SUPERVISEUR" },
  input: CreateSaisieInput,
) {
  // Accès chantier
  const canAccess = await prisma.chantier.findFirst({
    where:
      auth.role === "SUPERVISEUR"
        ? { id: input.chantierId }
        : {
            id: input.chantierId,
            assignments: { some: { userId: auth.userId } },
          },
    select: { id: true },
  });
  if (!canAccess) throw new Error("Accès refusé au chantier");

  // Paramètres de l’onglet + % écorce + essence
  const qx = await prisma.qualiteOnChantier.findFirst({
    where: { chantierId: input.chantierId, qualiteId: input.qualiteId },
    select: {
      circonf: true,
      quart: true,
      qualite: { select: { pourcentageEcorce: true, essenceId: true } },
    },
  });
  if (!qx) throw new Error("Qualité non activée pour ce chantier");

  const { circonf, quart } = qx;
  const ecorcePct = qx.qualite.pourcentageEcorce ?? 0;
  const essenceId = qx.qualite.essenceId;

  // Validations
  if (!input.longueur || !input.diametre)
    throw new Error("Longueur et diamètre requis");
  if (input.longueur <= 0 || input.diametre <= 0)
    throw new Error("Longueur et diamètre doivent être > 0");

  // Calculs
  const volBrut = volumeBrut(
    input.longueur,
    input.diametre,
    !!circonf,
    !!quart,
  );
  const volSousEcorce = volBrut * (1 - ecorcePct / 100);

  // Seuils fixes
  const V1 = 0.25;
  const V2 = 0.5;

  // Répartition
  let volLtV1: number | null = null;
  let volBetweenV1V2: number | null = null;
  let volGeV2: number | null = null;

  if (volSousEcorce < V1) {
    volLtV1 = round3(volSousEcorce);
  } else if (volSousEcorce >= V2) {
    volGeV2 = round3(volSousEcorce);
  } else {
    volBetweenV1V2 = round3(volSousEcorce);
  }

  // Payload
  const payload = {
    chantierId: input.chantierId,
    essenceId,
    qualiteId: input.qualiteId,
    userId: auth.userId,
    longueur: round3(input.longueur),
    diametre: round3(input.diametre),
    volumeCalc: round3(volSousEcorce),
    volLtV1,
    volBetweenV1V2,
    volGeV2,
    annotation: (input.annotation ?? "").trim() || null,
  };

  // Numéro auto
  const numero = await ensureNumberingAndGetNext(auth.userId, input.chantierId);

  // Insert
  return prisma.saisie.create({
    data: { ...payload, numero },
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

export async function listSaisiesService(
  auth: { userId: string; role: "BUCHERON" | "SUPERVISEUR" },
  filters: { chantierId: string; qualiteId: string },
) {
  // Accès chantier
  const canAccess = await prisma.chantier.findFirst({
    where:
      auth.role === "SUPERVISEUR"
        ? { id: filters.chantierId }
        : {
            id: filters.chantierId,
            assignments: { some: { userId: auth.userId } },
          },
    select: { id: true },
  });
  if (!canAccess) throw new Error("Accès refusé");

  return prisma.saisie.findMany({
    where: { chantierId: filters.chantierId, qualiteId: filters.qualiteId },
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

// ⬇️ à la suite de listSaisiesService
export async function getSaisiesStatsService(
  auth: { userId: string; role: "BUCHERON" | "SUPERVISEUR" },
  filters: { chantierId: string; qualiteId: string },
) {
  // contrôle d’accès identique
  const canAccess = await prisma.chantier.findFirst({
    where:
      auth.role === "SUPERVISEUR"
        ? { id: filters.chantierId }
        : { id: filters.chantierId, assignments: { some: { userId: auth.userId } } },
    select: { id: true },
  });
  if (!canAccess) throw new Error("Accès refusé");

  const rows = await prisma.saisie.findMany({
    where: { chantierId: filters.chantierId, qualiteId: filters.qualiteId },
    select: { volLtV1: true, volBetweenV1V2: true, volGeV2: true },
  });

  const sum = { ltV1: 0, between: 0, geV2: 0 };
  const count = { ltV1: 0, between: 0, geV2: 0 };

  for (const r of rows) {
    if (r.volLtV1 != null)      { sum.ltV1 += Number(r.volLtV1);           count.ltV1++; }
    if (r.volBetweenV1V2 != null){ sum.between += Number(r.volBetweenV1V2); count.between++; }
    if (r.volGeV2 != null)      { sum.geV2 += Number(r.volGeV2);           count.geV2++; }
  }

  const avg = {
    ltV1:     count.ltV1     ? +(sum.ltV1     / count.ltV1    ).toFixed(3) : 0,
    between:  count.between  ? +(sum.between  / count.between ).toFixed(3) : 0,
    geV2:     count.geV2     ? +(sum.geV2     / count.geV2    ).toFixed(3) : 0,
  };

  const totalSum   = +(sum.ltV1 + sum.between + sum.geV2).toFixed(3);
  const totalCount = rows.length;
  const totalAvg   = totalCount ? +(totalSum / totalCount).toFixed(3) : 0;

  return {
    columns: {
      ltV1:    { sum: +sum.ltV1.toFixed(3),    count: count.ltV1,    avg: avg.ltV1 },
      between: { sum: +sum.between.toFixed(3), count: count.between, avg: avg.between },
      geV2:    { sum: +sum.geV2.toFixed(3),    count: count.geV2,    avg: avg.geV2 },
    },
    total: { sum: totalSum, count: totalCount, avg: totalAvg },
  };
}
