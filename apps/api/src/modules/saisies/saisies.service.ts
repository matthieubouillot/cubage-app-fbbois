import { prisma } from "../../prisma";

/* =========================
 * Types
 * ========================= */
type Role = "BUCHERON" | "SUPERVISEUR" | "DEBARDEUR";

type Auth = {
  userId: string;
  roles: Role[];
};

type CreateSaisieInput = {
  chantierId: string;
  qualityGroupId: string;
  longueur: number; // m
  diametre: number; // cm
  annotation?: string | null;
  numero?: number;
  debardeurId?: string | null;
};

type UpdateSaisieInput = {
  longueur: number; // m
  diametre: number; // cm
  annotation?: string | null;
  numero?: number;
  debardeurId?: string | null;
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
  // Vérifier d'abord si le chantier existe
  const chantier = await prisma.chantier.findUnique({
    where: { id: chantierId },
    select: { id: true },
  });
  
  if (!chantier) {
    throw new Error("Chantier non trouvé");
  }
  
  // Pour l'instant, permettre l'accès à tous les utilisateurs authentifiés
  // TODO: Restreindre l'accès selon les rôles si nécessaire
}

/**
 * Vérifie l’existence des 3 FKs utilisées par NumberingState upsert,
 * ce qui permet d’éviter des erreurs FK opaques.
 */
async function assertFKs(
  userId: string,
  chantierId: string,
  qualityGroupId: string,
) {
  const [u, ch, qg] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { id: true } }),
    prisma.chantier.findUnique({
      where: { id: chantierId },
      select: { id: true },
    }),
    prisma.qualityGroup.findUnique({
      where: { id: qualityGroupId },
      select: { id: true },
    }),
  ]);
  if (!u) throw new Error("Utilisateur inconnu (reconnecte-toi).");
  if (!ch) throw new Error("Chantier introuvable.");
  if (!qg) throw new Error("Groupe de qualité inexistant.");
}

// Numérotation auto par (user, chantier, qualité)
// =================== NUMÉROTATION ATOMIQUE ===================
async function getNextNumber(
  userId: string,
  chantierId: string,
  qualityGroupId: string,
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { numStart: true },
  });
  const start = user?.numStart ?? 1;

  return prisma.$transaction(async (tx) => {
    // Récupérer le dernier numéro existant pour cet utilisateur/chantier/groupe de qualité
    const lastSaisie = await tx.saisie.findFirst({
      where: {
        userId,
        chantierId,
        qualityGroupId,
      },
      orderBy: { numero: 'desc' },
      select: { numero: true },
    });

    // Si aucune saisie existante, commencer au numéro de départ
    if (!lastSaisie) {
      return start;
    }

    // Sinon, prendre le dernier numéro + 1
    return lastSaisie.numero + 1;
  });
}

// Validation d'unicité du numéro
async function validateNumeroUnique(
  userId: string,
  chantierId: string,
  qualityGroupId: string,
  numero: number,
  excludeId?: string,
) {
  const existing = await prisma.saisie.findFirst({
    where: {
      userId,
      chantierId,
      qualityGroupId,
      numero,
      ...(excludeId && { id: { not: excludeId } }),
    },
  });

  if (existing) {
    throw new Error(`Le numéro ${numero} est déjà utilisé`);
  }
}

// Validation de la plage de numérotation
async function validateNumeroRange(userId: string, numero: number) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { numStart: true, numEnd: true },
  });

  if (user?.numStart && numero < user.numStart) {
    throw new Error(`Le numéro doit être supérieur ou égal à ${user.numStart}`);
  }
  if (user?.numEnd && numero > user.numEnd) {
    throw new Error(`Le numéro doit être inférieur ou égal à ${user.numEnd}`);
  }
}

/**
 * Calcule volumes + récupère qualityGroupId à partir de (chantierId, qualityGroupId).
 * Retourne aussi longueur/diametre arrondis.
 */
