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
exports.ChallengesService = exports.ChallengeStatus = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
var ChallengeStatus;
(function (ChallengeStatus) {
    ChallengeStatus["IN_PROGRESS"] = "IN_PROGRESS";
    ChallengeStatus["COMPLETED"] = "COMPLETED";
    ChallengeStatus["FAILED"] = "FAILED";
})(ChallengeStatus || (exports.ChallengeStatus = ChallengeStatus = {}));
let ChallengesService = class ChallengesService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getChallengesByCategory(category) {
        return this.prisma.challengeTemplate.findMany({
            where: { category },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getChallengeTemplatesByCategory(category) {
        return this.prisma.challengeTemplate.findMany({
            where: { category },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getActiveChallenge(coupleId) {
        return this.prisma.challenge.findFirst({
            where: {
                coupleId,
                status: ChallengeStatus.IN_PROGRESS,
                endDate: {
                    gte: new Date(),
                },
            },
        });
    }
    async startChallenge(coupleId, templateId) {
        const activeChallenge = await this.getActiveChallenge(coupleId);
        if (activeChallenge) {
            throw new common_1.BadRequestException('이미 진행중인 챌린지가 있습니다.');
        }
        const template = await this.prisma.challengeTemplate.findUnique({
            where: { id: templateId },
        });
        if (!template) {
            throw new common_1.NotFoundException('챌린지 템플릿을 찾을 수 없습니다.');
        }
        const now = new Date();
        const currentDay = now.getDay();
        const startDate = new Date(now);
        const offset = (currentDay === 0) ? 6 : currentDay - 1;
        startDate.setDate(now.getDate() - offset);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        return this.prisma.challenge.create({
            data: {
                coupleId,
                startDate,
                endDate,
                status: ChallengeStatus.IN_PROGRESS,
                title: template.title,
                description: template.description,
                category: template.category,
                frequency: template.frequency,
                isOneTime: template.isOneTime,
                points: template.points,
            },
        });
    }
    async completeChallenge(challengeId, userId) {
        const challenge = await this.prisma.challenge.findUnique({
            where: { id: challengeId },
            include: {
                couple: {
                    include: {
                        members: true,
                    },
                },
            },
        });
        if (!challenge) {
            throw new common_1.NotFoundException('챌린지를 찾을 수 없습니다.');
        }
        const isMember = challenge.couple.members.some(member => member.id === userId);
        if (!isMember) {
            throw new common_1.BadRequestException('해당 챌린지에 참여할 수 없습니다.');
        }
        const isFirstMember = challenge.couple.members[0].id === userId;
        const updateData = isFirstMember
            ? { isCompletedByMember1: true }
            : { isCompletedByMember2: true };
        const updatedChallenge = await this.prisma.challenge.update({
            where: { id: challengeId },
            data: updateData,
        });
        if (updatedChallenge.isCompletedByMember1 && updatedChallenge.isCompletedByMember2) {
            return this.prisma.challenge.update({
                where: { id: challengeId },
                data: {
                    status: ChallengeStatus.COMPLETED,
                    completedAt: new Date(),
                },
            });
        }
        return updatedChallenge;
    }
    async getChallengeHistory(coupleId) {
        const [completed, failed] = await Promise.all([
            this.prisma.challenge.findMany({
                where: {
                    coupleId,
                    status: ChallengeStatus.COMPLETED,
                },
                orderBy: {
                    completedAt: 'desc',
                },
            }),
            this.prisma.challenge.findMany({
                where: {
                    coupleId,
                    status: ChallengeStatus.FAILED,
                },
                orderBy: {
                    endDate: 'desc',
                },
            }),
        ]);
        return {
            completed,
            failed,
        };
    }
    async processExpiredChallenges() {
        const now = new Date();
        const expiredChallenges = await this.prisma.challenge.findMany({
            where: {
                status: ChallengeStatus.IN_PROGRESS,
                endDate: {
                    lt: now,
                },
            },
        });
        for (const challenge of expiredChallenges) {
            await this.prisma.challenge.update({
                where: { id: challenge.id },
                data: {
                    status: ChallengeStatus.FAILED,
                },
            });
        }
    }
    async checkWeeklyChallengeCompletion(coupleId) {
        const now = new Date();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        const completedChallenge = await this.prisma.challenge.findFirst({
            where: {
                coupleId,
                status: ChallengeStatus.COMPLETED,
                completedAt: {
                    gte: startOfWeek,
                    lte: endOfWeek,
                },
            },
        });
        return !!completedChallenge;
    }
};
exports.ChallengesService = ChallengesService;
exports.ChallengesService = ChallengesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChallengesService);
//# sourceMappingURL=challenges.service.js.map