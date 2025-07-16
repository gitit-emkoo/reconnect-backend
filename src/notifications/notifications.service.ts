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
    return this.prisma.notification.create({
      data,
    });
  }

  // 파트너 연결 알림
  async createPartnerConnectedNotification(userId: string, partnerName: string) {
    return this.createNotification({
      userId,
      message: `파트너 ${partnerName}님이 연결되었습니다. 낮은 온도를 갖고 있는 파트너의 온도로 동기화됩니다.`,
      type: 'PARTNER_CONNECTED',
      url: '/dashboard',
    });
  }

  // 감정 카드 수신 알림
  async createEmotionCardNotification(userId: string) {
    return this.createNotification({
      userId,
      message: '새 감정카드가 도착했어요!',
      type: 'EMOTION_CARD_RECEIVED',
      url: '/emotion-card?tab=received',
    });
  }

  // 챌린지 완료 알림
  async createChallengeCompletedNotification(userId: string, challengeTitle: string) {
    return this.createNotification({
      userId,
      message: `챌린지 "${challengeTitle}"이 완료되었습니다!`,
      type: 'CHALLENGE_COMPLETED',
      url: '/challenge',
    });
  }

  // 챌린지 시작 알림
  async createChallengeStartedNotification(userId: string, challengeTitle: string) {
    return this.createNotification({
      userId,
      message: `새로운 챌린지 "${challengeTitle}"이 시작되었습니다!`,
      type: 'CHALLENGE_STARTED',
      url: '/challenge',
    });
  }

  // 합의서 작성 알림
  async createAgreementCreatedNotification(userId: string, agreementTitle: string) {
    return this.createNotification({
      userId,
      message: `파트너가 "${agreementTitle}" 합의서를 작성했습니다. 확인해주세요.`,
      type: 'AGREEMENT_CREATED',
      url: '/agreement',
    });
  }

  // 합의서 서명 요청 알림
  async createAgreementSignatureRequestNotification(userId: string, agreementTitle: string) {
    return this.createNotification({
      userId,
      message: `파트너가 "${agreementTitle}" 합의서에 서명했습니다. 서명을 완료해주세요.`,
      type: 'AGREEMENT_SIGNATURE_REQUEST',
      url: '/agreement',
    });
  }

  // 합의서 완료 알림
  async createAgreementCompletedNotification(userId: string, agreementTitle: string) {
    return this.createNotification({
      userId,
      message: `"${agreementTitle}" 합의서가 완료되었습니다! PDF로 발행할 수 있습니다.`,
      type: 'AGREEMENT_COMPLETED',
      url: '/issued-agreements',
    });
  }

  // 합의서 PDF 발행 알림
  async createAgreementPublishedNotification(userId: string, agreementTitle: string) {
    return this.createNotification({
      userId,
      message: `"${agreementTitle}" 합의서가 PDF로 발행되었습니다.`,
      type: 'AGREEMENT_PUBLISHED',
      url: '/issued-agreements',
    });
  }

  // 사용자의 모든 알림 조회
  async getNotifications(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // 읽지 않은 알림 개수 조회
  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: { 
        userId, 
        isRead: false 
      },
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

  // 오래된 알림 삭제 (30일 이상)
  async deleteOldNotifications() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    return this.prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo,
        },
        isRead: true,
      },
    });
  }
}
