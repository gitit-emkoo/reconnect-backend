import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import type { User } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class PartnerInvitesService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
    private authService: AuthService,
  ) {}

  // 초대 코드 생성
  async createInviteCode(userId: string) {
    // 이미 파트너가 있는지 확인
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { couple: true }
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    if (user.couple) {
      throw new BadRequestException('이미 파트너와 연결되어 있습니다.');
    }

    // 이미 진행 중인 초대가 있는지 확인
    const existingInvite = await this.prisma.partnerInvite.findFirst({
      where: {
        inviterId: userId,
        status: {
          in: ['PENDING', 'RESPONDED']
        }
      }
    });

    if (existingInvite) {
      throw new BadRequestException('이미 진행 중인 초대가 있습니다.');
    }

    // 새로운 초대 코드 생성
    const invite = await this.prisma.partnerInvite.create({
      data: {
        code: uuidv4().slice(0, 8), // 8자리 코드
        inviterId: userId,
        status: 'PENDING'
      }
    });

    return invite;
  }

  // 초대 코드로 응답
  async respondToInvite(code: string, inviteeId: string) {
    // 초대 코드로 초대 찾기
    const invite = await this.prisma.partnerInvite.findUnique({
      where: { code },
      include: { inviter: true }
    });

    if (!invite) {
      throw new NotFoundException('유효하지 않은 초대 코드입니다.');
    }

    if (invite.status !== 'PENDING') {
      throw new BadRequestException('이미 사용된 초대 코드입니다.');
    }

    if (invite.inviterId === inviteeId) {
      throw new BadRequestException('자기 자신을 초대할 수 없습니다.');
    }

    // 이미 파트너가 있는지 확인
    const inviteeUser = await this.prisma.user.findUnique({
      where: { id: inviteeId },
      include: { couple: true },
    });

    if (!inviteeUser) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    if (inviteeUser.couple) {
      throw new BadRequestException('이미 파트너와 연결되어 있습니다.');
    }

    // 트랜잭션으로 커플 생성 및 초대 상태 업데이트 (바로 CONFIRMED)
    const result = await this.prisma.$transaction(async (_tx) => {

      // 1. 두 사용자의 '베이스라인(INITIAL/UNAUTH_CONVERTED)' 진단 결과 조회 (가장 오래된 것)
      const inviterDiagnosis = await this.prisma.diagnosisResult.findFirst({
        where: {
          userId: invite.inviterId,
          resultType: { in: ['INITIAL', 'UNAUTH_CONVERTED'] },
        },
        orderBy: { createdAt: 'asc' },
      });
      const inviteeDiagnosis = await this.prisma.diagnosisResult.findFirst({
        where: {
          userId: inviteeId,
          resultType: { in: ['INITIAL', 'UNAUTH_CONVERTED'] },
        },
        orderBy: { createdAt: 'asc' },
      });

      // 없으면 새로운 베이스라인 레코드 생성 (기본 61점)
      const ensureBaseline = async (userId: string) => {
        return this.prisma.diagnosisResult.create({
          data: {
            userId,
            score: 61,
            resultType: '기초 관계온도',
            diagnosisType: 'BASELINE_TEMPERATURE',
          },
        });
      };

      const inviterBase = inviterDiagnosis ?? await ensureBaseline(invite.inviterId);
      const inviteeBase = inviteeDiagnosis ?? await ensureBaseline(inviteeId);

      // 두 사람의 낮은 점수 계산
      const lowerScore = Math.min(inviterBase.score, inviteeBase.score);

      await this.prisma.diagnosisResult.update({ where: { id: inviterBase.id }, data: { score: lowerScore } });
      await this.prisma.diagnosisResult.update({ where: { id: inviteeBase.id }, data: { score: lowerScore } });

      const needDiagnosis = false; // 이미 베이스라인 확보됨

      // 2. 두 사람 모두 결과가 있으면 점수를 비교하여 낮은 점수로 동기화
      if (!needDiagnosis && inviterDiagnosis && inviteeDiagnosis) {
        const lowerScore = Math.min(inviterDiagnosis.score, inviteeDiagnosis.score);

        // 두 사용자의 진단 점수를 낮은 점수로 업데이트
        await this.prisma.diagnosisResult.update({
          where: { id: inviterDiagnosis.id },
          data: { score: lowerScore },
        });
        await this.prisma.diagnosisResult.update({
          where: { id: inviteeDiagnosis.id },
          data: { score: lowerScore },
        });
      }

      // 새로운 커플 생성
      const couple = await this.prisma.couple.create({
        data: {
          members: {
            connect: [
              { id: invite.inviterId },
              { id: inviteeId }
            ]
          }
        }
      });

      // 초대 상태 업데이트 (바로 CONFIRMED)
      const updatedInvite = await this.prisma.partnerInvite.update({
        where: { id: invite.id },
        data: {
          inviteeId,
          status: 'CONFIRMED',
          coupleId: couple.id
        },
        include: {
          inviter: true,
          invitee: true
        }
      });

      // 서로의 partnerId 업데이트
      await this.prisma.user.update({
        where: { id: invite.inviterId },
        data: { partnerId: inviteeId },
      });
      await this.prisma.user.update({
        where: { id: inviteeId },
        data: { partnerId: invite.inviterId },
      });

      if (updatedInvite.invitee && updatedInvite.inviter) {
        // 두 멤버 모두에게 파트너 연결 알림 생성
        await this.notificationsService.createNotification({
          userId: invite.inviterId,
          message: `${updatedInvite.invitee.nickname}님과 파트너로 연결되었어요!`,
          type: 'PARTNER_CONNECTED',
          url: '/dashboard',
        });
        await this.notificationsService.createNotification({
          userId: inviteeId,
          message: `${updatedInvite.inviter.nickname}님과 파트너로 연결되었어요!`,
          type: 'PARTNER_CONNECTED',
          url: '/dashboard',
        });
      }

      // 최신 유저 정보 다시 불러오기 (partner, couple 포함)
      const updatedInvitee = await this.prisma.user.findUnique({
        where: { id: inviteeId },
        include: { partner: true, couple: true },
      });

      return { couple, invite: updatedInvite, needDiagnosis, updatedInvitee };
    });
    
    // 트랜잭션 성공 후 토큰 생성
    const { updatedInvitee, invite: updatedInvite } = result;
    if (!updatedInvitee || !updatedInvite.inviter || !updatedInvite.invitee) {
      throw new Error('파트너 연결 후 사용자 정보를 업데이트하지 못했습니다.');
    }

    const inviter = updatedInvite.inviter;
    const invitee = updatedInvite.invitee;

    // inviter와 invitee의 전체 사용자 정보 조회 (couple 정보 포함)
    const [inviterFull, inviteeFull] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: inviter.id }, include: { couple: true } }),
      this.prisma.user.findUnique({ where: { id: invitee.id }, include: { couple: true } }),
    ]);

    if (!inviterFull || !inviteeFull) {
        throw new InternalServerErrorException('Failed to retrieve full user data.');
    }

    const inviterPayload = {
        userId: inviterFull.id,
        email: inviterFull.email,
        nickname: inviterFull.nickname,
        role: inviterFull.role,
        partnerId: inviteeFull.id,
        couple: inviterFull.couple ? { id: inviterFull.couple.id } : null,
    };
    const inviterToken = this.jwtService.sign(inviterPayload);

    const inviteePayload = {
        userId: inviteeFull.id,
        email: inviteeFull.email,
        nickname: inviteeFull.nickname,
        role: inviteeFull.role,
        partnerId: inviterFull.id,
        couple: inviteeFull.couple ? { id: inviteeFull.couple.id } : null,
    };
    const inviteeToken = this.jwtService.sign(inviteePayload);


    return {
        inviter: { ...inviterFull, partnerId: inviteeFull.id },
        invitee: { ...inviteeFull, partnerId: inviterFull.id },
        inviterToken,
        inviteeToken,
    };
  }

  // 초대 수락
  async acceptInvite(code: string, inviteeId: string) {
    const invite = await this.prisma.partnerInvite.findUnique({
      where: { code },
    });

    if (!invite || invite.status !== 'PENDING') {
      throw new NotFoundException('유효하지 않거나 만료된 초대 코드입니다.');
    }
    
    if (invite.inviterId === inviteeId) {
        throw new BadRequestException('자기 자신을 초대할 수 없습니다.');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: invite.inviterId },
        data: { partnerId: inviteeId },
      });
      await tx.user.update({
        where: { id: inviteeId },
        data: { partnerId: invite.inviterId },
      });
      
      const couple = await tx.couple.create({
        data: {
          members: {
            connect: [{ id: invite.inviterId }, { id: inviteeId }],
          },
        },
      });

      await tx.partnerInvite.update({
        where: { id: invite.id },
        data: {
          inviteeId,
          status: 'CONFIRMED',
          coupleId: couple.id,
        },
      });

      const [inviter, invitee] = await Promise.all([
        tx.user.findUnique({ where: { id: invite.inviterId } }),
        tx.user.findUnique({ where: { id: inviteeId } }),
      ]);
      
      if(!inviter || !invitee) {
          throw new InternalServerErrorException("Failed to retrieve user data after update.");
      }

      await this.notificationsService.createNotification({
        userId: inviter.id,
        message: `${invitee.nickname}님과 파트너로 연결되었어요!`,
        type: 'PARTNER_CONNECTED',
        url: '/dashboard',
      });
      await this.notificationsService.createNotification({
        userId: invitee.id,
        message: `${inviter.nickname}님과 파트너로 연결되었어요!`,
        type: 'PARTNER_CONNECTED',
        url: '/dashboard',
      });

      const inviterToken = this.jwtService.sign({ userId: inviter.id, partnerId: invitee.id });
      const inviteeToken = this.jwtService.sign({ userId: invitee.id, partnerId: inviter.id });

      return {
        inviter,
        invitee,
        inviterToken,
        inviteeToken,
      };
    });
  }

  // 초대 거절
  async rejectInvite(inviteId: string, inviterId: string) {
    const invite = await this.prisma.partnerInvite.findUnique({
      where: { id: inviteId }
    });

    if (!invite) {
      throw new NotFoundException('초대를 찾을 수 없습니다.');
    }

    if (invite.inviterId !== inviterId) {
      throw new BadRequestException('초대를 거절할 권한이 없습니다.');
    }

    if (invite.status !== 'RESPONDED') {
      throw new BadRequestException('이미 처리된 초대입니다.');
    }

    const updatedInvite = await this.prisma.partnerInvite.update({
      where: { id: invite.id },
      data: {
        status: 'REJECTED'
      }
    });

    return updatedInvite;
  }

  // 내 초대 현황 조회
  async getMyInvites(userId: string) {
    const invites = await this.prisma.partnerInvite.findMany({
      where: {
        OR: [
          { inviterId: userId },
          { inviteeId: userId }
        ]
      },
      include: {
        inviter: {
          select: {
            id: true,
            nickname: true,
            profileImageUrl: true
          }
        },
        invitee: {
          select: {
            id: true,
            nickname: true,
            profileImageUrl: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return invites;
  }
} 