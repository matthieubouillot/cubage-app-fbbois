import { prisma } from "../../prisma";

// Input reçu depuis le controller (zod)
type CreateInput = {
  referenceLot: string;
  convention: string;
  proprietaire: string;
  commune: string;
  lieuDit: string;
  qualiteIds: string[];
  bucheronIds: string[];
};

/**
 * Création d'un chantier à partir de qualités + bûcherons
 * - Vérifie que tous les bûcherons ont le rôle BUCHERON
 * - Charge les qualités, déduit les essences uniques
 * - Crée Chantier + EssenceOnChantier + Assignment + QualiteOnChantier
 * - Retourne un résumé du chantier
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

  // 2) Charger qualités + vérifier existence
  const qualites = await prisma.qualite.findMany({
    where: { id: { in: input.qualiteIds } },
    select: { id: true, essenceId: true },
  });
  if (qualites.length !== input.qualiteIds.length) {
    throw new Error("Une ou plusieurs qualités sont introuvables");
  }

  // 3) Déduire les essences uniques à partir des qualités
  const essenceIds = Array.from(new Set(qualites.map(q => q.essenceId)));

  // 4) Transaction : créer chantier + liaisons
  return prisma.$transaction(async (tx) => {
    const chantier = await tx.chantier.create({
      data: {
        referenceLot: input.referenceLot,
        convention: input.convention,
        proprietaire: input.proprietaire,
        commune: input.commune,
        lieuDit: input.lieuDit,
        // essences activées (dérivées des qualités)
        essences: { create: essenceIds.map(essenceId => ({ essenceId })) },
        // affectations bûcherons
        assignments: { create: input.bucheronIds.map(userId => ({ userId })) },
      },
      select: {
        id: true, referenceLot: true, convention: true, proprietaire: true, commune: true, lieuDit: true,
      },
    });

    // qualités activées (jonction)
    await tx.qualiteOnChantier.createMany({
      data: input.qualiteIds.map(qualiteId => ({ qualiteId, chantierId: chantier.id })),
      skipDuplicates: true,
    });

    // retour détaillé (avec essences & qualités activées)
    const full = await tx.chantier.findUniqueOrThrow({
      where: { id: chantier.id },
      select: {
        id: true, referenceLot: true, convention: true, proprietaire: true, commune: true, lieuDit: true,
        essences: { select: { essence: { select: { id: true, name: true } } } },
        qualites: {
          select: {
            qualite: {
              select: { id: true, name: true, pourcentageEcorce: true, essence: { select: { id: true, name: true } } },
            },
          },
        },
        assignments: { select: { user: { select: { id: true, firstName: true, lastName: true } } } },
      },
    });

    return {
      ...full,
      essences: full.essences.map(e => e.essence),
      qualites: full.qualites.map(q => ({ ...q.qualite })),
      bucherons: full.assignments.map(a => a.user),
    };
  });
}

/**
 * Liste les chantiers :
 * - SUPERVISEUR : tous
 * - BUCHERON    : seulement ceux auxquels il est assigné
 */
export async function listChantiersService(user: { userId: string; role: "BUCHERON" | "SUPERVISEUR" }) {
  const where =
    user.role === "SUPERVISEUR"
      ? {}
      : { assignments: { some: { userId: user.userId } } };

  const rows = await prisma.chantier.findMany({
    where,
    orderBy: { referenceLot: "asc" },
    select: {
      id: true, referenceLot: true, proprietaire: true, commune: true, lieuDit: true,
      essences: { select: { essence: { select: { id: true, name: true } } } },
      qualites: { select: { qualite: { select: { id: true, name: true, essence: { select: { id: true } } } } } },
    },
  });

  return rows.map(r => ({
    id: r.id,
    referenceLot: r.referenceLot,
    proprietaire: r.proprietaire,
    commune: r.commune,
    lieuDit: r.lieuDit,
    essences: r.essences.map(e => e.essence),
    qualites: r.qualites.map(q => q.qualite),
  }));
}