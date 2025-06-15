import { AppService } from './app.service';
import { User } from '@prisma/client';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHello(): string;
    createUser(userData: {
        email: string;
        nickname: string;
    }): Promise<User>;
    getUsers(): Promise<User[]>;
}
