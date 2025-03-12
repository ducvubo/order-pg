import { Controller, Get, Post, Query, Req, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody, ApiQuery } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadService } from './upload.service';
import { ResponseMessage } from 'src/decorator/customize';
import { MulterConfigService } from 'src/config/multer.config';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) { }

  @Post()
  @ApiOperation({ summary: 'Upload image to MinIO' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
      },
    },
  })
  @ResponseMessage('Upload image')
  @UseInterceptors(FileInterceptor('file', new MulterConfigService().createMulterOptions()))
  async uploadImageFromLocal(@UploadedFile() file: Express.Multer.File, @Req() req: any): Promise<any> {
    if (!file) {
      throw new Error('No file provided');
    }

    return await this.uploadService.uploadFile(file, req.headers.folder_type || 'default');
  }

  @Get('get-image')
  @ApiOperation({ summary: 'Get signed URL for image' })
  @ApiQuery({ name: 'bucket', required: true, type: 'string' })
  @ApiQuery({ name: 'file', required: true, type: 'string' })
  @ResponseMessage('Get signed URL for image')
  async getImageUrl(
    @Query('bucket') bucketName: string,
    @Query('file') fileName: string,
  ): Promise<{ url: string }> {
    const url = await this.uploadService.getSignedUrl(bucketName, fileName);
    return { url };
  }

  @Get('view-image')
  @ApiOperation({ summary: 'View image from server' })
  @ApiQuery({ name: 'bucket', required: true, type: 'string' })
  @ApiQuery({ name: 'file', required: true, type: 'string' })
  @ResponseMessage('View image from server')
  async viewImage(
    @Query('bucket') bucketName: string,
    @Query('file') fileName: string,
    @Res() res: any,
  ): Promise<void> {
    const { stream, contentType } = await this.uploadService.getFileStream(bucketName, fileName);
    res.set({
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=86400', // Cache 1 ngày
    });

    stream.pipe(res);
  }
}
