import { 
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  Body,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '@prisma/client';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(@GetUser() user: User) {
    return this.notificationsService.getNotifications(user.id);
  }

  @Get('unread-count')
  async getUnreadCount(@GetUser() user: User) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return { count };
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    // TODO: Consider adding authorization logic to ensure
    // a user can only mark their own notifications as read.
    return this.notificationsService.markAsRead(id);
  }

  @Patch('read-all')
  async markAllAsRead(@GetUser() user: User) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  // 알림 설정 조회/업데이트
  @Get('preferences')
  async getPreferences(@GetUser() user: User) {
    const pref = await this.notificationsService['prisma'].notificationPreference.findUnique({ where: { userId: user.id } });
    return (
      pref || {
        muteAll: false,
        muteCommunity: false,
        muteChallenge: false,
        muteEmotionCard: false,
      }
    );
  }

  @Patch('preferences')
  async updatePreferences(
    @GetUser() user: User,
    @Body() body: Partial<{ muteAll: boolean; muteCommunity: boolean; muteChallenge: boolean; muteEmotionCard: boolean }>
  ) {
    const { muteAll, muteCommunity, muteChallenge, muteEmotionCard } = body || {};
    const updated = await this.notificationsService['prisma'].notificationPreference.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        muteAll: !!muteAll,
        muteCommunity: !!muteCommunity,
        muteChallenge: !!muteChallenge,
        muteEmotionCard: !!muteEmotionCard,
      },
      update: {
        muteAll: muteAll ?? undefined,
        muteCommunity: muteCommunity ?? undefined,
        muteChallenge: muteChallenge ?? undefined,
        muteEmotionCard: muteEmotionCard ?? undefined,
      },
    });
    return updated;
  }
}
