// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 모든 API 경로에 '/api' 접두사 추가
  app.setGlobalPrefix('api');
  
  // CORS 설정 강화
  app.enableCors({
    origin: [ 
      'https://reconnect-ivory.vercel.app', // 🚨배포된 프론트엔드 주소 이거 절대 수정하면 안됨!!
      'http://localhost:5173'                   // 🚨 로컬 개발용 프론트엔드 주소 이거 절대 수정하면 안됨!!
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