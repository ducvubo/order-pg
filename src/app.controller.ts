import { Controller, Get, Inject, OnModuleInit, Post } from '@nestjs/common'
import { AppService } from './app.service'
import { ResponseMessage } from './decorator/customize'
import { ClientGrpc } from '@nestjs/microservices'
import AppInterface from './app.interface'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ResponseMessage('Hello World')
  async getHello(): Promise<any> {
    return await this.appService.getHelloGRPC()
  }
}
