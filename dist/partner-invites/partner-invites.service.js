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
exports.PartnerInvitesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const uuid_1 = require("uuid");
const jwt_1 = require("@nestjs/jwt");
const notifications_service_1 = require("../notifications/notifications.service");
const auth_service_1 = require("../auth/auth.service");
const diagnosis_service_1 = require("../diagnosis/diagnosis.service");
let PartnerInvitesService = class PartnerInvitesService {
    constructor(prisma, jwtService, notificationsService, authService, diagnosisService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.notificationsService = notificationsService;
        this.authService = authService;
        this.diagnosisService = diagnosisService;
    }
    async createInviteCode(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { couple: true }
        });
        if (!user) {
            throw new common_1.NotFoundException('사용자를 찾을 수 없습니다.');
        }
        if (user.couple) {
            throw new common_1.BadRequestException('이미 파트너와 연결되어 있습니다.');
        }
        const existingInvite = await this.prisma.partnerInvite.findFirst({
            where: {
                inviterId: userId,
                status: {
                    in: ['PENDING', 'RESPONDED']
                }
            }
        });
        if (existingInvite) {
            throw new common_1.BadRequestException('이미 진행 중인 초대가 있습니다.');
        }
        const invite = await this.prisma.partnerInvite.create({
            data: {
                code: (0, uuid_1.v4)().slice(0, 8),
                inviterId: userId,
                status: 'PENDING'
            }
        });
        return invite;
    }
    async respondToInvite(code, inviteeId) {
        const invite = await this.prisma.partnerInvite.findUnique({
            where: { code },
            include: { inviter: true }
        });
        if (!invite) {
            throw new common_1.NotFoundException('유효하지 않은 초대 코드입니다.');
        }
        if (invite.status !== 'PENDING') {
            throw new common_1.BadRequestException('이미 사용된 초대 코드입니다.');
        }
        if (invite.inviterId === inviteeId) {
            throw new common_1.BadRequestException('자기 자신을 초대할 수 없습니다.');
        }
        const inviteeUser = await this.prisma.user.findUnique({
            where: { id: inviteeId },
            include: { couple: true },
        });
        if (!inviteeUser) {
            throw new common_1.NotFoundException('사용자를 찾을 수 없습니다.');
        }
        if (inviteeUser.couple) {
            throw new common_1.BadRequestException('이미 파트너와 연결되어 있습니다.');
        }
        const result = await this.prisma.$transaction(async (tx) => {
            const inviterDiagnosis = await this.diagnosisService.getMyLatestDiagnosis(invite.inviterId);
            const inviteeDiagnosis = await this.diagnosisService.getMyLatestDiagnosis(inviteeId);
            const inviterScore = inviterDiagnosis?.score ?? 61;
            const inviteeScore = inviteeDiagnosis?.score ?? 61;
            const synchronizedScore = Math.min(inviterScore, inviteeScore);
            await tx.diagnosisResult.createMany({
                data: [
                    {
                        userId: invite.inviterId,
                        score: synchronizedScore,
                        resultType: '파트너 연결',
                        diagnosisType: 'COUPLE_SYNC',
                    },
                    {
                        userId: inviteeId,
                        score: synchronizedScore,
                        resultType: '파트너 연결',
                        diagnosisType: 'COUPLE_SYNC',
                    },
                ],
            });
            const couple = await tx.couple.create({
                data: {
                    members: {
                        connect: [{ id: invite.inviterId }, { id: inviteeId }],
                    },
                },
            });
            const updatedInvite = await tx.partnerInvite.update({
                where: { id: invite.id },
                data: {
                    inviteeId,
                    status: 'CONFIRMED',
                    coupleId: couple.id,
                },
                include: {
                    inviter: true,
                    invitee: true,
                },
            });
            await tx.user.update({
                where: { id: invite.inviterId },
                data: { partnerId: inviteeId },
            });
            await tx.user.update({
                where: { id: inviteeId },
                data: { partnerId: invite.inviterId },
            });
            if (updatedInvite.invitee && updatedInvite.inviter) {
                await this.notificationsService.createNotification({
                    userId: invite.inviterId,
                    message: `${updatedInvite.invitee.nickname}님과 파트너로 연결되었어요!`,
                    type: 'PARTNER_CONNECTED',
                    url: '/dashboard',
                });
                await this.notificationsService.createNotification({
                    userId: inviteeId,
                    message: `${updatedInvite.inviter.nickname}님과 파트너로 연결되었어요!`,
                    type: 'PARTNER_CONNECTED',
                    url: '/dashboard',
                });
            }
            const updatedInvitee = await tx.user.findUnique({
                where: { id: inviteeId },
                include: { partner: true, couple: true },
            });
            return { updatedInvitee, invite: updatedInvite };
        });
        const { updatedInvitee, invite: updatedInvite } = result;
        if (!updatedInvitee || !updatedInvite.inviter || !updatedInvite.invitee) {
            throw new Error('파트너 연결 후 사용자 정보를 업데이트하지 못했습니다.');
        }
        const inviter = updatedInvite.inviter;
        const invitee = updatedInvite.invitee;
        const [inviterFull, inviteeFull] = await Promise.all([
            this.prisma.user.findUnique({ where: { id: inviter.id }, include: { couple: true } }),
            this.prisma.user.findUnique({ where: { id: invitee.id }, include: { couple: true } }),
        ]);
        if (!inviterFull || !inviteeFull) {
            throw new common_1.InternalServerErrorException('Failed to retrieve full user data.');
        }
        const inviterPayload = {
            userId: inviterFull.id,
            email: inviterFull.email,
            nickname: inviterFull.nickname,
            role: inviterFull.role,
            partnerId: inviteeFull.id,
            couple: inviterFull.couple ? { id: inviterFull.couple.id } : null,
        };
        const inviterToken = this.jwtService.sign(inviterPayload);
        const inviteePayload = {
            userId: inviteeFull.id,
            email: inviteeFull.email,
            nickname: inviteeFull.nickname,
            role: inviteeFull.role,
            partnerId: inviterFull.id,
            couple: inviteeFull.couple ? { id: inviteeFull.couple.id } : null,
        };
        const inviteeToken = this.jwtService.sign(inviteePayload);
        return {
            inviter: { ...inviterFull, partnerId: inviteeFull.id },
            invitee: { ...inviteeFull, partnerId: inviterFull.id },
            inviterToken,
            inviteeToken,
        };
    }
    async acceptInvite(code, inviteeId) {
        const invite = await this.prisma.partnerInvite.findUnique({
            where: { code },
        });
        if (!invite || invite.status !== 'PENDING') {
            throw new common_1.NotFoundException('유효하지 않거나 만료된 초대 코드입니다.');
        }
        if (invite.inviterId === inviteeId) {
            throw new common_1.BadRequestException('자기 자신을 초대할 수 없습니다.');
        }
        return this.prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: invite.inviterId },
                data: { partnerId: inviteeId },
            });
            await tx.user.update({
                where: { id: inviteeId },
                data: { partnerId: invite.inviterId },
            });
            const couple = await tx.couple.create({
                data: {
                    members: {
                        connect: [{ id: invite.inviterId }, { id: inviteeId }],
                    },
                },
            });
            await tx.partnerInvite.update({
                where: { id: invite.id },
                data: {
                    inviteeId,
                    status: 'CONFIRMED',
                    coupleId: couple.id,
                },
            });
            const [inviter, invitee] = await Promise.all([
                tx.user.findUnique({ where: { id: invite.inviterId } }),
                tx.user.findUnique({ where: { id: inviteeId } }),
            ]);
            if (!inviter || !invitee) {
                throw new common_1.InternalServerErrorException("Failed to retrieve user data after update.");
            }
            await this.notificationsService.createNotification({
                userId: inviter.id,
                message: `${invitee.nickname}님과 파트너로 연결되었어요!`,
                type: 'PARTNER_CONNECTED',
                url: '/dashboard',
            });
            await this.notificationsService.createNotification({
                userId: invitee.id,
                message: `${inviter.nickname}님과 파트너로 연결되었어요!`,
                type: 'PARTNER_CONNECTED',
                url: '/dashboard',
            });
            const inviterToken = this.jwtService.sign({ userId: inviter.id, partnerId: invitee.id });
            const inviteeToken = this.jwtService.sign({ userId: invitee.id, partnerId: inviter.id });
            return {
                inviter,
                invitee,
                inviterToken,
                inviteeToken,
            };
        });
    }
    async rejectInvite(inviteId, inviterId) {
        const invite = await this.prisma.partnerInvite.findUnique({
            where: { id: inviteId }
        });
        if (!invite) {
            throw new common_1.NotFoundException('초대를 찾을 수 없습니다.');
        }
        if (invite.inviterId !== inviterId) {
            throw new common_1.BadRequestException('초대를 거절할 권한이 없습니다.');
        }
        if (invite.status !== 'RESPONDED') {
            throw new common_1.BadRequestException('이미 처리된 초대입니다.');
        }
        const updatedInvite = await this.prisma.partnerInvite.update({
            where: { id: invite.id },
            data: {
                status: 'REJECTED'
            }
        });
        return updatedInvite;
    }
    async getMyInvites(userId) {
        const invites = await this.prisma.partnerInvite.findMany({
            where: {
                OR: [
                    { inviterId: userId },
                    { inviteeId: userId }
                ]
            },
            include: {
                inviter: {
                    select: {
                        id: true,
                        nickname: true,
                        profileImageUrl: true
                    }
                },
                invitee: {
                    select: {
                        id: true,
                        nickname: true,
                        profileImageUrl: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return invites;
    }
};
exports.PartnerInvitesService = PartnerInvitesService;
exports.PartnerInvitesService = PartnerInvitesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        notifications_service_1.NotificationsService,
        auth_service_1.AuthService,
        diagnosis_service_1.DiagnosisService])
], PartnerInvitesService);
//# sourceMappingURL=partner-invites.service.js.map