import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CreateNotificationData {
  userId: string;
  message: string;
  type: string;
  url?: string;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async createNotification(data: CreateNotificationData) {
    // 사용자 알림 설정 확인 후 억제
    const pref = await this.prisma.notificationPreference.findUnique({ where: { userId: data.userId } });
    if (pref?.muteAll) return null;
    if (data.type?.startsWith('COMMUNITY') && pref?.muteCommunity) return null;
    if (data.type?.startsWith('CHALLENGE') && pref?.muteChallenge) return null;
    if (data.type?.startsWith('EMOTION_CARD') && pref?.muteEmotionCard) return null;

    return this.prisma.notification.create({ data });
  }

  // 사용자의 모든 알림 조회
  async getNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 알림 읽음 처리
  async markAsRead(notificationId: string) {
    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  }

  // 모든 알림 읽음 처리
  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  // 읽지 않은 알림 개수 조회
  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { userId, isRead: false },
    });
  }
}
