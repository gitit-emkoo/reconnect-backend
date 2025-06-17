import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { MailService } from './mail.service';

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

    // 이메일 발송 (mailService는 추후 구현)
    const resetUrl = `https://reconnect-ivory.vercel.app/reset-password?token=${token}`;
    if (this.mailService && this.mailService.sendMail) {
      await this.mailService.sendMail({
        to: email,
        subject: '비밀번호 재설정 안내',
        html: `<a href="${resetUrl}">여기를 클릭해 비밀번호를 재설정하세요.</a>`,
      });
    } else {
      console.log(`메일 발송: ${email}, 제목: 비밀번호 재설정 안내, 내용: ${resetUrl}`);
    }

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
} 