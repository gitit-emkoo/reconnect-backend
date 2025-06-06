import { Module, ValidationPipe } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users.module'; // <--- 이 경로가 올바른 경로입니다.
import { EmotionCardsModule } from './emotion-cards/emotion-cards.module';
import { CommunityModule } from './community/community.module';
import { APP_PIPE } from '@nestjs/core';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    UsersModule,
    EmotionCardsModule,
    CommunityModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
  ],
})
export class AppModule {}