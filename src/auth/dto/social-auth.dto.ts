import { IsNotEmpty, IsString, IsOptional, IsObject, IsNumber, IsArray } from 'class-validator';

export class SocialAuthDto {
  @IsString()
  @IsNotEmpty({ message: '인증 코드는 필수입니다.' })
  code: string;
}

class UnauthDiagnosisDto {
  @IsNumber()
  score: number;

  @IsOptional()
  @IsArray()
  answers?: string[];

  @IsOptional()
  @IsString()
  createdAt?: string;
}

export class GoogleAuthDto {
  @IsString()
  @IsNotEmpty({ message: '액세스 토큰은 필수입니다.' })
  accessToken: string;

  @IsOptional()
  @IsObject()
  unauthDiagnosis?: UnauthDiagnosisDto;
}

export class AppleAuthDto {
  @IsString()
  @IsNotEmpty({ message: 'Apple ID 토큰은 필수입니다.' })
  idToken: string;

  @IsOptional()
  @IsString()
  authorizationCode?: string;

  @IsOptional()
  @IsString()
  user?: string; // Apple에서 제공하는 사용자 정보 (JSON string)

  @IsOptional()
  @IsObject()
  unauthDiagnosis?: UnauthDiagnosisDto;
} 