import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDiagnosisDto } from './dto/create-diagnosis.dto';
import { UpdateDiagnosisDto } from './dto/update-diagnosis.dto';
import axios from 'axios';

@Injectable()
export class DiagnosisService {
  private readonly logger = new Logger(DiagnosisService.name);
  private readonly geminiApiKey = process.env.GEMINI_API_KEY;
  private readonly geminiModelId = process.env.GEMINI_MODEL_ID || 'gemini-pro';
  private readonly geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModelId}:generateContent`;

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

  /**
   * 섹션별 결과를 기반으로 AI 종합 의견을 생성합니다.
   * - Gemini 설정이 없으면 규칙 기반 텍스트를 반환합니다(폴백).
   */
  async generateDiagnosisSummary(sections: Array<{ title: string; score: number; level: string; message: string }>): Promise<string> {
    const composeFallback = () => {
      const risks = sections.filter(s => ['매우 위험', '위험'].includes(s.level));
      const cautions = sections.filter(s => s.level === '주의');
      const strengths = sections.filter(s => ['양호', '매우 양호'].includes(s.level));
      const riskText = risks.length ? `주의가 필요한 영역: ${risks.map(r => `${r.title}(${r.level})`).join(', ')}` : '특별한 위험 신호는 낮습니다.';
      const cautionText = cautions.length ? `관찰이 필요한 영역: ${cautions.map(c => c.title).join(', ')}` : '';
      const strengthText = strengths.length ? `강점 영역: ${strengths.map(s => s.title).join(', ')}` : '';
      return ['스스로를 돌보려는 지금의 선택만으로도 이미 큰 진전이에요.', riskText, cautionText, strengthText]
        .filter(Boolean)
        .join('\n');
    };

    if (!this.geminiApiKey) {
      this.logger.warn('GEMINI_API_KEY 미설정 - 규칙 기반 요약 반환');
      return composeFallback();
    }

    const prompt = `역할: 공감적이고 실천지향적인 심리 코칭 보조자(한국어)

요청: 아래 "섹션 결과"(제목, 점수, 레벨, 메시지)를 바탕으로, 사용자의 현재 정서/상황을 서술형으로 자연스럽게 통합 설명해 주세요. 각 섹션 메시지를 단순 나열하지 말고, 하나의 이야기처럼 엮어 주세요.

구성 가이드(필수):
1) 공감 서두 2–3문장(사용자의 감정 경험 공감)
2) 인물 서술형 요약 5–7문장(섹션 "메시지"와 레벨 반영)
3) 강점 1–2문장(양호/매우 양호 기반 강화 포인트)
4) 실천 체크리스트 4개(각 1줄, 구체적 행동/빈도/시간. 명령조 지양)
5) 부드러운 격려 1문장(과도한 약속/의학적 표현 금지)

형식: 일반 텍스트. 체크리스트는 아래 예시처럼 이모지 불릿을 사용해 가독성을 높이세요.
예시)
[실천 체크리스트]\n
• ✅ 아침 10분 산책으로 몸을 깨워보세요\n
• 🕒 감정이 올라올 때 4-4-6 호흡 3분\n
• 📝 잠들기 전 오늘 좋았던 1가지 기록\n
• 🤝 신뢰하는 1인에게 안부/감사 메시지 보내기

스타일: 존댓말, 따뜻하고 차분한 톤, 의학적 진단/낙인 금지, 개인정보/호칭 없음. 전체 분량 250~500자.

섹션 결과(JSON):\n${JSON.stringify(sections, null, 2)}`;

    try {
      const res = await axios.post(
        `${this.geminiApiUrl}?key=${this.geminiApiKey}`,
        {
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ]
        },
        { timeout: 12000 }
      );

      const candidates = res.data?.candidates;
      const text = candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!text) throw new Error('Empty AI response');
      return text.trim();
    } catch (error: any) {
      this.logger.error('AI 종합 의견 생성 실패', error?.response?.data || error?.message);
      // 쿼터 초과 등은 폴백
      return composeFallback();
    }
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

  async getDiagnosisCounter() {
    // diagnosisType이 'BASELINE_TEMPERATURE'인 진단 결과 개수 반환
    const count = await this.prisma.diagnosisResult.count({
      where: { diagnosisType: 'BASELINE_TEMPERATURE' },
    });
    // 기본값 2391 이상으로 보이게 하고 싶으면 +2391 등 가공 가능
    return { count };
  }

  async incrementDiagnosisCounter() {
    // 실제 진단 저장과 별개로, 카운트만 증가시키고 싶으면 dummy row를 insert하거나, 프론트에서 진단 시작시 호출만 하고 count 반환
    // 여기서는 진짜로 row를 추가하지 않고, 단순히 count만 반환(실제 진단 저장은 따로 처리됨)
    // 만약 진짜로 카운트만 올리고 싶으면 redis나 별도 테이블을 써야 함. 여기선 단순 count 반환
    const count = await this.getDiagnosisCounter();
    return count;
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