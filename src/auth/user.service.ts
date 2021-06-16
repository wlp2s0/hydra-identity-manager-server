import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './user.schema';
import { CreateRequest } from './requests/CreateRequest';
import { argon2id, hash } from 'argon2';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}
  async findAll(): Promise<User[]> {
    return await this.userModel.find();
  }

  findByEmail(email: string) {
    return this.userModel.findOne({ email });
  }

  async create(createRequest: CreateRequest) {
    const hashedPassword = await hash(createRequest.password, {
      type: argon2id,
    });
    const createdUser = new this.userModel({
      ...createRequest,
      password: hashedPassword,
    });
    return createdUser.save();
  }
}
