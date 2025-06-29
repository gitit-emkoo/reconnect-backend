import { PrismaService } from '../prisma/prisma.service';
import { ChallengeCategory } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
export declare enum ChallengeStatus {
    IN_PROGRESS = "IN_PROGRESS",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED"
}
export declare class ChallengesService {
    private prisma;
    private notificationsService;
    private readonly logger;
    constructor(prisma: PrismaService, notificationsService: NotificationsService);
    getChallengesByCategory(category: ChallengeCategory): Promise<{
        category: import(".prisma/client").$Enums.ChallengeCategory;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string;
        frequency: number;
        isOneTime: boolean;
        points: number;
    }[]>;
    getChallengeTemplatesByCategory(category: ChallengeCategory): Promise<{
        category: import(".prisma/client").$Enums.ChallengeCategory;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string;
        frequency: number;
        isOneTime: boolean;
        points: number;
    }[]>;
    getActiveChallenge(coupleId: string): Promise<{
        category: import(".prisma/client").$Enums.ChallengeCategory;
        id: string;
        createdAt: Date;
        updatedAt: Date;
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
        category: import(".prisma/client").$Enums.ChallengeCategory;
        id: string;
        createdAt: Date;
        updatedAt: Date;
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
        category: import(".prisma/client").$Enums.ChallengeCategory;
        id: string;
        createdAt: Date;
        updatedAt: Date;
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
            category: import(".prisma/client").$Enums.ChallengeCategory;
            id: string;
            createdAt: Date;
            updatedAt: Date;
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
            category: import(".prisma/client").$Enums.ChallengeCategory;
            id: string;
            createdAt: Date;
            updatedAt: Date;
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
    checkWeeklyChallengeCompletion(coupleId: string): Promise<boolean>;
    failExpiredChallenges(): Promise<void>;
}
