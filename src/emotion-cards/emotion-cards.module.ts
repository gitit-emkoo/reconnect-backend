import { Module } from '@nestjs/common';
import { EmotionCardsController } from './emotion-cards.controller';
import { EmotionCardsService } from './emotion-cards.service';

@Module({
  controllers: [EmotionCardsController],
  providers: [EmotionCardsService],
})
export class EmotionCardsModule {} 