import { Controller, Get, UseGuards, Query, BadRequestException } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '@prisma/client';

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

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
} 