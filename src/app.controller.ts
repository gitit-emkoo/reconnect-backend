import { Controller, Get, Post, Body } from '@nestjs/common'; // Post, Body 데코레이터 임포트
import { AppService } from './app.service';
import { User } from '@prisma/client'; // User 타입 임포트

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('users') // POST 요청으로 /users 경로에 접근
  async createUser(@Body() userData: { email: string; nickname: string }): Promise<User> {
    return this.appService.createTestUser(userData.email, userData.nickname);
  }

  @Get('users') // GET 요청으로 /users 경로에 접근
  async getUsers(): Promise<User[]> {
    return this.appService.getAllUsers();
  }
}