import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: ['http://localhost:4002', process.env.APP_CORS_ORIGIN],
    credentials: true,
  });
  await app.listen(5002);
}
bootstrap();
