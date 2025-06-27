import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getYear, getMonth, getWeek, startOfWeek, endOfWeek, subWeeks } from 'date-fns';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);
  constructor(private prisma: PrismaService) {}

  /**
   * 모든 활성 커플에 대한 주간 리포트를 생성합니다.
   * 보통 스케줄러에 의해 매주 초에 실행됩니다.
   */
  async generateWeeklyReports() {
    this.logger.log('주간 리포트 생성을 시작합니다.');
    const activeCouples = await this.prisma.couple.findMany({
      where: { status: 'ACTIVE' },
      include: { members: true },
    });

    for (const couple of activeCouples) {
      // 지난주에 대한 리포트를 생성합니다.
      const lastWeek = subWeeks(new Date(), 1);
      await this.generateWeeklyReportForCouple(couple.id, lastWeek);
    }
    this.logger.log(`총 ${activeCouples.length} 커플의 리포트 생성을 완료했습니다.`);
  }

  /**
   * 특정 커플의 특정 주에 대한 리포트를 생성하거나 업데이트합니다.
   * @param coupleId 커플 ID
   * @param date 해당 주의 아무 날짜
   */
  async generateWeeklyReportForCouple(coupleId: string, date: Date) {
    const weekStartDate = startOfWeek(date, { weekStartsOn: 1 }); // 주의 시작은 월요일
    const weekEndDate = endOfWeek(date, { weekStartsOn: 1 });   // 주의 끝은 일요일

    this.logger.log(`${coupleId} 커플의 ${weekStartDate.toLocaleDateString()} ~ ${weekEndDate.toLocaleDateString()} 리포트를 생성합니다.`);

    // 1. 주간 활동 데이터 집계
    const cardsSentCount = await this.prisma.emotionCard.count({
      where: {
        coupleId: coupleId,
        createdAt: {
          gte: weekStartDate,
          lte: weekEndDate,
        },
      },
    });

    const challengesCompletedCount = await this.prisma.challenge.count({
      where: {
        coupleId: coupleId,
        status: 'COMPLETED',
        completedAt: {
          gte: weekStartDate,
          lte: weekEndDate,
        },
      },
    });
    
    // TODO: 추후 다른 활동 데이터 추가 (전문가 솔루션, 결혼 진단 등)
    const expertSolutionsCount = 0;
    const marriageDiagnosisCount = 0;


    // 2. 관계 온도 계산
    const previousWeekStartDate = subWeeks(weekStartDate, 1);
    const previousReport = await this.prisma.report.findUnique({
        where: {
            coupleId_weekStartDate: {
                coupleId,
                weekStartDate: previousWeekStartDate,
            },
        },
    });
    const baseScore = previousReport ? previousReport.overallScore : 50; // 이전 주 리포트가 없으면 50점으로 시작
    const { score: overallScore, reason } = this.calculateOverallScore(baseScore, { cardsSentCount, challengesCompletedCount });


    // 3. 리포트 생성 또는 업데이트 (Upsert)
    const report = await this.prisma.report.upsert({
      where: {
        coupleId_weekStartDate: {
          coupleId: coupleId,
          weekStartDate: weekStartDate,
        },
      },
      update: {
        overallScore,
        reason,
        cardsSentCount,
        challengesCompletedCount,
        expertSolutionsCount,
        marriageDiagnosisCount,
      },
      create: {
        coupleId: coupleId,
        weekStartDate: weekStartDate,
        overallScore,
        reason,
        cardsSentCount,
        challengesCompletedCount,
        expertSolutionsCount,
        marriageDiagnosisCount,
      },
    });

    this.logger.log(`${coupleId} 커플의 리포트가 저장되었습니다. 점수: ${report.overallScore}`);
    return report;
  }

  /**
   * 활동 데이터를 기반으로 관계 온도를 계산합니다.
   * @param baseScore 이전 주의 점수
   * @param activities 주간 활동 데이터
   */
  private calculateOverallScore(baseScore: number, activities: { cardsSentCount: number; challengesCompletedCount: number; }): { score: number, reason: string } {
    let score = baseScore;
    let reason = "지난 주와 큰 변화가 없었어요.";
    const scoreChanges: string[] = [];

    // 감정 카드: 개당 +2점
    if (activities.cardsSentCount > 0) {
        score += activities.cardsSentCount * 2;
        scoreChanges.push(`감정 카드 교환(${activities.cardsSentCount}회)`);
    }

    // 챌린지 완료: 개당 +5점
    if (activities.challengesCompletedCount > 0) {
        score += activities.challengesCompletedCount * 5;
        scoreChanges.push(`챌린지 완료(${activities.challengesCompletedCount}회)`);
    }

    // 최대/최소 점수 제한
    score = Math.max(0, Math.min(100, score));
    
    if (scoreChanges.length > 0) {
        reason = `${scoreChanges.join(', ')}으로 온도가 변동했어요.`;
    }

    return { score: parseFloat(score.toFixed(1)), reason };
  }

  async findAvailableWeeks(coupleId: string) {
    const reports = await this.prisma.report.findMany({
      where: { coupleId },
      select: {
        weekStartDate: true,
      },
      orderBy: {
        weekStartDate: 'desc',
      },
    });

    // 중복을 제거하고 년/월/주차 정보로 변환
    const availableWeeks = reports.map(report => {
      const date = report.weekStartDate;
      return {
        year: getYear(date),
        month: getMonth(date) + 1, // 0-11을 1-12로 변환
        week: getWeek(date, { weekStartsOn: 1 }), // 월요일 시작 기준
        label: `${getYear(date)}년 ${getMonth(date) + 1}월 ${getWeek(date, { weekStartsOn: 1 })}주차`,
        value: `${getYear(date)}-${getWeek(date, { weekStartsOn: 1 })}`,
      };
    });

    // 중복 제거
    const uniqueWeeks = availableWeeks.filter(
      (week, index, self) =>
        index === self.findIndex(t => t.value === week.value)
    );

    return uniqueWeeks;
  }

  async findReportByWeek(coupleId: string, year: number, week: number) {
    const start = this.getWeekStartDate(year, week);

    const report = await this.prisma.report.findFirst({
      where: {
        coupleId: coupleId,
        weekStartDate: start,
      },
    });

    return report;
  }

  async getMyLatestReport(coupleId: string) {
    return this.prisma.report.findFirst({
      where: { coupleId },
      orderBy: { weekStartDate: 'desc' },
    });
  }
  
  /**
   * 년도와 주차를 기반으로 해당 주의 시작일(월요일)을 반환합니다.
   * @param year 년도
   * @param week 주차 (1-53)
   */
  private getWeekStartDate(year: number, week: number): Date {
    // 1월 4일을 기준으로 계산해야 ISO 8601 주차 정의와 일관성을 유지하기 쉽습니다.
    const januaryFourth = new Date(year, 0, 4);
    const dayOfWeekOfJanFourth = januaryFourth.getDay(); // 0(일) - 6(토)
    const mondayOfFirstWeek = new Date(year, 0, 4 - (dayOfWeekOfJanFourth === 0 ? 6 : dayOfWeekOfJanFourth - 1));
    
    return new Date(mondayOfFirstWeek.setDate(mondayOfFirstWeek.getDate() + (week - 1) * 7));
  }
} 