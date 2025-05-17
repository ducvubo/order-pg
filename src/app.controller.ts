import { Body, Controller, Get, Inject, OnModuleInit, Post } from '@nestjs/common'
import { AppService } from './app.service'
import { ResponseMessage } from './decorator/customize'
import { ClientGrpc } from '@nestjs/microservices'
import AppInterface from './app.interface'
import { ApiBody, ApiOperation } from '@nestjs/swagger'

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  @ResponseMessage('Hello World')
  async getHello(): Promise<any> {
    return await this.appService.getHelloGRPC()
  }

  @Post('/generate-image')
  @ApiOperation({ summary: 'Generate image from prompt' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        promt: {
          type: 'string',
          example: 'A beautiful sunset over the mountains',
        },
      },
    },
  })
  @ResponseMessage('Generate image successfully')
  async generateImage(@Body('promt') promt: any) {
    return await this.appService.generateImage(promt)
  }
}
