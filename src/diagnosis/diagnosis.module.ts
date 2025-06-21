import { Module } from '@nestjs/common';
import { DiagnosisService } from './diagnosis.service';
import { DiagnosisController } from './diagnosis.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DiagnosisController],
  providers: [DiagnosisService],
})
export class DiagnosisModule {}
