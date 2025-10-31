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
  email: string;
  phone: string;
  street: string;
  postalCode: string;
  city: string;
  properties?: CreatePropertyPayload[];
};

export type UpdateClientPayload = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  postalCode: string;
  city: string;
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
  if (!PHONE_RE.test(input.phone)) throw new Error("Téléphone invalide");
  if (!input.email?.trim()) throw new Error("Email requis");
  if (!input.street?.trim()) throw new Error("Rue requise");
  if (!input.postalCode?.trim()) throw new Error("Code postal requis");
  if (!input.city?.trim()) throw new Error("Commune requise");

  // Vérifier si l'email existe déjà
  const existingClient = await prisma.client.findUnique({
    where: { email: input.email.toLowerCase().trim() },
  });
  if (existingClient) {
    throw new Error("Un client avec cet email existe déjà");
  }

  const client = await prisma.client.create({
    data: {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: input.email.toLowerCase().trim(),
      phone: input.phone.trim(),
      street: input.street.trim(),
      postalCode: input.postalCode.trim(),
      city: input.city.trim(),
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
  if (!PHONE_RE.test(input.phone)) throw new Error("Téléphone invalide");
  if (!input.email?.trim()) throw new Error("Email requis");
  if (!input.street?.trim()) throw new Error("Rue requise");
  if (!input.postalCode?.trim()) throw new Error("Code postal requis");
  if (!input.city?.trim()) throw new Error("Commune requise");

  // Vérifier si l'email existe déjà pour un autre client
  const existingClient = await prisma.client.findFirst({
    where: {
      email: input.email.toLowerCase().trim(),
      NOT: { id },
    },
  });
  if (existingClient) {
    throw new Error("Un client avec cet email existe déjà");
  }

  // Supprimer les anciennes propriétés et créer les nouvelles
  await prisma.property.deleteMany({ where: { clientId: id } });

  const client = await prisma.client.update({
    where: { id },
    data: {
      firstName: input.firstName.trim(),
      lastName: input.lastName.trim(),
      email: input.email.toLowerCase().trim(),
      phone: input.phone.trim(),
      street: input.street.trim(),
      postalCode: input.postalCode.trim(),
      city: input.city.trim(),
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
