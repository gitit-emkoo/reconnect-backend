export declare class UploadsService {
    uploadFile(file: Express.Multer.File): Promise<{
        url: string;
    }>;
}
