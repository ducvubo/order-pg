import { Injectable, BadRequestException } from '@nestjs/common';
import { getMinio } from 'src/config/minio.config';
import { NotFoundError } from 'src/utils/errorResponse';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadService {
  private readonly minio = getMinio().instanceConnect;
  private readonly minioUrl = process.env.MINIO_URL || 'https://minio.taphoaictu.id.vn';

  async uploadFile(file: Express.Multer.File, bucketName: string): Promise<any> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    bucketName = bucketName.replace("_", "-");


    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${Date.now()}-${uuidv4()}.${fileExtension}`;
    const metaData = { 'Content-Type': file.mimetype };

    const bucketExists = await this.minio.bucketExists(bucketName);
    if (!bucketExists) {
      await this.minio.makeBucket(bucketName, 'us-east-1');
    }

    await this.minio.putObject(bucketName, fileName, file.buffer, file.size, metaData);

    return {
      image_custom: `/api/view-image?bucket=${bucketName}&file=${fileName}`,
      image_cloud: `/api/view-image?bucket=${bucketName}&file=${fileName}`,
    };
  }

  async getSignedUrl(bucketName: string, fileName: string, expiry = 24 * 60 * 60): Promise<string> {
    if (!bucketName || !fileName) {
      throw new BadRequestException('Bucket and file name are required');
    }

    return await this.minio.presignedUrl('GET', bucketName, fileName, expiry);
  }

  async getFileStream(bucketName: string, fileName: string): Promise<{ stream: any; contentType: string }> {
    try {
      const metaData: any = await this.minio.statObject(bucketName, fileName);
      const stream = await this.minio.getObject(bucketName, fileName);
      return { stream, contentType: metaData.contentType || 'application/octet-stream' };
    } catch (error) {
      throw new NotFoundError('File not found');
    }
  }
}
