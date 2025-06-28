import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
export declare class PartnerInvitesService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
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
        message: string;
        user: {
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
                resetPasswordToken: string | null;
                resetPasswordTokenExpires: Date | null;
                nickname: string;
                profileImageUrl: string | null;
                role: import(".prisma/client").$Enums.Role;
                provider: string | null;
                providerId: string | null;
                createdAt: Date;
                updatedAt: Date;
                coupleId: string | null;
                partnerId: string | null;
            } | null;
            id: string;
            email: string;
            resetPasswordToken: string | null;
            resetPasswordTokenExpires: Date | null;
            nickname: string;
            profileImageUrl: string | null;
            role: import(".prisma/client").$Enums.Role;
            provider: string | null;
            providerId: string | null;
            createdAt: Date;
            updatedAt: Date;
            coupleId: string | null;
            partnerId: string | null;
        };
        accessToken: string;
    }>;
    acceptInvite(inviteId: string, inviterId: string): Promise<{
        couple: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.CoupleStatus;
        };
        invite: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            coupleId: string | null;
            code: string;
            status: import(".prisma/client").$Enums.InviteStatus;
            inviterId: string;
            inviteeId: string | null;
        };
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
