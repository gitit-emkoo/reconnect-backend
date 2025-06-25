import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DiagnosisService } from './diagnosis.service';
import { CreateDiagnosisDto } from './dto/create-diagnosis.dto';
import { UpdateDiagnosisDto } from './dto/update-diagnosis.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import type { User } from '@prisma/client';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';

@Controller('diagnosis')
export class DiagnosisController {
  constructor(private readonly diagnosisService: DiagnosisService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createDiagnosisDto: CreateDiagnosisDto, @GetUser() user: User) {
    return this.diagnosisService.create(user.id, createDiagnosisDto);
  }

  @Post('unauth')
  @UseGuards(JwtAuthGuard)
  createFromUnauth(@Body() createDiagnosisDto: CreateDiagnosisDto, @GetUser() user: User) {
    return this.diagnosisService.createOrUpdateFromUnauth(user.id, createDiagnosisDto);
  }

  @Get('my-latest')
  @UseGuards(JwtAuthGuard)
  findMyLatest(@GetUser() user: User) {
    return this.diagnosisService.getMyLatestDiagnosis(user.id);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll() {
    return this.diagnosisService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.diagnosisService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateDiagnosisDto: UpdateDiagnosisDto,
  ) {
    return this.diagnosisService.update(+id, updateDiagnosisDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.diagnosisService.remove(+id);
  }
}
