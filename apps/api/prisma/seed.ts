// apps/api/prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

// Mot de passe par défaut (à communiquer puis à faire changer)
const DEFAULT_PWD = "fbbois2025!";

async function seedUsers() {
  const hash = await bcrypt.hash(DEFAULT_PWD, 10);

  const users = [
    // --- BÛCHERONS (plages de numérotation) ---
    {
      lastName: "Tracoulat",
      firstName: "Donovan",
      role: "BUCHERON",
      numStart: 1,
      numEnd: 1000,
      phone: "0668362351",
      email: "donovantracoulat82@gmail.com",
    },
    {
      lastName: "Talaron",
      firstName: "Kentin",
      role: "BUCHERON",
      numStart: 1001,
      numEnd: 2000,
      phone: "0629969210",
      email: "kentintalaronriboulet@gmail.com",
    },
    {
      lastName: "Gibert",
      firstName: "Corentin",
      role: "BUCHERON",
      numStart: 2001,
      numEnd: 3000,
      phone: "0628040389",
      email: "gibertcorentin83@gmail.com",
    },
    {
      lastName: "Montélimar",
      firstName: "Alexandre",
      role: "BUCHERON",
      numStart: 3001,
      numEnd: 4000,
      phone: "0605215645",
      email: "montelalexandre3@gmail.com",
    },
    {
      lastName: "Charreyron",
      firstName: "Antonin",
      role: "BUCHERON",
      numStart: 4001,
      numEnd: 5000,
      phone: "0760337082",
      email: "tf.charreyron@gmail.com",
    },
    {
      lastName: "Paccalet",
      firstName: "Lynce",
      role: "BUCHERON",
      numStart: 5001,
      numEnd: 6000,
      phone: "0618227034",
      email: "paclynce@gmail.com",
    },
    {
      lastName: "Lillio",
      firstName: "Baptiste",
      role: "BUCHERON",
      numStart: 6001,
      numEnd: 7000,
      phone: "0784545395",
      email: "lilliobaptiste@gmail.com",
    },

    // --- SUPERVISEURS ---
    {
      lastName: "Bouchet",
      firstName: "Florian",
      role: "SUPERVISEUR",
      numStart: 11001,
      numEnd: 12000,
      phone: "0761503643",
      email: "fb.bois43@gmail.com",
    },
    {
      lastName: "Combes",
      firstName: "Simon",
      role: "SUPERVISEUR",
      numStart: 10001,
      numEnd: 11000,
      phone: "0764024451",
      email: "simon.combes@hotmail.fr",
    },
  ] as const;

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, password: hash },
    });
  }

}

async function seedEssences() {
  const essences = [
    {
      name: "Sapin",
      qualites: [
        { name: "Palette", pourcentageEcorce: 10 },
        { name: "Emballage", pourcentageEcorce: 10 },
        { name: "Charpente Moulin", pourcentageEcorce: 10 },
        { name: "Charpente Arnaud", pourcentageEcorce: 10 },
        { name: "Poteaux", pourcentageEcorce: 10 },
        { name: "Écorcé", pourcentageEcorce: 0 },
      ],
    },
    {
      name: "Épicéa",
      qualites: [
        { name: "Palette", pourcentageEcorce: 10 },
        { name: "Emballage", pourcentageEcorce: 10 },
        { name: "Charpente", pourcentageEcorce: 10 },
        { name: "Écorcé", pourcentageEcorce: 0 },
      ],
    },
    {
      name: "Douglas",
      qualites: [
        { name: "Palette", pourcentageEcorce: 12 },
        { name: "Emballage", pourcentageEcorce: 12 },
        { name: "Charpente", pourcentageEcorce: 12 },
        { name: "Écorcé", pourcentageEcorce: 0 },
      ],
    },
    {
      name: "Pin",
      qualites: [
        { name: "Palette", pourcentageEcorce: 8 },
        { name: "Emballage", pourcentageEcorce: 8 },
        { name: "Charpente", pourcentageEcorce: 8 },
      ],
    },
    {
      name: "Feuillus",
      qualites: [
        { name: "Chauffage", pourcentageEcorce: 0 },
        { name: "Sciage", pourcentageEcorce: 0 },
      ],
    },
  ];

  for (const e of essences) {
    await prisma.essence.upsert({
      where: { name: e.name },
      update: {},
      create: {
        name: e.name,
        qualites: {
          create: e.qualites.map((q) => ({
            name: q.name,
            pourcentageEcorce: q.pourcentageEcorce,
          })),
        },
      },
    });
  }

}

async function main() {
  await seedUsers();
  await seedEssences();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    prisma.$disconnect();
  });
