import { Injectable } from '@nestjs/common';
import { CreateDiagnosisDto } from './dto/create-diagnosis.dto';
import { UpdateDiagnosisDto } from './dto/update-diagnosis.dto';
import { PrismaService } from '../prisma/prisma.service';
import type { User } from '@prisma/client';
import { startOfWeek, endOfWeek } from 'date-fns';

@Injectable()
export class DiagnosisService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDiagnosisDto: CreateDiagnosisDto) {
    const { score, resultType, createdAt, diagnosisType } = createDiagnosisDto;

    // 1. DiagnosisResult 생성
    const newDiagnosis = await this.prisma.diagnosisResult.create({
      data: {
        userId: null, // 비회원이므로 userId는 null
        score,
        resultType: resultType || 'USER_SUBMITTED', // 타입이 없으면 기본값
        diagnosisType: diagnosisType || 'USER_SUBMITTED',
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
        diagnosisType: 'INITIAL',
      },
    });

    // 2. 있으면 해당 결과를 비회원 진단 결과로 업데이트
    if (existingInitialDiagnosis) {
      return this.prisma.diagnosisResult.update({
        where: { id: existingInitialDiagnosis.id },
        data: {
          score,
          resultType: '기초 관계온도', // 비회원->회원 전환됨
          diagnosisType: 'BASELINE_TEMPERATURE',
          createdAt: createdAt ? new Date(createdAt) : new Date(),
        },
      });
    } else {
      // 3. 없으면(드문 경우), 새로운 진단 결과를 생성
      return this.prisma.diagnosisResult.create({
        data: {
          userId,
          score,
          resultType: '기초 관계온도',
          diagnosisType: 'BASELINE_TEMPERATURE',
          createdAt: createdAt ? new Date(createdAt) : new Date(),
        },
      });
    }
  }

  async getMyLatestDiagnosis(userId: string) {
    if (!userId) {
      throw new Error('User ID is required');
    }

    // 가장 최근의 진단 결과를 찾도록 `desc`로 변경
    const latestDiagnosis = await this.prisma.diagnosisResult.findFirst({
      where: {
        userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // 진단 결과가 있으면 바로 반환
    if (latestDiagnosis) {
      return latestDiagnosis;
    }

    // 진단 결과가 전혀 없으면 기본값을 생성하여 반환
    return {
      id: 'default',
      score: 61,
      resultType: '기초 관계온도',
      diagnosisType: 'BASELINE_TEMPERATURE',
      createdAt: new Date(),
      userId: userId,
    };
  }

  async getMyHistory(userId: string) {
    return this.prisma.diagnosisResult.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
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
