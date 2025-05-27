import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module'; // PrismaModule 임포트

@Module({
  imports: [AuthModule, PrismaModule], // AuthModule과 PrismaModule을 imports에 추가
  controllers: [AppController],
  providers: [AppService], // PrismaService는 이제 PrismaModule에서 제공됩니다.
})
export class AppModule {}