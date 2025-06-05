import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module'; // PrismaModule 임포트
import { UsersModule } from './users.module';
import { EmotionCardsModule } from './emotion-cards/emotion-cards.module'; // EmotionCardsModule 임포트 추가

@Module({
  imports: [AuthModule, PrismaModule, UsersModule, EmotionCardsModule], // EmotionCardsModule을 imports에 추가
  controllers: [AppController],
  providers: [AppService], // PrismaService는 이제 PrismaModule에서 제공됩니다.
})
export class AppModule {}