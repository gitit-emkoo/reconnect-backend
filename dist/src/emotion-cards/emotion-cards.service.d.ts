export declare class EmotionCardsService {
    private readonly geminiApiKey;
    private readonly geminiModelId;
    private readonly geminiApiUrl;
    private prisma;
    refineText(originalText: string): Promise<string>;
    getAllCards(): Promise<{
        id: string;
        message: string;
        aiSuggestion: string | null;
        isRead: boolean;
        emoji: string | null;
        createdAt: Date;
        senderId: string;
        receiverId: string;
        coupleId: string;
    }[]>;
    createCard(body: any): Promise<{
        id: string;
        message: string;
        aiSuggestion: string | null;
        isRead: boolean;
        emoji: string | null;
        createdAt: Date;
        senderId: string;
        receiverId: string;
        coupleId: string;
    }>;
    private toKST;
    private isTodayKST;
    getReceivedCards(userId: string): Promise<{
        isNew: boolean;
        id: string;
        message: string;
        aiSuggestion: string | null;
        isRead: boolean;
        emoji: string | null;
        createdAt: Date;
        senderId: string;
        receiverId: string;
        coupleId: string;
    }[]>;
    getFilteredCards(userId: string, partnerId: string): Promise<{
        isNew: boolean;
        id: string;
        message: string;
        aiSuggestion: string | null;
        isRead: boolean;
        emoji: string | null;
        createdAt: Date;
        senderId: string;
        receiverId: string;
        coupleId: string;
    }[]>;
}
