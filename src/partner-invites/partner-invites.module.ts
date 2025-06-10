import { Module } from '@nestjs/common';
import { PartnerInvitesController } from './partner-invites.controller';
import { PartnerInvitesService } from './partner-invites.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PartnerInvitesController],
  providers: [PartnerInvitesService],
  exports: [PartnerInvitesService],
})
export class PartnerInvitesModule {} 