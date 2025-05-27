import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service'; // PrismaService 임포트
import { User } from '@prisma/client'; // Prisma 클라이언트에서 생성된 User 타입 임포트

@Injectable()
export class AppService {
  constructor(private prisma: PrismaService) {} // PrismaService를 주입받음

  getHello(): string {
    return 'Hello World!';
  }

  async createTestUser(email: string, nickname: string): Promise<User> {
    return this.prisma.user.create({
      data: {
        email,
        password: 'testpassword', // 실제 앱에서는 해싱된 비밀번호 사용
        nickname,
      },
    });
  }

  async getAllUsers(): Promise<User[]> {
    return this.prisma.user.findMany();
  }
}