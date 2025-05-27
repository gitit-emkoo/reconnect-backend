import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaModule } from '../prisma/prisma.module'; // PrismaModule 임포트

@Module({
  imports: [PrismaModule], // 여기에 PrismaModule을 추가 (PrismaService를 사용하기 위함)
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
