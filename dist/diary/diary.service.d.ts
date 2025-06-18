import { PrismaService } from '../prisma/prisma.service';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { UpdateDiaryDto } from './dto/update-diary.dto';
export declare class DiaryService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createDiaryDto: CreateDiaryDto): Promise<{
        date: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        comment: string;
        emotion: import("@prisma/client/runtime/library").JsonValue;
        triggers: import("@prisma/client/runtime/library").JsonValue;
        palette: import("@prisma/client/runtime/library").JsonValue;
        randomInfo: import("@prisma/client/runtime/library").JsonValue;
    }>;
    findAll(userId: string): Promise<{
        date: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        comment: string;
        emotion: import("@prisma/client/runtime/library").JsonValue;
        triggers: import("@prisma/client/runtime/library").JsonValue;
        palette: import("@prisma/client/runtime/library").JsonValue;
        randomInfo: import("@prisma/client/runtime/library").JsonValue;
    }[]>;
    findByDate(userId: string, date: string): Promise<{
        date: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        comment: string;
        emotion: import("@prisma/client/runtime/library").JsonValue;
        triggers: import("@prisma/client/runtime/library").JsonValue;
        palette: import("@prisma/client/runtime/library").JsonValue;
        randomInfo: import("@prisma/client/runtime/library").JsonValue;
    } | null>;
    update(id: string, updateDiaryDto: UpdateDiaryDto): Promise<{
        date: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        comment: string;
        emotion: import("@prisma/client/runtime/library").JsonValue;
        triggers: import("@prisma/client/runtime/library").JsonValue;
        palette: import("@prisma/client/runtime/library").JsonValue;
        randomInfo: import("@prisma/client/runtime/library").JsonValue;
    }>;
    remove(id: string): Promise<{
        date: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        comment: string;
        emotion: import("@prisma/client/runtime/library").JsonValue;
        triggers: import("@prisma/client/runtime/library").JsonValue;
        palette: import("@prisma/client/runtime/library").JsonValue;
        randomInfo: import("@prisma/client/runtime/library").JsonValue;
    }>;
}
