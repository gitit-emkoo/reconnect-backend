// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service'; // PrismaService 임포트

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // PrismaService 인스턴스를 가져와서 enableShutdownHooks 호출
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);

  await app.listen(3000);
}
bootstrap();
