import { Module, Injectable } from '@nestjs/common';
import { DiagnosisController } from './diagnosis.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CreateDiagnosisDto } from './dto/create-diagnosis.dto';
import { UpdateDiagnosisDto } from './dto/update-diagnosis.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DiagnosisService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDiagnosisDto: CreateDiagnosisDto, userId: string | null = null) {
    const { score, resultType, createdAt, diagnosisType } = createDiagnosisDto;

    const newDiagnosis = await this.prisma.diagnosisResult.create({
      data: {
        userId,
        score,
        resultType: resultType || 'USER_SUBMITTED',
        diagnosisType: diagnosisType || 'USER_SUBMITTED',
        createdAt: createdAt ? new Date(createdAt) : new Date(),
      },
    });

    return newDiagnosis;
  }

  async createOrUpdateFromUnauth(userId: string, createDiagnosisDto: CreateDiagnosisDto) {
    const { score, createdAt, diagnosisType } = createDiagnosisDto;

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
          diagnosisType: diagnosisType || 'BASELINE_TEMPERATURE',
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
          diagnosisType: diagnosisType || 'BASELINE_TEMPERATURE',
          createdAt: createdAt ? new Date(createdAt) : new Date(),
        },
      });
    }
  }

  async getMyLatestDiagnosis(userId: string) {
    if (!userId) {
      throw new Error("User ID is required");
    }

    // 1) 우선 사용자의 초기(베이스라인) 진단 결과를 찾습니다.
    //    INITIAL 또는 비회원→회원 전환된 UNAUTH_CONVERTED 타입 중 가장 오래된(첫 번째) 진단을 반환합니다.
    const baseline = await this.prisma.diagnosisResult.findFirst({
      where: {
        userId,
        resultType: {
          in: ['INITIAL', 'UNAUTH_CONVERTED'],
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (baseline) {
      return baseline;
    }

    // 2) 위 타입이 없을 경우, 사용자의 가장 첫 번째 진단 결과(최초 기록)를 반환합니다.
    return this.prisma.diagnosisResult.findFirst({
      where: { userId },
      orderBy: {
        createdAt: 'asc',
      },
    });
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

@Module({
  imports: [PrismaModule],
  controllers: [DiagnosisController],
  providers: [DiagnosisService],
  exports: [DiagnosisService],
})
export class DiagnosisModule {
  constructor() {
    console.log('diagnosis module loaded!');
  }
}
