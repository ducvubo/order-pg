import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseInterceptors
} from '@nestjs/common'
import { UploadService } from './upload.service'
import { ResponseMessage } from 'src/decorator/customize'
import { FileInterceptor } from '@nestjs/platform-express'
import { MulterConfigService } from 'src/config/multer.config'

@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @ResponseMessage('Upload image')
  @UseInterceptors(FileInterceptor('file', new MulterConfigService().createMulterOptions()))
  async uploadImageFromLocal(@UploadedFile() file: Express.Multer.File, @Req() req: any): Promise<any> {
    if (!file) {
      throw new Error('No file provided')
    }

    return await this.uploadService.uploadFile(file, req.headers.folder_type || 'default')
  }

  @Get()
  @ResponseMessage('Get file from MinIO')
  async getFile(@Query('bucketName') bucketName: string, @Query('fileName') fileName: string, @Res() res: any) {
    try {
      const file = await this.uploadService.getFileFromMinio(bucketName, fileName)
      res.set({
        'Content-Type': file.contentType, // Set Content-Type dựa trên MIME type của file
        'Content-Disposition': `attachment; filename="${fileName}"`
      })

      res.send(file.data) // Trả về file trong response
    } catch (error) {
      throw new NotFoundException('File not found')
    }
  }
}
