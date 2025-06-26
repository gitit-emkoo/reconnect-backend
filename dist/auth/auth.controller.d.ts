import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SocialAuthDto } from './dto/social-auth.dto';
import { GoogleAuthDto } from './dto/social-auth.dto';
import { User } from '@prisma/client';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<Omit<User, 'password'>>;
    login(loginDto: LoginDto): Promise<{
        accessToken: string;
        user: Omit<User, 'password'>;
    }>;
    googleLogin(googleAuthDto: GoogleAuthDto): Promise<{
        accessToken: string;
        user: Omit<User, 'password'>;
    }>;
    kakaoRegister(code: string): Promise<{
        message: string;
    } | undefined>;
    kakaoLogin(socialAuthDto: SocialAuthDto): Promise<{
        accessToken: string;
        user: Omit<User, 'password'>;
    }>;
    logout(): Promise<{
        message: string;
    }>;
}
