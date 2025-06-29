import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
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
}
