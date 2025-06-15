import { PartnerInvitesService } from './partner-invites.service';
export declare class PartnerInvitesController {
    private readonly partnerInvitesService;
    constructor(partnerInvitesService: PartnerInvitesService);
    createInviteCode(req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        coupleId: string | null;
        status: import(".prisma/client").$Enums.InviteStatus;
        code: string;
        inviterId: string;
        inviteeId: string | null;
    }>;
    respondToInvite(body: {
        code: string;
    }, req: any): Promise<{
        couple: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.CoupleStatus;
        };
        invite: {
            inviter: {
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
            };
            invitee: {
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
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            coupleId: string | null;
            status: import(".prisma/client").$Enums.InviteStatus;
            code: string;
            inviterId: string;
            inviteeId: string | null;
        };
    }>;
    acceptInvite(inviteId: string, req: any): Promise<{
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
            status: import(".prisma/client").$Enums.InviteStatus;
            code: string;
            inviterId: string;
            inviteeId: string | null;
        };
    }>;
    rejectInvite(inviteId: string, req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        coupleId: string | null;
        status: import(".prisma/client").$Enums.InviteStatus;
        code: string;
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
        status: import(".prisma/client").$Enums.InviteStatus;
        code: string;
        inviterId: string;
        inviteeId: string | null;
    })[]>;
}
