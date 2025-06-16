import { Module } from '@nestjs/common';
import { DiaryController } from './diary.controller';
import { DiaryService } from './diary.service';
import { PrismaService } from '../prisma/prisma.service';
 
@Module({
  controllers: [DiaryController],
  providers: [DiaryService, PrismaService],
})
export class DiaryModule {
  constructor() {
    console.log('DiaryModule loaded!');
  }
} 