import { UsersService } from './users.service';
import { ResetPasswordDto } from './users/dto/reset-password.dto';
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
        partnerOf: {
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
        }[];
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
    }>;
    updateProfile(req: any, body: {
        nickname: string;
    }): Promise<{
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
    }>;
    changePassword(req: any, body: {
        currentPassword: string;
        newPassword: string;
    }): Promise<{
        success: boolean;
    }>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        success: boolean;
        message: string;
    }>;
}
