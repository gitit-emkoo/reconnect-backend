import { Module } from '@nestjs/common';
import { PartnerInvitesController } from './partner-invites.controller';
import { PartnerInvitesService } from './partner-invites.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
    NotificationsModule,
  ],
  controllers: [PartnerInvitesController],
  providers: [PartnerInvitesService],
  exports: [PartnerInvitesService],
})
export class PartnerInvitesModule {} 