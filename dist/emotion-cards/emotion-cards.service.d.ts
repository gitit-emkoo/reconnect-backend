export declare class EmotionCardsService {
    private readonly geminiApiKey;
    private readonly geminiModelId;
    private readonly geminiApiUrl;
    private prisma;
    refineText(originalText: string): Promise<string>;
    getAllCards(): Promise<{
        id: string;
        createdAt: Date;
        coupleId: string;
        message: string;
        aiSuggestion: string | null;
        isRead: boolean;
        emoji: string | null;
        senderId: string;
        receiverId: string;
    }[]>;
    createCard(body: any): Promise<{
        id: string;
        createdAt: Date;
        coupleId: string;
        message: string;
        aiSuggestion: string | null;
        isRead: boolean;
        emoji: string | null;
        senderId: string;
        receiverId: string;
    }>;
    getReceivedCards(userId: string): Promise<{
        id: string;
        createdAt: Date;
        coupleId: string;
        message: string;
        aiSuggestion: string | null;
        isRead: boolean;
        emoji: string | null;
        senderId: string;
        receiverId: string;
    }[]>;
    getFilteredCards(userId: string, partnerId: string): Promise<{
        id: string;
        createdAt: Date;
        coupleId: string;
        message: string;
        aiSuggestion: string | null;
        isRead: boolean;
        emoji: string | null;
        senderId: string;
        receiverId: string;
    }[]>;
}
