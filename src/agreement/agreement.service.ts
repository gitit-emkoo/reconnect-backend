import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgreementDto } from './dto/create-agreement.dto';
import { SignAgreementDto } from './dto/sign-agreement.dto';
import { UpdateAgreementStatusDto } from './dto/update-agreement-status.dto';
import * as crypto from 'crypto';

@Injectable()
export class AgreementService {
  constructor(private readonly prisma: PrismaService) {}

  // 해시 생성 함수
  private generateAgreementHash(agreement: any): string {
    const content = `${agreement.title}${agreement.content}${agreement.authorId}${agreement.partnerId}${agreement.createdAt}`;
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  async create(createAgreementDto: CreateAgreementDto & { authorId: string }) {
    const data: any = {
      ...createAgreementDto,
      status: 'pending',
    };
    
    // authorSignature가 없으면 빈 문자열로 설정
    if (!data.authorSignature) {
      data.authorSignature = '';
    }
    
    return this.prisma.agreement.create({
      data,
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
            email: true,
          },
        },
        partner: {
          select: {
            id: true,
            nickname: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.agreement.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
            email: true,
          },
        },
        partner: {
          select: {
            id: true,
            nickname: true,
            email: true,
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const agreement = await this.prisma.agreement.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
            email: true,
          },
        },
        partner: {
          select: {
            id: true,
            nickname: true,
            email: true,
          },
        },
      },
    });

    if (!agreement) {
      throw new NotFoundException('합의서를 찾을 수 없습니다.');
    }

    return agreement;
  }

  async signAgreement(id: string, userId: string, signAgreementDto: SignAgreementDto) {
    const agreement = await this.prisma.agreement.findUnique({
      where: { id },
      include: {
        author: true,
        partner: true,
      },
    });

    if (!agreement) {
      throw new NotFoundException('합의서를 찾을 수 없습니다.');
    }

    // 서명자가 합의서의 당사자인지 확인
    if (agreement.authorId !== userId && agreement.partnerId !== userId) {
      throw new BadRequestException('서명 권한이 없습니다.');
    }

    // 이미 서명된 상태인지 확인
    if (agreement.status === 'completed') {
      throw new BadRequestException('이미 완료된 합의서입니다.');
    }

    // 서명 정보 업데이트
    const updateData: any = {};

    // 서명자에 따라 해당 필드 업데이트
    if (agreement.authorId === userId) {
      if (agreement.authorSignature) {
        throw new BadRequestException('이미 작성자 서명이 완료되었습니다.');
      }
      updateData.authorSignature = signAgreementDto.signature;
    } else if (agreement.partnerId === userId) {
      if (agreement.partnerSignature) {
        throw new BadRequestException('이미 파트너 서명이 완료되었습니다.');
      }
      updateData.partnerSignature = signAgreementDto.signature;
    }

    // 양쪽 모두 서명이 완료되면 상태를 'completed'로 변경하고 해시 생성
    const willHaveAuthorSignature = agreement.authorSignature || updateData.authorSignature;
    const willHavePartnerSignature = agreement.partnerSignature || updateData.partnerSignature;
    
    if (willHaveAuthorSignature && willHavePartnerSignature) {
      updateData.status = 'completed';
      // 합의서 완료 시 해시 생성
      updateData.agreementHash = this.generateAgreementHash(agreement);
    } else {
      updateData.status = 'signed';
    }

    return this.prisma.agreement.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
            email: true,
          },
        },
        partner: {
          select: {
            id: true,
            nickname: true,
            email: true,
          },
        },
      },
    });
  }

  async updateStatus(id: string, userId: string, updateStatusDto: UpdateAgreementStatusDto) {
    const agreement = await this.prisma.agreement.findUnique({
      where: { id },
    });

    if (!agreement) {
      throw new NotFoundException('합의서를 찾을 수 없습니다.');
    }

    // 상태 변경 권한 제한을 삭제 (누구나 가능)
    // if (agreement.authorId !== userId) {
    //   throw new BadRequestException('상태 변경 권한이 없습니다.');
    // }

    // PDF 발행('issued') 상태로 변경 시 검증
    if (updateStatusDto.status === 'issued') {
      // 양쪽 모두 서명이 완료되어야 함
      if (!agreement.authorSignature || !agreement.partnerSignature) {
        throw new BadRequestException('양쪽 모두 서명이 완료되어야 PDF를 발행할 수 있습니다.');
      }
    }

    return this.prisma.agreement.update({
      where: { id },
      data: {
        status: updateStatusDto.status,
      },
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
            email: true,
          },
        },
        partner: {
          select: {
            id: true,
            nickname: true,
            email: true,
          },
        },
      },
    });
  }

  async findByUser(userId: string) {
    return this.prisma.agreement.findMany({
      where: {
        OR: [
          { authorId: userId },
          { partnerId: userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            nickname: true,
            email: true,
          },
        },
        partner: {
          select: {
            id: true,
            nickname: true,
            email: true,
          },
        },
      },
    });
  }

  async deleteAgreement(id: string, userId: string) {
    const agreement = await this.prisma.agreement.findUnique({
      where: { id },
    });

    if (!agreement) {
      throw new NotFoundException('합의서를 찾을 수 없습니다.');
    }

    // 삭제 권한 확인 (작성자만 삭제 가능)
    if (agreement.authorId !== userId) {
      throw new BadRequestException('삭제 권한이 없습니다.');
    }

    // PDF 발행된 합의서는 삭제 불가
    if (agreement.status === 'issued') {
      throw new BadRequestException('PDF가 발행된 합의서는 삭제할 수 없습니다.');
    }

    // pending 또는 completed 상태의 합의서만 삭제 가능
    if (agreement.status !== 'pending' && agreement.status !== 'completed') {
      throw new BadRequestException('삭제할 수 없는 상태의 합의서입니다.');
    }

    await this.prisma.agreement.delete({
      where: { id },
    });

    return { message: '합의서가 삭제되었습니다.' };
  }
} 