import { PrismaService } from './prisma/prisma.service';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    updateNickname(userId: string, nickname: string): Promise<{
        id: string;
        email: string;
        nickname: string;
        profileImageUrl: string | null;
        provider: string | null;
        providerId: string | null;
        createdAt: Date;
        updatedAt: Date;
        coupleId: string | null;
        partnerId: string | null;
    }>;
    findUserById(userId: string): Promise<{
        couple: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.CoupleStatus;
        } | null;
        partner: {
            id: string;
            email: string;
            password: string;
            nickname: string;
            profileImageUrl: string | null;
            provider: string | null;
            providerId: string | null;
            createdAt: Date;
            updatedAt: Date;
            coupleId: string | null;
            partnerId: string | null;
        } | null;
        partnerOf: {
            id: string;
            email: string;
            password: string;
            nickname: string;
            profileImageUrl: string | null;
            provider: string | null;
            providerId: string | null;
            createdAt: Date;
            updatedAt: Date;
            coupleId: string | null;
            partnerId: string | null;
        }[];
        id: string;
        email: string;
        nickname: string;
        profileImageUrl: string | null;
        provider: string | null;
        providerId: string | null;
        createdAt: Date;
        updatedAt: Date;
        coupleId: string | null;
        partnerId: string | null;
    }>;
}
