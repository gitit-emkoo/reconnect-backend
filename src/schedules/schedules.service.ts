import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto, UpdateScheduleDto } from './dto';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReportsService } from '../reports/reports.service';
import { ChallengesService } from '../challenges/challenges.service';

@Injectable()
export class SchedulesService {
  private readonly logger = new Logger(SchedulesService.name);

  constructor(
    private prisma: PrismaService,
    private readonly reportsService: ReportsService,
    private readonly challengesService: ChallengesService,
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
   * 매주 월요일 자정에 주간 리포트를 생성합니다.
   */
  @Cron(CronExpression.MONDAY_AT_MIDNIGHT, {
    name: 'generateWeeklyReports',
    timeZone: 'Asia/Seoul',
  })
  async handleWeeklyReportGeneration() {
    this.logger.log('주간 리포트 생성 작업을 시작합니다.');
    await this.reportsService.generateWeeklyReports();
    this.logger.log('주간 리포트 생성 작업을 완료했습니다.');
  }

  /**
   * 매일 자정에 만료된 챌린지를 확인하고 실패 처리합니다.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    name: 'failExpiredChallenges',
    timeZone: 'Asia/Seoul',
  })
  async handleExpiredChallenges() {
    this.logger.log('만료된 챌린지 확인 및 실패 처리 작업을 시작합니다.');
    await this.challengesService.failExpiredChallenges();
    this.logger.log('만료된 챌린지 확인 및 실패 처리 작업을 완료했습니다.');
  }
} 