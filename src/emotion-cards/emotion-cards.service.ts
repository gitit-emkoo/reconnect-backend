import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';
import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config(); // .env 파일에서 환경 변수를 로드

@Injectable()
export class EmotionCardsService {
  private readonly geminiApiKey = process.env.GEMINI_API_KEY;
  // gemini-pro 모델을 기본으로 사용합니다.
  private readonly geminiModelId = process.env.GEMINI_MODEL_ID || 'gemini-pro'; 
  private readonly geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.geminiModelId}:generateContent`;
  private prisma = new PrismaClient();

  async refineText(originalText: string): Promise<string> {
    console.log(`[EmotionCardsService] Refining text: "${originalText}" using Gemini model ${this.geminiModelId}`);

    if (!this.geminiApiKey) {
      console.error('Gemini API Key is not configured.');
      throw new HttpException('AI service configuration error.', HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (!originalText || originalText.trim() === '') {
      throw new HttpException('Input text cannot be empty.', HttpStatus.BAD_REQUEST);
    }

    // 제미니에게 전달할 프롬프트 구성 (결과물 자체를 요청하도록 수정)
    const prompt = `아래 "원본 문장"을 상대방이 더 부드럽고 따뜻하게 느낄 수 있는 말투로 바꿔서, 수정된 문장만 결과로 보여줘. 다른 설명이나 부연은 하지 말고, 오직 수정된 문장만 반환해줘. 만약 원본 문장이 이미 충분히 좋다면, 긍정적인 느낌을 살짝 더하거나 거의 그대로 유지해서 반환해줘.

원본 문장: "${originalText}"
수정된 문장:`; // AI가 이어서 작성하도록 유도

    try {
      const response = await axios.post(
        `${this.geminiApiUrl}?key=${this.geminiApiKey}`, // API 키를 URL 쿼리 파라미터로 전달
        {
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          // generationConfig: { // 필요에 따라 생성 옵션 추가 가능
          //   temperature: 0.7, // 0.0 ~ 1.0, 높을수록 창의적
          //   maxOutputTokens: 150, // 최대 출력 토큰 수
          //   topP: 0.95,
          //   topK: 40,
          // },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );

      // 제미니 API 응답 구조에서 텍스트 추출
      if (
        response.data &&
        response.data.candidates &&
        response.data.candidates[0] &&
        response.data.candidates[0].content &&
        response.data.candidates[0].content.parts &&
        response.data.candidates[0].content.parts[0] &&
        response.data.candidates[0].content.parts[0].text
      ) {
        let refined = response.data.candidates[0].content.parts[0].text.trim();
        
        // 모델이 생성한 텍스트 앞뒤로 불필요한 따옴표나 설명이 붙는 경우가 있어 간단히 제거
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
      } else {
        console.error('Unexpected response structure from Gemini API:', response.data);
        throw new Error('Failed to parse AI suggestion from Gemini.');
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error.response?.data || error.message);
      
      // 오버쿼트 에러인지 확인
      if (axios.isAxiosError(error) && error.response?.data?.error?.message) {
        const errorMessage = error.response.data.error.message;
        if (errorMessage.includes('quota') || errorMessage.includes('queries') || errorMessage.includes('limit')) {
          console.log('[EmotionCardsService] Gemini API 할당량 초과 - 원본 텍스트 반환');
          return originalText; // 원본 텍스트 그대로 반환
        }
      }
      
      // 기타 API 오류 시에도 원본 텍스트 반환
      console.log('[EmotionCardsService] Gemini API 오류 - 원본 텍스트 반환');
      return originalText;
    }
  }

  // 전체 감정카드 반환 (임시)
  async getAllCards() {
    console.log('[EmotionCardsService] getAllCards 호출');
    const cards = await this.prisma.emotionCard.findMany({
      orderBy: { createdAt: 'desc' },
    });
    console.log('[EmotionCardsService] 반환 데이터:', cards);
    return cards;
  }

  // 감정카드 생성 (원본 텍스트 그대로 저장)
  async createCard(body: any) {
    console.log('[EmotionCardsService] createCard 호출:', body);
    
    const newCard = await this.prisma.emotionCard.create({
      data: {
        message: body.text || '', // 원본 텍스트 그대로 저장
        aiSuggestion: '', // AI 변환은 사용자가 요청할 때만
        isRead: false,
        emoji: body.emoji || '❤️',
        senderId: body.senderId,
        receiverId: body.receiverId,
        coupleId: body.coupleId
      }
    });
    console.log('[EmotionCardsService] 생성된 카드:', newCard);
    return newCard;
  }

  // 한국 시간으로 변환하는 유틸리티 함수
  private toKST(date: Date): Date {
    return new Date(date.getTime() + 9 * 60 * 60 * 1000);
  }

  // 한국 시간 기준 오늘인지 확인하는 함수
  private isTodayKST(date: Date): boolean {
    const now = this.toKST(new Date());
    const target = this.toKST(date);
    return (
      now.getFullYear() === target.getFullYear() &&
      now.getMonth() === target.getMonth() &&
      now.getDate() === target.getDate()
    );
  }

  async getReceivedCards(userId: string) {
    const cards = await this.prisma.emotionCard.findMany({
      where: { receiverId: userId },
      orderBy: { createdAt: 'desc' },
    });

    return cards.map(card => ({
      ...card,
      isNew: this.isTodayKST(card.createdAt)
    }));
  }

  // 내 카드 + 파트너가 나에게 보낸 카드만 반환
  async getFilteredCards(userId: string, partnerId: string) {
    const cards = await this.prisma.emotionCard.findMany({
      where: {
        OR: [
          { senderId: userId },
          { senderId: partnerId, receiverId: userId }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    return cards.map(card => ({
      ...card,
      isNew: this.isTodayKST(card.createdAt)
    }));
  }
} 