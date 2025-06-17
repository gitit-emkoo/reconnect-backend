import { PrismaService } from '../prisma/prisma.service';
import { ChallengeCategory } from '@prisma/client';
export declare enum ChallengeStatus {
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
}
export declare class ChallengesService {
    private prisma;
    constructor(prisma: PrismaService);
    getChallengesByCategory(category: ChallengeCategory): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        category: import(".prisma/client").$Enums.ChallengeCategory;
        title: string;
        description: string;
        frequency: number;
        isOneTime: boolean;
        points: number;
    }[]>;
    getChallengeTemplatesByCategory(category: ChallengeCategory): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        category: import(".prisma/client").$Enums.ChallengeCategory;
        title: string;
        description: string;
        frequency: number;
        isOneTime: boolean;
        points: number;
    }[]>;
    getActiveChallenge(coupleId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        category: import(".prisma/client").$Enums.ChallengeCategory;
        coupleId: string;
        status: import(".prisma/client").$Enums.ChallengeStatus;
        title: string;
        description: string;
        frequency: number;
        isOneTime: boolean;
        points: number;
        startDate: Date;
        endDate: Date;
        isCompletedByMember1: boolean;
        isCompletedByMember2: boolean;
        completedAt: Date | null;
    } | null>;
    startChallenge(coupleId: string, templateId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        category: import(".prisma/client").$Enums.ChallengeCategory;
        coupleId: string;
        status: import(".prisma/client").$Enums.ChallengeStatus;
        title: string;
        description: string;
        frequency: number;
        isOneTime: boolean;
        points: number;
        startDate: Date;
        endDate: Date;
        isCompletedByMember1: boolean;
        isCompletedByMember2: boolean;
        completedAt: Date | null;
    }>;
    completeChallenge(challengeId: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        category: import(".prisma/client").$Enums.ChallengeCategory;
        coupleId: string;
        status: import(".prisma/client").$Enums.ChallengeStatus;
        title: string;
        description: string;
        frequency: number;
        isOneTime: boolean;
        points: number;
        startDate: Date;
        endDate: Date;
        isCompletedByMember1: boolean;
        isCompletedByMember2: boolean;
        completedAt: Date | null;
    }>;
    getChallengeHistory(coupleId: string): Promise<{
        completed: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            category: import(".prisma/client").$Enums.ChallengeCategory;
            coupleId: string;
            status: import(".prisma/client").$Enums.ChallengeStatus;
            title: string;
            description: string;
            frequency: number;
            isOneTime: boolean;
            points: number;
            startDate: Date;
            endDate: Date;
            isCompletedByMember1: boolean;
            isCompletedByMember2: boolean;
            completedAt: Date | null;
        }[];
        failed: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            category: import(".prisma/client").$Enums.ChallengeCategory;
            coupleId: string;
            status: import(".prisma/client").$Enums.ChallengeStatus;
            title: string;
            description: string;
            frequency: number;
            isOneTime: boolean;
            points: number;
            startDate: Date;
            endDate: Date;
            isCompletedByMember1: boolean;
            isCompletedByMember2: boolean;
            completedAt: Date | null;
        }[];
    }>;
    processExpiredChallenges(): Promise<void>;
}
