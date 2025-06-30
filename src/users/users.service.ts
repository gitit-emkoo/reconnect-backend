import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { MailService } from '../mail/mail.service';
import { getPartnerId } from '../utils/getPartnerId';

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
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
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

  async sendPasswordResetEmail(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException('해당 이메일의 사용자가 없습니다.');

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1시간 유효

    await this.prisma.user.update({
      where: { email },
      data: {
        resetPasswordToken: token,
        resetPasswordTokenExpires: expires,
      },
    });

    // 이메일 발송
    const resetUrl = `https://reconnect-ivory.vercel.app/reset-password?token=${token}`;
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
          <a href="${resetUrl}" target="_blank" style="display: inline-block; width: 100%; padding: 15px 0; text-align: center; background: linear-gradient(to right, #FF69B4, #785ce2); color: white; font-size: 16px; font-weight: 500; text-decoration: none; border-radius: 8px; box-sizing: border-box;">
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

    return { message: '비밀번호 재설정 링크가 이메일로 전송되었습니다.' };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordTokenExpires: {
          gte: new Date(),
        },
      },
    });

    if (!user) {
      throw new NotFoundException('유효하지 않은 토큰이거나 토큰이 만료되었습니다.');
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      throw new BadRequestException('비밀번호는 8자 이상, 영문/숫자/특수문자를 포함해야 합니다.');
    }
    
    if (await bcrypt.compare(newPassword, user.password)) {
        throw new BadRequestException('새 비밀번호는 기존 비밀번호와 달라야 합니다.');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        resetPasswordToken: null,
        resetPasswordTokenExpires: null,
      },
    });

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
} 