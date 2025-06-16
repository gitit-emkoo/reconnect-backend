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
let PartnerInvitesService = class PartnerInvitesService {
    constructor(prisma) {
        this.prisma = prisma;
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
        const invitee = await this.prisma.user.findUnique({
            where: { id: inviteeId },
            include: { couple: true }
        });
        if (!invitee) {
            throw new common_1.NotFoundException('사용자를 찾을 수 없습니다.');
        }
        if (invitee.couple) {
            throw new common_1.BadRequestException('이미 파트너와 연결되어 있습니다.');
        }
        const result = await this.prisma.$transaction(async (prisma) => {
            const couple = await prisma.couple.create({
                data: {
                    members: {
                        connect: [
                            { id: invite.inviterId },
                            { id: inviteeId }
                        ]
                    }
                }
            });
            const updatedInvite = await prisma.partnerInvite.update({
                where: { id: invite.id },
                data: {
                    inviteeId,
                    status: 'CONFIRMED',
                    coupleId: couple.id
                },
                include: {
                    inviter: true,
                    invitee: true
                }
            });
            await prisma.user.update({
                where: { id: invite.inviterId },
                data: { partnerId: inviteeId }
            });
            await prisma.user.update({
                where: { id: inviteeId },
                data: { partnerId: invite.inviterId }
            });
            return { couple, invite: updatedInvite };
        });
        return result;
    }
    async acceptInvite(inviteId, inviterId) {
        const invite = await this.prisma.partnerInvite.findUnique({
            where: { id: inviteId },
            include: {
                inviter: true,
                invitee: true
            }
        });
        if (!invite) {
            throw new common_1.NotFoundException('초대를 찾을 수 없습니다.');
        }
        if (invite.inviterId !== inviterId) {
            throw new common_1.BadRequestException('초대를 수락할 권한이 없습니다.');
        }
        if (invite.status !== 'RESPONDED') {
            throw new common_1.BadRequestException('이미 처리된 초대입니다.');
        }
        const result = await this.prisma.$transaction(async (prisma) => {
            const couple = await prisma.couple.create({
                data: {
                    members: {
                        connect: [
                            { id: invite.inviterId },
                            ...(invite.inviteeId ? [{ id: invite.inviteeId }] : [])
                        ]
                    }
                }
            });
            const updatedInvite = await prisma.partnerInvite.update({
                where: { id: invite.id },
                data: {
                    status: 'CONFIRMED',
                    coupleId: couple.id
                }
            });
            return { couple, invite: updatedInvite };
        });
        return result;
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
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PartnerInvitesService);
//# sourceMappingURL=partner-invites.service.js.map