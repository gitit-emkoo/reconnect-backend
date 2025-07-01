import { IsString, MinLength, Matches } from 'class-validator';

/**
 * 로그인한 사용자가 비밀번호를 변경할 때 사용하는 DTO
 * - currentPassword: 현재 비밀번호
 * - newPassword: 새 비밀번호(8자 이상, 영문/숫자/특수문자 포함)
 */
export class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/, {
    message: '비밀번호는 영문, 숫자, 특수문자를 모두 포함해야 합니다.',
  })
  newPassword: string;
} 