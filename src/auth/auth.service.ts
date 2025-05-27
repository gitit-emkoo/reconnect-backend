// src/auth/auth.service.ts
import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async register(email: string, password: string, nickname: string): Promise<User> {
    // 1. 이메일 중복 확인
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('이미 존재하는 이메일입니다.'); // HTTP 409 Conflict
    }

    // 2. 사용자 생성 (실제 비밀번호는 해싱 필요)
    const user = await this.prisma.user.create({
      data: {
        email,
        password, // 실제 앱에서는 bcrypt 등으로 해싱 필요
        nickname,
      },
    });

    // 민감 정보는 응답에서 제외
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: userPassword, ...result } = user;
    return result as User;
  }

  async login(email: string, password: string): Promise<User> {
    // 1. 사용자 이메일로 조회
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.'); // HTTP 401 Unauthorized
    }

    // 2. 비밀번호 일치 여부 확인 (실제 앱에서는 해싱된 비밀번호 비교)
    if (user.password !== password) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    // 로그인 성공 시 민감 정보 제외하고 반환
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: userPassword, ...result } = user;
    return result as User;
  }
}