import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AgreementService } from './agreement.service';
import { AgreementController } from './agreement.controller';

@Module({
  imports: [],
  controllers: [AgreementController],
  providers: [AgreementService, PrismaService, NotificationsService],
})
export class AgreementModule {} 