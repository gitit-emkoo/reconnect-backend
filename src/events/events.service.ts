import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async createEntry(eventKey: string, userId: string) {
    try {
      const entry = await this.prisma.eventEntry.create({
        data: { eventKey, userId },
      });
      return entry;
    } catch (e) {
      // Unique constraint (already participated) → return existing-like response
      const exists = await this.prisma.eventEntry.findUnique({
        where: { eventKey_userId: { eventKey, userId } },
      });
      if (exists) return exists;
      throw e;
    }
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
}


