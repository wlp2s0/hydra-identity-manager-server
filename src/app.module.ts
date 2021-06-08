import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoginModule } from './login/login.module';
import { ConsentController } from './consent/consent.controller';

@Module({
  imports: [LoginModule],
  controllers: [AppController, ConsentController],
  providers: [AppService],
})
export class AppModule {}
