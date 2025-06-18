import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateContentDto } from './dto/create-content.dto';
import { UpdateContentDto } from './dto/update-content.dto';

@Injectable()
export class ContentService {
  constructor(private readonly prisma: PrismaService) {}

  create(createContentDto: CreateContentDto) {
    return this.prisma.content.create({ data: createContentDto });
  }

  findAll() {
    return this.prisma.content.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findOne(id: string) {
    return this.prisma.content.findUnique({ where: { id } });
  }

  update(id: string, updateContentDto: UpdateContentDto) {
    return this.prisma.content.update({
      where: { id },
      data: updateContentDto,
    });
  }

  remove(id: string) {
    return this.prisma.content.delete({ where: { id } });
  }
}
