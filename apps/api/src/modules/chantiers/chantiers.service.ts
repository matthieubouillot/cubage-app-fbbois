import { prisma } from "../../prisma";

// Input reçu depuis le controller (zod)
type CreateInput = {
  referenceLot: string;
  convention: string;
  proprietaire: string;
  proprietaireFirstName: string;
  commune: string;
  lieuDit: string;
  qualiteIds: string[];
  bucheronIds: string[];
  section: string;
  parcel: string;
};

/**
 * Création d'un chantier à partir de qualités + bûcherons
 */
export async function createChantierService(input: CreateInput) {
  // 1) Vérifier les bûcherons (rôle BUCHERON)
  const bucherons = await prisma.user.findMany({
    where: { id: { in: input.bucheronIds }, role: "BUCHERON" },
    select: { id: true },
  });
  if (bucherons.length !== input.bucheronIds.length) {
    throw new Error("Un ou plusieurs utilisateurs ne sont pas des bûcherons");
  }

  // 2) Charger qualités
  const qualites = await prisma.qualite.findMany({
    where: { id: { in: input.qualiteIds } },
    select: { id: true, essenceId: true },
  });
  if (qualites.length !== input.qualiteIds.length) {
    throw new Error("Une ou plusieurs qualités sont introuvables");
  }

  // 3) Essences déduites
  const essenceIds = Array.from(new Set(qualites.map((q) => q.essenceId)));

  // 4) Transaction
  return prisma.$transaction(async (tx) => {
    const chantier = await tx.chantier.create({
      data: {
        referenceLot: input.referenceLot,
        convention: input.convention,
        proprietaire: input.proprietaire,
        proprietaireFirstName: input.proprietaireFirstName,
        commune: input.commune,
        lieuDit: input.lieuDit,
        section: input.section.toUpperCase(),
        parcel: input.parcel,
        createdAt: new Date(),
        essences: { create: essenceIds.map((essenceId) => ({ essenceId })) },
        assignments: {
          create: input.bucheronIds.map((userId) => ({ userId })),
        },
      },
      select: {
        id: true,
        referenceLot: true,
        convention: true,
        proprietaire: true,
        proprietaireFirstName: true,
        commune: true,
        lieuDit: true,
        section: true,
        parcel: true,
        createdAt: true,
      },
    });

    await tx.qualiteOnChantier.createMany({
      data: input.qualiteIds.map((qualiteId) => ({
        qualiteId,
        chantierId: chantier.id,
      })),
      skipDuplicates: true,
    });

    // Retour détaillé
    const full = await tx.chantier.findUniqueOrThrow({
      where: { id: chantier.id },
      select: {
        id: true,
        referenceLot: true,
        convention: true,
        proprietaire: true,
        proprietaireFirstName: true,
        commune: true,
        lieuDit: true,
        section: true,
        parcel: true,
        createdAt: true,
        essences: { select: { essence: { select: { id: true, name: true } } } },
        qualites: {
          select: {
            qualite: {
              select: {
                id: true,
                name: true,
                pourcentageEcorce: true,
                essence: { select: { id: true, name: true } },
              },
            },
          },
        },
        assignments: {
          select: {
            user: {
              select: { id: true, firstName: true, lastName: true, role: true },
            },
          },
        },
      },
    });

    return {
      id: full.id,
      referenceLot: full.referenceLot,
      convention: full.convention,
      proprietaire: full.proprietaire,
      proprietaireFirstName: full.proprietaireFirstName,
      commune: full.commune,
      lieuDit: full.lieuDit,
      section: full.section,
      parcel: full.parcel,
      createdAt: full.createdAt,
      essences: full.essences.map((e) => e.essence),
      qualites: full.qualites.map((q) => q.qualite),
      bucherons: full.assignments
        .map((a) => a.user)
        .filter((u) => u.role === "BUCHERON"),
    };
  });
}

