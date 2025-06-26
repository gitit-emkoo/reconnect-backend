import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { GoogleAuthDto } from './dto/social-auth.dto';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private prisma;
    private jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    register(registerDto: RegisterDto): Promise<Omit<User, 'password'>>;
    login(loginDto: LoginDto): Promise<{
        accessToken: string;
        user: Omit<User, 'password'>;
    }>;
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
