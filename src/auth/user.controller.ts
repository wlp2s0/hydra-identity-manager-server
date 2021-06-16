import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { CreateRequest } from './requests/CreateRequest';
import { UserService } from './user.service';

@Controller('/v1/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(@Body() createRequest: CreateRequest) {
    try {
      await this.userService.create(createRequest);
    } catch (error) {
      throw new HttpException(
        error.message || 'BadRequest',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
