import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { ValidationPipe } from '@nestjs/common'; // 이 부분이 중요!

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- CORS 활성화 설정 ---
  app.enableCors({
    origin: 'http://localhost:5174',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // --- 전역 유효성 검사 파이프 추가 ---
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // DTO에 정의되지 않은 속성은 자동으로 제거
    forbidNonWhitelisted: true, // DTO에 정의되지 않은 속성이 있을 경우 에러 발생
    transform: true, // DTO 클래스 인스턴스로 자동 변환
  }));

  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  await app.listen(3000);
}
bootstrap();
