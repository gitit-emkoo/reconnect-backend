import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional, IsArray, IsNumber } from 'class-validator';
import { Provider } from '@prisma/client';

export class RegisterDto {
  @IsEmail({}, { message: '유효한 이메일 형식이 아닙니다.' })
  @IsNotEmpty({ message: '이메일은 필수 입력 항목입니다.' })
  email: string;

  @IsString({ message: '비밀번호는 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '비밀번호는 필수 입력 항목입니다.' })
  @MinLength(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' })
  password: string;

  @IsString({ message: '닉네임은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '닉네임은 필수 입력 항목입니다.' })
  nickname: string;

  @IsEnum(Provider, { message: '유효한 제공자가 아닙니다.' })
  @IsOptional()
  provider?: Provider;

  @IsString({ message: '소셜 ID는 문자열이어야 합니다.' })
  @IsOptional()
  socialId?: string;

  @IsOptional()
  @IsString()
  diagnosisId?: string;

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  answers?: number[];

  @IsOptional()
  @IsString()
  unauthDiagnosisId?: string;
}