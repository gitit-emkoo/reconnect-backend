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
        title: string;
        description: string;
        category: import(".prisma/client").$Enums.ChallengeCategory;
        frequency: number;
        isOneTime: boolean;
        points: number;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getChallengeTemplatesByCategory(category: ChallengeCategory): Promise<{
        id: string;
        title: string;
        description: string;
        category: import(".prisma/client").$Enums.ChallengeCategory;
        frequency: number;
        isOneTime: boolean;
        points: number;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    getActiveChallenge(coupleId: string): Promise<{
        id: string;
        title: string;
        description: string;
        category: import(".prisma/client").$Enums.ChallengeCategory;
        frequency: number;
        isOneTime: boolean;
        points: number;
        createdAt: Date;
        updatedAt: Date;
        startDate: Date;
        endDate: Date;
        status: import(".prisma/client").$Enums.ChallengeStatus;
        isCompletedByMember1: boolean;
        isCompletedByMember2: boolean;
        completedAt: Date | null;
        coupleId: string;
    } | null>;
    startChallenge(coupleId: string, templateId: string): Promise<{
        id: string;
        title: string;
        description: string;
        category: import(".prisma/client").$Enums.ChallengeCategory;
        frequency: number;
        isOneTime: boolean;
        points: number;
        createdAt: Date;
        updatedAt: Date;
        startDate: Date;
        endDate: Date;
        status: import(".prisma/client").$Enums.ChallengeStatus;
        isCompletedByMember1: boolean;
        isCompletedByMember2: boolean;
        completedAt: Date | null;
        coupleId: string;
    }>;
    completeChallenge(challengeId: string, userId: string): Promise<{
        id: string;
        title: string;
        description: string;
        category: import(".prisma/client").$Enums.ChallengeCategory;
        frequency: number;
        isOneTime: boolean;
        points: number;
        createdAt: Date;
        updatedAt: Date;
        startDate: Date;
        endDate: Date;
        status: import(".prisma/client").$Enums.ChallengeStatus;
        isCompletedByMember1: boolean;
        isCompletedByMember2: boolean;
        completedAt: Date | null;
        coupleId: string;
    }>;
    getChallengeHistory(coupleId: string): Promise<{
        completed: {
            id: string;
            title: string;
            description: string;
            category: import(".prisma/client").$Enums.ChallengeCategory;
            frequency: number;
            isOneTime: boolean;
            points: number;
            createdAt: Date;
            updatedAt: Date;
            startDate: Date;
            endDate: Date;
            status: import(".prisma/client").$Enums.ChallengeStatus;
            isCompletedByMember1: boolean;
            isCompletedByMember2: boolean;
            completedAt: Date | null;
            coupleId: string;
        }[];
        failed: {
            id: string;
            title: string;
            description: string;
            category: import(".prisma/client").$Enums.ChallengeCategory;
            frequency: number;
            isOneTime: boolean;
            points: number;
            createdAt: Date;
            updatedAt: Date;
            startDate: Date;
            endDate: Date;
            status: import(".prisma/client").$Enums.ChallengeStatus;
            isCompletedByMember1: boolean;
            isCompletedByMember2: boolean;
            completedAt: Date | null;
            coupleId: string;
        }[];
    }>;
    processExpiredChallenges(): Promise<void>;
}