async function computeFor(
  chantierId: string,
  qualityGroupId: string,
  longueur: number,
  diametre: number,
) {
  const qg = await prisma.chantierQualityGroup.findFirst({
    where: { chantierId, qualityGroupId },
    select: {
      qualityGroup: { 
        select: { 
          pourcentageEcorce: true,
          essences: {
            select: {
              essence: { select: { id: true } }
            }
          }
        } 
      },
    },
  });
  if (!qg) throw new Error("Groupe de qualité non activé pour ce chantier");

  const volBrut = volumeBrut(longueur, diametre, false, false); // Pas de circonf/quart dans le nouveau modèle
  const volSousEcorce =
    volBrut * (1 - (qg.qualityGroup.pourcentageEcorce ?? 0) / 100);

  let volLtV1: number | null = null;
  let volBetweenV1V2: number | null = null;
  let volGeV2: number | null = null;

  if (volSousEcorce < V1) volLtV1 = round3(volSousEcorce);
  else if (volSousEcorce >= V2) volGeV2 = round3(volSousEcorce);
  else volBetweenV1V2 = round3(volSousEcorce);

  return {
    essenceId: qg.qualityGroup.essences[0]?.essence.id || null, // Prendre la première essence du groupe
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
    input.qualityGroupId,
    input.longueur,
    input.diametre,
  );

  // Numérotation
  let numero: number;
  if (input.numero) {
    // Numéro fourni : valider la plage et l'unicité
    await validateNumeroRange(auth.userId, input.numero);
    await validateNumeroUnique(
      auth.userId,
      input.chantierId,
      input.qualityGroupId,
      input.numero,
    );
    numero = input.numero;
  } else {
    // Numéro automatique : prendre le dernier + 1
    numero = await getNextNumber(
      auth.userId,
      input.chantierId,
      input.qualityGroupId,
    );
  }

  return prisma.saisie.create({
    data: {
      chantier: { connect: { id: input.chantierId } },
      qualityGroup: { connect: { id: input.qualityGroupId } },
      user: { connect: { id: auth.userId } },

      longueur: computed.longueur,
      diametre: computed.diametre,
      volumeCalc: computed.volumeCalc,
      volLtV1: computed.volLtV1,
      volBetweenV1V2: computed.volBetweenV1V2,
      volGeV2: computed.volGeV2,
      annotation: (input.annotation ?? "").trim() || null,
      numero,
      ...(input.debardeurId ? { 
        debardeur: { connect: { id: input.debardeurId } } 
      } : {}),
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
      debardeur: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });
}

/* =========================
 * List
 * ========================= */
export async function listSaisiesService(
  auth: Auth,
  filters: { chantierId: string; qualityGroupId: string },
) {
  await assertAccessToChantier(auth, filters.chantierId);

  // Filtrage par rôle
  const where: any = {
    chantierId: filters.chantierId,
    qualityGroupId: filters.qualityGroupId,
  };
  if (auth.roles.includes("BUCHERON") && !auth.roles.includes("SUPERVISEUR")) {
    where.userId = auth.userId; // ← ne voit que ses lignes
  }
  // Les débardeurs et superviseurs voient toutes les saisies du chantier

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
      debardeur: { select: { id: true, firstName: true, lastName: true } },
    },
  });
}

/* =========================
 * Stats (tableau des totaux)
 * ========================= */
export async function getSaisiesStatsService(
  auth: Auth,
  filters: { chantierId: string; qualityGroupId: string; global?: boolean },
) {
  await assertAccessToChantier(auth, filters.chantierId);

  const where: any = {
    chantierId: filters.chantierId,
    qualityGroupId: filters.qualityGroupId,
  };
  // Les bûcherons ne voient leurs stats que si global=false (par défaut)
  // Les superviseurs voient toujours les stats globales
  if (auth.roles.includes("BUCHERON") && !auth.roles.includes("SUPERVISEUR") && !filters.global) {
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
    select: { id: true, chantierId: true, qualityGroupId: true },
  });
  if (!s) throw new Error("Saisie introuvable");

  await assertAccessToChantier(auth, s.chantierId);

  if (payload.longueur <= 0 || payload.diametre <= 0) {
    throw new Error("Longueur et diamètre doivent être > 0");
  }

  const computed = await computeFor(
    s.chantierId,
    s.qualityGroupId,
    payload.longueur,
    payload.diametre,
  );

  // Validation du numéro si fourni
  if (payload.numero !== undefined) {
    await validateNumeroRange(auth.userId, payload.numero);
    await validateNumeroUnique(
      auth.userId,
      s.chantierId,
      s.qualityGroupId,
      payload.numero,
      s.id,
    );
  }

  return prisma.saisie.update({
    where: { id: s.id },
    data: {
      longueur: computed.longueur,
      diametre: computed.diametre,
      volumeCalc: computed.volumeCalc,
      ...(payload.numero !== undefined && { numero: payload.numero }),
      volLtV1: computed.volLtV1,
      volBetweenV1V2: computed.volBetweenV1V2,
      volGeV2: computed.volGeV2,
      annotation: (payload.annotation ?? "").trim() || null,
      version: { increment: 1 },
      ...(payload.debardeurId !== undefined && payload.debardeurId 
        ? { debardeur: { connect: { id: payload.debardeurId } } }
        : payload.debardeurId === null ? { debardeur: { disconnect: true } } : {}),
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
      debardeur: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
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
