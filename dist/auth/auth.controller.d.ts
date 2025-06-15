import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SocialAuthDto, GoogleAuthDto } from './dto/social-auth.dto';
import { User } from '@prisma/client';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<Omit<User, 'password'>>;
    login(loginDto: LoginDto): Promise<{
        accessToken: string;
        user: Omit<User, 'password'>;
    }>;
    googleRegister(googleAuthDto: GoogleAuthDto): Promise<{
        message: string;
    }>;
    googleLogin(googleAuthDto: GoogleAuthDto): Promise<{
        accessToken: string;
        user: Omit<User, 'password'>;
    }>;
    kakaoRegister(socialAuthDto: SocialAuthDto): Promise<{
        message: string;
    }>;
    kakaoLogin(socialAuthDto: SocialAuthDto): Promise<{
        accessToken: string;
        user: Omit<User, 'password'>;
    }>;
    logout(): Promise<{
        message: string;
    }>;
}
