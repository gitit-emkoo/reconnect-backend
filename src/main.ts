// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 환경 변수에서 허용할 프론트엔드 URL 목록을 가져옴
  // FRONTEND_URL_PROD (배포 환경)과 FRONTEND_URL_DEV (개발 환경)
  // 쉼표로 구분된 문자열을 배열로 변환
  const allowedOrigins = [
    process.env.FRONTEND_URL_PROD,
    ...(process.env.FRONTEND_URL_DEV?.split(',') || []), // 개발 URL은 쉼표로 분리하여 배열로 추가
  ].filter(Boolean); // 빈 문자열 제거
  console.log('Backend CORS allowedOrigins:', allowedOrigins);

  app.enableCors({
    origin: allowedOrigins, // <-- 배열로 변경
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.setGlobalPrefix('api');

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