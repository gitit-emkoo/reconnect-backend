import { PrismaService } from './prisma/prisma.service';
import { User } from '@prisma/client';
export declare class AppService {
    private prisma;
    constructor(prisma: PrismaService);
    getHello(): string;
    createTestUser(email: string, nickname: string): Promise<User>;
    getAllUsers(): Promise<User[]>;
}
