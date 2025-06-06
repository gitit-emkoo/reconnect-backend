import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users.module';
import { EmotionCardsModule } from './emotion-cards/emotion-cards.module';
import { CommunityModule } from './community/community.module';
import { CoupleModule } from './couple/couple.module';
import { ChallengeModule } from './challenge/challenge.module';
import { EmotionCardModule } from './emotion-card/emotion-card.module';
import { ReportModule } from './report/report.module';
import { ContentModule } from './content/content.module';
import { EmotionJournalModule } from './emotion-journal/emotion-journal.module';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    UsersModule,
    EmotionCardsModule,
    CommunityModule,
    CoupleModule,
    ChallengeModule,
    EmotionCardModule,
    ReportModule,
    ContentModule,
    EmotionJournalModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}