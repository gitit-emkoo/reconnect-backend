import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';
import { MailService } from '../mail/mail.service';

@Injectable()
export class TrackReportsService {
  private readonly logger = new Logger(TrackReportsService.name);
  private readonly geminiApiKey = process.env.GEMINI_API_KEY;
  private readonly geminiModelId = process.env.GEMINI_MODEL_ID || 'gemini-pro';
  private readonly geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModelId}:generateContent`;
  private readonly minDiaryCount = Number(process.env.TRACK_MIN_DIARIES || 6);

  constructor(private readonly prisma: PrismaService, private readonly mail: MailService) {}

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
      const diariesRaw = await this.prisma.diary.findMany({
        where: {
          userId,
          date: {
            gte: periodStart.toISOString().split('T')[0], // YYYY-MM-DD 형식
            lt: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0]
          }
        },
        orderBy: { date: 'asc' }
      });
      const diaries = diariesRaw.filter((d) => {
        const hasComment = !!(d.comment && String(d.comment).trim().length >= 5);
        const hasEmotion = !!(d.emotion && (d.emotion as any)?.name);
        const hasTrigger = Array.isArray(d.triggers) && (d.triggers as any[]).length > 0;
        return hasComment || hasEmotion || hasTrigger;
      });

      // 최소 N개 이상의 일기가 있어야 리포트 생성
      if (diaries.length < this.minDiaryCount) {
        this.logger.log(`사용자 ${userId}: 유효 일기 수 ${diaries.length}개로 부족하여 리포트 생성 건너뜀 (필요: ${this.minDiaryCount})`);
        return;
      }

      // 감정 및 트리거 통계 계산
      const emotionStats = this.calculateEmotionStats(diaries);
      const triggerStats = this.calculateTriggerStats(diaries);

      // 지난 달 리포트 조회 (비교용)
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevReport = await this.prisma.trackReport.findUnique({
        where: { userId_monthStartDate: { userId, monthStartDate: prevMonthStart } },
      });

      // AI 분석 수행 (확장 지표 + 전월 비교 포함)
      const aiAnalysis = await this.generateAIAnalysis(diaries, emotionStats, triggerStats, {
        prevEmotionStats: (prevReport?.emotionStats as any) || null,
        prevTriggerStats: (prevReport?.triggerStats as any) || null,
      });

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
    triggerStats: Record<string, number>,
    context?: { prevEmotionStats?: Record<string, number> | null; prevTriggerStats?: Record<string, number> | null }
  ): Promise<string> {
    if (!this.geminiApiKey) {
      this.logger.warn('Gemini API Key가 설정되지 않아 기본 분석 텍스트(JSON)를 반환합니다.');
      const extended = this.computeExtendedStats(diaries);
      return JSON.stringify({
        summary: this.generateDefaultAnalysis(emotionStats, triggerStats),
        comparison: this.generateDefaultComparison(context?.prevEmotionStats || {}, context?.prevTriggerStats || {}, emotionStats, triggerStats),
        suggestions: this.generateDefaultSuggestions(extended),
        metrics: { emotionStats, triggerStats, ...extended },
      });
    }

    try {
      // 확장 지표 계산
      const extended = this.computeExtendedStats(diaries);

      // 감정일기 내용 요약
      const diaryContents = diaries.map(diary => ({
        date: diary.date,
        emotion: (diary.emotion as any)?.name || '알 수 없음',
        triggers: (diary.triggers as any[])?.map(t => t.name).join(', ') || '없음',
        comment: diary.comment || ''
      }));

      const prompt = `다음은 한 달간의 감정일기 데이터입니다.

감정 통계: ${JSON.stringify(emotionStats)}
트리거 통계: ${JSON.stringify(triggerStats)}
확장 지표: ${JSON.stringify(extended)}
전월 감정 통계: ${JSON.stringify(context?.prevEmotionStats || {})}
전월 트리거 통계: ${JSON.stringify(context?.prevTriggerStats || {})}

일기 요약:
${diaryContents.map(d => `- ${d.date}: ${d.emotion} (${d.triggers}) - ${d.comment}`).join('\n')}

요구사항:
- 한국어, 친근하고 따뜻한 톤
- 길이: 200~300자 내 요약(summary)
- 전월 대비 변화(comparison): 핵심 변화 1~2가지 설명(100자 내)
- 개선 제안(suggestions): 사용자가 즉시 시도할 수 있는 3가지 행동 제안(각 1줄)
- metrics로 확장 지표(extended)도 함께 포함

