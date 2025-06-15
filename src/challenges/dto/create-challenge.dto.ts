import { ChallengeCategory } from '@prisma/client';

export class CreateChallengeDto {
  title: string;
  description: string;
  category: ChallengeCategory;
  duration: number; // 챌린지 기간 (일)
  points: number; // 완료 시 획득 포인트
} 