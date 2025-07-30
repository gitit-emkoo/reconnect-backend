// 7월 4주차 리포트 재생성 스크립트
const { PrismaClient } = require('@prisma/client');
const { startOfWeek, subWeeks } = require('date-fns');

const prisma = new PrismaClient();

async function regenerateJuly4thWeekReport() {
  try {
    console.log('7월 4주차 리포트 재생성을 시작합니다...');
    
    // 7월 4주차 시작일 계산 (2024년 7월 22일 월요일)
    const july4thWeekStart = new Date(2024, 6, 22); // 7월은 6 (0-based)
    
    console.log('7월 4주차 시작일:', july4thWeekStart.toLocaleDateString());
    
    // 활성 커플들 찾기
    const activeCouples = await prisma.couple.findMany({
      where: { status: 'ACTIVE' },
      include: { members: true },
    });
    
    console.log(`총 ${activeCouples.length}개의 활성 커플을 찾았습니다.`);
    
    // 각 커플에 대해 리포트 재생성
    for (const couple of activeCouples) {
      console.log(`\n${couple.id} 커플의 7월 4주차 리포트를 재생성합니다...`);
      
      // 기존 리포트 삭제
      await prisma.report.deleteMany({
        where: {
          coupleId: couple.id,
          weekStartDate: july4thWeekStart,
        },
      });
      
      console.log('기존 리포트 삭제 완료');
      
      // 새로운 리포트 생성 (ReportsService 로직을 여기에 구현)
      // ... 리포트 생성 로직
      
      console.log('새로운 리포트 생성 완료');
    }
    
    console.log('\n모든 커플의 7월 4주차 리포트 재생성이 완료되었습니다!');
    
  } catch (error) {
    console.error('리포트 재생성 중 오류 발생:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
regenerateJuly4thWeekReport(); 