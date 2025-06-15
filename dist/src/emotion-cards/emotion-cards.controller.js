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
exports.EmotionCardsController = void 0;
const common_1 = require("@nestjs/common");
const emotion_cards_service_1 = require("./emotion-cards.service");
const refine_text_dto_1 = require("./dto/refine-text.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let EmotionCardsController = class EmotionCardsController {
    constructor(emotionCardsService) {
        this.emotionCardsService = emotionCardsService;
    }
    async refineEmotionCardText(refineTextDto) {
        const refinedText = await this.emotionCardsService.refineText(refineTextDto.text);
        return { refinedText };
    }
    async getEmotionCards(req, res) {
        const userId = req.user.userId;
        const partnerId = req.user.partnerId || req.user.partner?.id;
        console.log('[EmotionCardsController][GET /emotion-cards] req.user:', req.user);
        console.log('[EmotionCardsController][GET /emotion-cards] userId:', userId, 'partnerId:', partnerId);
        if (!userId || !partnerId) {
            console.log('[EmotionCardsController][GET /emotion-cards] 403: 파트너 연결이 필요합니다.');
            return res.status(403).json({
                message: '파트너와 연결이 필요한 메뉴입니다. 파트너와 연결 후 재시도 바랍니다.',
                code: 'PARTNER_REQUIRED'
            });
        }
        try {
            const cards = await this.emotionCardsService.getFilteredCards(userId, partnerId);
            return res.status(200).json(cards);
        }
        catch (error) {
            return res.status(500).json({ message: '감정카드 목록을 불러오지 못했습니다.' });
        }
    }
    async createEmotionCard(body, req, res) {
        console.log('[EmotionCardsController] POST /emotion-cards 요청:', body, req.headers);
        const senderId = req.user.userId;
        const receiverId = req.user.partnerId || req.user.partner?.id;
        const coupleId = req.user.couple?.id;
        if (!senderId || !receiverId || !coupleId) {
            console.log('[EmotionCardsController] 400: senderId, receiverId, coupleId가 필요합니다.');
            return res.status(400).json({ message: 'senderId, receiverId, coupleId가 필요합니다.' });
        }
        try {
            const newCard = await this.emotionCardsService.createCard({ ...body, senderId, receiverId, coupleId });
            console.log('[EmotionCardsController] 생성된 카드:', newCard);
            return res.status(201).json(newCard);
        }
        catch (error) {
            console.error('[EmotionCardsController] 카드 생성 에러:', error);
            return res.status(500).json({ message: '감정카드 생성에 실패했습니다.' });
        }
    }
    async getReceivedCards(req, res) {
        const userId = req.user.userId;
        if (!userId) {
            console.log('[EmotionCardsController][GET /emotion-cards/received] 400: userId가 필요합니다.');
            return res.status(400).json({ message: 'userId가 필요합니다.' });
        }
        try {
            const cards = await this.emotionCardsService.getReceivedCards(userId);
            return res.status(200).json(cards);
        }
        catch (error) {
            console.error('[EmotionCardsController][GET /emotion-cards/received] 에러:', error);
            return res.status(500).json({
                message: '받은 감정카드 목록을 불러오지 못했습니다.',
                error: error.message
            });
        }
    }
};
exports.EmotionCardsController = EmotionCardsController;
__decorate([
    (0, common_1.Post)('refine-text'),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true })),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [refine_text_dto_1.RefineTextDto]),
    __metadata("design:returntype", Promise)
], EmotionCardsController.prototype, "refineEmotionCardText", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EmotionCardsController.prototype, "getEmotionCards", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], EmotionCardsController.prototype, "createEmotionCard", null);
__decorate([
    (0, common_1.Get)('received'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], EmotionCardsController.prototype, "getReceivedCards", null);
exports.EmotionCardsController = EmotionCardsController = __decorate([
    (0, common_1.Controller)('emotion-cards'),
    __metadata("design:paramtypes", [emotion_cards_service_1.EmotionCardsService])
], EmotionCardsController);
//# sourceMappingURL=emotion-cards.controller.js.map