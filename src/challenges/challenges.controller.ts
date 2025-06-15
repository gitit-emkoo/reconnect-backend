import { Controller, Get, Post, Body, Param, UseGuards, BadRequestException } from '@nestjs/common';
import { ChallengesService } from './challenges.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { ChallengeCategory } from './dto/create-challenge.dto';

@Controller('challenges')
@UseGuards(JwtAuthGuard)
export class ChallengesController {
  constructor(private readonly challengesService: ChallengesService) {}

  // 카테고리별 챌린지 목록 조회
  @Get('category/:category')
  async getChallengesByCategory(@Param('category') category: ChallengeCategory) {
    return this.challengesService.getChallengesByCategory(category);
  }

  // 현재 진행중인 챌린지 조회
  @Get('active')
  async getActiveChallenge(@GetUser() user: any) {
    console.log('[ChallengeController][getActiveChallenge]', { userId: user.userId, partnerId: user.partnerId, coupleId: user.couple?.id });
    if (!user.couple || !user.couple.id) {
      throw new BadRequestException('연결된 파트너가 없습니다.');
    }
    return this.challengesService.getActiveChallenge(user.couple.id);
  }

  // 챌린지 시작
  @Post('start/:challengeId')
  async startChallenge(
    @Param('challengeId') challengeId: string,
    @GetUser() user: any,
  ) {
    console.log('[ChallengeController][startChallenge]', { userId: user.userId, partnerId: user.partnerId, coupleId: user.couple?.id });
    if (!user.couple || !user.couple.id) {
      throw new BadRequestException('연결된 파트너가 없습니다.');
    }
    return this.challengesService.startChallenge(user.couple.id, challengeId);
  }

  // 챌린지 완료 처리
  @Post('complete/:challengeId')
  async completeChallenge(
    @Param('challengeId') challengeId: string,
    @GetUser() user: any,
  ) {
    console.log('[ChallengeController][completeChallenge]', { userId: user.userId, partnerId: user.partnerId, coupleId: user.couple?.id });
    if (!user.couple || !user.couple.id) {
      throw new BadRequestException('연결된 파트너가 없습니다.');
    }
    return this.challengesService.completeChallenge(challengeId, user.userId);
  }

  // 챌린지 히스토리 조회
  @Get('history')
  async getChallengeHistory(@GetUser() user: any) {
    console.log('[ChallengeController][getChallengeHistory]', { userId: user.userId, partnerId: user.partnerId, coupleId: user.couple?.id });
    if (!user.couple || !user.couple.id) {
      throw new BadRequestException('연결된 파트너가 없습니다.');
    }
    return this.challengesService.getChallengeHistory(user.couple.id);
  }

  // 챌린지 템플릿 카테고리별 목록 조회
  @Get('template/category/:category')
  async getChallengeTemplatesByCategory(@Param('category') category: ChallengeCategory) {
    return this.challengesService.getChallengeTemplatesByCategory(category);
  }
} 