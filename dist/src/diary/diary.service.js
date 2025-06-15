"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiaryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let DiaryService = class DiaryService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createDiaryDto) {
        return this.prisma.diary.create({ data: createDiaryDto });
    }
    async findAll(userId) {
        return this.prisma.diary.findMany({
            where: { userId },
            orderBy: { date: 'desc' },
        });
    }
    async findByDate(userId, date) {
        return this.prisma.diary.findFirst({ where: { userId, date } });
    }
    async update(id, updateDiaryDto) {
        const diary = await this.prisma.diary.findUnique({ where: { id } });
        if (!diary)
            throw new common_1.NotFoundException('Diary not found');
        return this.prisma.diary.update({ where: { id }, data: updateDiaryDto });
    }
    async remove(id) {
        const diary = await this.prisma.diary.findUnique({ where: { id } });
        if (!diary)
            throw new common_1.NotFoundException('Diary not found');
        return this.prisma.diary.delete({ where: { id } });
    }
};
exports.DiaryService = DiaryService;
exports.DiaryService = DiaryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DiaryService);
//# sourceMappingURL=diary.service.js.map