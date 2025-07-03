import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAgreementDto } from './dto/create-agreement.dto';
import { SignAgreementDto } from './dto/sign-agreement.dto';
import { UpdateAgreementStatusDto } from './dto/update-agreement-status.dto';

@Injectable()
export class AgreementService {
  constructor(private readonly prisma: PrismaService) {}

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
    if (agreement.status === 'signed' || agreement.status === 'completed') {
      throw new BadRequestException('이미 서명된 합의서입니다.');
    }

    // 서명 정보 업데이트
    const updateData: any = {
      status: 'signed',
    };

    // 서명자에 따라 해당 필드 업데이트
    if (agreement.authorId === userId) {
      updateData.authorSignature = signAgreementDto.signature;
    } else if (agreement.partnerId === userId) {
      updateData.partnerSignature = signAgreementDto.signature;
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

    // 상태 변경 권한 확인 (생성자만 가능)
    if (agreement.authorId !== userId) {
      throw new BadRequestException('상태 변경 권한이 없습니다.');
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

  // 추후 CRUD 메서드 추가 예정
} 