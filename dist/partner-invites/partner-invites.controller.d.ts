import { PartnerInvitesService } from './partner-invites.service';
export declare class PartnerInvitesController {
    private readonly partnerInvitesService;
    constructor(partnerInvitesService: PartnerInvitesService);
    createInviteCode(req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        coupleId: string | null;
        code: string;
        status: import(".prisma/client").$Enums.InviteStatus;
        inviterId: string;
        inviteeId: string | null;
    }>;
    respondToInvite(body: {
        code: string;
    }, req: any): Promise<{
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
    acceptInvite(inviteId: string, req: any): Promise<{
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
    rejectInvite(inviteId: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        coupleId: string | null;
        code: string;
        status: import(".prisma/client").$Enums.InviteStatus;
        inviterId: string;
        inviteeId: string | null;
    }>;
    getMyInvites(req: any): Promise<({
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
