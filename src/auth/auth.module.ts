// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt'; // JwtModule 임포트

@Module({
  imports: [
    PrismaModule,
    // JwtModule 설정 추가
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'superSecretKey', // JWT 서명에 사용할 secret 키 (환경 변수에서 가져옴)
      signOptions: { expiresIn: '1h' }, // 토큰 만료 시간 (예: 1시간)
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService], // AuthService를 다른 모듈에서 사용하려면 export해야 함 (나중에 필요할 수 있음)
})
export class AuthModule {}
