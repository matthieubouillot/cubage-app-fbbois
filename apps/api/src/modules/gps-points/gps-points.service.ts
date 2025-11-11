import { prisma } from "../../prisma";
import { z } from "zod";

const CreateGPSPointSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  name: z.string().optional(),
  notes: z.string().optional(),
  order: z.number().int().min(0),
});

const UpdateGPSPointSchema = CreateGPSPointSchema.partial();

export type CreateGPSPointInput = z.infer<typeof CreateGPSPointSchema>;
export type UpdateGPSPointInput = z.infer<typeof UpdateGPSPointSchema>;

export async function getGPSPointsByChantier(chantierId: string) {
  return await prisma.gPSPoint.findMany({
    where: { chantierId },
    orderBy: { order: 'asc' },
    include: {
      qualityGroup: true
    }
  });
}

export async function getGPSPointsByQualityGroup(qualityGroupId: string) {
  return await prisma.gPSPoint.findMany({
    where: { qualityGroupId },
    orderBy: { order: 'asc' },
    include: {
      qualityGroup: true
    }
  });
}

export async function createGPSPoint(chantierId: string, qualityGroupId: string, input: CreateGPSPointInput) {
  const validatedInput = CreateGPSPointSchema.parse(input);
  
  return await prisma.gPSPoint.create({
    data: {
      ...validatedInput,
      chantierId,
      qualityGroupId,
    },
    include: {
      qualityGroup: true
    }
  });
}

export async function updateGPSPoint(id: string, input: UpdateGPSPointInput) {
  const validatedInput = UpdateGPSPointSchema.parse(input);
  
  // Vérifier que le point existe
  const existingPoint = await prisma.gPSPoint.findUnique({
    where: { id },
  });
  
  if (!existingPoint) {
    throw new Error("Point GPS non trouvé");
  }
  
  return await prisma.gPSPoint.update({
    where: { id },
    data: validatedInput,
  });
}

export async function deleteGPSPoint(id: string) {
  // Vérifier que le point existe
  const existingPoint = await prisma.gPSPoint.findUnique({
    where: { id },
  });
  
  if (!existingPoint) {
    throw new Error("Point GPS non trouvé");
  }
  
  return await prisma.gPSPoint.delete({
    where: { id },
  });
}

export async function reorderGPSPoints(chantierId: string, pointIds: string[]) {
  const updates = pointIds.map((id, index) => 
    prisma.gPSPoint.update({
      where: { id },
      data: { order: index },
    })
  );
  
  await Promise.all(updates);
  
  return await getGPSPointsByChantier(chantierId);
}
