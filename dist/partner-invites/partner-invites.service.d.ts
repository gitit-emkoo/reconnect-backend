import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthService } from '../auth/auth.service';
import { DiagnosisService } from '../diagnosis/diagnosis.service';
export declare class PartnerInvitesService {
    private prisma;
    private jwtService;
    private notificationsService;
    private authService;
    private diagnosisService;
    constructor(prisma: PrismaService, jwtService: JwtService, notificationsService: NotificationsService, authService: AuthService, diagnosisService: DiagnosisService);
    createInviteCode(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        coupleId: string | null;
        code: string;
        status: import(".prisma/client").$Enums.InviteStatus;
        inviterId: string;
        inviteeId: string | null;
    }>;
    respondToInvite(code: string, inviteeId: string): Promise<{
        inviter: {
            partnerId: string;
            couple: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: import(".prisma/client").$Enums.CoupleStatus;
            } | null;
            id: string;
            email: string;
            password: string;
            resetPasswordToken: string | null;
            resetPasswordTokenExpires: Date | null;
            nickname: string;
            profileImageUrl: string | null;
            role: import(".prisma/client").$Enums.Role;
            provider: string | null;
            providerId: string | null;
            createdAt: Date;
            updatedAt: Date;
            temperature: number;
            fcmToken: string | null;
            coupleId: string | null;
        };
        invitee: {
            partnerId: string;
            couple: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                status: import(".prisma/client").$Enums.CoupleStatus;
            } | null;
            id: string;
            email: string;
            password: string;
            resetPasswordToken: string | null;
            resetPasswordTokenExpires: Date | null;
            nickname: string;
            profileImageUrl: string | null;
            role: import(".prisma/client").$Enums.Role;
            provider: string | null;
            providerId: string | null;
            createdAt: Date;
            updatedAt: Date;
            temperature: number;
            fcmToken: string | null;
            coupleId: string | null;
        };
        inviterToken: string;
        inviteeToken: string;
    }>;
    acceptInvite(code: string, inviteeId: string): Promise<{
        inviter: {
            id: string;
            email: string;
            password: string;
            resetPasswordToken: string | null;
            resetPasswordTokenExpires: Date | null;
            nickname: string;
            profileImageUrl: string | null;
            role: import(".prisma/client").$Enums.Role;
            provider: string | null;
            providerId: string | null;
            createdAt: Date;
            updatedAt: Date;
            temperature: number;
            fcmToken: string | null;
            coupleId: string | null;
            partnerId: string | null;
        };
        invitee: {
            id: string;
            email: string;
            password: string;
            resetPasswordToken: string | null;
            resetPasswordTokenExpires: Date | null;
            nickname: string;
            profileImageUrl: string | null;
            role: import(".prisma/client").$Enums.Role;
            provider: string | null;
            providerId: string | null;
            createdAt: Date;
            updatedAt: Date;
            temperature: number;
            fcmToken: string | null;
            coupleId: string | null;
            partnerId: string | null;
        };
        inviterToken: string;
        inviteeToken: string;
    }>;
    rejectInvite(inviteId: string, inviterId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        coupleId: string | null;
        code: string;
        status: import(".prisma/client").$Enums.InviteStatus;
        inviterId: string;
        inviteeId: string | null;
    }>;
    getMyInvites(userId: string): Promise<({
        inviter: {
            id: string;
            nickname: string;
            profileImageUrl: string | null;
        };
        invitee: {
            id: string;
            nickname: string;
            profileImageUrl: string | null;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        coupleId: string | null;
        code: string;
        status: import(".prisma/client").$Enums.InviteStatus;
        inviterId: string;
        inviteeId: string | null;
    })[]>;
}
