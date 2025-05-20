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
      // Prepare payload for Gemini API
      const payload = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          responseModalities: ['TEXT', 'IMAGE']
        }
      };

      // Call Gemini API
      const response = await axios.post(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent?key=AIzaSyD4kCbJjXzwLhvrwp8COiOkqUrdpA5yH6o',
        payload,
        {
          headers: {
            'Content-Type': 'application/json'
          },
          responseType: 'json',
          validateStatus: undefined
        }
      );

      if (response.status !== 200) {
        throw new Error(`Gemini API error ${response.status}: ${JSON.stringify(response.data)}`);
      }

      // Extract image data from response
      const imageData = response.data.candidates[0].content.parts.find(
        (part: any) => part.inlineData?.mimeType === 'image/png'
      )?.inlineData?.data;

      if (!imageData) {
        throw new Error('No image data found in Gemini API response');
      }

      // Convert base64 to buffer
      const buffer = Buffer.from(imageData, 'base64');

      // Upload to MinIO
      const bucketName = 'ai-images';
      const fileExtension = 'png';
      const fileName = `${Date.now()}-${uuidv4()}.${fileExtension}`;
      const contentType = 'image/png';

      const bucketExists = await this.minio.bucketExists(bucketName);
      if (!bucketExists) {
        await this.minio.makeBucket(bucketName, 'us-east-1');
      }

      await this.minio.putObject(bucketName, fileName, buffer, buffer.length, {
        'Content-Type': contentType
      });

      return {
        image_custom: `/api/view-image?bucket=${bucketName}&file=${fileName}`,
        image_cloud: `/api/view-image?bucket=${bucketName}&file=${fileName}`
      };
    } catch (error: any) {
      console.error('generateImage error:', error.response?.data || error.message);
      throw new BadRequestException(`Failed to generate or upload image: ${error.message}`);
    }
  }

}
