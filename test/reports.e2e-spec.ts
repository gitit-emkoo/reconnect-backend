import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as bcrypt from 'bcryptjs';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AuthService } from '../src/auth/auth.service';
import { User, Couple } from '@prisma/client';
import { subWeeks, startOfWeek } from 'date-fns';

describe('ReportsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authService: AuthService;
  let token: string;
  let testUser1: User;
  let testUser2: User;
  let testCouple: Couple;

  // Jest 타임아웃을 30초로 늘립니다.
  jest.setTimeout(30000);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    prisma = app.get(PrismaService);
    authService = app.get(AuthService);

    // 1. 테스트 데이터 정리 (모든 관련 데이터를 삭제하여 환경 격리)
    // 1-1. 관계 해제 (모든 유저 대상)
    await prisma.user.updateMany({ data: { partnerId: null, coupleId: null } });
    const allCouples = await prisma.couple.findMany({});
    for (const couple of allCouples) {
      await prisma.couple.update({
        where: { id: couple.id },
        data: { members: { set: [] } },
      });
    }

    // 1-2. 모든 데이터 삭제
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
    await prisma.challengeTemplate.deleteMany({});

    // 2. 테스트용 유저 및 커플 생성
    const hashedPassword = await bcrypt.hash('password123', 10);
    testUser1 = await prisma.user.create({
      data: {
        email: 'testuser1@test.com',
        nickname: 'testuser1',
        password: hashedPassword,
      },
    });
    testUser2 = await prisma.user.create({
      data: {
        email: 'testuser2@test.com',
        nickname: 'testuser2',
        password: hashedPassword,
      },
    });
    testCouple = await prisma.couple.create({
      data: {
        members: {
          connect: [{ id: testUser1.id }, { id: testUser2.id }],
        },
        status: 'ACTIVE',
      },
    });
    // 생성된 커플 ID를 유저 정보에 업데이트
    await prisma.user.update({ where: { id: testUser1.id }, data: { coupleId: testCouple.id } });
    await prisma.user.update({ where: { id: testUser2.id }, data: { coupleId: testCouple.id } });
    // 서로를 파트너로 지정 (추가)
    await prisma.user.update({ where: { id: testUser1.id }, data: { partnerId: testUser2.id } });
    await prisma.user.update({ where: { id: testUser2.id }, data: { partnerId: testUser1.id } });


    // 3. 테스트용 활동 데이터 생성 (지난주에 보낸 감정 카드)
    const lastWeek = subWeeks(new Date(), 1);
    await prisma.emotionCard.create({
      data: {
        message: '지난주 테스트 카드',
        senderId: testUser1.id,
        receiverId: testUser2.id,
        coupleId: testCouple.id,
        createdAt: lastWeek,
      },
    });

    // 4. 인증 토큰 발급
    token = (await authService.login({ email: testUser1.email, password: 'password123' })).accessToken;
  });

  afterAll(async () => {
    // 1. 테스트 데이터 정리 (모든 관련 데이터를 삭제하여 환경 격리)
    // 1-1. 관계 해제 (모든 유저 대상)
    await prisma.user.updateMany({ data: { partnerId: null, coupleId: null } });
    const allCouples = await prisma.couple.findMany({});
    for (const couple of allCouples) {
      await prisma.couple.update({
        where: { id: couple.id },
        data: { members: { set: [] } },
      });
    }

    // 1-2. 모든 데이터 삭제
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
    await prisma.challengeTemplate.deleteMany({});

    await app.close();
  });

  it('POST /reports/generate - 주간 리포트를 성공적으로 생성해야 한다', async () => {
    // When: API 호출 (이제는 특정 커플만 대상으로 하도록 수정이 필요할 수 있음)
    // 우선 현재 테스트가 통과하는지 확인
    const response = await request(app.getHttpServer())
      .post('/reports/generate')
      .set('Authorization', `Bearer ${token}`)
      .expect(201); // Post 성공 시 201 Created

    // Then: 결과 검증
    const lastWeekStartDate = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });
    
    const report = await prisma.report.findUnique({
      where: {
        coupleId_weekStartDate: {
          coupleId: testCouple.id,
          weekStartDate: lastWeekStartDate,
        },
      },
    });

    expect(response.body).toBeDefined();
    expect(report).toBeDefined();
    expect(report!.coupleId).toBe(testCouple.id);
    expect(report!.cardsSentCount).toBe(1); // 감정카드 1개 보냈으므로
    expect(report!.challengesCompletedCount).toBe(0);
    // 기본점수 50점 + 감정카드 1개(2점) = 52점
    expect(report!.overallScore).toBe(52);
  });
}); 