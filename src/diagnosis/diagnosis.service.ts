import { Injectable } from '@nestjs/common';
import { CreateDiagnosisDto } from './dto/create-diagnosis.dto';
import { UpdateDiagnosisDto } from './dto/update-diagnosis.dto';
import { PrismaService } from '../prisma/prisma.service';
import type { User } from '@prisma/client';
import { startOfWeek, endOfWeek } from 'date-fns';

@Injectable()
export class DiagnosisService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createDiagnosisDto: CreateDiagnosisDto) {
    const { score, resultType, createdAt } = createDiagnosisDto;

    // 1. DiagnosisResult 생성
    const newDiagnosis = await this.prisma.diagnosisResult.create({
      data: {
        userId,
        score,
        resultType: resultType || 'USER_SUBMITTED', // 타입이 없으면 기본값
        createdAt: createdAt ? new Date(createdAt) : new Date(),
      },
    });

    return newDiagnosis;
  }

  async createOrUpdateFromUnauth(userId: string, createDiagnosisDto: CreateDiagnosisDto) {
    const { score, createdAt } = createDiagnosisDto;

    // 1. 사용자의 초기 진단 결과가 있는지 확인
    const existingInitialDiagnosis = await this.prisma.diagnosisResult.findFirst({
      where: {
        userId,
        resultType: 'INITIAL',
      },
    });

    // 2. 있으면 해당 결과를 비회원 진단 결과로 업데이트
    if (existingInitialDiagnosis) {
      return this.prisma.diagnosisResult.update({
        where: { id: existingInitialDiagnosis.id },
        data: {
          score,
          resultType: 'UNAUTH_CONVERTED', // 비회원->회원 전환됨
          createdAt: createdAt ? new Date(createdAt) : new Date(),
        },
      });
    } else {
      // 3. 없으면(드문 경우), 새로운 진단 결과를 생성
      return this.prisma.diagnosisResult.create({
        data: {
          userId,
          score,
          resultType: 'UNAUTH_CONVERTED',
          createdAt: createdAt ? new Date(createdAt) : new Date(),
        },
      });
    }
  }

  async getMyLatestDiagnosis(userId: string) {
    if (!userId) {
      throw new Error("User ID is required");
    }
    return this.prisma.diagnosisResult.findFirst({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findAll() {
    return `This action returns all diagnosis`;
  }

  findOne(id: number) {
    return `This action returns a #${id} diagnosis`;
  }

  update(id: number, updateDiagnosisDto: UpdateDiagnosisDto) {
    return `This action updates a #${id} diagnosis`;
  }

  remove(id: number) {
    return `This action removes a #${id} diagnosis`;
  }
}
