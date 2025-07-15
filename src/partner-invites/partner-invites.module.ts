import { Module } from '@nestjs/common';
import { PartnerInvitesController } from './partner-invites.controller';
import { PartnerInvitesService } from './partner-invites.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthModule } from '../auth/auth.module';
import { DiagnosisModule } from '../diagnosis/diagnosis.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '30d' }, // 30일로 통일
    }),
    NotificationsModule,
    AuthModule,
    DiagnosisModule,
  ],
  controllers: [PartnerInvitesController],
  providers: [PartnerInvitesService],
  exports: [PartnerInvitesService],
})
export class PartnerInvitesModule {} 