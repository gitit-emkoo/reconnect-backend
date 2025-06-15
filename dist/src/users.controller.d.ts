import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getMyProfile(req: any): Promise<{
        couple: {
            id: string;
            status: import(".prisma/client").$Enums.CoupleStatus;
            createdAt: Date;
            updatedAt: Date;
        } | null;
        partner: {
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
        partnerOf: {
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
        }[];
        id: string;
        createdAt: Date;
        updatedAt: Date;
        coupleId: string | null;
        email: string;
        nickname: string;
        profileImageUrl: string | null;
        provider: string | null;
        providerId: string | null;
        partnerId: string | null;
    }>;
    updateProfile(req: any, body: {
        nickname: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        coupleId: string | null;
        email: string;
        nickname: string;
        profileImageUrl: string | null;
        provider: string | null;
        providerId: string | null;
        partnerId: string | null;
    }>;
}
