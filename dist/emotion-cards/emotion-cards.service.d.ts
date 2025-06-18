export declare class EmotionCardsService {
    private readonly geminiApiKey;
    private readonly geminiModelId;
    private readonly geminiApiUrl;
    private prisma;
    refineText(originalText: string): Promise<string>;
    getAllCards(): Promise<{
        message: string;
        id: string;
        createdAt: Date;
        coupleId: string;
        aiSuggestion: string | null;
        isRead: boolean;
        emoji: string | null;
        senderId: string;
        receiverId: string;
    }[]>;
    createCard(body: any): Promise<{
        message: string;
        id: string;
        createdAt: Date;
        coupleId: string;
        aiSuggestion: string | null;
        isRead: boolean;
        emoji: string | null;
        senderId: string;
        receiverId: string;
    }>;
    private toKST;
    private isTodayKST;
    getReceivedCards(userId: string): Promise<{
        isNew: boolean;
        message: string;
        id: string;
        createdAt: Date;
        coupleId: string;
        aiSuggestion: string | null;
        isRead: boolean;
        emoji: string | null;
        senderId: string;
        receiverId: string;
    }[]>;
    getFilteredCards(userId: string, partnerId: string): Promise<{
        isNew: boolean;
        message: string;
        id: string;
        createdAt: Date;
        coupleId: string;
        aiSuggestion: string | null;
        isRead: boolean;
        emoji: string | null;
        senderId: string;
        receiverId: string;
    }[]>;
}
