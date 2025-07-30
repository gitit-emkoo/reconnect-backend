import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getYear, getMonth, getWeek, startOfWeek, endOfWeek, subWeeks } from 'date-fns';
import { Report } from '@prisma/client';

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

    let challengesFailedCount = await this.prisma.challenge.count({
      where: {
        coupleId: coupleId,
        status: 'FAILED',
        endDate: {  // updatedAt 대신 endDate 기준으로 집계
          gte: weekStartDate,
          lte: weekEndDate,
        },
      },
    });

    // 주간 챌린지 활동이 없었는지 확인
    const challengesStartedCount = await this.prisma.challenge.count({
      where: { coupleId, createdAt: { gte: weekStartDate, lte: weekEndDate } },
    });
    const noChallengeActivity = challengesStartedCount === 0;
    
    // 전문가 솔루션, 결혼 진단 데이터 집계
    const coupleWithMembers = await this.prisma.couple.findUnique({
      where: { id: coupleId },
      include: { members: { select: { id: true } } },
    });
    const memberIds = coupleWithMembers ? coupleWithMembers.members.map(m => m.id) : [];

    // '상담' 기능은 추후 구현 예정이므로, 현재는 0으로 처리합니다.
    const expertSolutionsCount = 0;

    // '진단'은 종류와 상관없이 모두 카운트합니다.
    const diagnosisCount = await this.prisma.diagnosisResult.count({
      where: {
        userId: { in: memberIds },
        createdAt: { gte: weekStartDate, lte: weekEndDate },
      }
    });


    // 2. 관계 온도 계산
    const previousWeekStartDate = subWeeks(weekStartDate, 1);
    
    // 이전 주 리포트가 없으면 더 이전 주의 리포트를 찾기
    let baseScore = 61; // 기본값
    let previousReport: Report | null = null;
    
    // 최대 4주 전까지 찾아보기
    for (let i = 1; i <= 4; i++) {
      const targetWeekStartDate = subWeeks(weekStartDate, i);
      previousReport = await this.prisma.report.findUnique({
        where: {
          coupleId_weekStartDate: {
            coupleId,
            weekStartDate: targetWeekStartDate,
          },
        },
      });
      
      if (previousReport) {
        baseScore = previousReport.overallScore;
        this.logger.log(`${coupleId} 커플의 ${i}주 전 리포트를 기준점으로 사용: ${baseScore}`);
        break;
      }
    }
    
    // 이전 리포트가 없으면 베이스라인 진단 결과를 찾아서 사용
    if (!previousReport) {
      // 커플 멤버들의 베이스라인 진단 결과 찾기
      const coupleMembers = await this.prisma.couple.findUnique({
        where: { id: coupleId },
        select: { members: { select: { id: true } } },
      });

      if (coupleMembers && coupleMembers.members.length > 0) {
        const memberIds = coupleMembers.members.map(m => m.id);
        
        // 베이스라인 진단 결과 찾기 (INITIAL 또는 UNAUTH_CONVERTED)
        const baselineDiagnosis = await this.prisma.diagnosisResult.findFirst({
          where: {
            userId: { in: memberIds },
            resultType: {
              in: ['INITIAL', 'UNAUTH_CONVERTED'],
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        });

        if (baselineDiagnosis) {
          baseScore = baselineDiagnosis.score;
          this.logger.log(`${coupleId} 커플의 베이스라인 진단 결과를 기준점으로 사용: ${baseScore}`);
        } else {
          this.logger.log(`${coupleId} 커플의 베이스라인 진단 결과가 없어 기본값 61을 사용합니다.`);
        }
      } else {
        this.logger.log(`${coupleId} 커플의 멤버 정보를 찾을 수 없어 기본값 61을 사용합니다.`);
      }
    }
    const { score: overallScore, reason } = this.calculateOverallScore(baseScore, { 
      cardsSentCount, 
      challengesCompletedCount,
      challengesFailedCount,
      expertSolutionsCount, // 0으로 전달
      diagnosisCount, // 모든 진단 횟수 전달
      noChallengeActivity,
    });


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
        challengesFailedCount,
        expertSolutionsCount,
        marriageDiagnosisCount: diagnosisCount,
      },
      create: {
        coupleId: coupleId,
        weekStartDate: weekStartDate,
        overallScore,
        reason,
        cardsSentCount,
        challengesCompletedCount,
        challengesFailedCount,
        expertSolutionsCount,
        marriageDiagnosisCount: diagnosisCount,
      },
    });

    this.logger.log(`${coupleId} 커플의 리포트가 저장되었습니다. 점수: ${report.overallScore}`);

    // [추가] 리포트 점수를 커플 멤버들의 temperature에 반영
    const coupleMembers = await this.prisma.couple.findUnique({
      where: { id: coupleId },
      select: { members: { select: { id: true } } },
    });

    if (coupleMembers && coupleMembers.members.length > 0) {
      const memberIds = coupleMembers.members.map(m => m.id);
      await this.prisma.user.updateMany({
        where: { id: { in: memberIds } },
        data: { temperature: report.overallScore },
      });
      this.logger.log(`${coupleId} 커플 멤버(${memberIds.join(', ')})의 관계 온도를 ${report.overallScore}로 업데이트했습니다.`);
    }

    return report;
  }

  /**
   * 활동 데이터를 기반으로 관계 온도를 계산합니다.
   * @param baseScore 이전 주의 점수
   * @param activities 주간 활동 데이터
   */
  private calculateOverallScore(
    baseScore: number, 
    activities: { 
      cardsSentCount: number; 
      challengesCompletedCount: number; 
      challengesFailedCount: number;
      expertSolutionsCount: number;
      diagnosisCount: number;
      noChallengeActivity: boolean;
    }
  ): { score: number, reason: string } {
    let score = baseScore;
    let reason = "지난 주와 큰 변화가 없었어요.";
    const scoreChanges: string[] = [];

    // 감정 카드: 개당 +0.005점
    if (activities.cardsSentCount > 0) {
        score += activities.cardsSentCount * 0.005;
        scoreChanges.push(`마음 카드 교환(${activities.cardsSentCount}회)`);
    }

    // 챌린지 완료: 개당 +0.1점
    if (activities.challengesCompletedCount > 0) {
        score += activities.challengesCompletedCount * 0.1;
        scoreChanges.push(`챌린지 완료(${activities.challengesCompletedCount}회)`);
    }

    // 챌린지 실패: 개당 -0.025점
    if (activities.challengesFailedCount > 0) {
      score -= activities.challengesFailedCount * 0.025;
      scoreChanges.push(`챌린지 실패(${activities.challengesFailedCount}회)`);
    }

    // 챌린지 안 하기: 활동이 없는 경우 이전 온도 유지 (감점 제거)
    if (activities.noChallengeActivity) {
      // score -= 0.025; // 감점 제거
      // scoreChanges.push('주간 챌린지 미수행'); // 감점 메시지 제거
    }

    // 전문가 솔루션(상담)은 추후 구현 예정
    if (activities.expertSolutionsCount > 0) {
      // score += activities.expertSolutionsCount * 0.5;
      // scoreChanges.push(`전문가 솔루션 확인(${activities.expertSolutionsCount}회)`);
    }

    // 자기이해진단: 회당 +0.5점
    if (activities.diagnosisCount > 0) {
      score += activities.diagnosisCount * 0.5;
      scoreChanges.push(`진단 참여(${activities.diagnosisCount}회)`);
    }

    // 최대/최소 점수 제한
    score = Math.max(0, Math.min(100, score));
    
    if (scoreChanges.length > 0) {
        reason = `${scoreChanges.join(', ')}으로 온도가 변동했어요.`;
    }

    return { score: parseFloat(score.toFixed(3)), reason };
  }

  async findAvailableWeeks(coupleId: string) {
    const reports = await this.prisma.report.findMany({
      where: { coupleId },
      select: {
        id: true,
        weekStartDate: true,
      },
      orderBy: {
        weekStartDate: 'desc',
      },
    });

    // 월 기준 n번째 주차 계산 함수 (월요일 시작)
    function getWeekOfMonth(date: Date) {
      const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      // firstDayOfMonth.getDay(): 0(일)~6(토), 월요일=1
      // 월요일 시작 보정: (getDay() + 6) % 7
      const offset = (firstDayOfMonth.getDay() + 6) % 7;
      return Math.floor((date.getDate() + offset - 1) / 7) + 1;
    }

    const availableWeeks = reports.map(report => {
      const date = report.weekStartDate;
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const weekOfMonth = getWeekOfMonth(date);
      return {
        id: report.id,
        year,
        month,
        week: weekOfMonth,
        label: `${month}월 ${weekOfMonth}주차`,
        value: report.id,
      };
    });

    // 같은 달, 같은 주차에 여러 리포트가 있을 경우 중복 제거
    const uniqueWeeks = availableWeeks.filter(
      (week, index, self) =>
        index === self.findIndex(t => t.month === week.month && t.week === week.week)
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
    if (!coupleId) {
      throw new BadRequestException('Couple ID is required.');
    }
    return this.prisma.report.findFirst({
      where: { coupleId },
      orderBy: { weekStartDate: 'desc' },
    });
  }

  async getMyReports(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.coupleId) {
      return []; // 파트너가 없으면 빈 배열 반환
    }
    return this.prisma.report.findMany({
      where: { coupleId: user.coupleId },
      orderBy: { weekStartDate: 'desc' },
    });
  }
  
  /**
   * 년도와 주차를 기반으로 해당 주의 시작일(월요일)을 반환합니다.
   * @param year 년도
   * @param week 주차 (1-53)
   */
  private getWeekStartDate(year: number, week: number): Date {
    const date = new Date(year, 0, 1 + (week - 1) * 7);
    date.setDate(date.getDate() + (1 - date.getDay())); // 월요일 시작
    return date;
  }
} 