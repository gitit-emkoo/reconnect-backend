import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto, UpdateScheduleDto } from './dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReportsService } from '../reports/reports.service';
import { ChallengesService } from '../challenges/challenges.service';
import { TrackReportsService } from '../track-reports/track-reports.service';

@Injectable()
export class SchedulesService {
  private readonly logger = new Logger(SchedulesService.name);
  private isGeneratingWeeklyReports = false; // 중복 실행 방지 플래그

  constructor(
    private prisma: PrismaService,
    private readonly reportsService: ReportsService,
    private readonly challengesService: ChallengesService,
    private readonly trackReportsService: TrackReportsService,
  ) {}

  async create(createScheduleDto: CreateScheduleDto, userId: string) {
    return this.prisma.schedule.create({
      data: {
        ...createScheduleDto,
        userId,
      },
    });
  }

  async findAllByUserId(userId: string) {
    return this.prisma.schedule.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      throw new NotFoundException('일정을 찾을 수 없습니다.');
    }

    if (schedule.userId !== userId) {
      throw new ForbiddenException('이 일정에 접근할 권한이 없습니다.');
    }

    return schedule;
  }

  async update(id: string, updateScheduleDto: UpdateScheduleDto, userId: string) {
    // 먼저 일정이 존재하고 사용자가 소유자인지 확인
    await this.findOne(id, userId);

    return this.prisma.schedule.update({
      where: { id },
      data: updateScheduleDto,
    });
  }

  async remove(id: string, userId: string) {
    // 먼저 일정이 존재하고 사용자가 소유자인지 확인
    await this.findOne(id, userId);

    return this.prisma.schedule.delete({
      where: { id },
    });
  }

  async findByDate(date: string, userId: string) {
    return this.prisma.schedule.findMany({
      where: {
        userId,
        date,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * 매주 월요일 오전 1시(서버 UTC 기준)에 주간 리포트를 생성합니다.
   */
  @Cron('0 1 * * 1', {
    name: 'generateWeeklyReports',
    // 개발 환경에서는 크론잡 비활성화
    disabled: process.env.NODE_ENV !== 'production',
  })
  async handleWeeklyReportGeneration() {
    // 중복 실행 방지
    if (this.isGeneratingWeeklyReports) {
      this.logger.warn('주간 리포트 생성 작업이 이미 실행 중입니다. 중복 실행을 건너뜁니다.');
      return;
    }

    try {
      this.isGeneratingWeeklyReports = true;
      this.logger.log('주간 리포트 생성 작업을 시작합니다.');
      
      // 1. 먼저 만료된 챌린지 실패 처리
      this.logger.log('만료된 챌린지 실패 처리를 시작합니다.');
      await this.challengesService.failExpiredChallenges();
      this.logger.log('만료된 챌린지 실패 처리를 완료했습니다.');
      
      // 2. 주간 리포트 생성
      await this.reportsService.generateWeeklyReports();
      this.logger.log('주간 리포트 생성 작업을 완료했습니다.');
    } catch (error) {
      this.logger.error('주간 리포트 생성 작업 중 오류 발생:', error);
    } finally {
      this.isGeneratingWeeklyReports = false;
    }
  }

  /**
   * 매월 1일 오전 10시에 월간 트랙 리포트를 생성합니다.
   */
  @Cron('0 1 1 * *', {
    name: 'generateMonthlyTrackReports',
    // 개발 환경에서는 크론잡 비활성화
    disabled: process.env.NODE_ENV !== 'production',
  })
  async handleMonthlyTrackReportGeneration() {
    this.logger.log('월간 트랙 리포트 생성 작업을 시작합니다.');
    await this.trackReportsService.generateMonthlyTrackReports();
    this.logger.log('월간 트랙 리포트 생성 작업을 완료했습니다.');
  }
} 