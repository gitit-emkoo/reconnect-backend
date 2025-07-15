/**
 * [백엔드] users.service.ts
 * - 이 파일은 "실제 비즈니스 로직(DB 처리, 검증, 암호화 등)"을 담당합니다.
 * - 컨트롤러에서 호출되어 실제 데이터 변경/조회가 이루어집니다.
 * - 예: 비밀번호 변경, 프로필 수정, 유저 정보 조회 등
 */
import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { MailService } from '../mail/mail.service';
import { getPartnerId } from '../utils/getPartnerId';
import { v4 as uuidv4 } from 'uuid';
const multiavatar = require('@multiavatar/multiavatar');

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async updateNickname(userId: string, nickname: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { nickname },
    });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    // 비밀번호 제외
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        partner: true,
        partnerOf: true,
        couple: true,
      },
    });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, include: { partner: true, couple: true } });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new Error('현재 비밀번호가 일치하지 않습니다.');
    }
    if (currentPassword === newPassword) {
      throw new Error('새 비밀번호는 기존 비밀번호와 달라야 합니다.');
    }
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      throw new Error('비밀번호는 8자 이상, 영문/숫자/특수문자를 포함해야 합니다.');
    }
    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } });
    return { success: true };
  }

  async sendPasswordResetEmail(
    email: string,
  ): Promise<{ message: string; user?: any }> {
    console.log(`[sendPasswordResetEmail] Start for email: ${email}`);
    const user = await this.prisma.user.findUnique({ where: { email }, include: { partner: true, couple: true } });

    if (!user) {
      console.error(`[sendPasswordResetEmail] User not found: ${email}`);
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }
    console.log(`[sendPasswordResetEmail] Found user:`, user);

    // 임시 토큰 생성 (여기서는 간단히 UUID 사용, 실제 프로덕션에서는 더 안전한 방법 사용)
    const token = uuidv4();
    const expires = new Date(new Date().getTime() + 3600 * 1000); // 1시간 후 만료
    console.log(`[sendPasswordResetEmail] Generated token: ${token}`);

    await this.prisma.passwordReset.create({
      data: {
        email,
        token,
        expires,
      },
    });
    console.log(`[sendPasswordResetEmail] Saved token to DB`);

    // 이메일 발송
    const resetUrl = `https://reconnect-ivory.vercel.app/reset-password?token=${token}`;
    try {
      console.log(`[sendPasswordResetEmail] Attempting to send email to: ${email}`);
      await this.mailService.sendMail({
        to: email,
        subject: '[Reconnect] 비밀번호 재설정 안내',
        html: `
      <div style="font-family: 'Apple SD Gothic Neo', 'sans-serif'; width: 100%; max-width: 600px; margin: 0 auto; padding: 40px; box-sizing: border-box; background-color: #f9f9f9; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #333; font-size: 28px; font-weight: 600;">Reconnect</h1>
        </div>
        <div style="background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
          <h2 style="color: #444; font-size: 22px; margin-top: 0; margin-bottom: 20px;">비밀번호 재설정 요청</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            안녕하세요! Reconnect입니다.<br>
            계정의 비밀번호 재설정을 요청하셨습니다.
          </p>
          <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
            아래 버튼을 클릭하여 새로운 비밀번호를 설정해주세요.
          </p>
          <a href="${resetUrl}" target="_blank" style="display: inline-block; width: 100%; padding: 15px 0; text-align: center; background: linear-gradient(to right, #FF69B4, #785ce2); color: white; font-size: 16px; font-weight: 500; text-decoration: none; border-radius: 8px; box-sizing: border-box; padding: 10px 20px;">
            비밀번호 재설정하기
          </a>
          <p style="color: #888; font-size: 14px; margin-top: 30px; line-height: 1.5;">
            이 링크는 1시간 동안만 유효합니다.<br>
            만약 본인이 요청한 것이 아니라면, 이 이메일을 무시하셔도 안전합니다.
          </p>
        </div>
        <div style="text-align: center; margin-top: 30px;">
          <p style="color: #aaa; font-size: 12px;">© 2025 Reconnect. All rights reserved.</p>
        </div>
      </div>
      `,
      });
      console.log(`[sendPasswordResetEmail] Email sent successfully to: ${email}`);
    } catch (error) {
      console.error('[sendPasswordResetEmail] Failed to send email:', error);
      throw new InternalServerErrorException(
        '이메일 발송 중 오류가 발생했습니다.',
      );
    }

    return { message: '비밀번호 재설정 링크가 이메일로 전송되었습니다.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const passwordReset = await this.prisma.passwordReset.findUnique({
      where: { token },
    });

    if (!passwordReset || passwordReset.expires < new Date()) {
      throw new NotFoundException('유효하지 않은 토큰이거나 토큰이 만료되었습니다.');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: passwordReset.email },
      include: { partner: true, couple: true },
    });

    if (!user) {
      // This should not happen if the reset token was created correctly
      throw new NotFoundException('해당 이메일의 사용자를 찾을 수 없습니다.');
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      throw new BadRequestException('비밀번호는 8자 이상, 영문/숫자/특수문자를 포함해야 합니다.');
    }

    if (await bcrypt.compare(newPassword, user.password)) {
      throw new BadRequestException('새 비밀번호는 기존 비밀번호와 달라야 합니다.');
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    // Use a transaction to update the user's password and delete the reset token
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashed },
      }),
      this.prisma.passwordReset.delete({
        where: { id: passwordReset.id },
      }),
    ]);

    return { success: true, message: '비밀번호가 성공적으로 변경되었습니다.' };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        partner: true,
        couple: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...result } = user;
    return result;
  }

  async getMyTemperature(userId: string): Promise<{ temperature: number }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { temperature: true },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return { temperature: user.temperature };
  }

  async updateFcmToken(userId: string, fcmToken: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { fcmToken },
    });
  }

  async updateProfile(userId: string, nickname: string) {
    if (!nickname || nickname.length < 1 || nickname.length > 8) {
      throw new BadRequestException('닉네임은 1~8글자여야 합니다.');
    }
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { nickname },
      include: { partner: true, couple: true },
    });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async updateProfileImage(userId: string, profileImageUrl: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { profileImageUrl },
    });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async generateRandomAvatar(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('사용자를 찾을 수 없습니다.');

    // 매번 다른 랜덤 아바타 생성을 위해 랜덤 문자열 사용
    const randomSeed = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const svg = multiavatar(randomSeed);
    
    // SVG를 base64로 인코딩
    const base64 = Buffer.from(svg).toString('base64');
    
    // data URL로 반환 (미리보기용, DB에 저장하지 않음)
    const avatarUrl = `data:image/svg+xml;base64,${base64}`;

    // 원본 사용자 정보에 새로운 아바타 URL만 추가하여 반환
    const { password, ...userWithoutPassword } = user;
    return {
      ...userWithoutPassword,
      profileImageUrl: avatarUrl,
    };
  }

  async startSubscription(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { partner: true, couple: true },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    if (user.subscriptionStatus === 'SUBSCRIBED') {
      throw new BadRequestException('이미 구독 중인 사용자입니다.');
    }

    // 구독 상태를 SUBSCRIBED로 변경
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionStatus: 'SUBSCRIBED',
        subscriptionStartedAt: new Date(), // 구독 시작일 저장
      },
      include: { partner: true, couple: true },
    });

    const { password, ...userWithoutPassword } = updatedUser;
    return {
      ...userWithoutPassword,
      message: '구독이 성공적으로 시작되었습니다.',
    };
  }

  async withdraw(userId: string, reason: string) {
    console.log('[withdraw] 시작 - userId:', userId, 'reason:', reason);
    
    try {
      console.log('[withdraw] 사용자 정보 조회 시작');
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { partner: true, couple: true },
      });
      console.log('[withdraw] 사용자 정보 조회 완료:', {
        id: user?.id,
        email: user?.email,
        nickname: user?.nickname,
        hasPartner: !!user?.partner,
        hasCouple: !!user?.couple,
        partnerId: user?.partner?.id,
        coupleId: user?.couple?.id
      });

      if (!user) {
        console.log('[withdraw] 사용자를 찾을 수 없음 - userId:', userId);
        throw new NotFoundException('사용자를 찾을 수 없습니다.');
      }

      console.log('[withdraw] 트랜잭션 시작 - 관련 데이터 삭제 및 사용자 삭제');
      
      // 트랜잭션으로 모든 관련 데이터 삭제와 사용자 삭제를 함께 처리
      const result = await this.prisma.$transaction(async (tx) => {
        // 1. 탈퇴 사유 저장 (사용자 ID 없이)
        const withdrawalReason = await tx.withdrawalReason.create({
          data: {
            reason,
          },
        });
        console.log('[withdraw] 탈퇴 사유 저장 완료:', withdrawalReason);

        // 2. 관련된 모든 데이터 삭제
        console.log('[withdraw] 관련 데이터 삭제 시작');
        
        // PartnerInvite 삭제 (보낸 초대, 받은 초대)
        await tx.partnerInvite.deleteMany({
          where: {
            OR: [
              { inviterId: userId },
              { inviteeId: userId }
            ]
          }
        });
        console.log('[withdraw] PartnerInvite 삭제 완료');

        // 감정카드 삭제 (보낸 카드, 받은 카드)
        await tx.emotionCard.deleteMany({
          where: {
            OR: [
              { senderId: userId },
              { receiverId: userId }
            ]
          }
        });
        console.log('[withdraw] EmotionCard 삭제 완료');

        // 메시지 삭제 (보낸 메시지, 받은 메시지)
        await tx.message.deleteMany({
          where: {
            OR: [
              { senderId: userId },
              { receiverId: userId }
            ]
          }
        });
        console.log('[withdraw] Message 삭제 완료');

        // 감정일기 삭제
        await tx.emotionJournal.deleteMany({
          where: { authorId: userId }
        });
        console.log('[withdraw] EmotionJournal 삭제 완료');

        // 커뮤니티 포스트 삭제
        await tx.communityPost.deleteMany({
          where: { authorId: userId }
        });
        console.log('[withdraw] CommunityPost 삭제 완료');

        // 댓글 삭제
        await tx.comment.deleteMany({
          where: { authorId: userId }
        });
        console.log('[withdraw] Comment 삭제 완료');

        // 투표 삭제
        await tx.communityPostVote.deleteMany({
          where: { userId }
        });
        console.log('[withdraw] CommunityPostVote 삭제 완료');

        // 관계 설문 삭제
        await tx.relationshipSurvey.deleteMany({
          where: { respondentId: userId }
        });
        console.log('[withdraw] RelationshipSurvey 삭제 완료');

        // 일기 삭제
        await tx.diary.deleteMany({
          where: { userId }
        });
        console.log('[withdraw] Diary 삭제 완료');

        // 스케줄 삭제
        await tx.schedule.deleteMany({
          where: { userId }
        });
        console.log('[withdraw] Schedule 삭제 완료');

        // 콘텐츠 좋아요 삭제
        await tx.contentLike.deleteMany({
          where: { userId }
        });
        console.log('[withdraw] ContentLike 삭제 완료');

        // 콘텐츠 북마크 삭제
        await tx.contentBookmark.deleteMany({
          where: { userId }
        });
        console.log('[withdraw] ContentBookmark 삭제 완료');

        // 합의서 삭제 (작성자 또는 파트너)
        await tx.agreement.deleteMany({
          where: {
            OR: [
              { authorId: userId },
              { partnerId: userId }
            ]
          }
        });
        console.log('[withdraw] Agreement 삭제 완료');

        // 트랙 리포트 삭제
        await tx.trackReport.deleteMany({
          where: { userId }
        });
        console.log('[withdraw] TrackReport 삭제 완료');

        // 고객지원 문의 삭제
        await tx.supportInquiry.deleteMany({
          where: { userId }
        });
        console.log('[withdraw] SupportInquiry 삭제 완료');

        // 알림 삭제
        await tx.notification.deleteMany({
          where: { userId }
        });
        console.log('[withdraw] Notification 삭제 완료');

        // 진단 결과 삭제
        await tx.diagnosisResult.deleteMany({
          where: { userId }
        });
        console.log('[withdraw] DiagnosisResult 삭제 완료');

        // 비밀번호 재설정 토큰 삭제
        await tx.passwordReset.deleteMany({
          where: { email: user.email }
        });
        console.log('[withdraw] PasswordReset 삭제 완료');

        // 3. 사용자 계정 삭제
        const deletedUser = await tx.user.delete({
          where: { id: userId },
        });
        console.log('[withdraw] 사용자 계정 삭제 완료:', {
          id: deletedUser.id,
          email: deletedUser.email,
          nickname: deletedUser.nickname
        });

        return { withdrawalReason, deletedUser };
      });

      console.log('[withdraw] 트랜잭션 완료');
      console.log('[withdraw] 탈퇴 처리 완료');
      return { success: true, message: '탈퇴가 완료되었습니다.' };
    } catch (error) {
      console.error('[withdraw] 오류 발생:', error);
      console.error('[withdraw] 오류 스택:', error.stack);
      throw error;
    }
  }
} 