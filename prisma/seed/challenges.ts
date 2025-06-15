import { PrismaClient, ChallengeCategory } from '@prisma/client';

const prisma = new PrismaClient();

const challengeTemplates = [
  // 일상 공유
  { title: '오늘의 기분 물어주기', description: '주 3회', category: ChallengeCategory.DAILY_SHARE, isOneTime: false, frequency: 3, points: 10 },
  { title: '서로의 하루를 3줄로 요약해서 공유하기', description: '주 3회', category: ChallengeCategory.DAILY_SHARE, isOneTime: false, frequency: 3, points: 10 },
  { title: '오늘 점심 메뉴 인증샷 보내기', description: '주 3회', category: ChallengeCategory.DAILY_SHARE, isOneTime: false, frequency: 3, points: 10 },
  { title: '스타일 추천해주고 그대로 입어주기', description: '1회', category: ChallengeCategory.DAILY_SHARE, isOneTime: true, frequency: 1, points: 10 },
  { title: '하루 중 힘들었던 순간 이야기 해주기', description: '주 3회', category: ChallengeCategory.DAILY_SHARE, isOneTime: false, frequency: 3, points: 10 },
  { title: '이번주 서운했던 순간 물어주고 성의있게 답하기', description: '1회', category: ChallengeCategory.DAILY_SHARE, isOneTime: true, frequency: 1, points: 10 },

  // 함께 하기
  { title: '근처 공원 또는 둘레길 걷기 (30분 대화 포함)', description: '2회', category: ChallengeCategory.TOGETHER_ACT, isOneTime: false, frequency: 2, points: 10 },
  { title: '같이 요리해서 먹기', description: '2회', category: ChallengeCategory.TOGETHER_ACT, isOneTime: false, frequency: 2, points: 10 },
  { title: '가보고 싶었던 카페 가기', description: '2회', category: ChallengeCategory.TOGETHER_ACT, isOneTime: false, frequency: 2, points: 10 },
  { title: '커플 사진 찍기', description: '1회', category: ChallengeCategory.TOGETHER_ACT, isOneTime: true, frequency: 1, points: 10 },
  { title: '서로가 좋아하는 음악 추천하고 함께 듣기', description: '2회', category: ChallengeCategory.TOGETHER_ACT, isOneTime: false, frequency: 2, points: 10 },
  { title: '무계획 드라이브 떠나기', description: '1회', category: ChallengeCategory.TOGETHER_ACT, isOneTime: true, frequency: 1, points: 10 },

  // 감정 표현
  { title: '오늘 고마웠던 점 한 가지 직접 말하기', description: '2회', category: ChallengeCategory.EMOTION_EXPR, isOneTime: false, frequency: 2, points: 10 },
  { title: '매일 한번이상 감정카드 보내기', description: '7회', category: ChallengeCategory.EMOTION_EXPR, isOneTime: false, frequency: 7, points: 10 },
  { title: '상대방의 장점을 종이에 써서 냉장고에 붙이기', description: '1회', category: ChallengeCategory.EMOTION_EXPR, isOneTime: true, frequency: 1, points: 10 },
  { title: '커피쿠폰 메시지와 함께 선물하기', description: '1회', category: ChallengeCategory.EMOTION_EXPR, isOneTime: true, frequency: 1, points: 10 },
  { title: '사랑해라는 말 대신 다른 방식으로 표현하기', description: '1회', category: ChallengeCategory.EMOTION_EXPR, isOneTime: true, frequency: 1, points: 10 },
  { title: '상대에게 못했던 말 털어놓기', description: '1회', category: ChallengeCategory.EMOTION_EXPR, isOneTime: true, frequency: 1, points: 10 },

  // 기억 쌓기
  { title: '첫 만남 또는 기억의 남는 데이트 장소 다시 가기', description: '1회', category: ChallengeCategory.MEMORY_BUILD, isOneTime: true, frequency: 1, points: 10 },
  { title: '오래된 사진 1장 꺼내서 함께 이야기 나누기', description: '1회', category: ChallengeCategory.MEMORY_BUILD, isOneTime: true, frequency: 1, points: 10 },
  { title: '데이트했던 장소 근처 음식점 다시 방문', description: '1회', category: ChallengeCategory.MEMORY_BUILD, isOneTime: true, frequency: 1, points: 10 },
  { title: '결혼식 영상 혹은 추억앨범 보기', description: '1회', category: ChallengeCategory.MEMORY_BUILD, isOneTime: true, frequency: 1, points: 10 },
  { title: '처음 여행 갔던 곳 온라인으로 찾아보고 대화하기', description: '1회', category: ChallengeCategory.MEMORY_BUILD, isOneTime: true, frequency: 1, points: 10 },
  { title: '함께 한 시간동안 가장 고마웠던 일 하나씩 말하기', description: '1회', category: ChallengeCategory.MEMORY_BUILD, isOneTime: true, frequency: 1, points: 10 },

  // 마음 돌보기
  { title: '10분 명상 또는 혼자 산책하며 감정 정리', description: '1회', category: ChallengeCategory.SELF_CARE, isOneTime: true, frequency: 1, points: 10 },
  { title: '감정 다이어리에 솔직한 감정 작성', description: '3회', category: ChallengeCategory.SELF_CARE, isOneTime: false, frequency: 3, points: 10 },
  { title: '오늘 나를 힘들게 했던 순간 기록하고 나누기', description: '2회', category: ChallengeCategory.SELF_CARE, isOneTime: false, frequency: 2, points: 10 },
  { title: '상대방에게 기대 없이 감정 공유 시도하기', description: '', category: ChallengeCategory.SELF_CARE, isOneTime: true, frequency: 1, points: 10 },
  { title: '책 한 페이지 함께 읽고 느낀 점 메모하기', description: '1회', category: ChallengeCategory.SELF_CARE, isOneTime: true, frequency: 1, points: 10 },
  { title: '내가 지금 바라는 감정 상태를 글로 써보기', description: '', category: ChallengeCategory.SELF_CARE, isOneTime: true, frequency: 1, points: 10 },

  // 함께 성장
  { title: '3개월 안에 하고 싶은 함께 목표 계획하기', description: '1회', category: ChallengeCategory.GROW_TOGETHER, isOneTime: true, frequency: 1, points: 10 },
  { title: '우리 사이를 더 좋게 만들려면? 대화 주제로 깊게 대화', description: '1회', category: ChallengeCategory.GROW_TOGETHER, isOneTime: true, frequency: 1, points: 10 },
  { title: '함께 가보고 싶은 여행지 정해서 지도에 표시', description: '2회', category: ChallengeCategory.GROW_TOGETHER, isOneTime: false, frequency: 2, points: 10 },
  { title: '서로의 취미 같이 해보기', description: '1회', category: ChallengeCategory.GROW_TOGETHER, isOneTime: true, frequency: 1, points: 10 },
  { title: '상대방 일과 관련한 도서 한권 선물하기', description: '1회', category: ChallengeCategory.GROW_TOGETHER, isOneTime: true, frequency: 1, points: 10 },
  { title: '각자의 목표 설정해보기', description: '1회', category: ChallengeCategory.GROW_TOGETHER, isOneTime: true, frequency: 1, points: 10 },
];

async function main() {
  console.log('🌱 챌린지 템플릿 데이터 생성 시작...');

  try {
    // 기존 챌린지 템플릿 삭제
    await prisma.challengeTemplate.deleteMany({});
    console.log('기존 챌린지 템플릿 삭제 완료');

    // 새로운 챌린지 템플릿 생성
    for (const template of challengeTemplates) {
      await prisma.challengeTemplate.create({ data: template });
    }

    console.log('✅ 챌린지 템플릿 데이터 생성 완료!');
  } catch (error) {
    console.error('❌ 챌린지 템플릿 데이터 생성 중 오류 발생:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    throw e;
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 