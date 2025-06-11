import { Controller, Post, Body, ValidationPipe, UsePipes, Get, Req, Res, UseGuards } from '@nestjs/common';
import { EmotionCardsService } from './emotion-cards.service';
import { RefineTextDto } from './dto/refine-text.dto';
import { RefinedTextResponseDto } from './dto/refined-text.response.dto';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

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
  @UseGuards(JwtAuthGuard)
  async getEmotionCards(@Req() req: any, @Res() res: Response) {
    // req.user에서 userId, partnerId 추출 (구조에 따라 조정)
    const userId = req.user.userId;
    const partnerId = req.user.partnerId || req.user.partner?.id;
    console.log('[EmotionCardsController][GET /emotion-cards] req.user:', req.user);
    console.log('[EmotionCardsController][GET /emotion-cards] userId:', userId, 'partnerId:', partnerId);
    if (!userId || !partnerId) {
      console.log('[EmotionCardsController][GET /emotion-cards] 400: userId와 partnerId가 필요합니다.');
      return res.status(400).json({ message: 'userId와 partnerId가 필요합니다.' });
    }
    try {
      const cards = await this.emotionCardsService.getFilteredCards(userId, partnerId);
      return res.status(200).json(cards);
    } catch (error) {
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

  @Get('received')
  async getReceivedCards(@Req() req: Request, @Res() res: Response) {
    // 실제 서비스에서는 req.user.id 등에서 유저 id 추출 필요
    // 임시로 쿼리 파라미터 userId 사용
    console.log('[EmotionCardsController][GET /emotion-cards/received] req.query:', req.query);
    const userId = req.query.userId as string;
    if (!userId) {
      console.log('[EmotionCardsController][GET /emotion-cards/received] 400: userId 쿼리 파라미터가 필요합니다.');
      return res.status(400).json({ message: 'userId 쿼리 파라미터가 필요합니다.' });
    }
    try {
      const cards = await this.emotionCardsService.getReceivedCards(userId);
      return res.status(200).json(cards);
    } catch (error) {
      return res.status(500).json({ message: '받은 감정카드 목록을 불러오지 못했습니다.' });
    }
  }
} 