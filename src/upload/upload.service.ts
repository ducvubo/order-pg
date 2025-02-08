import { Injectable } from '@nestjs/common'
import { getMinio } from 'src/config/minio.config'
import { v4 as uuidv4 } from 'uuid'

@Injectable()
export class UploadService {
  private readonly minio = getMinio().instanceConnect

  async uploadFile(file: Express.Multer.File, bucketName: string): Promise<any> {
    const bucketExists = await this.minio.bucketExists(bucketName)
    if (!bucketExists) {
      await this.minio.makeBucket(bucketName, 'us-east-1')
    }

    //get extension of file
    const fileExtension = file.originalname.split('.').pop()

    const fileName = `${Date.now()}-${uuidv4()}.${fileExtension}`
    const metaData = {
      'Content-Type': file.mimetype
    }
    await this.minio.putObject(bucketName, fileName, file.buffer, file.size, metaData)
    return {
      bucket: bucketName,
      fileName,
      url: `http://localhost:9000/${bucketName}/${fileName}`
    }
  }

  async getFileFromMinio(bucketName: string, fileName: string): Promise<any> {
    try {
      const fileStream = await this.minio.getObject(bucketName, fileName)
      const fileBuffer = await this.streamToBuffer(fileStream)

      return {
        data: fileBuffer,
        contentType: 'application/octet-stream' // Hoặc lấy content type chính xác nếu có
      }
    } catch (error) {
      throw new Error('Error retrieving file from MinIO')
    }
  }

  // Chuyển đổi stream thành buffer
  private streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = []
      stream.on('data', (chunk) => chunks.push(chunk))
      stream.on('end', () => resolve(Buffer.concat(chunks)))
      stream.on('error', reject)
    })
  }
}
