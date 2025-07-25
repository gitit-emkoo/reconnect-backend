// src/auth/auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SocialAuthDto } from './dto/social-auth.dto';
import { GoogleAuthDto } from './dto/social-auth.dto';
import { User } from '@prisma/client'; // User 타입 임포트는 유지
import { JwtAuthGuard } from './jwt-auth.guard';
import { GetUser } from './decorators/get-user.decorator';

@Controller('auth') // 이 컨트롤러의 기본 경로가 /auth가 됩니다.
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register') // POST /auth/register
  @HttpCode(HttpStatus.CREATED) // 성공 시 201 Created 반환
  async register(
    @Body() registerDto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: Omit<User, 'password'>; accessToken: string }> {
    // 이제 AuthService.register는 RegisterDto 전체를 인자로 받습니다.
    return this.authService.register(registerDto, res);
  }

  @Post('login') // POST /auth/login
  @HttpCode(HttpStatus.OK) // 성공 시 200 OK 반환
  // AuthService.login의 반환 타입에 맞춰 컨트롤러의 반환 타입도 변경
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response): Promise<{ accessToken: string; user: Omit<User, 'password'> }> {
    // 이제 AuthService.login은 LoginDto 전체를 인자로 받습니다.
    return this.authService.login(loginDto, res);
  }

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
      console.log('카카오 회원가입 요청 받음');
      console.log('인증 코드:', code);
      return this.authService.kakaoRegister(code);
    }
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

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(): Promise<{ message: string }> {
    return this.authService.logout();
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  async refreshToken(@GetUser() user: any) {
    const newToken = this.authService.createJwtToken(user);
    return { accessToken: newToken };
  }
}