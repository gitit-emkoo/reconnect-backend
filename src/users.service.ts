import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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
} 