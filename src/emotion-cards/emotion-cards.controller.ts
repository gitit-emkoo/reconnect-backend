import { Controller, Post, Body, ValidationPipe, UsePipes, Get, Req, Res, UseGuards } from '@nestjs/common';
import { EmotionCardsService } from './emotion-cards.service';
import { RefineTextDto } from './dto/refine-text.dto';
import { RefinedTextResponseDto } from './dto/refined-text.response.dto';
import { Request, Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { getPartnerId } from '../utils/getPartnerId';
import { PrismaService } from '../prisma/prisma.service';

@Controller('emotion-cards')
export class EmotionCardsController {
  constructor(
    private readonly emotionCardsService: EmotionCardsService,
    private readonly prisma: PrismaService,
  ) {}

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
    console.log('[EmotionCardsController][GET /emotion-cards] req.user:', req.user);
    console.log('[EmotionCardsController][GET /emotion-cards] userId:', userId);
    
    try {
      // 데이터베이스에서 직접 사용자 정보 조회
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { partner: true, couple: true }
      });
      
      if (!user) {
        return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
      }
      
      const partnerId = user.partnerId || user.partner?.id;
      console.log('[EmotionCardsController][GET /emotion-cards] DB에서 조회한 partnerId:', partnerId);
      
      if (!partnerId) {
        console.log('[EmotionCardsController][GET /emotion-cards] 403: 파트너 연결이 필요합니다.');
        return res.status(403).json({ 
          message: '파트너와 연결이 필요한 메뉴입니다. 파트너와 연결 후 재시도 바랍니다.',
          code: 'PARTNER_REQUIRED'
        });
      }
      
      const cards = await this.emotionCardsService.getFilteredCards(userId, partnerId);
      return res.status(200).json(cards);
    } catch (error) {
      console.error('[EmotionCardsController][GET /emotion-cards] 에러:', error);
      return res.status(500).json({ message: '감정카드 목록을 불러오지 못했습니다.' });
    }
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createEmotionCard(@Body() body: any, @Req() req: any, @Res() res: Response) {
    console.log('[EmotionCardsController][POST /emotion-cards] req.user:', req.user);
    const senderId = req.user.userId;
    
    try {
      // 데이터베이스에서 직접 사용자 정보 조회
      const user = await this.prisma.user.findUnique({
        where: { id: senderId },
        include: { partner: true, couple: true }
      });
      
      if (!user) {
        return res.status(404).json({ message: '사용자를 찾을 수 없습니다.' });
      }
      
      const receiverId = user.partnerId || user.partner?.id;
      const coupleId = user.coupleId || user.couple?.id;
      
      console.log('[EmotionCardsController][POST /emotion-cards] senderId:', senderId, 'receiverId:', receiverId, 'coupleId:', coupleId);
      
      if (!senderId || !receiverId || !coupleId) {
        console.log('[EmotionCardsController] 400: senderId, receiverId, coupleId가 필요합니다.');
        return res.status(400).json({ message: 'senderId, receiverId, coupleId가 필요합니다.' });
      }
      
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
    console.log('[EmotionCardsController][GET /emotion-cards/received] req.user:', req.user);
    const userId = req.user.userId;
    console.log('[EmotionCardsController][GET /emotion-cards/received] userId:', userId);
    if (!userId) {
      console.log('[EmotionCardsController][GET /emotion-cards/received] 400: userId가 필요합니다.');
      return res.status(400).json({ message: 'userId가 필요합니다.' });
    }
    try {
      const cards = await this.emotionCardsService.getReceivedCards(userId);
      return res.status(200).json(cards);
    } catch (error) {
      console.error('[EmotionCardsController][GET /emotion-cards/received] 에러:', error);
      return res.status(500).json({ 
        message: '받은 감정카드 목록을 불러오지 못했습니다.',
        error: error.message 
      });
    }
  }
} 