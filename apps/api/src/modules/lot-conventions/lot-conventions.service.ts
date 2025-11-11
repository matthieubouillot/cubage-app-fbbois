import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface LotConventionDTO {
  id: string;
  lot: string;
  convention: string;
  qualityGroupId: string;
  qualityGroup: {
    id: string;
    name: string;
  };
}

export interface CreateLotConventionDTO {
  lot: string;
  convention: string;
  qualityGroupId: string;
}

export interface UpdateLotConventionDTO {
  lot: string;
  convention: string;
}

export class LotConventionsService {
  async findAll(): Promise<LotConventionDTO[]> {
    const lotConventions = await prisma.lotConvention.findMany({
      include: {
        qualityGroup: true
      },
      orderBy: [
        { qualityGroup: { name: 'asc' } },
        { lot: 'asc' },
        { convention: 'asc' }
      ]
    });

    return lotConventions.map(lc => ({
      id: lc.id,
      lot: lc.lot,
      convention: lc.convention,
      qualityGroupId: lc.qualityGroupId,
      qualityGroup: {
        id: lc.qualityGroup.id,
        name: lc.qualityGroup.name
      }
    }));
  }

  async findByQualityGroupId(qualityGroupId: string): Promise<LotConventionDTO[]> {
    const lotConventions = await prisma.lotConvention.findMany({
      where: { qualityGroupId },
      include: {
        qualityGroup: true
      },
      orderBy: [
        { lot: 'asc' },
        { convention: 'asc' }
      ]
    });

    return lotConventions.map(lc => ({
      id: lc.id,
      lot: lc.lot,
      convention: lc.convention,
      qualityGroupId: lc.qualityGroupId,
      qualityGroup: {
        id: lc.qualityGroup.id,
        name: lc.qualityGroup.name
      }
    }));
  }

  async findById(id: string): Promise<LotConventionDTO | null> {
    const lotConvention = await prisma.lotConvention.findUnique({
      where: { id },
      include: {
        qualityGroup: true
      }
    });

    if (!lotConvention) return null;

    return {
      id: lotConvention.id,
      lot: lotConvention.lot,
      convention: lotConvention.convention,
      qualityGroupId: lotConvention.qualityGroupId,
      qualityGroup: {
        id: lotConvention.qualityGroup.id,
        name: lotConvention.qualityGroup.name
      }
    };
  }

  async create(data: CreateLotConventionDTO): Promise<LotConventionDTO> {
    const lotConvention = await prisma.lotConvention.create({
      data: {
        lot: data.lot,
        convention: data.convention,
        qualityGroupId: data.qualityGroupId
      },
      include: {
        qualityGroup: true
      }
    });

    return {
      id: lotConvention.id,
      lot: lotConvention.lot,
      convention: lotConvention.convention,
      qualityGroupId: lotConvention.qualityGroupId,
      qualityGroup: {
        id: lotConvention.qualityGroup.id,
        name: lotConvention.qualityGroup.name
      }
    };
  }

  async update(id: string, data: UpdateLotConventionDTO): Promise<LotConventionDTO> {
    const lotConvention = await prisma.lotConvention.update({
      where: { id },
      data: {
        lot: data.lot,
        convention: data.convention
      },
      include: {
        qualityGroup: true
      }
    });

    return {
      id: lotConvention.id,
      lot: lotConvention.lot,
      convention: lotConvention.convention,
      qualityGroupId: lotConvention.qualityGroupId,
      qualityGroup: {
        id: lotConvention.qualityGroup.id,
        name: lotConvention.qualityGroup.name
      }
    };
  }

  async delete(id: string): Promise<void> {
    await prisma.lotConvention.delete({
      where: { id }
    });
  }
}
