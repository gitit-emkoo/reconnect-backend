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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PartnerInvitesController = void 0;
const common_1 = require("@nestjs/common");
const partner_invites_service_1 = require("./partner-invites.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let PartnerInvitesController = class PartnerInvitesController {
    constructor(partnerInvitesService) {
        this.partnerInvitesService = partnerInvitesService;
    }
    async createInviteCode(req) {
        return this.partnerInvitesService.createInviteCode(req.user.userId);
    }
    async respondToInvite(body, req) {
        return this.partnerInvitesService.respondToInvite(body.code, req.user.userId);
    }
    async acceptInvite(inviteId, req) {
        return this.partnerInvitesService.acceptInvite(inviteId, req.user.userId);
    }
    async rejectInvite(inviteId, req) {
        return this.partnerInvitesService.rejectInvite(inviteId, req.user.userId);
    }
    async getMyInvites(req) {
        console.log('[PartnerInvitesController] req.user:', req.user);
        if (req.user) {
            console.log('[PartnerInvitesController] req.user.userId:', req.user.userId);
        }
        const invites = await this.partnerInvitesService.getMyInvites(req.user.userId);
        console.log('[PartnerInvitesController] invites:', invites);
        return invites;
    }
};
exports.PartnerInvitesController = PartnerInvitesController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PartnerInvitesController.prototype, "createInviteCode", null);
__decorate([
    (0, common_1.Post)('respond'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PartnerInvitesController.prototype, "respondToInvite", null);
__decorate([
    (0, common_1.Post)(':inviteId/accept'),
    __param(0, (0, common_1.Param)('inviteId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PartnerInvitesController.prototype, "acceptInvite", null);
__decorate([
    (0, common_1.Post)(':inviteId/reject'),
    __param(0, (0, common_1.Param)('inviteId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PartnerInvitesController.prototype, "rejectInvite", null);
__decorate([
    (0, common_1.Get)('me'),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PartnerInvitesController.prototype, "getMyInvites", null);
exports.PartnerInvitesController = PartnerInvitesController = __decorate([
    (0, common_1.Controller)('partner-invites'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [partner_invites_service_1.PartnerInvitesService])
], PartnerInvitesController);
//# sourceMappingURL=partner-invites.controller.js.map