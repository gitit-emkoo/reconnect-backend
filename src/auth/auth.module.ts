// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt'; // JwtModule 임포트
import { PassportModule } from '@nestjs/passport'; // PassportModule 임포트
import { JwtStrategy } from './jwt.strategy'; // JwtStrategy 임포트
import { DiagnosisModule } from '../diagnosis/diagnosis.module';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }), // PassportModule 등록
    // JwtModule 설정 추가
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'superSecretKey', // JWT 서명에 사용할 secret 키 (환경 변수에서 가져옴)
      signOptions: { expiresIn: '90d' }, // 토큰 만료 시간 (90일로 연장)
    }),
    DiagnosisModule, // [추가]
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy], // JwtStrategy를 providers에 추가
  exports: [AuthService, PassportModule], // PassportModule도 export 할 수 있음 (다른 모듈에서 guard 사용 시 필요할 수 있음)
})
export class AuthModule {}
