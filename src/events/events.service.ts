import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async createEntry(eventKey: string, userId: string) {
    if (!userId) {
      throw new Error('Unauthorized: missing user id');
    }
    
    // 먼저 기존 응모 기록이 있는지 확인
    const existingEntry = await this.prisma.eventEntry.findFirst({
      where: { eventKey, userId },
    });
    
    if (existingEntry) {
      return existingEntry; // 이미 응모한 경우 기존 기록 반환
    }
    
    // 새로운 응모 기록 생성
    const entry = await this.prisma.eventEntry.create({
      data: { eventKey, userId },
    });
    return entry;
  }

  async listEntries(eventKey: string) {
    const entries = await this.prisma.eventEntry.findMany({
      where: { eventKey },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, email: true, nickname: true, profileImageUrl: true },
        },
      },
    });
    return entries;
  }

  async findMyEntry(eventKey: string, userId: string) {
    if (!userId) return null;
    return this.prisma.eventEntry.findFirst({
      where: { eventKey, userId },
    });
  }
}


