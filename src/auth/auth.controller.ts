// src/auth/auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Res, BadRequestException } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SocialAuthDto } from './dto/social-auth.dto';
import { GoogleAuthDto, AppleAuthDto } from './dto/social-auth.dto';
import { User } from '@prisma/client';
import { JwtAuthGuard } from './jwt-auth.guard';
import { GetUser } from './decorators/get-user.decorator';

// 쿠키 설정 함수
const setAuthCookie = (res: Response, token: string) => {
  res.cookie('accessToken', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 90 * 24 * 60 * 60 * 1000, // 90일
  });
};

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: Omit<User, 'password'>; accessToken: string }> {
    return this.authService.register(registerDto, res);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response): Promise<{ accessToken: string; user: Omit<User, 'password'> }> {
    return this.authService.login(loginDto, res);
  }

  // 기존 SNS 로그인/회원가입 엔드포인트들 (통합 API로 대체됨 - 주석처리)
  /*
  @Post('google/login')
  @HttpCode(HttpStatus.OK)
  async googleLogin(
    @Body() googleAuthDto: GoogleAuthDto
  ): Promise<{ accessToken: string; user: Omit<User, 'password'> }> {
    return this.authService.googleLogin(googleAuthDto);
  }

  @Post('google/register')
  @HttpCode(HttpStatus.CREATED)
  async googleRegister(
    @Body() googleAuthDto: GoogleAuthDto
  ): Promise<{ accessToken: string; user: Omit<User, 'password'> }> {
    return this.authService.googleRegister(googleAuthDto);
  }

  @Post('kakao/register')
  @HttpCode(HttpStatus.CREATED)
  async kakaoRegister(@Body('code') code: string) {
    if (!code) {
      throw new BadRequestException('카카오 인증 코드가 필요합니다.');
    }
    console.log('카카오 회원가입 요청 받음');
    console.log('인증 코드:', code);
    return this.authService.kakaoRegister(code);
  }

  @Post('kakao/login')
  @HttpCode(HttpStatus.OK)
  async kakaoLogin(
    @Body() socialAuthDto: SocialAuthDto
  ): Promise<{ accessToken: string; user: Omit<User, 'password'> }> {
    console.log('카카오 로그인 요청 받음');
    console.log('인증 코드:', socialAuthDto.code);
    return this.authService.kakaoLogin(socialAuthDto.code);
  }

  @Post('apple/login')
  @HttpCode(HttpStatus.OK)
  async appleLogin(
    @Body() appleAuthDto: AppleAuthDto
  ): Promise<{ accessToken: string; user: Omit<User, 'password'> }> {
    return this.authService.appleLogin(appleAuthDto);
  }

  @Post('apple/register')
  @HttpCode(HttpStatus.CREATED)
  async appleRegister(
    @Body() appleAuthDto: AppleAuthDto
  ): Promise<{ accessToken: string; user: Omit<User, 'password'> }> {
    return this.authService.appleRegister(appleAuthDto);
  }
  */

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(): Promise<{ message: string }> {
    return this.authService.logout();
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  async refreshToken(@GetUser() user: any, @Res({ passthrough: true }) res: Response) {
    const newToken = this.authService.createJwtToken(user);
    setAuthCookie(res, newToken);
    return { accessToken: newToken };
  }

  // 통합 SNS 로그인/가입 엔드포인트들
  @Post('google/signin')
  @HttpCode(HttpStatus.OK)
  async googleSignIn(
    @Body() googleAuthDto: GoogleAuthDto
  ): Promise<{ accessToken: string; user: Omit<User, 'password'>; isNewUser: boolean }> {
    return this.authService.googleSignIn(googleAuthDto);
  }

  @Post('apple/signin')
  @HttpCode(HttpStatus.OK)
  async appleSignIn(
    @Body() appleAuthDto: AppleAuthDto
  ): Promise<{ accessToken: string; user: Omit<User, 'password'>; isNewUser: boolean }> {
    return this.authService.appleSignIn(appleAuthDto);
  }

  @Post('kakao/signin')
  @HttpCode(HttpStatus.OK)
  async kakaoSignIn(
    @Body() socialAuthDto: SocialAuthDto
  ): Promise<{ accessToken: string; user: Omit<User, 'password'>; isNewUser: boolean }> {
    if (!socialAuthDto.code) {
      throw new BadRequestException('카카오 인증 코드가 필요합니다.');
    }
    return this.authService.kakaoSignIn(socialAuthDto.code);
  }
}