export async function updateChantierService(
  user: { userId: string; role: "BUCHERON" | "SUPERVISEUR" },
  id: string,
  input: {
    referenceLot: string;
    convention: string;
    proprietaire: string;
    proprietaireFirstName: string;
    commune: string;
    lieuDit: string;
    section: string;
    parcel: string;
    qualiteIds: string[];
    bucheronIds: string[];
  },
) {
  if (user.role !== "SUPERVISEUR") throw new Error("Accès refusé");

  // vérifie que le chantier existe
  const exists = await prisma.chantier.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!exists) throw new Error("Chantier introuvable");

  // vérifie bûcherons
  const buchs = await prisma.user.findMany({
    where: { id: { in: input.bucheronIds }, role: "BUCHERON" },
    select: { id: true },
  });
  if (buchs.length !== input.bucheronIds.length) {
    throw new Error("Un ou plusieurs utilisateurs ne sont pas des bûcherons");
  }

  // charge qualités et déduit essences
  const qualites = await prisma.qualite.findMany({
    where: { id: { in: input.qualiteIds } },
    select: { id: true, essenceId: true },
  });
  if (qualites.length !== input.qualiteIds.length) {
    throw new Error("Une ou plusieurs qualités sont introuvables");
  }
  const essenceIds = Array.from(new Set(qualites.map((q) => q.essenceId)));

  // récupère état actuel (pour diff)
  const current = await prisma.chantier.findUniqueOrThrow({
    where: { id },
    select: {
      qualites: { select: { qualiteId: true } },
      assignments: { select: { userId: true } },
      essences: { select: { essenceId: true } },
    },
  });

  const currentQualiteIds = current.qualites.map((x) => x.qualiteId);
  const currentUserIds = current.assignments.map((x) => x.userId);
  const currentEssenceIds = current.essences.map((x) => x.essenceId);

  const qualitesToAdd = input.qualiteIds.filter(
    (x) => !currentQualiteIds.includes(x),
  );
  const qualitesToRemove = currentQualiteIds.filter(
    (x) => !input.qualiteIds.includes(x),
  );

  const usersToAdd = input.bucheronIds.filter(
    (x) => !currentUserIds.includes(x),
  );
  const usersToRemove = currentUserIds.filter(
    (x) => !input.bucheronIds.includes(x),
  );

  const essencesToAdd = essenceIds.filter(
    (x) => !currentEssenceIds.includes(x),
  );
  const essencesToRemove = currentEssenceIds.filter(
    (x) => !essenceIds.includes(x),
  );

  await prisma.$transaction(async (tx) => {
    // 1) champs simples
    await tx.chantier.update({
      where: { id },
      data: {
        referenceLot: input.referenceLot,
        convention: input.convention,
        proprietaire: input.proprietaire,
        proprietaireFirstName: input.proprietaireFirstName,
        commune: input.commune,
        lieuDit: input.lieuDit,
        section: input.section.toUpperCase(),
        parcel: input.parcel,
      },
    });

    // 2) sync QualiteOnChantier
    if (qualitesToRemove.length) {
      await tx.qualiteOnChantier.deleteMany({
        where: { chantierId: id, qualiteId: { in: qualitesToRemove } },
      });
    }
    if (qualitesToAdd.length) {
      await tx.qualiteOnChantier.createMany({
        data: qualitesToAdd.map((qid) => ({ chantierId: id, qualiteId: qid })),
        skipDuplicates: true,
      });
    }

    // 3) sync Assignments
    if (usersToRemove.length) {
      await tx.assignment.deleteMany({
        where: { chantierId: id, userId: { in: usersToRemove } },
      });
    }
    if (usersToAdd.length) {
      await tx.assignment.createMany({
        data: usersToAdd.map((uid) => ({ chantierId: id, userId: uid })),
        skipDuplicates: true,
      });
    }

    // 4) sync EssenceOnChantier (dérivé des qualités)
    if (essencesToRemove.length) {
      await tx.essenceOnChantier.deleteMany({
        where: { chantierId: id, essenceId: { in: essencesToRemove } },
      });
    }
    if (essencesToAdd.length) {
      await tx.essenceOnChantier.createMany({
        data: essencesToAdd.map((eid) => ({ chantierId: id, essenceId: eid })),
        skipDuplicates: true,
      });
    }
  });

  // renvoie le détail à jour (même format que getChantierByIdService)
  return getChantierByIdService({ userId: user.userId, role: user.role }, id);
}

/**
 * Liste des chantiers (filtrée par date de création + rôle/assignment)
 */
