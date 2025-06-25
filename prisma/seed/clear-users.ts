import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Start clearing users and related data...');

  // 모든 관계를 먼저 끊고 데이터를 삭제합니다.
  // 1. User-User 파트너 관계 및 Couple 관계 해제
  await prisma.user.updateMany({ data: { partnerId: null, coupleId: null } });
  const allCouples = await prisma.couple.findMany({});
  for (const couple of allCouples) {
    await prisma.couple.update({
      where: { id: couple.id },
      data: { members: { set: [] } },
    });
  }

  // 2. 모든 데이터 삭제 (의존성 역순)
  await prisma.comment.deleteMany({});
  await prisma.communityPostVote.deleteMany({});
  await prisma.communityPost.deleteMany({});
  await prisma.contentLike.deleteMany({});
  await prisma.contentBookmark.deleteMany({});
  await prisma.content.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.report.deleteMany({});
  await prisma.emotionCard.deleteMany({});
  await prisma.challenge.deleteMany({});
  await prisma.schedule.deleteMany({});
  await prisma.diary.deleteMany({});
  await prisma.message.deleteMany({});
  await prisma.relationshipSurvey.deleteMany({});
  await prisma.emotionJournal.deleteMany({});
  await prisma.partnerInvite.deleteMany({});
  await prisma.diagnosisResult.deleteMany({});
  await prisma.couple.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('All users and related data have been cleared.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 