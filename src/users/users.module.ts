import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MailService } from '../mail.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService, PrismaService, JwtAuthGuard, MailService],
})
export class UsersModule {} 