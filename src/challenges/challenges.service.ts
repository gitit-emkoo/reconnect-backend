import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChallengeDto, ChallengeCategory } from './dto/create-challenge.dto';

export enum ChallengeStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

@Injectable()
export class ChallengesService {
  constructor(private prisma: PrismaService) {}

  // 카테고리별 챌린지 템플릿 조회
  async getChallengesByCategory(category: ChallengeCategory) {
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

    // 챌린지 템플릿 조회
    const template = await this.prisma.challengeTemplate.findUnique({
      where: { id: templateId },
    });
    if (!template) {
      throw new NotFoundException('챌린지 템플릿을 찾을 수 없습니다.');
    }

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7); // 1주일 후

    return this.prisma.challenge.create({
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
      return this.prisma.challenge.update({
        where: { id: challengeId },
        data: {
          status: ChallengeStatus.COMPLETED,
          completedAt: new Date(),
        },
      });
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
} 