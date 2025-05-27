// src/auth/auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto'; 
import { LoginDto } from './dto/login.dto';     
import { User } from '@prisma/client';

@Controller('auth') // 이 컨트롤러의 기본 경로가 /auth가 됩니다.
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register') // POST /auth/register
  @HttpCode(HttpStatus.CREATED) // 성공 시 201 Created 반환
  async register(@Body() registerDto: RegisterDto): Promise<Omit<User, 'password'>> {
    const { email, password, nickname } = registerDto;
    return this.authService.register(email, password, nickname);
  }

  @Post('login') // POST /auth/login
  @HttpCode(HttpStatus.OK) // 성공 시 200 OK 반환
  async login(@Body() loginDto: LoginDto): Promise<Omit<User, 'password'>> {
    const { email, password } = loginDto;
    return this.authService.login(email, password);
  }
}