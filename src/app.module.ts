import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { EmotionCardsModule } from './emotion-cards/emotion-cards.module';
import { CommunityModule } from './community/community.module';
import { APP_PIPE } from '@nestjs/core';
import { UploadsModule } from './uploads/uploads.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PartnerInvitesModule } from './partner-invites/partner-invites.module';
import { DiaryModule } from './diary/diary.module';
import { ChallengesModule } from './challenges/challenges.module';
import { SchedulesModule } from './schedules/schedules.module';
import { ContentModule } from './content/content.module';

@Module({
  imports: [
    UsersModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    AuthModule,
    PrismaModule,
    EmotionCardsModule,
    CommunityModule,
    PartnerInvitesModule,
    UploadsModule,
    DiaryModule,
    ChallengesModule,
    SchedulesModule,
    ContentModule,
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