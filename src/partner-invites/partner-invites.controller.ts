import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PartnerInvitesService } from './partner-invites.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('partner-invites')
@UseGuards(JwtAuthGuard)
export class PartnerInvitesController {
  constructor(private readonly partnerInvitesService: PartnerInvitesService) {}

  @Post()
  async createInviteCode(@Request() req) {
    return this.partnerInvitesService.createInviteCode(req.user.id);
  }

  @Post('respond')
  async respondToInvite(
    @Body() body: { code: string },
    @Request() req
  ) {
    return this.partnerInvitesService.respondToInvite(body.code, req.user.id);
  }

  @Post(':inviteId/accept')
  async acceptInvite(
    @Param('inviteId') inviteId: string,
    @Request() req
  ) {
    return this.partnerInvitesService.acceptInvite(inviteId, req.user.id);
  }

  @Post(':inviteId/reject')
  async rejectInvite(
    @Param('inviteId') inviteId: string,
    @Request() req
  ) {
    return this.partnerInvitesService.rejectInvite(inviteId, req.user.id);
  }

  @Get('me')
  async getMyInvites(@Request() req) {
    return this.partnerInvitesService.getMyInvites(req.user.id);
  }
} 