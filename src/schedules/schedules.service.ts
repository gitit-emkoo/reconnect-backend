import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScheduleDto, UpdateScheduleDto } from './dto';

@Injectable()
export class SchedulesService {
  constructor(private prisma: PrismaService) {}

  async create(createScheduleDto: CreateScheduleDto, userId: string) {
    return this.prisma.schedule.create({
      data: {
        ...createScheduleDto,
        userId,
      },
    });
  }

  async findAllByUserId(userId: string) {
    return this.prisma.schedule.findMany({
      where: { userId },
      orderBy: { date: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
    });

    if (!schedule) {
      throw new NotFoundException('일정을 찾을 수 없습니다.');
    }

    if (schedule.userId !== userId) {
      throw new ForbiddenException('이 일정에 접근할 권한이 없습니다.');
    }

    return schedule;
  }

  async update(id: string, updateScheduleDto: UpdateScheduleDto, userId: string) {
    // 먼저 일정이 존재하고 사용자가 소유자인지 확인
    await this.findOne(id, userId);

    return this.prisma.schedule.update({
      where: { id },
      data: updateScheduleDto,
    });
  }

  async remove(id: string, userId: string) {
    // 먼저 일정이 존재하고 사용자가 소유자인지 확인
    await this.findOne(id, userId);

    return this.prisma.schedule.delete({
      where: { id },
    });
  }

  async findByDate(date: string, userId: string) {
    return this.prisma.schedule.findMany({
      where: {
        userId,
        date,
      },
      orderBy: { createdAt: 'asc' },
    });
  }
} 