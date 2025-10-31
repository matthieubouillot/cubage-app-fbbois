import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface QualityGroupDTO {
  id: string;
  name: string;
  category: string;
  qualiteId: string;
  scieurId: string;
  pourcentageEcorce: number;
  createdAt: Date;
  qualite: {
    id: string;
    name: string;
  };
  scieur: {
    id: string;
    name: string;
  };
  essences: {
    id: string;
    name: string;
  }[];
  lotConventions: {
    id: string;
    lot: string;
    convention: string;
  }[];
}

export interface CreateQualityGroupDTO {
  name: string;
  qualiteId: string;
  scieurId: string;
  pourcentageEcorce: number;
  essenceIds: string[];
}

export interface UpdateQualityGroupDTO {
  name: string;
  qualiteId: string;
  scieurId: string;
  pourcentageEcorce: number;
  essenceIds: string[];
}

export class QualityGroupsService {
  async findAll(): Promise<QualityGroupDTO[]> {
    const qualityGroups = await prisma.qualityGroup.findMany({
      include: {
        qualite: true,
        scieur: true,
        essences: {
          include: {
            essence: true
          }
        },
        lotConventions: true
      },
      orderBy: { name: 'asc' }
    });

          return qualityGroups.map(group => ({
            id: group.id,
            name: group.name,
            category: group.category,
            qualiteId: group.qualiteId,
            scieurId: group.scieurId,
            pourcentageEcorce: group.pourcentageEcorce,
            createdAt: group.createdAt,
            qualite: {
              id: group.qualite.id,
              name: group.qualite.name
            },
            scieur: {
              id: group.scieur.id,
              name: group.scieur.name
            },
            essences: group.essences.map(e => ({
              id: e.essence.id,
              name: e.essence.name
            })),
            lotConventions: group.lotConventions ? {
              id: group.lotConventions.id,
              lot: group.lotConventions.lot,
              convention: group.lotConventions.convention
            } : null
          }));
  }

  async findById(id: string): Promise<QualityGroupDTO | null> {
    const qualityGroup = await prisma.qualityGroup.findUnique({
      where: { id },
      include: {
        qualite: true,
        scieur: true,
        essences: {
          include: {
            essence: true
          }
        },
        lotConventions: true
      }
    });

    if (!qualityGroup) return null;

    return {
      id: qualityGroup.id,
      name: qualityGroup.name,
      category: qualityGroup.category,
      qualiteId: qualityGroup.qualiteId,
      scieurId: qualityGroup.scieurId,
      pourcentageEcorce: qualityGroup.pourcentageEcorce,
      createdAt: qualityGroup.createdAt,
      qualite: {
        id: qualityGroup.qualite.id,
        name: qualityGroup.qualite.name
      },
      scieur: {
        id: qualityGroup.scieur.id,
        name: qualityGroup.scieur.name
      },
      essences: qualityGroup.essences.map(e => ({
        id: e.essence.id,
        name: e.essence.name
      })),
      lotConventions: qualityGroup.lotConventions ? {
        id: qualityGroup.lotConventions.id,
        lot: qualityGroup.lotConventions.lot,
        convention: qualityGroup.lotConventions.convention
      } : null
    };
  }

  async create(data: CreateQualityGroupDTO): Promise<QualityGroupDTO> {
    const qualityGroup = await prisma.qualityGroup.create({
      data: {
        name: data.name,
        qualiteId: data.qualiteId,
        scieurId: data.scieurId,
        pourcentageEcorce: data.pourcentageEcorce,
        essences: {
          create: data.essenceIds.map(essenceId => ({
            essenceId
          }))
        }
      },
      include: {
        qualite: true,
        scieur: true,
        essences: {
          include: {
            essence: true
          }
        },
        lotConventions: true
      }
    });

    return {
      id: qualityGroup.id,
      name: qualityGroup.name,
      qualiteId: qualityGroup.qualiteId,
      scieurId: qualityGroup.scieurId,
      pourcentageEcorce: qualityGroup.pourcentageEcorce,
      createdAt: qualityGroup.createdAt,
      qualite: {
        id: qualityGroup.qualite.id,
        name: qualityGroup.qualite.name
      },
      scieur: {
        id: qualityGroup.scieur.id,
        name: qualityGroup.scieur.name
      },
      essences: qualityGroup.essences.map(e => ({
        id: e.essence.id,
        name: e.essence.name
      })),
      lotConventions: qualityGroup.lotConventions ? {
        id: qualityGroup.lotConventions.id,
        lot: qualityGroup.lotConventions.lot,
        convention: qualityGroup.lotConventions.convention
      } : null
    };
  }

  async update(id: string, data: UpdateQualityGroupDTO): Promise<QualityGroupDTO> {
    // Supprimer les anciennes relations essences
    await prisma.essenceOnQualityGroup.deleteMany({
      where: { qualityGroupId: id }
    });

    const qualityGroup = await prisma.qualityGroup.update({
      where: { id },
      data: {
        name: data.name,
        qualiteId: data.qualiteId,
        scieurId: data.scieurId,
        pourcentageEcorce: data.pourcentageEcorce,
        essences: {
          create: data.essenceIds.map(essenceId => ({
            essenceId
          }))
        }
      },
      include: {
        qualite: true,
        scieur: true,
        essences: {
          include: {
            essence: true
          }
        },
        lotConventions: true
      }
    });

    return {
      id: qualityGroup.id,
      name: qualityGroup.name,
      qualiteId: qualityGroup.qualiteId,
      scieurId: qualityGroup.scieurId,
      pourcentageEcorce: qualityGroup.pourcentageEcorce,
      createdAt: qualityGroup.createdAt,
      qualite: {
        id: qualityGroup.qualite.id,
        name: qualityGroup.qualite.name
      },
      scieur: {
        id: qualityGroup.scieur.id,
        name: qualityGroup.scieur.name
      },
      essences: qualityGroup.essences.map(e => ({
        id: e.essence.id,
        name: e.essence.name
      })),
      lotConventions: qualityGroup.lotConventions ? {
        id: qualityGroup.lotConventions.id,
        lot: qualityGroup.lotConventions.lot,
        convention: qualityGroup.lotConventions.convention
      } : null
    };
  }

  async delete(id: string): Promise<void> {
    await prisma.qualityGroup.delete({
      where: { id }
    });
  }
}
