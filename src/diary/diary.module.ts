import { Module } from '@nestjs/common';
import { DiaryController } from './diary.controller';
import { DiaryService } from './diary.service';
import { PrismaModule } from '../prisma/prisma.module';
 
@Module({
  imports: [PrismaModule],
  controllers: [DiaryController],
  providers: [DiaryService],
})
export class DiaryModule {
  constructor() {
    console.log('DiaryModule loaded!');
  }
} 