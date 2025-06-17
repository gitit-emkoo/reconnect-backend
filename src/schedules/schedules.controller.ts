import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { CreateScheduleDto, UpdateScheduleDto } from './dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('schedules')
@UseGuards(JwtAuthGuard)
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post()
  async create(@Body() createScheduleDto: CreateScheduleDto, @Request() req) {
    return this.schedulesService.create(createScheduleDto, req.user.id);
  }

  @Get()
  async findAll(@Request() req) {
    return this.schedulesService.findAllByUserId(req.user.id);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    return this.schedulesService.findOne(id, req.user.id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateScheduleDto: UpdateScheduleDto, @Request() req) {
    return this.schedulesService.update(id, updateScheduleDto, req.user.id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    return this.schedulesService.remove(id, req.user.id);
  }

  @Get('date/:date')
  async findByDate(@Param('date') date: string, @Request() req) {
    return this.schedulesService.findByDate(date, req.user.id);
  }
} 