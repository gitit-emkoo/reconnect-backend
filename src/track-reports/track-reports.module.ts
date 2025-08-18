import { Module } from '@nestjs/common';
import { TrackReportsService } from './track-reports.service';
import { TrackReportsController } from './track-reports.controller';
import { PrismaService } from '../prisma/prisma.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [TrackReportsController],
  providers: [TrackReportsService, PrismaService],
  exports: [TrackReportsService],
})
export class TrackReportsModule {} 