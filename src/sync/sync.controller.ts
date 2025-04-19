import { Controller, Post, Body, HttpCode, HttpStatus, Request } from '@nestjs/common'
import { SyncService } from './sync.service'
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger'
import { Request as RequestExpress } from 'express'
import { ResponseMessage } from 'src/decorator/customize'

class CreateTokenDto {
  clientId: string
}

class VerifyTokenDto {
  token: string
}

@ApiTags('sync')
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Post('create-token')
  @ResponseMessage('Tạo token đồng bộ thành công')
  async createToken(@Request() req: RequestExpress): Promise<string> {
    return this.syncService.createToken(req.headers['x-cl-id'] as string)
  }

  @Post('sync-verify-token')
  @ResponseMessage('Xác thực token đồng bộ thành công')
  async verifyToken(@Body() verifyTokenDto: VerifyTokenDto, @Request() req: RequestExpress): Promise<string> {
    return this.syncService.verifyToken(verifyTokenDto.token, req.headers['x-cl-id'] as string)
  }
}
