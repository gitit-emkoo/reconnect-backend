import { Module } from '@nestjs/common';
import { DiagnosisController } from './diagnosis.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { DiagnosisService } from './diagnosis.service';

@Module({
  imports: [PrismaModule],
  controllers: [DiagnosisController],
  providers: [DiagnosisService],
  exports: [DiagnosisService],
})
export class DiagnosisModule {
  constructor() {
    console.log('diagnosis module loaded!');
  }
}
