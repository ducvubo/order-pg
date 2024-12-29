import { NestFactory, Reflector } from '@nestjs/core'
import { AppModule } from './app.module'
import { NestExpressApplication } from '@nestjs/platform-express'
import { ConfigService } from '@nestjs/config'
import { ValidationPipe, VersioningType } from '@nestjs/common'
import { TransformIntercaptor } from './interceptor/transform.interceptor'
import { IdUserGuestInterceptor } from './interceptor/guestId.interceptor'
import { join } from 'path'
import { initRedis } from './config/redis.config'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { AllExceptionsFilter } from './interceptor/exception.interceptor'
// import { initOpenSearch } from './config/open-search.config'
import { initKafka } from './config/kafka.config'
import { initElasticsearch } from './config/elasticsearch.config'
declare const module: any

async function bootstrap() {
  // const app = await NestFactory.create(AppModule)
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  const configService = app.get(ConfigService)

  app.useGlobalPipes(new ValidationPipe())
  const reflector = app.get(Reflector)

  initRedis()
  initElasticsearch()
  // initOpenSearch()
  initKafka()

  // await addDocToElasticsearch('test', '1', { name: 'test' })

  app.useGlobalInterceptors(new TransformIntercaptor(reflector))
  app.useGlobalInterceptors(new IdUserGuestInterceptor(reflector))
  app.useGlobalFilters(new AllExceptionsFilter())

  app.useStaticAssets(join(__dirname, '..', 'public'))
  app.setBaseViewsDir(join(__dirname, '..', 'views'))
  app.setViewEngine('ejs')

  app.setGlobalPrefix('api')
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: ['1']
  })

  app.enableCors()

  const config = new DocumentBuilder()
    .setTitle('Cats example')
    .setDescription('The cats API description')
    .setVersion('1.0')
    .addTag('cats')
    .build()
  const documentFactory = () => SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('swagger', app, documentFactory)

  await app.startAllMicroservices()
  await app.listen(configService.get<string>('PORT'))

  if (module.hot) {
    module.hot.accept()
    module.hot.dispose(() => app.close())
  }
}
bootstrap()
