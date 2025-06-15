"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmotionCardsService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("axios");
const dotenv = require("dotenv");
const client_1 = require("@prisma/client");
dotenv.config();
let EmotionCardsService = class EmotionCardsService {
    constructor() {
        this.geminiApiKey = process.env.GEMINI_API_KEY;
        this.geminiModelId = process.env.GEMINI_MODEL_ID || 'gemini-pro';
        this.geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModelId}:generateContent`;
        this.prisma = new client_1.PrismaClient();
    }
    async refineText(originalText) {
        console.log(`[EmotionCardsService] Refining text: "${originalText}" using Gemini model ${this.geminiModelId}`);
        if (!this.geminiApiKey) {
            console.error('Gemini API Key is not configured.');
            throw new common_1.HttpException('AI service configuration error.', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
        if (!originalText || originalText.trim() === '') {
            throw new common_1.HttpException('Input text cannot be empty.', common_1.HttpStatus.BAD_REQUEST);
        }
        const prompt = `아래 "원본 문장"을 상대방이 더 부드럽고 따뜻하게 느낄 수 있는 말투로 바꿔서, 수정된 문장만 결과로 보여줘. 다른 설명이나 부연은 하지 말고, 오직 수정된 문장만 반환해줘. 만약 원본 문장이 이미 충분히 좋다면, 긍정적인 느낌을 살짝 더하거나 거의 그대로 유지해서 반환해줘.

원본 문장: "${originalText}"
수정된 문장:`;
        try {
            const response = await axios_1.default.post(`${this.geminiApiUrl}?key=${this.geminiApiKey}`, {
                contents: [
                    {
                        parts: [{ text: prompt }],
                    },
                ],
            }, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (response.data &&
                response.data.candidates &&
                response.data.candidates[0] &&
                response.data.candidates[0].content &&
                response.data.candidates[0].content.parts &&
                response.data.candidates[0].content.parts[0] &&
                response.data.candidates[0].content.parts[0].text) {
                let refined = response.data.candidates[0].content.parts[0].text.trim();
                if (refined.startsWith('"') && refined.endsWith('"')) {
                    refined = refined.substring(1, refined.length - 1);
                }
                const commonPrefixesToRemove = [
                    "알겠습니다. 다음과 같이 수정해보았습니다:",
                    "다음과 같이 수정했습니다:",
                    "이렇게 바꿔보았습니다:",
                    "수정된 문장:"
                ];
                for (const prefix of commonPrefixesToRemove) {
                    if (refined.toLowerCase().startsWith(prefix.toLowerCase())) {
                        refined = refined.substring(prefix.length).trim();
                        break;
                    }
                }
                console.log(`[EmotionCardsService] Refined text from Gemini: "${refined}"`);
                return refined !== '' ? refined : "(AI가 적절한 답변을 찾지 못했어요. 좀 더 자세히 써보는건 어때요?)";
            }
            else {
                console.error('Unexpected response structure from Gemini API:', response.data);
                throw new Error('Failed to parse AI suggestion from Gemini.');
            }
        }
        catch (error) {
            console.error('Error calling Gemini API:', error.response?.data || error.message);
            let errorMessage = 'AI 제안을 가져오는데 실패했습니다.';
            if (axios_1.default.isAxiosError(error) && error.response?.data?.error?.message) {
                errorMessage = `AI 서비스 오류: ${error.response.data.error.message}`;
            }
            throw new common_1.HttpException(errorMessage, common_1.HttpStatus.SERVICE_UNAVAILABLE);
        }
    }
    async getAllCards() {
        console.log('[EmotionCardsService] getAllCards 호출');
        const cards = await this.prisma.emotionCard.findMany({
            orderBy: { createdAt: 'desc' },
        });
        console.log('[EmotionCardsService] 반환 데이터:', cards);
        return cards;
    }
    async createCard(body) {
        console.log('[EmotionCardsService] createCard 호출:', body);
        const newCard = await this.prisma.emotionCard.create({ data: { message: body.text || '', aiSuggestion: '', isRead: false, emoji: body.emoji || '❤️', senderId: body.senderId, receiverId: body.receiverId, coupleId: body.coupleId } });
        console.log('[EmotionCardsService] 생성된 카드:', newCard);
        return newCard;
    }
    async getReceivedCards(userId) {
        return this.prisma.emotionCard.findMany({
            where: { receiverId: userId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async getFilteredCards(userId, partnerId) {
        return this.prisma.emotionCard.findMany({
            where: {
                OR: [
                    { senderId: userId },
                    { senderId: partnerId, receiverId: userId }
                ]
            },
            orderBy: { createdAt: 'desc' }
        });
    }
};
exports.EmotionCardsService = EmotionCardsService;
exports.EmotionCardsService = EmotionCardsService = __decorate([
    (0, common_1.Injectable)()
], EmotionCardsService);
//# sourceMappingURL=emotion-cards.service.js.map