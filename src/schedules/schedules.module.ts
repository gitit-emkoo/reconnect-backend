import { Module } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { SchedulesController } from './schedules.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ReportsModule } from '../reports/reports.module';
import { ChallengesModule } from '../challenges/challenges.module';
import { TrackReportsModule } from '../track-reports/track-reports.module';

@Module({
  imports: [PrismaModule, ReportsModule, ChallengesModule, TrackReportsModule],
  controllers: [SchedulesController],
  providers: [SchedulesService],
  exports: [SchedulesService],
})
export class SchedulesModule {} 