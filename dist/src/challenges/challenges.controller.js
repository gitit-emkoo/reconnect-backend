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
exports.ChallengesController = void 0;
const common_1 = require("@nestjs/common");
const challenges_service_1 = require("./challenges.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const get_user_decorator_1 = require("../auth/decorators/get-user.decorator");
const client_1 = require("@prisma/client");
const getPartnerId_1 = require("../utils/getPartnerId");
let ChallengesController = class ChallengesController {
    constructor(challengesService) {
        this.challengesService = challengesService;
    }
    async getChallengesByCategory(category) {
        return this.challengesService.getChallengesByCategory(category);
    }
    async getActiveChallenge(user) {
        const partnerId = (0, getPartnerId_1.getPartnerId)(user);
        console.log('[ChallengeController][getActiveChallenge]', { userId: user.userId, partnerId, coupleId: user.couple?.id });
        if (!user.couple || !user.couple.id) {
            throw new common_1.BadRequestException('연결된 파트너가 없습니다.');
        }
        return this.challengesService.getActiveChallenge(user.couple.id);
    }
    async startChallenge(challengeId, user) {
        const partnerId = (0, getPartnerId_1.getPartnerId)(user);
        console.log('[ChallengeController][startChallenge]', { userId: user.userId, partnerId, coupleId: user.couple?.id });
        if (!user.couple || !user.couple.id) {
            throw new common_1.BadRequestException('연결된 파트너가 없습니다.');
        }
        return this.challengesService.startChallenge(user.couple.id, challengeId);
    }
    async completeChallenge(challengeId, user) {
        const partnerId = (0, getPartnerId_1.getPartnerId)(user);
        console.log('[ChallengeController][completeChallenge]', { userId: user.userId, partnerId, coupleId: user.couple?.id });
        if (!user.couple || !user.couple.id) {
            throw new common_1.BadRequestException('연결된 파트너가 없습니다.');
        }
        return this.challengesService.completeChallenge(challengeId, user.userId);
    }
    async getChallengeHistory(user) {
        const partnerId = (0, getPartnerId_1.getPartnerId)(user);
        console.log('[ChallengeController][getChallengeHistory]', { userId: user.userId, partnerId, coupleId: user.couple?.id });
        if (!user.couple || !user.couple.id) {
            throw new common_1.BadRequestException('연결된 파트너가 없습니다.');
        }
        return this.challengesService.getChallengeHistory(user.couple.id);
    }
    async getChallengeTemplatesByCategory(category) {
        return this.challengesService.getChallengeTemplatesByCategory(category);
    }
};
exports.ChallengesController = ChallengesController;
__decorate([
    (0, common_1.Get)('category/:category'),
    __param(0, (0, common_1.Param)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChallengesController.prototype, "getChallengesByCategory", null);
__decorate([
    (0, common_1.Get)('active'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChallengesController.prototype, "getActiveChallenge", null);
__decorate([
    (0, common_1.Post)('start/:challengeId'),
    __param(0, (0, common_1.Param)('challengeId')),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ChallengesController.prototype, "startChallenge", null);
__decorate([
    (0, common_1.Post)('complete/:challengeId'),
    __param(0, (0, common_1.Param)('challengeId')),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ChallengesController.prototype, "completeChallenge", null);
__decorate([
    (0, common_1.Get)('history'),
    __param(0, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ChallengesController.prototype, "getChallengeHistory", null);
__decorate([
    (0, common_1.Get)('template/category/:category'),
    __param(0, (0, common_1.Param)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChallengesController.prototype, "getChallengeTemplatesByCategory", null);
exports.ChallengesController = ChallengesController = __decorate([
    (0, common_1.Controller)('challenges'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [challenges_service_1.ChallengesService])
], ChallengesController);
//# sourceMappingURL=challenges.controller.js.map