반드시 아래 JSON 스키마로만 응답하세요 (추가 설명 금지):
{
  "summary": string,
  "comparison": string,
  "suggestions": string[3],
  "metrics": {
    "emotionStats": object,
    "triggerStats": object,
    "dayOfWeekStats": object,
    "timeOfDayStats": object,
    "averageCommentLength": number,
    "positivityRatio": number,
    "topKeywords": string[],
    "topEmojis": string[]
  }
}`;

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

      if (response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
        const text = response.data.candidates[0].content.parts[0].text.trim();
        // 응답이 JSON이 아닐 수 있으므로 파싱 가능 여부 확인 후 원문/래핑
        try {
          JSON.parse(text);
          return text;
        } catch {
          return JSON.stringify({
            summary: text,
            comparison: this.generateDefaultComparison(context?.prevEmotionStats || {}, context?.prevTriggerStats || {}, emotionStats, triggerStats),
            suggestions: this.generateDefaultSuggestions(extended),
            metrics: { emotionStats, triggerStats, ...extended },
          });
        }
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
      
      const extended = this.computeExtendedStats(diaries);
      return JSON.stringify({
        summary: this.generateDefaultAnalysis(emotionStats, triggerStats),
        comparison: this.generateDefaultComparison(context?.prevEmotionStats || {}, context?.prevTriggerStats || {}, emotionStats, triggerStats),
        suggestions: this.generateDefaultSuggestions(extended),
        metrics: { emotionStats, triggerStats, ...extended },
      });
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

  private generateDefaultComparison(
    prevEmotion: Record<string, number>,
    prevTrigger: Record<string, number>,
    currEmotion: Record<string, number>,
    currTrigger: Record<string, number>,
  ): string {
    const top = (stats: Record<string, number>) => Object.entries(stats).sort(([,a],[,b]) => b-a)[0]?.[0];
    const pe = top(prevEmotion) || 'N/A';
    const ce = top(currEmotion) || 'N/A';
    const pt = top(prevTrigger) || 'N/A';
    const ct = top(currTrigger) || 'N/A';
    if (pe === 'N/A' && pt === 'N/A') return '전월 데이터가 없어 비교 정보를 제공할 수 없어요.';
    const parts: string[] = [];
    if (pe !== ce) parts.push(`가장 빈번한 감정이 '${pe}'에서 '${ce}'로 바뀌었습니다.`);
    if (pt !== ct) parts.push(`주요 트리거가 '${pt}'에서 '${ct}'로 변화했어요.`);
    return parts.join(' ') || '큰 변화 없이 유사한 패턴이 이어졌습니다.';
  }

  private generateDefaultSuggestions(extended: ReturnType<TrackReportsService['computeExtendedStats']>): string[] {
    const suggestions: string[] = [];
    // 시간대별에 따라 루틴 제안
    const peakTime = Object.entries(extended.timeOfDayStats).sort(([,a],[,b]) => b-a)[0]?.[0];
    if (peakTime) suggestions.push(`${peakTime}에 감정변화가 잦아요. 이 시간엔 5분 호흡명상이나 짧은 산책을 시도해보세요.`);
    // 요일별 루틴
    const peakDay = Object.entries(extended.dayOfWeekStats).sort(([,a],[,b]) => b-a)[0]?.[0];
    if (peakDay) suggestions.push(`${peakDay}엔 파트너와 하루 감정 체크인을 해보세요. 서로의 상태를 간단히 나누면 도움이 돼요.`);
    // 키워드 기반 행동
    const key = extended.topKeywords[0];
    if (key) suggestions.push(`'${key}'와 관련된 일이 반복돼요. 작은 목표를 정해 구체적으로 개선해보면 어떨까요?`);
    while (suggestions.length < 3) suggestions.push('하루 1회 감정일기를 짧게라도 기록하며 패턴을 관찰해보세요.');
    return suggestions.slice(0,3);
  }

  private computeExtendedStats(diaries: any[]) {
    const dayOfWeekStats: Record<string, number> = { 일:0, 월:0, 화:0, 수:0, 목:0, 금:0, 토:0 };
    const timeOfDayStats: Record<string, number> = { 새벽:0, 아침:0, 오후:0, 밤:0 };
    let totalLen = 0;
    let countLen = 0;
    const emojiRegex = /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u;
    const emojiCounts: Record<string, number> = {};
    const wordCounts: Record<string, number> = {};
    const positiveEmotions = new Set(['행복','기쁨','감사','설렘','만족']);
    const negativeEmotions = new Set(['슬픔','화남','분노','불안','두려움','우울']);
    let pos = 0, neg = 0;

    for (const d of diaries) {
      const created = d.createdAt ? new Date(d.createdAt) : (d.date ? new Date(d.date) : null);
      if (created) {
        const dow = ['일','월','화','수','목','금','토'][created.getDay()];
        dayOfWeekStats[dow] = (dayOfWeekStats[dow] || 0) + 1;
        const hour = created.getHours();
        const tod = hour < 6 ? '새벽' : hour < 12 ? '아침' : hour < 18 ? '오후' : '밤';
        timeOfDayStats[tod] = (timeOfDayStats[tod] || 0) + 1;
      }

      const emotionName = (d.emotion as any)?.name;
      if (emotionName) {
        if (positiveEmotions.has(emotionName)) pos++;
        if (negativeEmotions.has(emotionName)) neg++;
      }

      const comment = (d.comment || '') as string;
      if (comment) {
        totalLen += comment.length;
        countLen++;
        // 간단 키워드 추출
        const tokens = comment
          .toLowerCase()
          .replace(/[^\p{L}0-9\s]/gu, ' ')
          .split(/\s+/)
          .filter(w => w.length >= 2 && !['그리고','그래서','하지만','나는','우리는','정말','조금','너무','많이','더','좀','등','의','이','그','저','또','또는','및'].includes(w));
        for (const t of tokens) wordCounts[t] = (wordCounts[t] || 0) + 1;
        // 이모지 카운트 (가벼운 방식)
        for (const ch of Array.from(comment)) {
          if (emojiRegex.test(ch)) emojiCounts[ch] = (emojiCounts[ch] || 0) + 1;
        }
      }
    }

    const averageCommentLength = countLen ? Math.round((totalLen / countLen) * 10) / 10 : 0;
    const positivityRatio = pos + neg > 0 ? Math.round((pos / (pos + neg)) * 100) / 100 : 0;
    const topKeywords = Object.entries(wordCounts).sort(([,a],[,b]) => b-a).slice(0,5).map(([w]) => w);
    const topEmojis = Object.entries(emojiCounts).sort(([,a],[,b]) => b-a).slice(0,5).map(([e]) => e);

    return { dayOfWeekStats, timeOfDayStats, averageCommentLength, positivityRatio, topKeywords, topEmojis };
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
      this.logger.log(`[DEV] generateManualTrackReportForUser start user=${userId}`);
      // 지난 달 1일과 마지막 날 계산
      const now = new Date();
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      
      // 구독 시작일이 지난 달보다 늦으면 구독 시작일부터
      const periodStart = subscriptionStartedAt > lastMonthStart ? subscriptionStartedAt : lastMonthStart;
      
      // 해당 기간의 감정일기 조회
      const diariesRaw = await this.prisma.diary.findMany({
        where: {
          userId,
          date: {
            gte: periodStart.toISOString().split('T')[0],
            lte: lastMonthEnd.toISOString().split('T')[0]
          }
        },
        orderBy: { date: 'asc' }
      });
      this.logger.log(`[DEV] last-month diariesRaw=${diariesRaw.length} periodStart=${periodStart.toISOString()} lastMonthEnd=${lastMonthEnd.toISOString()}`);
      const diaries = diariesRaw.filter((d) => {
        const hasComment = !!(d.comment && String(d.comment).trim().length >= 5);
        const hasEmotion = !!(d.emotion && (d.emotion as any)?.name);
        const hasTrigger = Array.isArray(d.triggers) && (d.triggers as any[]).length > 0;
        return hasComment || hasEmotion || hasTrigger;
      });
      this.logger.log(`[DEV] last-month validDiaries=${diaries.length}`);

      // 개발용: 데이터가 없어도 플레이스홀더로 발행
      const emotionStats: any = diaries.length > 0 ? this.calculateEmotionStats(diaries) : {};
      const triggerStats: any = diaries.length > 0 ? this.calculateTriggerStats(diaries) : {};
      const t1 = Date.now();
      const aiAnalysis = diaries.length > 0
        ? await this.generateAIAnalysis(diaries, emotionStats, triggerStats)
        : JSON.stringify({
            summary: '지난 달 데이터가 부족하여 기본 리포트를 생성했습니다.',
            comparison: '',
            suggestions: [
              '다음 달에는 감정일기를 3개 이상 작성해보세요.',
              '하루 끝에 간단 메모라도 남겨 꾸준함을 유지해보세요.',
              '키워드(감정/트리거)를 함께 기록하면 분석 품질이 향상됩니다.'
            ],
            metrics: { emotionStats: {}, triggerStats: {}, dayOfWeekStats: {}, timeOfDayStats: {}, averageCommentLength: 0, positivityRatio: 0, topKeywords: [], topEmojis: [] }
          });
      this.logger.log(`[DEV] last-month aiAnalysis ms=${Date.now()-t1}`);

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

  /**
   * 현재 월의 일기 진행 현황 반환
   */
  async getCurrentMonthProgress(userId: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const diariesRaw = await this.prisma.diary.findMany({
      where: {
        userId,
        date: {
          gte: monthStart.toISOString().split('T')[0],
          lt: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0],
        },
      },
      orderBy: { date: 'asc' },
    });
    const valid = diariesRaw.filter((d) => {
      const hasComment = !!(d.comment && String(d.comment).trim().length >= 5);
      const hasEmotion = !!(d.emotion && (d.emotion as any)?.name);
      const hasTrigger = Array.isArray(d.triggers) && (d.triggers as any[]).length > 0;
      return hasComment || hasEmotion || hasTrigger;
    });
    return {
      monthStartDate: monthStart,
      totalDiaryCount: diariesRaw.length,
      validDiaryCount: valid.length,
      minRequired: this.minDiaryCount,
      canGenerate: valid.length >= this.minDiaryCount,
    };
  }

  /**
   * 사용자 요청으로 현재 월 리포트 즉시 생성 (최소 일기 충족 시)
   */
  async generateCurrentMonthNow(userId: string, subscriptionStartedAt: Date) {
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const subscriptionStart = new Date(subscriptionStartedAt);
    const periodStart = subscriptionStart > currentMonthStart ? subscriptionStart : currentMonthStart;

    const diariesRaw = await this.prisma.diary.findMany({
      where: {
        userId,
        date: {
          gte: periodStart.toISOString().split('T')[0],
          lt: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0],
        },
      },
      orderBy: { date: 'asc' },
    });
    const diaries = diariesRaw.filter((d) => {
      const hasComment = !!(d.comment && String(d.comment).trim().length >= 5);
      const hasEmotion = !!(d.emotion && (d.emotion as any)?.name);
      const hasTrigger = Array.isArray(d.triggers) && (d.triggers as any[]).length > 0;
      return hasComment || hasEmotion || hasTrigger;
    });
    if (diaries.length < this.minDiaryCount) {
      return { generated: false, reason: 'MIN_DIARIES_NOT_MET', count: diaries.length, min: this.minDiaryCount };
    }

    const emotionStats = this.calculateEmotionStats(diaries);
    const triggerStats = this.calculateTriggerStats(diaries);
    const aiAnalysis = await this.generateAIAnalysis(diaries, emotionStats, triggerStats);

    await this.prisma.trackReport.upsert({
      where: { userId_monthStartDate: { userId, monthStartDate: currentMonthStart } },
      update: { emotionStats, triggerStats, aiAnalysis, totalDiaryCount: diaries.length, updatedAt: new Date() },
      create: { userId, monthStartDate: currentMonthStart, emotionStats, triggerStats, aiAnalysis, totalDiaryCount: diaries.length },
    });
    return { generated: true };
  }

  /**
   * 개발/테스트용: 현재 월 리포트 강제 생성 (최소 일기 수 제한 없음)
   */
  async generateCurrentMonthManual(userId: string, subscriptionStartedAt: Date) {
    this.logger.log(`[DEV] generateCurrentMonthManual start user=${userId}`);
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const subscriptionStart = new Date(subscriptionStartedAt);
    const periodStart = subscriptionStart > currentMonthStart ? subscriptionStart : currentMonthStart;

    const diariesRaw = await this.prisma.diary.findMany({
      where: {
        userId,
        date: {
          gte: periodStart.toISOString().split('T')[0],
          lt: new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split('T')[0],
        },
      },
      orderBy: { date: 'asc' },
    });
    this.logger.log(`[DEV] current-month diariesRaw=${diariesRaw.length} periodStart=${periodStart.toISOString()} now=${now.toISOString()}`);
    const diaries = diariesRaw.filter((d) => {
      const hasComment = !!(d.comment && String(d.comment).trim().length >= 5);
      const hasEmotion = !!(d.emotion && (d.emotion as any)?.name);
      const hasTrigger = Array.isArray(d.triggers) && (d.triggers as any[]).length > 0;
      return hasComment || hasEmotion || hasTrigger;
    });
    this.logger.log(`[DEV] current-month validDiaries=${diaries.length}`);

    // 개발용: 데이터가 없어도 플레이스홀더로 발행
    const emotionStats: any = diaries.length > 0 ? this.calculateEmotionStats(diaries) : {};
    const triggerStats: any = diaries.length > 0 ? this.calculateTriggerStats(diaries) : {};
    const t0 = Date.now();
    const aiAnalysis = diaries.length > 0
      ? await this.generateAIAnalysis(diaries, emotionStats, triggerStats)
      : JSON.stringify({
          summary: '이번 달 데이터가 부족하여 기본 리포트를 생성했습니다.',
          comparison: '',
          suggestions: [
            '이번 달에는 감정일기를 3개 이상 작성해보세요.',
            '하루 끝에 간단 메모라도 남겨 꾸준함을 유지해보세요.',
            '키워드(감정/트리거)를 함께 기록하면 분석 품질이 향상됩니다.'
          ],
          metrics: { emotionStats: {}, triggerStats: {}, dayOfWeekStats: {}, timeOfDayStats: {}, averageCommentLength: 0, positivityRatio: 0, topKeywords: [], topEmojis: [] }
        });
    this.logger.log(`[DEV] current-month aiAnalysis ms=${Date.now()-t0}`);

    await this.prisma.trackReport.upsert({
      where: { userId_monthStartDate: { userId, monthStartDate: currentMonthStart } },
      update: { emotionStats, triggerStats, aiAnalysis, totalDiaryCount: diaries.length, updatedAt: new Date() },
      create: { userId, monthStartDate: currentMonthStart, emotionStats, triggerStats, aiAnalysis, totalDiaryCount: diaries.length },
    });
    return { generated: true };
  }

  /**
   * 이메일 발송: 이번 달 리포트 요약 + PDF 첨부
   */
  async emailCurrentMonthReport(userId: string) {
    // 사용자와 최신 리포트 조회
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user?.email) throw new Error('사용자 이메일이 없습니다.');
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const report = await this.prisma.trackReport.findUnique({ where: { userId_monthStartDate: { userId, monthStartDate: monthStart } } });
    if (!report) throw new Error('이번 달 리포트가 없습니다.');

    // 본문 HTML (요약/변화/제안 파싱)
    let parsed: any = null;
    try { parsed = JSON.parse(report.aiAnalysis as any); } catch {}
    const summary = parsed?.summary || report.aiAnalysis;
    const comparison = parsed?.comparison || '';
    const suggestions: string[] = Array.isArray(parsed?.suggestions) ? parsed.suggestions : [];
    const html = `
      <div>
        <h2>이번 달 감정 트랙 리포트</h2>
        <p>${summary}</p>
        ${comparison ? `<p><strong>전월 대비 변화</strong>: ${comparison}</p>` : ''}
        ${suggestions.length ? `<ul>${suggestions.slice(0,3).map((s: string) => `<li>${s}</li>`).join('')}</ul>` : ''}
      </div>
    `;

    // PDF 생성 (간단 텍스트 기반)
    // 동적 로드로 의존성 유연화 (런타임에만 필요)
    const moduleName = 'pdfkit';
    const imported: any = await (Function('m', 'return import(m)') as any)(moduleName);
    const PDF = imported.default || imported;
    const doc = new PDF({ size: 'A4', margin: 50 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    const title = `${monthStart.getFullYear()}년 ${monthStart.getMonth()+1}월 감정 트랙 리포트`;
    doc.fontSize(18).text(title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text('요약');
    doc.moveDown(0.4).fontSize(11).text(summary, { align: 'left' });
    if (comparison) { doc.moveDown().fontSize(12).text('전월 대비 변화'); doc.moveDown(0.4).fontSize(11).text(comparison); }
    if (suggestions.length) { doc.moveDown().fontSize(12).text('개선 제안'); suggestions.slice(0,3).forEach((s) => doc.moveDown(0.2).fontSize(11).text(`• ${s}`)); }
    doc.end();
    const pdfBuffer: Buffer = await new Promise((resolve) => {
      const end = () => resolve(Buffer.concat(chunks));
      doc.on('end', end);
    });

    await this.mail.sendMail({
      to: user.email,
      subject: title,
      html,
      attachments: [{ filename: 'track-report.pdf', content: pdfBuffer, contentType: 'application/pdf' }],
    });
  }
} 