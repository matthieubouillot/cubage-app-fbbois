import { prisma } from "../../prisma";

export async function getEntreprisesService() {
  return prisma.entreprise.findMany({
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function getEntrepriseByIdService(id: string) {
  return prisma.entreprise.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function createEntrepriseService(name: string) {
  if (!name || !name.trim()) {
    throw new Error("Le nom de l'entreprise est requis");
  }

  const trimmedName = name.trim();

  const existing = await prisma.entreprise.findUnique({
    where: { name: trimmedName },
  });

  if (existing) {
    throw new Error("Une entreprise avec ce nom existe déjà");
  }

  return prisma.entreprise.create({
    data: {
      name: trimmedName,
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function updateEntrepriseService(id: string, name: string) {
  if (!name || !name.trim()) {
    throw new Error("Le nom de l'entreprise est requis");
  }

  const trimmedName = name.trim();

  // Vérifier si une autre entreprise avec ce nom existe
  const existing = await prisma.entreprise.findFirst({
    where: {
      name: trimmedName,
      NOT: { id },
    },
  });

  if (existing) {
    throw new Error("Une entreprise avec ce nom existe déjà");
  }

  return prisma.entreprise.update({
    where: { id },
    data: {
      name: trimmedName,
    },
    select: {
      id: true,
      name: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function deleteEntrepriseService(id: string) {
  // Vérifier que l'entreprise existe
  const entreprise = await prisma.entreprise.findUnique({
    where: { id },
    include: {
      users: {
        select: { id: true },
      },
    },
  });

  if (!entreprise) {
    throw new Error("Entreprise introuvable");
  }

  // Si l'entreprise a des utilisateurs, on ne peut pas la supprimer
  if (entreprise.users.length > 0) {
    throw new Error("Impossible de supprimer une entreprise ayant des utilisateurs");
  }

  await prisma.entreprise.delete({
    where: { id },
  });

  return { ok: true };
}

