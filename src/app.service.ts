import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common'
import { Client, ClientGrpc, Transport } from '@nestjs/microservices'
import AppInterface from './app.interface'
import { join } from 'path'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom, Observable } from 'rxjs'
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import * as FormData from 'form-data';
import { getMinio } from './config/minio.config'

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private readonly configService: ConfigService) { }

  @Client({
    transport: Transport.GRPC,
    options: {
      package: 'HelloWorld',
      protoPath: join(__dirname, 'grpc/proto/helloWorld.proto'),
      url: '127.0.0.1:8000'
    }
  })
  client: ClientGrpc
  private grpcService: AppInterface
  private readonly minio = getMinio().instanceConnect;

  // constructor(@Inject('APP_SERVICE') private readonly grpcClient: ClientGrpc) {}

  onModuleInit() {
    this.grpcService = this.client.getService<AppInterface>('HelloWorldService')
  }

  async getHelloGRPC(): Promise<any> {
    try {
      const response: Observable<any> = await this.grpcService.GetHelloWorld({ name: 'ChatGPT' })
      const result = await firstValueFrom(response)
      console.log('Response:', result)
      return response
    } catch (error) {
      console.error('gRPC call error:', error)
      throw error
    }
  }

  async generateImage(prompt: string): Promise<any> {
    try {
      const payload = {
        prompt,
        output_format: 'png', // hoặc 'webp' tuỳ bạn
      };

      // Gọi API Stability AI
      const response = await axios.postForm(
        'https://api.stability.ai/v2beta/stable-image/generate/ultra',
        axios.toFormData(payload, new FormData()),
        {
          headers: {
            Authorization: `Bearer sk-uUPGFe9MEdmsnwY5rnb91R2jJgUgmXvRWKuaciXNGc3asy36`, // hoặc gán trực tiếp key
            Accept: 'image/*',
          },
          responseType: 'arraybuffer',
          validateStatus: undefined,
        },
      );

      if (response.status !== 200) {
        throw new Error(`Stability API error ${response.status}: ${response.data.toString()}`);
      }

      const buffer = Buffer.from(response.data);

      // Upload ảnh lên MinIO
      const bucketName = 'ai-images';
      const fileExtension = 'png';
      const fileName = `${Date.now()}-${uuidv4()}.${fileExtension}`;
      const contentType = 'image/png';

      const bucketExists = await this.minio.bucketExists(bucketName);
      if (!bucketExists) {
        await this.minio.makeBucket(bucketName, 'us-east-1');
      }

      await this.minio.putObject(bucketName, fileName, buffer, buffer.length, {
        'Content-Type': contentType,
      });

      return {
        image_custom: `/api/view-image?bucket=${bucketName}&file=${fileName}`,
        image_cloud: `/api/view-image?bucket=${bucketName}&file=${fileName}`,
      };
    } catch (error: any) {
      console.error('generateImage error:', error.response?.data || error.message);
      throw new BadRequestException(`Failed to generate or upload image: ${error.message}`);
    }
  }

}
