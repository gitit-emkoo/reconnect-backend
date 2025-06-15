import { PartnerInvitesService } from './partner-invites.service';
export declare class PartnerInvitesController {
    private readonly partnerInvitesService;
    constructor(partnerInvitesService: PartnerInvitesService);
    createInviteCode(req: any): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.InviteStatus;
        createdAt: Date;
        updatedAt: Date;
        coupleId: string | null;
        code: string;
        inviterId: string;
        inviteeId: string | null;
    }>;
    respondToInvite(body: {
        code: string;
    }, req: any): Promise<{
        couple: {
            id: string;
            status: import(".prisma/client").$Enums.CoupleStatus;
            createdAt: Date;
            updatedAt: Date;
        };
        invite: {
            inviter: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                coupleId: string | null;
                email: string;
                password: string;
                nickname: string;
                profileImageUrl: string | null;
                provider: string | null;
                providerId: string | null;
                partnerId: string | null;
            };
            invitee: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                coupleId: string | null;
                email: string;
                password: string;
                nickname: string;
                profileImageUrl: string | null;
                provider: string | null;
                providerId: string | null;
                partnerId: string | null;
            } | null;
        } & {
            id: string;
            status: import(".prisma/client").$Enums.InviteStatus;
            createdAt: Date;
            updatedAt: Date;
            coupleId: string | null;
            code: string;
            inviterId: string;
            inviteeId: string | null;
        };
    }>;
    acceptInvite(inviteId: string, req: any): Promise<{
        couple: {
            id: string;
            status: import(".prisma/client").$Enums.CoupleStatus;
            createdAt: Date;
            updatedAt: Date;
        };
        invite: {
            id: string;
            status: import(".prisma/client").$Enums.InviteStatus;
            createdAt: Date;
            updatedAt: Date;
            coupleId: string | null;
            code: string;
            inviterId: string;
            inviteeId: string | null;
        };
    }>;
    rejectInvite(inviteId: string, req: any): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.InviteStatus;
        createdAt: Date;
        updatedAt: Date;
        coupleId: string | null;
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
        status: import(".prisma/client").$Enums.InviteStatus;
        createdAt: Date;
        updatedAt: Date;
        coupleId: string | null;
        code: string;
        inviterId: string;
        inviteeId: string | null;
    })[]>;
}
