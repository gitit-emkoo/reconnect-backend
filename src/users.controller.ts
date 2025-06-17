import { Controller, Patch, Body, Req, UseGuards, Get, Put, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { ResetPasswordDto } from './users/dto/reset-password.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyProfile(@Req() req) {
    const userId = req.user?.userId;
    if (!userId) throw new Error('사용자 ID를 찾을 수 없습니다. JWT payload를 확인하세요.');
    return this.usersService.findUserById(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('profile')
  async updateProfile(@Req() req, @Body() body: { nickname: string }) {
    const userId = req.user.userId;
    return this.usersService.updateNickname(userId, body.nickname);
  }

  @UseGuards(JwtAuthGuard)
  @Put('password')
  async changePassword(@Req() req, @Body() body: { currentPassword: string, newPassword: string }) {
    const userId = req.user.userId;
    return this.usersService.changePassword(userId, body.currentPassword, body.newPassword);
  }

  @Post('forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.usersService.sendPasswordResetEmail(email);
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.usersService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }
} 