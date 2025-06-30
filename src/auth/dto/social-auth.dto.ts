import { IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator';

export class SocialAuthDto {
  @IsString()
  @IsNotEmpty({ message: '인증 코드는 필수입니다.' })
  code: string;
}

class UnauthDiagnosisDto {
  @IsString()
  id: string;

  @IsString()
  score: number;

  @IsString()
  resultType: string;

  @IsString()
  createdAt: string;
}

export class GoogleAuthDto {
  @IsString()
  @IsNotEmpty({ message: '액세스 토큰은 필수입니다.' })
  accessToken: string;

  @IsOptional()
  @IsObject()
  unauthDiagnosis?: UnauthDiagnosisDto;
} 