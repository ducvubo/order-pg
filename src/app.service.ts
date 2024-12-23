import { Injectable, OnModuleInit } from '@nestjs/common'
import { Client, ClientGrpc, Transport } from '@nestjs/microservices'
import AppInterface from './app.interface'
import { join } from 'path'
import { ConfigService } from '@nestjs/config'
import { firstValueFrom, Observable } from 'rxjs'

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

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
}
