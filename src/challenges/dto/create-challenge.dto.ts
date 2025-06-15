import { IsString, IsEnum, IsInt, IsBoolean, IsDateString, Min, Max } from 'class-validator';

export enum ChallengeCategory {
  DAILY_SHARE = 'DAILY_SHARE',    // 일상 공유
  TOGETHER_ACT = 'TOGETHER_ACT',   // 함께하기
  EMOTION_EXPR = 'EMOTION_EXPR',   // 감정표현
  MEMORY_BUILD = 'MEMORY_BUILD',   // 기억쌓기
  SELF_CARE = 'SELF_CARE',        // 마음 돌보기
  GROW_TOGETHER = 'GROW_TOGETHER'  // 함께성장
}

export class CreateChallengeDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsEnum(ChallengeCategory)
  category: ChallengeCategory;

  @IsInt()
  @Min(1)
  @Max(7)
  frequency: number;

  @IsBoolean()
  isOneTime: boolean;

  @IsInt()
  @Min(0)
  points: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
} 