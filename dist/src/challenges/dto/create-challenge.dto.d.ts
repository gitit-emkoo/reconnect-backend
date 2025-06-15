import { ChallengeCategory } from '@prisma/client';
export declare class CreateChallengeDto {
    title: string;
    description: string;
    category: ChallengeCategory;
    duration: number;
    points: number;
}
