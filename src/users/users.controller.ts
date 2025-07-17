import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Patch,
  Param,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { AuthGuard } from '@nestjs/passport';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '@prisma/client';
import { ChangePasswordDto } from './dto/change-password.dto';
import { WithdrawDto } from './dto/withdraw.dto';
import { AdminGuard } from '../auth/admin.guard';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  /**
   * 내 정보 조회 (로그인 필요)
   */
  @Get('/me')
  @UseGuards(AuthGuard('jwt'))
  me(@GetUser() user: User) {
    return this.usersService.me(user.id);
  }

  /**
   * 내 관계 온도 조회 (로그인 필요)
   */
  @Get('/me/temperature')
  @UseGuards(AuthGuard('jwt'))
  async getMyTemperature(@GetUser() user: User) {
    return this.usersService.getMyTemperature(user.id);
  }

  /**
   * 비밀번호 찾기(이메일로 토큰 발송) - 로그인 필요 없음
   * 사용 예: 비밀번호를 잊어버린 사용자가 이메일을 입력하면, 비밀번호 재설정 링크(토큰)를 발송
   */
  @Post('/forgot-password')
  async forgotPassword(@Body('email') email: string) {
    return this.usersService.sendPasswordResetEmail(email);
  }

  /**
   * 비밀번호 재설정(토큰 기반, 로그인 필요 없음)
   * 사용 예: 이메일로 받은 토큰과 새 비밀번호를 입력해서 비밀번호를 재설정
   */
  @Post('/reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.usersService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }

  /**
   * 비밀번호 변경(로그인 필요, 현재 비밀번호 확인)
   * 사용 예: 로그인한 사용자가 현재 비밀번호와 새 비밀번호를 입력해서 비밀번호를 변경
   */
  @Patch('/me/password')
  @UseGuards(AuthGuard('jwt'))
  async changePassword(
    @GetUser() user: User,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(user.id, dto.currentPassword, dto.newPassword);
  }

  /**
   * FCM 토큰 업데이트 (로그인 필요)
   */
  @Patch('/me/fcm-token')
  @UseGuards(AuthGuard('jwt'))
  async updateFcmToken(
    @GetUser() user: User,
    @Body('fcmToken') fcmToken: string,
  ) {
    return this.usersService.updateFcmToken(user.id, fcmToken);
  }

  /**
   * 프로필(닉네임) 수정 (로그인 필요)
   */
  @Patch('/me')
  @UseGuards(AuthGuard('jwt'))
  async updateProfile(@GetUser() user: User, @Body('nickname') nickname: string) {
    return this.usersService.updateProfile(user.id, nickname);
  }

  /**
   * 프로필 이미지 업데이트 (로그인 필요)
   */
  @Patch('/me/profile-image')
  @UseGuards(AuthGuard('jwt'))
  async updateProfileImage(@GetUser() user: User, @Body('profileImageUrl') profileImageUrl: string) {
    return this.usersService.updateProfileImage(user.id, profileImageUrl);
  }

  /**
   * 랜덤 아바타 생성 (로그인 필요)
   */
  @Post('/me/generate-avatar')
  @UseGuards(AuthGuard('jwt'))
  async generateRandomAvatar(@GetUser() user: User) {
    return this.usersService.generateRandomAvatar(user.id);
  }

  /**
   * 구독 시작 (로그인 필요)
   */
  @Post('/me/subscribe')
  @UseGuards(AuthGuard('jwt'))
  async startSubscription(@GetUser() user: User) {
    return this.usersService.startSubscription(user.id);
  }

  /**
   * 회원 탈퇴 (로그인 필요)
   */
  @Post('/me/withdraw')
  @UseGuards(AuthGuard('jwt'))
  async withdraw(@GetUser() user: User, @Body() dto: WithdrawDto) {
    console.log('[UsersController] withdraw 호출됨');
    console.log('[UsersController] user:', {
      id: user.id,
      email: user.email,
      nickname: user.nickname
    });
    console.log('[UsersController] dto:', dto);
    
    try {
      const result = await this.usersService.withdraw(user.id, dto.reason);
      console.log('[UsersController] withdraw 성공:', result);
      return result;
    } catch (error) {
      console.error('[UsersController] withdraw 실패:', error);
      throw error;
    }
  }

  /**
   * 모든 유저 조회 (관리자만)
   */
  @Get('/admin/all')
  @UseGuards(AdminGuard)
  async getAllUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
    @Query('search') search?: string,
  ) {
    return this.usersService.getAllUsers({
      page: parseInt(page),
      limit: parseInt(limit),
      search,
    });
  }

  /**
   * 유저 상세 정보 조회 (관리자만)
   */
  @Get('/admin/:id')
  @UseGuards(AdminGuard)
  async getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  /**
   * 유저 역할 변경 (관리자만)
   */
  @Patch('/admin/:id/role')
  @UseGuards(AdminGuard)
  async updateUserRole(
    @Param('id') id: string,
    @Body('role') role: string,
  ) {
    return this.usersService.updateUserRole(id, role);
  }

  /**
   * 유저 계정 상태 변경 (관리자만)
   */
  @Patch('/admin/:id/status')
  @UseGuards(AdminGuard)
  async updateUserStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.usersService.updateUserStatus(id, isActive);
  }
} 