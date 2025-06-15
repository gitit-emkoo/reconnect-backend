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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("./prisma/prisma.service");
let UsersService = class UsersService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async updateNickname(userId, nickname) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: { nickname },
        });
        if (!user)
            throw new common_1.NotFoundException('사용자를 찾을 수 없습니다.');
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
    async findUserById(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                partner: true,
                partnerOf: true,
                couple: true,
            },
        });
        if (!user)
            throw new common_1.NotFoundException('사용자를 찾을 수 없습니다.');
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map