import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb://root:2B3s2Ih1YYxO@localhost/hydra-identity-manager',
      {
        authSource: 'admin',
      },
    ),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.development.env',
    }),
    AuthModule,
  ],
})
export class AppModule {}
