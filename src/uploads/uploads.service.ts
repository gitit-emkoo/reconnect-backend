import { Injectable } from '@nestjs/common';

@Injectable()
export class UploadsService {
  async uploadFile(file: Express.Multer.File): Promise<{ url: string }> {
    // In a real application, you would save the file to a cloud storage,
    // and/or save file metadata to a database.
    console.log(file);

    // This URL should be configured based on your environment
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const fileUrl = `${baseUrl}/uploads/${file.filename}`;

    return {
      url: fileUrl,
    };
  }
} 