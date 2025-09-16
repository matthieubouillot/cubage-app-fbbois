import { prisma } from "../../prisma";

/**
 * Liste d'utilisateurs, optionnellement filtrée par rôle.
 * Ne renvoie que les champs utiles pour le front.
 */
export async function getUsersService(role?: "BUCHERON" | "SUPERVISEUR") {
  return prisma.user.findMany({
    where: role ? { role } : undefined,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}

/**
 * Liste des bûcherons uniquement (rôle = BUCHERON).
 */
export async function getBucheronsService() {
  return prisma.user.findMany({
    where: { role: "BUCHERON" },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}

/**
 * Récupération d’un utilisateur par id (sélective).
 */
export async function getUserByIdService(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      numStart: true,
      numEnd: true,
    },
  });
}