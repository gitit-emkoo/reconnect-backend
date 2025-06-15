import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getMyProfile(req: any): Promise<{
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
    updateProfile(req: any, body: {
        nickname: string;
    }): Promise<{
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
