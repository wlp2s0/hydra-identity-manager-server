import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConsentController } from './consent.controller';
import { HydraService } from './hydra.service';
import { LoginController } from './login.controller';
import { UserController } from './user.controller';
import { User, UserSchema } from './user.schema';
import { UserService } from './user.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [ConsentController, LoginController, UserController],
  providers: [UserService, HydraService],
})
export class AuthModule {}
