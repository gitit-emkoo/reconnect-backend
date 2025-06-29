import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { ChallengeCategory } from '@prisma/client';
import { Logger } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';

export enum ChallengeStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

@Injectable()
export class ChallengesService {
  private readonly logger = new Logger(ChallengesService.name);

  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  // 카테고리별 챌린지 템플릿 조회
  async getChallengesByCategory(category: ChallengeCategory) {
    return this.prisma.challengeTemplate.findMany({
      where: { category },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 챌린지 템플릿 카테고리별 목록 조회
  async getChallengeTemplatesByCategory(category: ChallengeCategory) {
    return this.prisma.challengeTemplate.findMany({
      where: { category },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 현재 진행중인 챌린지 조회
  async getActiveChallenge(coupleId: string) {
    return this.prisma.challenge.findFirst({
      where: {
        coupleId,
        status: ChallengeStatus.IN_PROGRESS,
        endDate: {
          gte: new Date(),
        },
      },
    });
  }

  // 챌린지 시작
  async startChallenge(coupleId: string, templateId: string) {
    // 이미 진행중인 챌린지가 있는지 확인
    const activeChallenge = await this.getActiveChallenge(coupleId);
    if (activeChallenge) {
      throw new BadRequestException('이미 진행중인 챌린지가 있습니다.');
    }

    // 커플 정보 조회 (멤버 ID 확인용)
    const couple = await this.prisma.couple.findUnique({
      where: { id: coupleId },
      include: { members: true },
    });
    if (!couple || couple.members.length < 2) {
      throw new NotFoundException('유효한 커플 정보를 찾을 수 없습니다.');
    }

    // 챌린지 템플릿 조회
    const template = await this.prisma.challengeTemplate.findUnique({
      where: { id: templateId },
    });
    if (!template) {
      throw new NotFoundException('챌린지 템플릿을 찾을 수 없습니다.');
    }

    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    const startDate = new Date(now);
    // 현재 날짜를 기준으로 해당 주의 월요일을 찾습니다.
    const offset = (currentDay === 0) ? 6 : currentDay - 1;
    startDate.setDate(now.getDate() - offset);
    startDate.setHours(0, 0, 0, 0); // 월요일 자정으로 설정

    const endDate = new Date(startDate);
    // 해당 주의 일요일을 종료일로 설정합니다.
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999); // 일요일 자정 직전으로 설정

    const newChallenge = await this.prisma.challenge.create({
      data: {
        coupleId,
        startDate,
        endDate,
        status: ChallengeStatus.IN_PROGRESS,
        title: template.title,
        description: template.description,
        category: template.category,
        frequency: template.frequency,
        isOneTime: template.isOneTime,
        points: template.points,
      },
    });

    // 두 멤버 모두에게 챌린지 시작 알림 생성
    for (const member of couple.members) {
      await this.notificationsService.createNotification({
        userId: member.id,
        message: `새로운 챌린지 '${template.title}'가 시작되었어요.`,
        type: 'CHALLENGE_STARTED',
        url: '/challenge',
      });
    }

    return newChallenge;
  }

  // 챌린지 완료 처리
  async completeChallenge(challengeId: string, userId: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        couple: {
          include: {
            members: true,
          },
        },
      },
    });

    if (!challenge) {
      throw new NotFoundException('챌린지를 찾을 수 없습니다.');
    }

    // 현재 사용자가 해당 커플의 멤버인지 확인
    const isMember = challenge.couple.members.some(member => member.id === userId);
    if (!isMember) {
      throw new BadRequestException('해당 챌린지에 참여할 수 없습니다.');
    }

    // 현재 사용자가 첫 번째 멤버인지 두 번째 멤버인지 확인
    const isFirstMember = challenge.couple.members[0].id === userId;
    
    // 완료 상태 업데이트
    const updateData = isFirstMember
      ? { isCompletedByMember1: true }
      : { isCompletedByMember2: true };

    const updatedChallenge = await this.prisma.challenge.update({
      where: { id: challengeId },
      data: updateData,
    });

    // 두 멤버 모두 완료했는지 확인
    if (updatedChallenge.isCompletedByMember1 && updatedChallenge.isCompletedByMember2) {
      const finalChallenge = await this.prisma.challenge.update({
        where: { id: challengeId },
        data: {
          status: ChallengeStatus.COMPLETED,
          completedAt: new Date(),
        },
      });

      // 두 멤버 모두에게 챌린지 완료 알림 생성
      for (const member of challenge.couple.members) {
        await this.notificationsService.createNotification({
          userId: member.id,
          message: `챌린지 '${finalChallenge.title}'를 성공적으로 완료했어요! 🎉`,
          type: 'CHALLENGE_COMPLETED',
          url: '/challenge',
        });
      }

      return finalChallenge;
    }

    return updatedChallenge;
  }

  // 챌린지 히스토리 조회
  async getChallengeHistory(coupleId: string) {
    const [completed, failed] = await Promise.all([
      this.prisma.challenge.findMany({
        where: {
          coupleId,
          status: ChallengeStatus.COMPLETED,
        },
        orderBy: {
          completedAt: 'desc',
        },
      }),
      this.prisma.challenge.findMany({
        where: {
          coupleId,
          status: ChallengeStatus.FAILED,
        },
        orderBy: {
          endDate: 'desc',
        },
      }),
    ]);

    return {
      completed,
      failed,
    };
  }

  // 만료된 챌린지 처리 (스케줄러에서 호출)
  async processExpiredChallenges() {
    const now = new Date();
    const expiredChallenges = await this.prisma.challenge.findMany({
      where: {
        status: ChallengeStatus.IN_PROGRESS,
        endDate: {
          lt: now,
        },
      },
    });

    for (const challenge of expiredChallenges) {
      await this.prisma.challenge.update({
        where: { id: challenge.id },
        data: {
          status: ChallengeStatus.FAILED,
        },
      });
    }
  }

  // 이번 주 챌린지 달성 여부 확인
  async checkWeeklyChallengeCompletion(coupleId: string) {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // 이번 주 일요일
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // 이번 주 토요일
    endOfWeek.setHours(23, 59, 59, 999);

    const completedChallenge = await this.prisma.challenge.findFirst({
      where: {
        coupleId,
        status: ChallengeStatus.COMPLETED,
        completedAt: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
    });

    return !!completedChallenge;
  }

  /**
   * 매일 자정 실행: 만료된 챌린지를 'FAILED' 상태로 업데이트합니다.
   */
  async failExpiredChallenges(): Promise<void> {
    const now = new Date();
    const result = await this.prisma.challenge.updateMany({
      where: {
        status: 'IN_PROGRESS',
        endDate: {
          lt: now,
        },
      },
      data: {
        status: 'FAILED',
      },
    });
    this.logger.log(`만료된 챌린지 ${result.count}개를 실패 처리했습니다.`);
  }
} 