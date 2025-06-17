import { PrismaService } from './prisma/prisma.service';
import { MailService } from './mail.service';
export declare class UsersService {
    private readonly prisma;
    private readonly mailService;
    constructor(prisma: PrismaService, mailService: MailService);
    updateNickname(userId: string, nickname: string): Promise<{
        id: string;
        email: string;
        nickname: string;
        partnerId: string | null;
        resetPasswordToken: string | null;
        resetPasswordTokenExpires: Date | null;
        profileImageUrl: string | null;
        provider: string | null;
        providerId: string | null;
        createdAt: Date;
        updatedAt: Date;
        coupleId: string | null;
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
            nickname: string;
            partnerId: string | null;
            password: string;
            resetPasswordToken: string | null;
            resetPasswordTokenExpires: Date | null;
            profileImageUrl: string | null;
            provider: string | null;
            providerId: string | null;
            createdAt: Date;
            updatedAt: Date;
            coupleId: string | null;
        } | null;
        partnerOf: {
            id: string;
            email: string;
            nickname: string;
            partnerId: string | null;
            password: string;
            resetPasswordToken: string | null;
            resetPasswordTokenExpires: Date | null;
            profileImageUrl: string | null;
            provider: string | null;
            providerId: string | null;
            createdAt: Date;
            updatedAt: Date;
            coupleId: string | null;
        }[];
        id: string;
        email: string;
        nickname: string;
        partnerId: string | null;
        resetPasswordToken: string | null;
        resetPasswordTokenExpires: Date | null;
        profileImageUrl: string | null;
        provider: string | null;
        providerId: string | null;
        createdAt: Date;
        updatedAt: Date;
        coupleId: string | null;
    }>;
    changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{
        success: boolean;
    }>;
    sendPasswordResetEmail(email: string): Promise<{
        message: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
