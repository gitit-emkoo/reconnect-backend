import { Controller, Post, Body, ValidationPipe, UsePipes, Get, Req, Res, UseGuards } from '@nestjs/common';
import { EmotionCardsService } from './emotion-cards.service';
import { RefineTextDto } from './dto/refine-text.dto';
import { RefinedTextResponseDto } from './dto/refined-text.response.dto';
import { Request, Response } from 'express';

@Controller('emotion-cards')
export class EmotionCardsController {
  constructor(private readonly emotionCardsService: EmotionCardsService) {}

  @Post('refine-text')
  @UsePipes(new ValidationPipe({ transform: true }))
  async refineEmotionCardText(
    @Body() refineTextDto: RefineTextDto,
  ): Promise<RefinedTextResponseDto> {
    const refinedText = await this.emotionCardsService.refineText(refineTextDto.text);
    return { refinedText };
  }

  @Get()
  async getEmotionCards(@Req() req: Request, @Res() res: Response) {
    console.log('[EmotionCardsController] GET /emotion-cards 요청:', req.headers);
    // TODO: 실제 서비스에서 사용자 인증 후, 해당 유저의 카드만 반환하도록 구현 필요
    // 임시로 전체 카드 반환 예시 (EmotionCardsService에 getAllCards 메서드 필요)
    try {
      const cards = await this.emotionCardsService.getAllCards();
      console.log('[EmotionCardsController] 응답 데이터:', cards);
      return res.status(200).json(cards);
    } catch (error) {
      console.error('[EmotionCardsController] 에러:', error);
      return res.status(500).json({ message: '감정카드 목록을 불러오지 못했습니다.' });
    }
  }

  @Post()
  async createEmotionCard(@Body() body: any, @Req() req: Request, @Res() res: Response) {
    console.log('[EmotionCardsController] POST /emotion-cards 요청:', body, req.headers);
    try {
      const newCard = await this.emotionCardsService.createCard(body);
      console.log('[EmotionCardsController] 생성된 카드:', newCard);
      return res.status(201).json(newCard);
    } catch (error) {
      console.error('[EmotionCardsController] 카드 생성 에러:', error);
      return res.status(500).json({ message: '감정카드 생성에 실패했습니다.' });
    }
  }
} 