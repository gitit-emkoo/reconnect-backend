import { Module } from '@nestjs/common';
import { EmotionCardsController } from './emotion-cards.controller';
import { EmotionCardsService } from './emotion-cards.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EmotionCardsController],
  providers: [EmotionCardsService],
})
export class EmotionCardsModule {} 