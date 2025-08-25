// src/prisma/prisma.service.ts
import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  constructor() {
    super();
  }

  async onModuleInit() {
    await this.$connect(); // NestJS 앱이 시작될 때 Prisma Client를 데이터베이스에 연결
  }

  async enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', async () => {
      await app.close(); // NestJS 앱이 종료되기 전에 데이터베이스 연결을 끊습니다.
    });
  }
}