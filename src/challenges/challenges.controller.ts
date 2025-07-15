import { Controller, Get, Post, Body, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { ChallengesService } from './challenges.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ChallengeCategory } from '@prisma/client';
import { getPartnerId } from '../utils/getPartnerId';
import { PrismaService } from '../prisma/prisma.service';

@Controller('challenges')
@UseGuards(JwtAuthGuard)
export class ChallengesController {
  constructor(
    private readonly challengesService: ChallengesService,
    private readonly prisma: PrismaService,
  ) {}

  // 카테고리별 챌린지 목록 조회
  @Get('category/:category')
  async getChallengesByCategory(@Param('category') category: ChallengeCategory) {
    return this.challengesService.getChallengesByCategory(category);
  }

  // 현재 진행중인 챌린지 조회
  @Get('active')
  async getActiveChallenge(@GetUser() user: any) {
    const userId = user.userId;
    console.log('[ChallengeController][getActiveChallenge] userId:', userId);
    
    try {
      // 데이터베이스에서 직접 사용자 정보 조회
      const userInfo = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { couple: true }
      });
      
      if (!userInfo) {
        throw new BadRequestException('사용자를 찾을 수 없습니다.');
      }
      
      const coupleId = userInfo.coupleId || userInfo.couple?.id;
      console.log('[ChallengeController][getActiveChallenge] coupleId:', coupleId);
      
      if (!coupleId) {
        throw new BadRequestException('연결된 파트너가 없습니다.');
      }
      
      return this.challengesService.getActiveChallenge(coupleId);
    } catch (error) {
      console.error('[ChallengeController][getActiveChallenge] 에러:', error);
      throw error;
    }
  }

  // 챌린지 시작
  @Post('start/:challengeId')
  async startChallenge(
    @Param('challengeId') challengeId: string,
    @GetUser() user: any,
  ) {
    const userId = user.userId;
    console.log('[ChallengeController][startChallenge] userId:', userId);
    
    try {
      // 데이터베이스에서 직접 사용자 정보 조회
      const userInfo = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { couple: true }
      });
      
      if (!userInfo) {
        throw new BadRequestException('사용자를 찾을 수 없습니다.');
      }
      
      const coupleId = userInfo.coupleId || userInfo.couple?.id;
      console.log('[ChallengeController][startChallenge] coupleId:', coupleId);
      
      if (!coupleId) {
        throw new BadRequestException('연결된 파트너가 없습니다.');
      }
      
      return this.challengesService.startChallenge(coupleId, challengeId);
    } catch (error) {
      console.error('[ChallengeController][startChallenge] 에러:', error);
      throw error;
    }
  }

  // 챌린지 완료 처리
  @Post('complete/:challengeId')
  async completeChallenge(
    @Param('challengeId') challengeId: string,
    @GetUser() user: any,
  ) {
    const userId = user.userId;
    console.log('[ChallengeController][completeChallenge] userId:', userId);
    
    try {
      // 데이터베이스에서 직접 사용자 정보 조회
      const userInfo = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { couple: true }
      });
      
      if (!userInfo) {
        throw new BadRequestException('사용자를 찾을 수 없습니다.');
      }
      
      const coupleId = userInfo.coupleId || userInfo.couple?.id;
      console.log('[ChallengeController][completeChallenge] coupleId:', coupleId);
      
      if (!coupleId) {
        throw new BadRequestException('연결된 파트너가 없습니다.');
      }
      
      return this.challengesService.completeChallenge(challengeId, userId);
    } catch (error) {
      console.error('[ChallengeController][completeChallenge] 에러:', error);
      throw error;
    }
  }

  // 챌린지 히스토리 조회
  @Get('history')
  async getChallengeHistory(@GetUser() user: any) {
    const userId = user.userId;
    console.log('[ChallengeController][getChallengeHistory] userId:', userId);
    
    try {
      // 데이터베이스에서 직접 사용자 정보 조회
      const userInfo = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { couple: true }
      });
      
      if (!userInfo) {
        throw new BadRequestException('사용자를 찾을 수 없습니다.');
      }
      
      const coupleId = userInfo.coupleId || userInfo.couple?.id;
      console.log('[ChallengeController][getChallengeHistory] coupleId:', coupleId);
      
      if (!coupleId) {
        throw new BadRequestException('연결된 파트너가 없습니다.');
      }
      
      return this.challengesService.getChallengeHistory(coupleId);
    } catch (error) {
      console.error('[ChallengeController][getChallengeHistory] 에러:', error);
      throw error;
    }
  }

  // 챌린지 템플릿 카테고리별 목록 조회
  @Get('template/category/:category')
  async getChallengeTemplatesByCategory(@Param('category') category: ChallengeCategory) {
    return this.challengesService.getChallengeTemplatesByCategory(category);
  }

  // 이번 주 챌린지 달성 여부 확인
  @Get('weekly-completion')
  async checkWeeklyCompletion(@GetUser() user: any) {
    const userId = user.userId;
    console.log('[ChallengeController][checkWeeklyCompletion] userId:', userId);
    
    try {
      // 데이터베이스에서 직접 사용자 정보 조회
      const userInfo = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { couple: true }
      });
      
      if (!userInfo) {
        throw new BadRequestException('사용자를 찾을 수 없습니다.');
      }
      
      const coupleId = userInfo.coupleId || userInfo.couple?.id;
      console.log('[ChallengeController][checkWeeklyCompletion] coupleId:', coupleId);
      
      if (!coupleId) {
        throw new BadRequestException('연결된 파트너가 없습니다.');
      }
      
      return this.challengesService.checkWeeklyChallengeCompletion(coupleId);
    } catch (error) {
      console.error('[ChallengeController][checkWeeklyCompletion] 에러:', error);
      throw error;
    }
  }
} 