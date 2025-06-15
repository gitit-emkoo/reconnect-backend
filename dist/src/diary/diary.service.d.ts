import { PrismaService } from '../prisma/prisma.service';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { UpdateDiaryDto } from './dto/update-diary.dto';
export declare class DiaryService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(createDiaryDto: CreateDiaryDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        comment: string;
        date: string;
        emotion: import("@prisma/client/runtime/library").JsonValue;
        triggers: import("@prisma/client/runtime/library").JsonValue;
        palette: import("@prisma/client/runtime/library").JsonValue;
        randomInfo: import("@prisma/client/runtime/library").JsonValue;
    }>;
    findAll(userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        comment: string;
        date: string;
        emotion: import("@prisma/client/runtime/library").JsonValue;
        triggers: import("@prisma/client/runtime/library").JsonValue;
        palette: import("@prisma/client/runtime/library").JsonValue;
        randomInfo: import("@prisma/client/runtime/library").JsonValue;
    }[]>;
    findByDate(userId: string, date: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        comment: string;
        date: string;
        emotion: import("@prisma/client/runtime/library").JsonValue;
        triggers: import("@prisma/client/runtime/library").JsonValue;
        palette: import("@prisma/client/runtime/library").JsonValue;
        randomInfo: import("@prisma/client/runtime/library").JsonValue;
    } | null>;
    update(id: string, updateDiaryDto: UpdateDiaryDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        comment: string;
        date: string;
        emotion: import("@prisma/client/runtime/library").JsonValue;
        triggers: import("@prisma/client/runtime/library").JsonValue;
        palette: import("@prisma/client/runtime/library").JsonValue;
        randomInfo: import("@prisma/client/runtime/library").JsonValue;
    }>;
    remove(id: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        comment: string;
        date: string;
        emotion: import("@prisma/client/runtime/library").JsonValue;
        triggers: import("@prisma/client/runtime/library").JsonValue;
        palette: import("@prisma/client/runtime/library").JsonValue;
        randomInfo: import("@prisma/client/runtime/library").JsonValue;
    }>;
}
