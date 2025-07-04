import { Controller, Post, Body, Get, Param, Put, Delete, UseGuards, Request } from '@nestjs/common';
import { AgreementService } from './agreement.service';
import { CreateAgreementDto } from './dto/create-agreement.dto';
import { SignAgreementDto } from './dto/sign-agreement.dto';
import { UpdateAgreementStatusDto } from './dto/update-agreement-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('agreements')
@UseGuards(JwtAuthGuard)
export class AgreementController {
  constructor(private readonly agreementService: AgreementService) {}

  @Post()
  async create(@Body() createAgreementDto: CreateAgreementDto, @Request() req) {
    return this.agreementService.create({
      ...createAgreementDto,
      authorId: req.user.id,
    });
  }

  @Get()
  async findAll() {
    return this.agreementService.findAll();
  }

  @Get('my')
  async findMyAgreements(@Request() req) {
    const result = await this.agreementService.findByUser(req.user.id);
    return Array.isArray(result) ? result : [];
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.agreementService.findOne(id);
  }

  @Put(':id/sign')
  async signAgreement(
    @Param('id') id: string,
    @Body() signAgreementDto: SignAgreementDto,
    @Request() req,
  ) {
    return this.agreementService.signAgreement(id, req.user.id, signAgreementDto);
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateAgreementStatusDto,
    @Request() req,
  ) {
    return this.agreementService.updateStatus(id, req.user.id, updateStatusDto);
  }

  @Delete(':id')
  async deleteAgreement(@Param('id') id: string, @Request() req) {
    return this.agreementService.deleteAgreement(id, req.user.id);
  }
} 