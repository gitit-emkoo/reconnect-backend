import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseGuards,
} from '@nestjs/common';
import { SchedulesService } from './schedules.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '@prisma/client';
import { CreateScheduleDto, UpdateScheduleDto } from './dto';

@Controller('schedules')
@UseGuards(JwtAuthGuard)
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Post()
  create(@Body() createScheduleDto: CreateScheduleDto, @GetUser() user: User) {
    return this.schedulesService.create(createScheduleDto, user.id);
  }

  @Get()
  findAll(@GetUser() user: User) {
    return this.schedulesService.findAllByUserId(user.id);
  }

  @Get('date/:date')
  findByDate(@Param('date') date: string, @GetUser() user: User) {
    return this.schedulesService.findByDate(date, user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @GetUser() user: User) {
    return this.schedulesService.findOne(id, user.id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateScheduleDto: UpdateScheduleDto,
    @GetUser() user: User,
  ) {
    return this.schedulesService.update(id, updateScheduleDto, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @GetUser() user: User) {
    return this.schedulesService.remove(id, user.id);
  }
} 