import { prisma } from "../../prisma";

const NAME_RE = /^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,}$/;
const PHONE_RE = /^[0-9+().\s-]{6,20}$/;

export type PropertyDTO = {
  id: string;
  commune: string | null;
  lieuDit: string | null;
  section: string | null;
  parcelle: string | null;
  surfaceCadastrale: number | null;
};

export type CreatePropertyPayload = {
  commune?: string;
  lieuDit?: string;
  section?: string;
  parcelle?: string;
  surfaceCadastrale?: number;
};

export type ClientDTO = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  postalCode: string;
  city: string;
  properties: PropertyDTO[];
  createdAt: string;
};

export type CreateClientPayload = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  street?: string;
  postalCode?: string;
  city?: string;
  properties?: CreatePropertyPayload[];
};

export type UpdateClientPayload = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  street?: string;
  postalCode?: string;
  city?: string;
  properties?: CreatePropertyPayload[];
};

/** Liste tous les clients triés par nom. */
export async function getClientsService() {
  return prisma.client.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      street: true,
      postalCode: true,
      city: true,
      properties: {
        select: {
          id: true,
          commune: true,
          lieuDit: true,
          section: true,
          parcelle: true,
          surfaceCadastrale: true,
        },
      },
      createdAt: true,
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
}

export async function getClientByIdService(id: string) {
  return prisma.client.findUnique({
    where: { id },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      street: true,
      postalCode: true,
      city: true,
      properties: {
        select: {
          id: true,
          commune: true,
          lieuDit: true,
          section: true,
          parcelle: true,
          surfaceCadastrale: true,
        },
      },
      createdAt: true,
    },
  });
}

/** Création d'un client. */
export async function createClientService(input: CreateClientPayload) {
  if (!NAME_RE.test(input.firstName)) throw new Error("Prénom invalide");
  if (!NAME_RE.test(input.lastName)) throw new Error("Nom invalide");
  
  // Validation optionnelle : si email est rempli, il doit être valide
  let finalEmail: string;
  if (input.email?.trim()) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(input.email.trim())) {
      throw new Error("Email invalide");
    }
    finalEmail = input.email.toLowerCase().trim();
  } else {
    // Pas d'email fourni : mettre une chaîne vide
    finalEmail = "";
  }
  
  // Validation optionnelle : si téléphone est rempli, il doit être valide
  if (input.phone?.trim() && !PHONE_RE.test(input.phone)) {
    throw new Error("Téléphone invalide");
  }

  const client = await prisma.client.create({
    data: {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: finalEmail,
      phone: input.phone?.trim() || "",
      street: input.street?.trim() || "",
      postalCode: input.postalCode?.trim() || "",
      city: input.city?.trim() || "",
      properties: {
        create: input.properties?.map(p => ({
          commune: p.commune?.trim() || null,
          lieuDit: p.lieuDit?.trim() || null,
          section: p.section?.toUpperCase().trim().slice(0, 2) || null,
          parcelle: p.parcelle?.trim() || null,
          surfaceCadastrale: p.surfaceCadastrale || null,
        })) || [],
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      street: true,
      postalCode: true,
      city: true,
      properties: {
        select: {
          id: true,
          commune: true,
          lieuDit: true,
          section: true,
          parcelle: true,
          surfaceCadastrale: true,
        },
      },
      createdAt: true,
    },
  });

  return client;
}

/** Mise à jour d'un client. */
export async function updateClientService(id: string, input: UpdateClientPayload) {
  if (!NAME_RE.test(input.firstName)) throw new Error("Prénom invalide");
  if (!NAME_RE.test(input.lastName)) throw new Error("Nom invalide");
  
  // Validation optionnelle : si email est rempli, il doit être valide
  if (input.email?.trim()) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(input.email.trim())) {
      throw new Error("Email invalide");
    }
  }
  
  // Validation optionnelle : si téléphone est rempli, il doit être valide
  if (input.phone?.trim() && !PHONE_RE.test(input.phone)) {
    throw new Error("Téléphone invalide");
  }

  // Récupérer le client existant pour préserver les valeurs non fournies
  const existingClient = await prisma.client.findUnique({
    where: { id },
    select: { email: true, phone: true, street: true, postalCode: true, city: true },
  });
  
  if (!existingClient) {
    throw new Error("Client introuvable");
  }

  // Utiliser les valeurs fournies ou conserver les existantes
  // Si email est fourni (même vide), l'utiliser, sinon conserver l'existant
  const finalEmail = input.email !== undefined
    ? (input.email.trim() ? input.email.toLowerCase().trim() : "")
    : existingClient.email;
  const finalPhone = input.phone?.trim() || existingClient.phone;
  const finalStreet = input.street?.trim() || existingClient.street;
  const finalPostalCode = input.postalCode?.trim() || existingClient.postalCode;
  const finalCity = input.city?.trim() || existingClient.city;

  // Récupérer les propriétés existantes
  const existingProperties = await prisma.property.findMany({
    where: { clientId: id },
  });

  // Si des propriétés sont fournies, remplacer les anciennes par les nouvelles
  // Sinon, conserver les propriétés existantes
  const propertiesToCreate = input.properties?.map(p => ({
    commune: p.commune?.trim() || null,
    lieuDit: p.lieuDit?.trim() || null,
    section: p.section?.toUpperCase().trim().slice(0, 2) || null,
    parcelle: p.parcelle?.trim() || null,
    surfaceCadastrale: p.surfaceCadastrale || null,
  })) || [];

  // Supprimer les anciennes propriétés seulement si de nouvelles sont fournies
  if (input.properties !== undefined) {
    await prisma.property.deleteMany({ where: { clientId: id } });
  }

  const client = await prisma.client.update({
    where: { id },
    data: {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: finalEmail,
      phone: finalPhone,
      street: finalStreet,
      postalCode: finalPostalCode,
      city: finalCity,
      ...(input.properties !== undefined && {
        properties: {
          create: propertiesToCreate,
        },
      }),
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      street: true,
      postalCode: true,
      city: true,
      properties: {
        select: {
          id: true,
          commune: true,
          lieuDit: true,
          section: true,
          parcelle: true,
          surfaceCadastrale: true,
        },
      },
      createdAt: true,
    },
  });

  return client;
}

export async function deleteClientService(id: string) {
  // Vérifier si le client a des chantiers associés
  const chantiersCount = await prisma.chantier.count({
    where: { clientId: id },
  });
  
  if (chantiersCount > 0) {
    throw new Error("Impossible de supprimer ce client car il a des chantiers associés");
  }

  await prisma.client.delete({ where: { id } });
  return { ok: true };
}
