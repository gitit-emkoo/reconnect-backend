import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import type { User } from '@prisma/client';

@Injectable()
export class PartnerInvitesService {
  constructor(private prisma: PrismaService) {}

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
    const invitee = await this.prisma.user.findUnique({
      where: { id: inviteeId },
      include: { couple: true }
    });

    if (!invitee) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    if (invitee.couple) {
      throw new BadRequestException('이미 파트너와 연결되어 있습니다.');
    }

    // 초대 상태 업데이트
    const updatedInvite = await this.prisma.partnerInvite.update({
      where: { id: invite.id },
      data: {
        inviteeId,
        status: 'RESPONDED'
      },
      include: {
        inviter: true,
        invitee: true
      }
    });

    return updatedInvite;
  }

  // 초대 수락
  async acceptInvite(inviteId: string, inviterId: string) {
    const invite = await this.prisma.partnerInvite.findUnique({
      where: { id: inviteId },
      include: {
        inviter: true,
        invitee: true
      }
    });

    if (!invite) {
      throw new NotFoundException('초대를 찾을 수 없습니다.');
    }

    if (invite.inviterId !== inviterId) {
      throw new BadRequestException('초대를 수락할 권한이 없습니다.');
    }

    if (invite.status !== 'RESPONDED') {
      throw new BadRequestException('이미 처리된 초대입니다.');
    }

    // 트랜잭션으로 커플 생성 및 초대 상태 업데이트
    const result = await this.prisma.$transaction(async (prisma) => {
      // 새로운 커플 생성
      const couple = await prisma.couple.create({
        data: {
          members: {
            connect: [
              { id: invite.inviterId },
              ...(invite.inviteeId ? [{ id: invite.inviteeId }] : [])
            ]
          }
        }
      });

      // 초대 상태 업데이트
      const updatedInvite = await prisma.partnerInvite.update({
        where: { id: invite.id },
        data: {
          status: 'CONFIRMED',
          coupleId: couple.id
        }
      });

      return { couple, invite: updatedInvite };
    });

    return result;
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