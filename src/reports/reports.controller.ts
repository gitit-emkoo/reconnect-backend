import { Controller, Get, Post, UseGuards, Query, BadRequestException } from '@nestjs/common';
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
   * (개발용) 수동으로 모든 커플의 지난주 리포트를 생성합니다.
   */
  @Post('generate')
  async generateReports() {
    // 실제 프로덕션에서는 이 엔드포인트를 AdminGuard 등으로 보호해야 합니다.
    return this.reportsService.generateWeeklyReports();
  }

  @Get('available-weeks')
  async findAvailableWeeks(@GetUser() user: User) {
    if (!user.coupleId) {
      throw new BadRequestException('Couple not found for this user.');
    }
    return this.reportsService.findAvailableWeeks(user.coupleId);
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