// Types pour les nouvelles entités
export interface Essence {
  id: string;
  name: string;
}

export interface Qualite {
  id: string;
  name: string;
}

export interface Scieur {
  id: string;
  name: string;
}

export interface QualityGroup {
  id: string;
  name: string;
  category: string;
  qualiteId: string;
  scieurId: string;
  pourcentageEcorce: number;
  createdAt: string;
  qualite: Qualite;
  scieur: Scieur;
  essences: Essence[];
  lot?: string | null;
  convention?: string | null;
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  postalCode: string;
  city: string;
  properties: string;
  createdAt: string;
}

export interface Chantier {
  id: string;
  numeroCoupe: string;
  clientId: string;
  section: string;
  parcel: string;
  createdAt: string;
  client: Client;
  qualityGroups: {
    id: string;
    name: string;
    category: string;
    pourcentageEcorce: number;
    qualite: Qualite;
    scieur: Scieur;
    essences: Essence[];
    lot?: string | null;
    convention?: string | null;
  }[];
  bucherons: {
    id: string;
    firstName: string;
    lastName: string;
  }[];
  debardeurs?: {
    id: string;
    firstName: string;
    lastName: string;
  }[];
}

export interface CreateChantierDTO {
  numeroCoupe: string;
  clientId: string;
  section: string;
  parcel: string;
  qualityGroupIds: string[];
  bucheronIds: string[];
  lotConventions: {
    qualityGroupId: string;
    lot: string;
    convention: string;
  }[];
}

export interface UpdateChantierDTO {
  numeroCoupe: string;
  clientId: string;
  section: string;
  parcel: string;
  qualityGroupIds: string[];
  bucheronIds: string[];
  lotConventions: {
    qualityGroupId: string;
    lot: string;
    convention: string;
  }[];
}
