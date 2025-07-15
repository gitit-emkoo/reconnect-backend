import { Controller, Post, Body, ValidationPipe, UsePipes, Get, Req, Res, UseGuards } from '@nestjs/common';
import { EmotionCardsService } from './emotion-cards.service';
import { RefineTextDto } from './dto/refine-text.dto';
import { RefinedTextResponseDto } from './dto/refined-text.response.dto';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { getPartnerId } from '../utils/getPartnerId';

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
    const userId = req.user.userId;
    const partnerId = getPartnerId(req.user);
    if (!userId || !partnerId) {
      console.log('[EmotionCardsController][GET /emotion-cards] 403: 파트너 연결이 필요합니다.');
      return res.status(403).json({ 
        message: '파트너와 연결이 필요한 메뉴입니다. 파트너와 연결 후 재시도 바랍니다.',
        code: 'PARTNER_REQUIRED'
      });
    }
    try {
      const cards = await this.emotionCardsService.getFilteredCards(userId, partnerId);
      return res.status(200).json(cards);
    } catch (error) {
      return res.status(500).json({ message: '감정카드 목록을 불러오지 못했습니다.' });
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createEmotionCard(@Body() body: any, @Req() req: any, @Res() res: Response) {
    const senderId = req.user.userId;
    const receiverId = getPartnerId(req.user);
    const coupleId = req.user.couple?.id;
    if (!senderId || !receiverId || !coupleId) {
      console.log('[EmotionCardsController] 400: senderId, receiverId, coupleId가 필요합니다.');
      return res.status(400).json({ message: 'senderId, receiverId, coupleId가 필요합니다.' });
    }
    try {
      const newCard = await this.emotionCardsService.createCard({ ...body, senderId, receiverId, coupleId });
      console.log('[EmotionCardsController] 생성된 카드:', newCard);
      return res.status(201).json(newCard);
    } catch (error) {
      console.error('[EmotionCardsController] 카드 생성 에러:', error);
      return res.status(500).json({ message: '감정카드 생성에 실패했습니다.' });
    }
  }

  @Get('received')
  @UseGuards(JwtAuthGuard)
  async getReceivedCards(@Req() req: any, @Res() res: Response) {
    const userId = req.user.userId;
    console.log('[EmotionCardsController][GET /emotion-cards/received] userId:', userId);
    try {
      const cards = await this.emotionCardsService.getReceivedCards(userId);
      return res.status(200).json(cards);
    } catch (error) {
      return res.status(500).json({ message: '받은 감정카드 목록을 불러오지 못했습니다.' });
    }
  }
} 