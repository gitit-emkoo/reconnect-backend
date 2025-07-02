import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import type { User } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthService } from '../auth/auth.service';
import { DiagnosisService } from '../diagnosis/diagnosis.module';

@Injectable()
export class PartnerInvitesService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private notificationsService: NotificationsService,
    private authService: AuthService,
    private diagnosisService: DiagnosisService,
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
      // 이미 유효한 초대 코드가 있다면, 에러 대신 기존 코드를 반환합니다.
      return existingInvite;
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

  // 초대 코드로 응답 (파트너 연결 최종 수락)
  async respondToInvite(code: string, inviteeId: string) {
    const invite = await this.prisma.partnerInvite.findUnique({
      where: { code },
      include: { inviter: true },
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

    const inviteeUser = await this.prisma.user.findUnique({ where: { id: inviteeId } });
    if (!inviteeUser) { throw new NotFoundException('사용자를 찾을 수 없습니다.'); }
    if (inviteeUser.coupleId) { throw new BadRequestException('이미 파트너와 연결되어 있습니다.'); }

    // 트랜잭션으로 커플 생성 및 모든 정보 업데이트
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. 두 사용자의 최신 `User.temperature` 값을 직접 사용
      const inviter = invite.inviter;
      const invitee = inviteeUser;
      
      // 2. 두 점수 중 낮은 점수를 동기화된 온도로 설정
      const synchronizedTemperature = Math.min(inviter.temperature, invitee.temperature);

      // 3. 새로운 커플 생성
      const couple = await tx.couple.create({
        data: {
          members: {
            connect: [{ id: inviter.id }, { id: invitee.id }],
          },
        },
      });

      // 4. 두 사용자의 실제 온도를 동기화하고, coupleId를 연결
      await tx.user.updateMany({
        where: { id: { in: [inviter.id, invitee.id] } },
        data: { 
          temperature: synchronizedTemperature,
          coupleId: couple.id,
        },
      });

      // 5. 서로의 partnerId 업데이트
      await tx.user.update({ where: { id: inviter.id }, data: { partnerId: invitee.id } });
      await tx.user.update({ where: { id: invitee.id }, data: { partnerId: inviter.id } });
      
      // 6. 초대 상태 업데이트 (CONFIRMED)
      const updatedInvite = await tx.partnerInvite.update({
        where: { id: invite.id },
        data: { inviteeId, status: 'CONFIRMED', coupleId: couple.id },
      });

      // 7. 파트너 연결 알림 생성
      await this.notificationsService.createNotification({
        userId: inviter.id,
        message: `${invitee.nickname}님과 파트너로 연결되었어요!`,
        type: 'PARTNER_CONNECTED', url: '/dashboard',
      });
      await this.notificationsService.createNotification({
        userId: invitee.id,
        message: `${inviter.nickname}님과 파트너로 연결되었어요!`,
        type: 'PARTNER_CONNECTED', url: '/dashboard',
      });

      // 8. 이력 관리를 위해 DiagnosisResult에도 기록
      await tx.diagnosisResult.createMany({
        data: [
          { userId: inviter.id, score: synchronizedTemperature, resultType: '파트너 연결', diagnosisType: 'COUPLE_SYNC' },
          { userId: invitee.id, score: synchronizedTemperature, resultType: '파트너 연결', diagnosisType: 'COUPLE_SYNC' },
        ],
      });
      
      // 트랜잭션 결과 반환
      return { synchronizedTemperature };
    });
    
    // 트랜잭션 성공 후, 최신 정보로 토큰 재발급 및 최종 응답 구성
    const [inviterFull, inviteeFull] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: invite.inviterId }, include: { couple: true, partner: true } }),
      this.prisma.user.findUnique({ where: { id: inviteeId }, include: { couple: true, partner: true } }),
    ]);

    if (!inviterFull || !inviteeFull) {
      throw new InternalServerErrorException('Failed to retrieve full user data for token creation.');
    }

    const inviterToken = this.authService.createJwtToken(inviterFull);
    const inviteeToken = this.authService.createJwtToken(inviteeFull);

    return {
        inviter: inviterFull,
        invitee: inviteeFull,
        inviterToken,
        inviteeToken,
        synchronizedTemperature: result.synchronizedTemperature,
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