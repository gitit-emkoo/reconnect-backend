import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { DiagnosisService } from './diagnosis.service';
import { CreateDiagnosisDto } from './dto/create-diagnosis.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('diagnosis')
export class DiagnosisController {
  constructor(private readonly diagnosisService: DiagnosisService) {}

  @Post()
  create(@Body() createDiagnosisDto: CreateDiagnosisDto) {
    return this.diagnosisService.create(createDiagnosisDto);
  }

  @Get('latest')
  @UseGuards(JwtAuthGuard)
  findLatest(@Request() req) {
    return this.diagnosisService.findLatest(req.user.userId);
  }
}
