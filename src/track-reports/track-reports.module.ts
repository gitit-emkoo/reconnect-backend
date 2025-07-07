import { Module } from '@nestjs/common';
import { TrackReportsService } from './track-reports.service';
import { TrackReportsController } from './track-reports.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [TrackReportsController],
  providers: [TrackReportsService, PrismaService],
  exports: [TrackReportsService],
})
export class TrackReportsModule {} 