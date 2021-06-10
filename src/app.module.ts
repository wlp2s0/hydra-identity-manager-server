import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConsentController } from './consent/consent.controller';
import { LoginController } from './login/login.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.development.env',
    }),
  ],
  controllers: [AppController, ConsentController, LoginController],
  providers: [AppService],
})
export class AppModule {}
