import { Injectable } from '@nestjs/common';
import { CreateDiagnosisDto } from './dto/create-diagnosis.dto';
import { UpdateDiagnosisDto } from './dto/update-diagnosis.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DiagnosisService {
  constructor(private prisma: PrismaService) {}

  async create(createDiagnosisDto: CreateDiagnosisDto) {
    return this.prisma.diagnosisResult.create({
      data: createDiagnosisDto,
    });
  }

  async findLatest(userId: string) {
    return this.prisma.diagnosisResult.findFirst({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  findAll() {
    return `This action returns all diagnosis`;
  }

  findOne(id: number) {
    return `This action returns a #${id} diagnosis`;
  }

  update(id: number, updateDiagnosisDto: UpdateDiagnosisDto) {
    return `This action updates a #${id} diagnosis`;
  }

  remove(id: number) {
    return `This action removes a #${id} diagnosis`;
  }
}
