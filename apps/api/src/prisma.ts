import { PrismaClient } from "@prisma/client";

// Vérifier que DATABASE_URL est chargée
if (!process.env.DATABASE_URL) {
  console.error("❌ DATABASE_URL n'est pas définie dans les variables d'environnement !");
  console.error("❌ Vérifiez que le fichier .env existe et contient DATABASE_URL");
} else {
  console.log("✅ DATABASE_URL chargée:", process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@')); // masque le mot de passe
}

export const prisma = new PrismaClient({
  log: ['error', 'warn'],
});