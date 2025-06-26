import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  { name: '부부생활', isPollCategory: false },
  { name: '결혼생활', isPollCategory: false },
  { name: '챌린지인증', isPollCategory: false },
  { name: '찬반토론', isPollCategory: true },
];

async function main() {
  console.log('Start seeding categories...');
  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: {
        name: category.name,
        isPollCategory: category.isPollCategory,
      },
    });
  }
  console.log('Seeding categories finished.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 