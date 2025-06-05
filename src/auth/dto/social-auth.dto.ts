import { IsNotEmpty, IsString } from 'class-validator';

export class SocialAuthDto {
  @IsString()
  @IsNotEmpty({ message: '인증 코드는 필수입니다.' })
  code: string;
}

export class GoogleAuthDto {
  @IsString()
  @IsNotEmpty({ message: '액세스 토큰은 필수입니다.' })
  access_token: string;
} 