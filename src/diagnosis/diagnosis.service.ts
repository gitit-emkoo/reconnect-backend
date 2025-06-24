import { Injectable } from '@nestjs/common';
import { CreateDiagnosisDto } from './dto/create-diagnosis.dto';
import { UpdateDiagnosisDto } from './dto/update-diagnosis.dto';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { startOfWeek, endOfWeek } from 'date-fns';

@Injectable()
export class DiagnosisService {
  constructor(private prisma: PrismaService) {}

  async create(createDiagnosisDto: CreateDiagnosisDto, user: User) {
    const { score, resultType } = createDiagnosisDto;
    
    // 1. DiagnosisResult 생성
    const newDiagnosis = await this.prisma.diagnosisResult.create({
      data: {
        score,
        resultType,
        userId: user.id,
      },
    });

    // 2. Report 생성 또는 업데이트
    if (user.coupleId) {
      const now = new Date();
      const weekStartDate = startOfWeek(now, { weekStartsOn: 1 }); // 월요일을 주의 시작으로 설정

      const existingReport = await this.prisma.report.findFirst({
        where: {
          coupleId: user.coupleId,
          weekStartDate: weekStartDate,
        }
      });

      if (existingReport) {
        // 기존 리포트가 있으면 점수 업데이트 (여기서는 덮어쓰기. 평균 등 다른 로직도 가능)
        await this.prisma.report.update({
          where: { id: existingReport.id },
          data: { overallScore: score },
        });
      } else {
        // 기존 리포트가 없으면 새로 생성
        await this.prisma.report.create({
          data: {
            coupleId: user.coupleId,
            weekStartDate: weekStartDate,
            overallScore: score,
            reason: '', // 초기값
            cardsSentCount: 0,
            challengesCompletedCount: 0,
            expertSolutionsCount: 0,
            marriageDiagnosisCount: 1, // 최초 진단이므로 1로 설정
          },
        });
      }
    }

    return newDiagnosis;
  }

  async findLatest(userId: string) {
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
