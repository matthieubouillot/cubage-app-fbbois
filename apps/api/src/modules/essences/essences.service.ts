import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface EssenceDTO {
  id: string;
  name: string;
}

export interface CreateEssenceDTO {
  name: string;
}

export interface UpdateEssenceDTO {
  name: string;
}

export class EssencesService {
  async findAll(): Promise<EssenceDTO[]> {
    const essences = await prisma.essence.findMany({
      orderBy: { name: 'asc' }
    });
    return essences;
  }

  async findById(id: string): Promise<EssenceDTO | null> {
    const essence = await prisma.essence.findUnique({
      where: { id }
    });
    return essence;
  }

  async create(data: CreateEssenceDTO): Promise<EssenceDTO> {
    const essence = await prisma.essence.create({
      data: {
        name: data.name
      }
    });
    return essence;
  }

  async update(id: string, data: UpdateEssenceDTO): Promise<EssenceDTO> {
    const essence = await prisma.essence.update({
      where: { id },
      data: {
        name: data.name
      }
    });
    return essence;
  }

  async delete(id: string): Promise<void> {
    await prisma.essence.delete({
      where: { id }
    });
  }
}