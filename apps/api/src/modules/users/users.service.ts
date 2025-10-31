import { prisma } from "../../prisma";
import * as bcrypt from "bcryptjs";

export type Role = "BUCHERON" | "SUPERVISEUR" | "DEBARDEUR";

const NAME_RE = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,}$/;
const PHONE_RE = /^[0-9+().\s-]{6,20}$/;

// ——— helper de détection de chevauchement de plage ———
// Un recouvrement existe si: existing.numStart <= newEnd ET existing.numEnd >= newStart
async function hasOverlappingRange(
  start: number,
  end: number,
  excludeUserId?: string,
) {
  const overlap = await prisma.user.findFirst({
    where: {
      ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}),
      AND: [{ numStart: { lte: end } }, { numEnd: { gte: start } }],
    },
    select: { id: true },
  });
  return !!overlap;
}

/** Liste triée par plage num (numStart puis numEnd). */
export async function getUsersService(role?: Role) {
  return prisma.user.findMany({
    where: role ? { 
      roles: {
        has: role
      }
    } : undefined,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      roles: true,
      numStart: true,
      numEnd: true,
      createdAt: true,
    },
    orderBy: [{ numStart: "asc" }, { numEnd: "asc" }],
  });
}

export async function getUserByIdService(id: string) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      roles: true,
      numStart: true,
      numEnd: true,
      createdAt: true,
    },
  });
}

/** Création (tous champs obligatoires + mot de passe temporaire obligatoire). */
export async function createUserService(input: {
  firstName: string;
  lastName: string;
  roles: Role[];
  email: string;
  phone: string;
  numStart: number;
  numEnd: number;
  password: string; // OBLIGATOIRE
}) {
  if (!NAME_RE.test(input.firstName)) throw new Error("Prénom invalide");
  if (!NAME_RE.test(input.lastName)) throw new Error("Nom invalide");
  if (!PHONE_RE.test(input.phone)) throw new Error("Téléphone invalide");
  if (!input.email?.trim()) throw new Error("Email requis");
  if (!input.password || input.password.length < 6)
    throw new Error("Mot de passe temporaire invalide (≥ 6 caractères)");
  if (
    !Number.isFinite(input.numStart) ||
    !Number.isFinite(input.numEnd) ||
    input.numStart > input.numEnd
  ) {
    throw new Error("Plage de numérotation invalide");
  }
  if (await hasOverlappingRange(input.numStart, input.numEnd)) {
    throw new Error("Cette plage num. chevauche déjà un autre utilisateur");
  }

  const hash = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      roles: input.roles,
      email: input.email.toLowerCase().trim(),
      phone: input.phone.trim(),
      password: hash,
      numStart: input.numStart,
      numEnd: input.numEnd,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      roles: true,
      email: true,
      phone: true,
      numStart: true,
      numEnd: true,
      createdAt: true,
    },
  });

  return user;
}

/** Mise à jour (tous champs requis côté contrôleur). */
export async function updateUserService(
  id: string,
  input: {
    firstName: string;
    lastName: string;
    roles: Role[];
    phone: string;
    numStart: number;
    numEnd: number;
  },
) {
  if (!NAME_RE.test(input.firstName)) throw new Error("Prénom invalide");
  if (!NAME_RE.test(input.lastName)) throw new Error("Nom invalide");
  if (!PHONE_RE.test(input.phone)) throw new Error("Téléphone invalide");
  if (
    !Number.isFinite(input.numStart) ||
    !Number.isFinite(input.numEnd) ||
    input.numStart > input.numEnd
  ) {
    throw new Error("Plage de numérotation invalide");
  }
  if (await hasOverlappingRange(input.numStart, input.numEnd, id)) {
    throw new Error("Cette plage num. chevauche déjà un autre utilisateur");
  }

  const user = await prisma.user.update({
    where: { id },
    data: {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      roles: input.roles,
      phone: input.phone.trim(),
      numStart: input.numStart,
      numEnd: input.numEnd,
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      roles: true,
      email: true,
      phone: true,
      numStart: true,
      numEnd: true,
      createdAt: true,
    },
  });

  return user;
}

export async function deleteUserService(id: string) {
  // Vérifier que l'utilisateur existe
  const user = await prisma.user.findUnique({
    where: { id }
  });

  if (!user) {
    throw new Error("Utilisateur introuvable");
  }

  // Supprimer toutes les données liées à l'utilisateur dans l'ordre correct
  // 1. Supprimer les saisies
  await prisma.saisie.deleteMany({
    where: { userId: id }
  });

  // 2. Supprimer les assignations (bûcherons)
  await prisma.assignment.deleteMany({
    where: { userId: id }
  });

  // 3. Supprimer les tokens de réinitialisation de mot de passe
  await prisma.passwordResetToken.deleteMany({
    where: { userId: id }
  });

  // 4. Enfin, supprimer l'utilisateur lui-même
  await prisma.user.delete({ where: { id } });
  
  return { ok: true };
}
