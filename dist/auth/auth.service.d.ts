import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { GoogleAuthDto } from './dto/social-auth.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { DiagnosisService } from '../diagnosis/diagnosis.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    private diagnosisService;
    constructor(prisma: PrismaService, jwtService: JwtService, diagnosisService: DiagnosisService);
    register(registerDto: RegisterDto): Promise<{
        user: Omit<User, 'password'>;
        accessToken: string;
    }>;
    login(loginDto: LoginDto): Promise<{
        accessToken: string;
        user: Omit<User, 'password'>;
    }>;
    createJwtToken(user: User & {
        partner?: User | null;
        couple?: any | null;
    }): string;
    googleLogin(googleAuthDto: GoogleAuthDto): Promise<{
        accessToken: string;
        user: Omit<User, 'password'>;
    }>;
    private getGoogleUserInfo;
    kakaoRegister(code: string): Promise<{
        message: string;
    }>;
    kakaoLogin(code: string): Promise<{
        accessToken: string;
        user: Omit<User, 'password'>;
    }>;
    logout(): Promise<{
        message: string;
    }>;
    private handleOAuthError;
}
