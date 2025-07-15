import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class TrackReportsService {
  private readonly logger = new Logger(TrackReportsService.name);
  private readonly geminiApiKey = process.env.GEMINI_API_KEY;
  private readonly geminiModelId = process.env.GEMINI_MODEL_ID || 'gemini-pro';
  private readonly geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModelId}:generateContent`;

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 매월 1일 오전 10시에 실행되는 월간 트랙 리포트 생성
   */
  async generateMonthlyTrackReports() {
    this.logger.log('월간 트랙 리포트 생성 시작');

    try {
      // 구독자 목록 조회
      const subscribedUsers = await this.prisma.user.findMany({
        where: {
          subscriptionStatus: 'SUBSCRIBED',
          subscriptionStartedAt: { not: null }
        },
        select: {
          id: true,
          subscriptionStartedAt: true
        }
      });

      this.logger.log(`구독자 ${subscribedUsers.length}명 발견`);

      for (const user of subscribedUsers) {
        await this.generateTrackReportForUser(user.id, user.subscriptionStartedAt!);
      }

      this.logger.log('모든 구독자의 트랙 리포트 생성 완료');
    } catch (error) {
      this.logger.error('트랙 리포트 생성 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * 특정 사용자의 트랙 리포트 생성
   */
  async generateTrackReportForUser(userId: string, subscriptionStartedAt: Date) {
    try {
      // 이번 달 1일 계산
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      // 구독 시작일부터 이번 달 1일까지의 기간 계산
      const subscriptionStart = new Date(subscriptionStartedAt);
      const periodStart = subscriptionStart > currentMonthStart ? subscriptionStart : currentMonthStart;
      
      // 해당 기간의 감정일기 조회
      const diaries = await this.prisma.diary.findMany({
        where: {
          userId,
          date: {
            gte: periodStart.toISOString().split('T')[0], // YYYY-MM-DD 형식
            lt: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0]
          }
        },
        orderBy: { date: 'asc' }
      });

      // 최소 7개 이상의 일기가 있어야 리포트 생성
      if (diaries.length < 7) {
        this.logger.log(`사용자 ${userId}: 일기 수 ${diaries.length}개로 부족하여 리포트 생성 건너뜀`);
        return;
      }

      // 감정 및 트리거 통계 계산
      const emotionStats = this.calculateEmotionStats(diaries);
      const triggerStats = this.calculateTriggerStats(diaries);

      // AI 분석 수행
      const aiAnalysis = await this.generateAIAnalysis(diaries, emotionStats, triggerStats);

      // 트랙 리포트 저장
      await this.prisma.trackReport.upsert({
        where: {
          userId_monthStartDate: {
            userId,
            monthStartDate: currentMonthStart
          }
        },
        update: {
          emotionStats,
          triggerStats,
          aiAnalysis,
          totalDiaryCount: diaries.length,
          updatedAt: new Date()
        },
        create: {
          userId,
          monthStartDate: currentMonthStart,
          emotionStats,
          triggerStats,
          aiAnalysis,
          totalDiaryCount: diaries.length
        }
      });

      this.logger.log(`사용자 ${userId}의 ${currentMonthStart.getFullYear()}년 ${currentMonthStart.getMonth() + 1}월 트랙 리포트 생성 완료`);
    } catch (error) {
      this.logger.error(`사용자 ${userId} 트랙 리포트 생성 실패:`, error);
    }
  }

  /**
   * 감정 통계 계산
   */
  private calculateEmotionStats(diaries: any[]): Record<string, number> {
    const emotionCounts: Record<string, number> = {};
    
    diaries.forEach(diary => {
      const emotion = diary.emotion as any;
      if (emotion && emotion.name) {
        emotionCounts[emotion.name] = (emotionCounts[emotion.name] || 0) + 1;
      }
    });

    return emotionCounts;
  }

  /**
   * 트리거 통계 계산
   */
  private calculateTriggerStats(diaries: any[]): Record<string, number> {
    const triggerCounts: Record<string, number> = {};
    
    diaries.forEach(diary => {
      const triggers = diary.triggers as any[];
      if (triggers && Array.isArray(triggers)) {
        triggers.forEach(trigger => {
          if (trigger && trigger.name) {
            triggerCounts[trigger.name] = (triggerCounts[trigger.name] || 0) + 1;
          }
        });
      }
    });

    return triggerCounts;
  }

  /**
   * AI 분석 생성
   */
  private async generateAIAnalysis(
    diaries: any[], 
    emotionStats: Record<string, number>, 
    triggerStats: Record<string, number>
  ): Promise<string> {
    if (!this.geminiApiKey) {
      this.logger.warn('Gemini API Key가 설정되지 않아 기본 분석 텍스트를 반환합니다.');
      return this.generateDefaultAnalysis(emotionStats, triggerStats);
    }

    try {
      // 감정일기 내용 요약
      const diaryContents = diaries.map(diary => ({
        date: diary.date,
        emotion: (diary.emotion as any)?.name || '알 수 없음',
        triggers: (diary.triggers as any[])?.map(t => t.name).join(', ') || '없음',
        comment: diary.comment || ''
      }));

      const prompt = `다음은 한 달간의 감정일기 데이터입니다. 

감정 통계: ${JSON.stringify(emotionStats, null, 2)}
트리거 통계: ${JSON.stringify(triggerStats, null, 2)}

일기 내용:
${diaryContents.map(d => `- ${d.date}: ${d.emotion} (${d.triggers}) - ${d.comment}`).join('\n')}

위 데이터를 바탕으로 다음을 분석해주세요:
1. 가장 많이 경험한 감정과 그 의미
2. 가장 자주 나타난 트리거와 그 영향
3. 전반적인 감정 패턴과 트렌드
4. 개선점이나 주의사항

