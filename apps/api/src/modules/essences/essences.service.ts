import { prisma } from "../../prisma";

export async function getAllEssences() {
  return prisma.essence.findMany({
    include: { qualites: true },
    orderBy: { name: "asc" }
  });
}