export async function listChantiersService(user: {
  userId: string;
  role: "BUCHERON" | "SUPERVISEUR";
}) {
  const where =
    user.role === "SUPERVISEUR"
      ? {}
      : { assignments: { some: { userId: user.userId } } };

  const rows = await prisma.chantier.findMany({
    where,
    orderBy: [{ createdAt: "desc" }, { referenceLot: "asc" }],
    select: {
      id: true,
      referenceLot: true,
      convention: true,
      proprietaire: true,
      proprietaireFirstName: true,
      commune: true,
      lieuDit: true,
      section: true,
      parcel: true,
      createdAt: true,
      essences: { select: { essence: { select: { id: true, name: true } } } },
      qualites: {
        select: {
          qualite: {
            select: { id: true, name: true, essence: { select: { id: true } } },
          },
        },
      },
      assignments: {
        select: {
          user: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
        },
      },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    referenceLot: r.referenceLot,
    convention: r.convention,
    proprietaire: r.proprietaire,
    proprietaireFirstName: r.proprietaireFirstName,
    commune: r.commune,
    lieuDit: r.lieuDit,
    section: r.section,
    parcel: r.parcel,
    createdAt: r.createdAt,
    essences: r.essences.map((e) => e.essence),
    qualites: r.qualites.map((q) => q.qualite),
    bucherons: r.assignments
      .map((a) => a.user)
      .filter((u) => u.role === "BUCHERON")
      .map((u) => ({ id: u.id, firstName: u.firstName, lastName: u.lastName })),
  }));
}

/**
 * Détail d'un chantier (contrôle d'accès par rôle/assignment)
 */
export async function getChantierByIdService(
  user: { userId: string; role: "BUCHERON" | "SUPERVISEUR" },
  id: string,
) {
  const where =
    user.role === "SUPERVISEUR"
      ? { id }
      : { id, assignments: { some: { userId: user.userId } } };

  const r = await prisma.chantier.findFirst({
    where,
    select: {
      id: true,
      referenceLot: true,
      convention: true,
      proprietaire: true,
      proprietaireFirstName: true,
      commune: true,
      lieuDit: true,
      section: true,
      parcel: true,
      createdAt: true,
      essences: { select: { essence: { select: { id: true, name: true } } } },
      qualites: {
        select: {
          qualite: {
            select: {
              id: true,
              name: true,
              pourcentageEcorce: true,
              essence: { select: { id: true, name: true } },
            },
          },
        },
      },
      assignments: {
        select: {
          user: {
            select: { id: true, firstName: true, lastName: true, role: true },
          },
        },
      },
    },
  });

  if (!r) return null;

  return {
    id: r.id,
    referenceLot: r.referenceLot,
    convention: r.convention,
    proprietaire: r.proprietaire,
    proprietaireFirstName: r.proprietaireFirstName,
    commune: r.commune,
    lieuDit: r.lieuDit,
    section: r.section,
    parcel: r.parcel,
    createdAt: r.createdAt,  
    essences: r.essences.map((e) => e.essence),
    qualites: r.qualites.map((q) => q.qualite),
    bucherons: r.assignments
      .map((a) => a.user)
      .filter((u) => u.role === "BUCHERON"),
  };
}

export async function deleteChantierService(
  user: {
    userId: string;
    role: "BUCHERON" | "SUPERVISEUR";
  },
  chantierId: string,
) {
  if (user.role !== "SUPERVISEUR") {
    throw new Error("Accès refusé");
  }

  // Vérifier l'existence (on peut aussi ignorer et deleteMany, mais c'est plus clair)
  const exists = await prisma.chantier.findUnique({
    where: { id: chantierId },
    select: { id: true },
  });
  if (!exists) {
    throw new Error("Chantier introuvable");
  }

  // Supprimer proprement les dépendances (ordre important si pas de CASCADE en DB)
  await prisma.$transaction(async (tx) => {
    // 1) Lignes de saisie
    await tx.saisie.deleteMany({ where: { chantierId } });

    // 2) États de numérotation
    await tx.numberingState.deleteMany({ where: { chantierId } });

    // 3) Assignations bûcherons
    await tx.assignment.deleteMany({ where: { chantierId } });

    // 4) Jonctions Qualité↔Chantier
    await tx.qualiteOnChantier.deleteMany({ where: { chantierId } });

    // 5) Jonctions Essence↔Chantier
    await tx.essenceOnChantier.deleteMany({ where: { chantierId } });

    // 6) Le chantier lui-même
    await tx.chantier.delete({ where: { id: chantierId } });
  });

  return { ok: true };
}