친근하고 따뜻한 톤으로 200-300자 내외로 작성해주세요.`;

      const response = await axios.post(
        `${this.geminiApiUrl}?key=${this.geminiApiKey}`,
        {
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (
        response.data?.candidates?.[0]?.content?.parts?.[0]?.text
      ) {
        return response.data.candidates[0].content.parts[0].text.trim();
      } else {
        throw new Error('AI 응답 형식이 올바르지 않습니다.');
      }
    } catch (error) {
      this.logger.error('AI 분석 생성 실패:', error);
      
      // 오버쿼트 에러인지 확인
      if (axios.isAxiosError(error) && error.response?.data?.error?.message) {
        const errorMessage = error.response.data.error.message;
        if (errorMessage.includes('quota') || errorMessage.includes('queries') || errorMessage.includes('limit')) {
          this.logger.warn('Gemini API 할당량 초과 - 기본 분석 텍스트 반환');
        }
      }
      
      return this.generateDefaultAnalysis(emotionStats, triggerStats);
    }
  }

  /**
   * 기본 분석 텍스트 생성 (AI 실패 시 사용)
   */
  private generateDefaultAnalysis(
    emotionStats: Record<string, number>, 
    triggerStats: Record<string, number>
  ): string {
    const topEmotion = Object.entries(emotionStats)
      .sort(([,a], [,b]) => b - a)[0];
    const topTrigger = Object.entries(triggerStats)
      .sort(([,a], [,b]) => b - a)[0];

    return `이번 달에는 '${topEmotion?.[0] || '다양한'} 감정을 가장 많이 경험하셨네요. '${topTrigger?.[0] || '일상'}과 관련된 일들이 감정에 큰 영향을 미쳤습니다. 꾸준한 감정 기록을 통해 자신의 감정 패턴을 더 잘 이해할 수 있게 되었을 거예요. 앞으로도 건강한 감정 관리를 위해 노력해보세요!`;
  }

  /**
   * 사용자의 트랙 리포트 조회
   */
  async getUserTrackReports(userId: string) {
    return this.prisma.trackReport.findMany({
      where: { userId },
      orderBy: { monthStartDate: 'desc' }
    });
  }

  /**
   * 특정 월의 트랙 리포트 조회
   */
  async getTrackReportByMonth(userId: string, monthStartDate: Date) {
    return this.prisma.trackReport.findUnique({
      where: {
        userId_monthStartDate: {
          userId,
          monthStartDate
        }
      }
    });
  }

  /**
   * 개발/테스트용 수동 트랙 리포트 생성 (7개 제한 없음)
   */
  async generateManualTrackReports() {
    this.logger.log('수동 트랙 리포트 생성 시작');

    try {
      // 구독자 목록 조회
      const subscribedUsers = await this.prisma.user.findMany({
        where: {
          subscriptionStatus: 'SUBSCRIBED',
          subscriptionStartedAt: { not: null }
        },
        select: {
          id: true,
          subscriptionStartedAt: true
        }
      });

      this.logger.log(`구독자 ${subscribedUsers.length}명 발견`);

      for (const user of subscribedUsers) {
        await this.generateManualTrackReportForUser(user.id, user.subscriptionStartedAt!);
      }

      this.logger.log('모든 구독자의 수동 트랙 리포트 생성 완료');
    } catch (error) {
      this.logger.error('수동 트랙 리포트 생성 중 오류 발생:', error);
      throw error;
    }
  }

  /**
   * 특정 사용자의 수동 트랙 리포트 생성 (7개 제한 없음)
   */
  async generateManualTrackReportForUser(userId: string, subscriptionStartedAt: Date) {
    try {
      // 지난 달 1일과 마지막 날 계산
      const now = new Date();
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      
      // 구독 시작일이 지난 달보다 늦으면 구독 시작일부터
      const periodStart = subscriptionStartedAt > lastMonthStart ? subscriptionStartedAt : lastMonthStart;
      
      // 해당 기간의 감정일기 조회
      const diaries = await this.prisma.diary.findMany({
        where: {
          userId,
          date: {
            gte: periodStart.toISOString().split('T')[0],
            lte: lastMonthEnd.toISOString().split('T')[0]
          }
        },
        orderBy: { date: 'asc' }
      });

      // 개발용이므로 7개 제한 제거 - 1개 이상이면 생성
      if (diaries.length === 0) {
        this.logger.log(`사용자 ${userId}: 일기 수 0개로 리포트 생성 건너뜀`);
        return;
      }

      // 감정 및 트리거 통계 계산
      const emotionStats = this.calculateEmotionStats(diaries);
      const triggerStats = this.calculateTriggerStats(diaries);

      // AI 분석 수행
      const aiAnalysis = await this.generateAIAnalysis(diaries, emotionStats, triggerStats);

      // 트랙 리포트 저장 (지난 달 기준)
      await this.prisma.trackReport.upsert({
        where: {
          userId_monthStartDate: {
            userId,
            monthStartDate: lastMonthStart
          }
        },
        update: {
          emotionStats,
          triggerStats,
          aiAnalysis,
          totalDiaryCount: diaries.length,
          updatedAt: new Date()
        },
        create: {
          userId,
          monthStartDate: lastMonthStart,
          emotionStats,
          triggerStats,
          aiAnalysis,
          totalDiaryCount: diaries.length
        }
      });

      this.logger.log(`사용자 ${userId}의 ${lastMonthStart.getFullYear()}년 ${lastMonthStart.getMonth() + 1}월 수동 트랙 리포트 생성 완료 (일기 ${diaries.length}개)`);
    } catch (error) {
      this.logger.error(`사용자 ${userId} 수동 트랙 리포트 생성 실패:`, error);
    }
  }
} 