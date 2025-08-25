import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { UpdateDiaryDto } from './dto/update-diary.dto';

@Injectable()
export class DiaryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDiaryDto: CreateDiaryDto) {
    return this.prisma.diary.create({ data: createDiaryDto });
  }

  async findAll(userId: string) {
    return this.prisma.diary.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    });
  }

  async findByDate(userId: string, date: string) {
    return this.prisma.diary.findFirst({ where: { userId, date } });
  }

  async update(id: string, updateDiaryDto: UpdateDiaryDto) {
    const diary = await this.prisma.diary.findUnique({ where: { id } });
    if (!diary) throw new NotFoundException('Diary not found');
    return this.prisma.diary.update({ where: { id }, data: updateDiaryDto });
  }

  async remove(id: string) {
    const diary = await this.prisma.diary.findUnique({ where: { id } });
    if (!diary) throw new NotFoundException('Diary not found');
    return this.prisma.diary.delete({ where: { id } });
  }
} 