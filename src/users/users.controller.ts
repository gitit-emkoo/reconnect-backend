import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('/me')
  @UseGuards(AuthGuard('jwt'))
  me(@GetUser() user: User) {
    return this.usersService.me(user.id);
  }

  @Get('/me/temperature')
  @UseGuards(AuthGuard('jwt'))
  async getMyTemperature(@GetUser() user: User) {
    return this.usersService.getMyTemperature(user.id);
  }

  @Post('/forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.usersService.sendPasswordResetEmail(email);
  }

  @Post('/reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.usersService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }

  @Patch('/me/fcm-token')
  @UseGuards(AuthGuard('jwt'))
  async updateFcmToken(
    @GetUser() user: User,
    @Body('fcmToken') fcmToken: string,
  ) {
    return this.usersService.updateFcmToken(user.id, fcmToken);
  }
} 