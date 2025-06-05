// src/prisma/prisma.module.ts
import { Module, Global } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // 이 모듈을 어디서든 임포트할 필요 없이 전역적으로 사용 가능하게 함 (편의상)
@Module({
  providers: [PrismaService], // PrismaService를 이 모듈의 Provider로 등록
  exports: [PrismaService],   // 이 모듈을 임포트하는 다른 모듈에서 PrismaService를 사용할 수 있도록 export
})
export class PrismaModule {}