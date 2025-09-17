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
  section?: string | null;
  parcel?: string | null;
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
        section: input.section?.toUpperCase() ?? null,
        parcel: input.parcel ?? null,
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
      essences: full.essences.map((e) => e.essence),
      qualites: full.qualites.map((q) => q.qualite),
      bucherons: full.assignments
        .map((a) => a.user)
        .filter((u) => u.role === "BUCHERON"),
    };
  });
}

/**
 * Liste des chantiers (filtrée par rôle)
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
    orderBy: { referenceLot: "asc" },
    select: {
      id: true,
      referenceLot: true,
      proprietaire: true,
      proprietaireFirstName: true,
      commune: true,
      lieuDit: true,
      section: true,
      parcel: true,
      essences: { select: { essence: { select: { id: true, name: true } } } },
      qualites: {
        select: {
          qualite: {
            select: { id: true, name: true, essence: { select: { id: true } } },
          },
        },
      },
    },
  });

  return rows.map((r) => ({
    id: r.id,
    referenceLot: r.referenceLot,
    proprietaire: r.proprietaire,
    proprietaireFirstName: r.proprietaireFirstName,
    commune: r.commune,
    lieuDit: r.lieuDit,
    section: r.section,
    parcel: r.parcel,
    essences: r.essences.map((e) => e.essence),
    qualites: r.qualites.map((q) => q.qualite),
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
    essences: r.essences.map((e) => e.essence),
    qualites: r.qualites.map((q) => q.qualite),
    bucherons: r.assignments
      .map((a) => a.user)
      .filter((u) => u.role === "BUCHERON"),
  };
}
