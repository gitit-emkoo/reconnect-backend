import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  { name: '부부관계', isPollCategory: false },
  { name: '결혼생활', isPollCategory: false },
  { name: '챌린지인증', isPollCategory: false },
  { name: '찬반토론', isPollCategory: true },
];

async function main() {
  console.log('카테고리 시드 생성중...🌱');
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
  console.log('카테고리 시드 생성이 완료되었다🥑');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 