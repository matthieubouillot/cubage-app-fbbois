import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ScieurDTO {
  id: string;
  name: string;
}

export interface CreateScieurDTO {
  name: string;
}

export interface UpdateScieurDTO {
  name: string;
}

export class ScieursService {
  async findAll(): Promise<ScieurDTO[]> {
    const scieurs = await prisma.scieur.findMany({
      orderBy: { name: 'asc' }
    });
    return scieurs;
  }

  async findById(id: string): Promise<ScieurDTO | null> {
    const scieur = await prisma.scieur.findUnique({
      where: { id }
    });
    return scieur;
  }

  async create(data: CreateScieurDTO): Promise<ScieurDTO> {
    const scieur = await prisma.scieur.create({
      data: {
        name: data.name
      }
    });
    return scieur;
  }

  async update(id: string, data: UpdateScieurDTO): Promise<ScieurDTO> {
    const scieur = await prisma.scieur.update({
      where: { id },
      data: {
        name: data.name
      }
    });
    return scieur;
  }

  async delete(id: string): Promise<void> {
    await prisma.scieur.delete({
      where: { id }
    });
  }
}
