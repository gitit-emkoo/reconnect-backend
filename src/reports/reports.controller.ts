import { Controller, Get, Post, UseGuards, Query, BadRequestException } from '@nestjs/common';
import { subWeeks } from 'date-fns';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '@prisma/client';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * (개발용) 수동으로 모든 커플의 특정 주차 리포트를 생성합니다.
   */
  @Post('generate')
  async generateReports(
    @Query('year') year?: string,
    @Query('month') month?: string,
    @Query('week') week?: string,
  ) {
    // 실제 프로덕션에서는 이 엔드포인트를 AdminGuard 등으로 보호해야 합니다.
    
    let targetDate: Date;
    
    if (year && month && week) {
      // 특정 주차 지정
      const firstDayOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
      const offset = (firstDayOfMonth.getDay() + 6) % 7;
      targetDate = new Date(parseInt(year), parseInt(month) - 1, 1 + (parseInt(week) - 1) * 7 + offset);
    } else {
      // 기본값: 지난주
      targetDate = subWeeks(new Date(), 1);
    }
    
    return this.reportsService.generateWeeklyReportsForDate(targetDate);
  }

  /**
   * (개발용) 특정 커플의 특정 주차 리포트를 재생성합니다.
   */
  @Post('regenerate')
  async regenerateReport(
    @GetUser() user: User,
    @Query('year') year: string,
    @Query('month') month: string,
    @Query('week') week: string,
  ) {
    if (!user.coupleId) {
      throw new BadRequestException('Couple not found for this user.');
    }
    if (!year || !month || !week) {
      throw new BadRequestException('Year, month, and week are required.');
    }
    
    // 해당 주차의 시작일 계산 (월요일)
    const targetDate = new Date(parseInt(year), parseInt(month) - 1, 1);
    // 해당 월의 첫 번째 날부터 시작해서 주차 계산
    const firstDayOfMonth = new Date(parseInt(year), parseInt(month) - 1, 1);
    const offset = (firstDayOfMonth.getDay() + 6) % 7; // 월요일 시작 보정
    const weekStartDate = new Date(parseInt(year), parseInt(month) - 1, 1 + (parseInt(week) - 1) * 7 + offset);
    
    return this.reportsService.generateWeeklyReportForCouple(user.coupleId, weekStartDate);
  }

  @Get('available-weeks')
  async findAvailableWeeks(@GetUser() user: any) {
    const coupleId = user.coupleId || (user.couple && user.couple.id);
    console.log('GET /reports/available-weeks user:', user);
    console.log('GET /reports/available-weeks coupleId:', coupleId);
    if (!coupleId) {
      throw new BadRequestException('Couple not found for this user.');
    }
    return this.reportsService.findAvailableWeeks(coupleId);
  }

  @Get()
  async findReport(
    @GetUser() user: User,
    @Query('year') year: string,
    @Query('week') week: string,
  ) {
    if (!user.coupleId) {
      throw new BadRequestException('Couple not found for this user.');
    }
    if (!year || !week) {
      throw new BadRequestException('Year and week are required.');
    }
    return this.reportsService.findReportByWeek(user.coupleId, parseInt(year), parseInt(week));
  }

  @Get('my-latest')
  async findMyLatest(@GetUser() user: User) {
    if (!user.coupleId) {
      throw new BadRequestException('Couple not found for this user.');
    }
    return this.reportsService.getMyLatestReport(user.coupleId);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getMyReports(@GetUser() user: User) {
    return this.reportsService.getMyReports(user.id);
  }

  @Get('week')
  @UseGuards(AuthGuard('jwt'))
  async getReportByWeek(
    @GetUser() user: User,
    @Query('year') year: string,
    @Query('week') week: string,
  ) {
    if (!user.coupleId) {
      throw new BadRequestException('Couple not found for this user.');
    }
    if (!year || !week) {
      throw new BadRequestException('Year and week are required.');
    }
    return this.reportsService.findReportByWeek(user.coupleId, parseInt(year), parseInt(week));
  }
} 