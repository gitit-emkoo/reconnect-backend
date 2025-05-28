// src/auth/auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { User } from '@prisma/client'; // User 타입 임포트는 유지

@Controller('auth') // 이 컨트롤러의 기본 경로가 /auth가 됩니다.
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register') // POST /auth/register
  @HttpCode(HttpStatus.CREATED) // 성공 시 201 Created 반환
  async register(@Body() registerDto: RegisterDto): Promise<Omit<User, 'password'>> {
    // 이제 AuthService.register는 RegisterDto 전체를 인자로 받습니다.
    return this.authService.register(registerDto);
  }

  @Post('login') // POST /auth/login
  @HttpCode(HttpStatus.OK) // 성공 시 200 OK 반환
  // AuthService.login의 반환 타입에 맞춰 컨트롤러의 반환 타입도 변경
  async login(@Body() loginDto: LoginDto): Promise<{ accessToken: string; user: Omit<User, 'password'> }> {
    // 이제 AuthService.login은 LoginDto 전체를 인자로 받습니다.
    return this.authService.login(loginDto);
  }
}