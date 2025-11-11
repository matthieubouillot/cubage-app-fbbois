import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface QualiteDTO {
  id: string;
  name: string;
}

export interface CreateQualiteDTO {
  name: string;
}

export interface UpdateQualiteDTO {
  name: string;
}

export class QualitesService {
  async findAll(): Promise<QualiteDTO[]> {
    const qualites = await prisma.qualite.findMany({
      orderBy: { name: 'asc' }
    });
    return qualites;
  }

  async findById(id: string): Promise<QualiteDTO | null> {
    const qualite = await prisma.qualite.findUnique({
      where: { id }
    });
    return qualite;
  }

  async create(data: CreateQualiteDTO): Promise<QualiteDTO> {
    const qualite = await prisma.qualite.create({
      data: {
        name: data.name
      }
    });
    return qualite;
  }

  async update(id: string, data: UpdateQualiteDTO): Promise<QualiteDTO> {
    const qualite = await prisma.qualite.update({
      where: { id },
      data: {
        name: data.name
      }
    });
    return qualite;
  }

  async delete(id: string): Promise<void> {
    await prisma.qualite.delete({
      where: { id }
    });
  }
}
