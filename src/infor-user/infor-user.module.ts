import { Module } from '@nestjs/common';
import { InforUserService } from './infor-user.service';
import { InforUserController } from './infor-user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InforUserEntity } from './entities/infor-user.entity';
import { InforUserRepo } from './entities/infor-user.repo';
import { InforUserQuery } from './entities/infor-user.query';

@Module({
  imports: [TypeOrmModule.forFeature([InforUserEntity])],
  controllers: [InforUserController],
  providers: [InforUserService, InforUserRepo, InforUserQuery],
})
export class InforUserModule { }
