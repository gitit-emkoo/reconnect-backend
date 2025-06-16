import { DiaryService } from './diary.service';
import { CreateDiaryDto } from './dto/create-diary.dto';
import { UpdateDiaryDto } from './dto/update-diary.dto';
import { Request, Response } from 'express';
export declare class DiaryController {
    private readonly diaryService;
    constructor(diaryService: DiaryService);
    create(createDiaryDto: CreateDiaryDto, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    findAll(req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    findByDate(date: string, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    update(id: string, updateDiaryDto: UpdateDiaryDto, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
    remove(id: string, req: Request, res: Response): Promise<Response<any, Record<string, any>>>;
}
