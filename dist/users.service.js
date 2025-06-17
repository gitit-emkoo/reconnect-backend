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
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const mail_service_1 = require("./mail.service");
let UsersService = class UsersService {
    constructor(prisma, mailService) {
        this.prisma = prisma;
        this.mailService = mailService;
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
    async changePassword(userId, currentPassword, newPassword) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('사용자를 찾을 수 없습니다.');
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            throw new Error('현재 비밀번호가 일치하지 않습니다.');
        }
        if (currentPassword === newPassword) {
            throw new Error('새 비밀번호는 기존 비밀번호와 달라야 합니다.');
        }
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            throw new Error('비밀번호는 8자 이상, 영문/숫자/특수문자를 포함해야 합니다.');
        }
        const hashed = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({ where: { id: userId }, data: { password: hashed } });
        return { success: true };
    }
    async sendPasswordResetEmail(email) {
        const user = await this.prisma.user.findUnique({ where: { email } });
        if (!user)
            throw new common_1.NotFoundException('해당 이메일의 사용자가 없습니다.');
        const token = crypto.randomBytes(32).toString('hex');
        const expires = new Date(Date.now() + 1000 * 60 * 60);
        await this.prisma.user.update({
            where: { email },
            data: {
                resetPasswordToken: token,
                resetPasswordTokenExpires: expires,
            },
        });
        const resetUrl = `https://reconnect-ivory.vercel.app/reset-password?token=${token}`;
        if (this.mailService && this.mailService.sendMail) {
            await this.mailService.sendMail({
                to: email,
                subject: '비밀번호 재설정 안내',
                html: `<a href="${resetUrl}">여기를 클릭해 비밀번호를 재설정하세요.</a>`,
            });
        }
        else {
            console.log(`메일 발송: ${email}, 제목: 비밀번호 재설정 안내, 내용: ${resetUrl}`);
        }
        return { message: '비밀번호 재설정 링크가 이메일로 전송되었습니다.' };
    }
    async resetPassword(token, newPassword) {
        const user = await this.prisma.user.findFirst({
            where: {
                resetPasswordToken: token,
                resetPasswordTokenExpires: {
                    gte: new Date(),
                },
            },
        });
        if (!user) {
            throw new common_1.NotFoundException('유효하지 않은 토큰이거나 토큰이 만료되었습니다.');
        }
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
        if (!passwordRegex.test(newPassword)) {
            throw new common_1.BadRequestException('비밀번호는 8자 이상, 영문/숫자/특수문자를 포함해야 합니다.');
        }
        if (await bcrypt.compare(newPassword, user.password)) {
            throw new common_1.BadRequestException('새 비밀번호는 기존 비밀번호와 달라야 합니다.');
        }
        const hashed = await bcrypt.hash(newPassword, 10);
        await this.prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashed,
                resetPasswordToken: null,
                resetPasswordTokenExpires: null,
            },
        });
        return { success: true, message: '비밀번호가 성공적으로 변경되었습니다.' };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        mail_service_1.MailService])
], UsersService);
//# sourceMappingURL=users.service.js.map