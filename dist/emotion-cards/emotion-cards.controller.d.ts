import { EmotionCardsService } from './emotion-cards.service';
import { RefineTextDto } from './dto/refine-text.dto';
import { RefinedTextResponseDto } from './dto/refined-text.response.dto';
import { Response } from 'express';
export declare class EmotionCardsController {
    private readonly emotionCardsService;
    constructor(emotionCardsService: EmotionCardsService);
    refineEmotionCardText(refineTextDto: RefineTextDto): Promise<RefinedTextResponseDto>;
    getEmotionCards(req: any, res: Response): Promise<Response<any, Record<string, any>>>;
    createEmotionCard(body: any, req: any, res: Response): Promise<Response<any, Record<string, any>>>;
    getReceivedCards(req: any, res: Response): Promise<Response<any, Record<string, any>>>;
}
