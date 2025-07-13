import { Controller, Post, Body, UseGuards, Get } from '@nestjs/common';
import { SupportService } from './support.service';
import { CreateSupportDto } from './dto/create-support.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '@prisma/client';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('inquiry')
  @UseGuards(JwtAuthGuard)
  async createInquiry(
    @Body() createSupportDto: CreateSupportDto,
    @GetUser() user: User,
  ) {
    return this.supportService.createInquiry(createSupportDto, user);
  }

  @Get('my-inquiries')
  @UseGuards(JwtAuthGuard)
  async getMyInquiries(@GetUser() user: User) {
    return this.supportService.getMyInquiries(user);
  }
} 