// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Health Check를 위해 루트 경로는 제외하고 API 경로에만 '/api' 접두사 추가
  app.setGlobalPrefix('api', {
    exclude: ['/health']
  });
  
  // CORS 설정 강화
  app.enableCors({
    origin: [
      /^https:\/\/reconnect-.*\.vercel\.app$/, // Vercel 배포 및 모든 프리뷰 URL 허용
      'http://localhost:5173',              // 🚨 로컬 개발용 프론트엔드 주소 이거 절대 수정하면 안됨!!
      'http://localhost:5174',              // 🚨 로컬 개발용 프론트엔드 주소(2) 이거 절대 수정하면 안됨!!
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: 'Content-Type, Accept, Authorization', // Authorization 헤더 허용
  });

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  await app.listen(process.env.PORT || 3000);
}
bootstrap();