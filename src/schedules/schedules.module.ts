import { Module } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ReportsModule } from '../reports/reports.module';
import { ChallengesModule } from '../challenges/challenges.module';

@Module({
  imports: [PrismaModule, ReportsModule, ChallengesModule],
  controllers: [SchedulesController],
  providers: [SchedulesService],
  exports: [SchedulesService],
})
export class SchedulesModule {} 