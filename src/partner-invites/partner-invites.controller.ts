import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PartnerInvitesService } from './partner-invites.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('partner-invites')
@UseGuards(JwtAuthGuard)
export class PartnerInvitesController {
  constructor(private readonly partnerInvitesService: PartnerInvitesService) {}

  @Post()
  async createInviteCode(@Request() req) {
    return this.partnerInvitesService.createInviteCode(req.user.userId);
  }

  @Post('respond')
  async respondToInvite(
    @Body() body: { code: string },
    @Request() req
  ) {
    return this.partnerInvitesService.respondToInvite(body.code, req.user.userId);
  }

  @Post(':inviteId/accept')
  async acceptInvite(
    @Param('inviteId') inviteId: string,
    @Request() req
  ) {
    return this.partnerInvitesService.acceptInvite(inviteId, req.user.userId);
  }

  @Post(':inviteId/reject')
  async rejectInvite(
    @Param('inviteId') inviteId: string,
    @Request() req
  ) {
    return this.partnerInvitesService.rejectInvite(inviteId, req.user.userId);
  }

  @Get('me')
  async getMyInvites(@Request() req) {
    console.log('[PartnerInvitesController] req.user:', req.user);
    if (req.user) {
      console.log('[PartnerInvitesController] req.user.userId:', req.user.userId);
    }
    const invites = await this.partnerInvitesService.getMyInvites(req.user.userId);
    console.log('[PartnerInvitesController] invites:', invites);
    return invites;
  }
} 