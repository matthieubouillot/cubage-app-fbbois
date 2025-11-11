import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Créer les utilisateurs
  console.log('👥 Creating users...');
  const hashedPassword = await bcrypt.hash('fbbois2025!', 10);

  const users = [
    // --- BÛCHERONS (plages de numérotation) ---
    {
      lastName: "Tracoulat",
      firstName: "Donovan",
      roles: ["BUCHERON"],
      numStart: 1,
      numEnd: 1000,
      phone: "0668362351",
      email: "donovantracoulat82@gmail.com",
    },
    {
      lastName: "Talaron",
      firstName: "Kentin",
      roles: ["BUCHERON"],
      numStart: 1001,
      numEnd: 2000,
      phone: "0629969210",
      email: "kentintalaronriboulet@gmail.com",
    },
    {
      lastName: "Gibert",
      firstName: "Corentin",
      roles: ["BUCHERON"],
      numStart: 2001,
      numEnd: 3000,
      phone: "0628040389",
      email: "gibertcorentin83@gmail.com",
    },
    {
      lastName: "Montélimar",
      firstName: "Alexandre",
      roles: ["BUCHERON"],
      numStart: 3001,
      numEnd: 4000,
      phone: "0605215645",
      email: "montelalexandre3@gmail.com",
    },
    {
      lastName: "Charreyron",
      firstName: "Antonin",
      roles: ["BUCHERON"],
      numStart: 4001,
      numEnd: 5000,
      phone: "0760337082",
      email: "tf.charreyron@gmail.com",
    },
    {
      lastName: "Paccalet",
      firstName: "Lynce",
      roles: ["BUCHERON"],
      numStart: 5001,
      numEnd: 6000,
      phone: "0618227034",
      email: "paclynce@gmail.com",
    },
    {
      lastName: "Lillio",
      firstName: "Baptiste",
      roles: ["BUCHERON"],
      numStart: 6001,
      numEnd: 7000,
      phone: "0784545395",
      email: "lilliobaptiste@gmail.com",
    },

    // --- SUPERVISEURS ---
    {
      lastName: "Bouchet",
      firstName: "Florian",
      roles: ["SUPERVISEUR"],
      numStart: 11001,
      numEnd: 12000,
      phone: "0761503643",
      email: "fb.bois43@gmail.com",
    },
    {
      lastName: "Combes",
      firstName: "Simon",
      roles: ["SUPERVISEUR"],
      numStart: 10001,
      numEnd: 11000,
      phone: "0764024451",
      email: "simon.combes@hotmail.fr",
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { 
        ...u, 
        roles: u.roles as any, // Cast pour éviter les erreurs TypeScript
        password: hashedPassword 
      },
    });
  }

  console.log('✅ Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });