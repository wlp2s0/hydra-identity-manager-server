import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Query,
  Redirect,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HydraService } from './hydra.service';
import { LogoutRequest } from './requests/LogoutRequest';
import { UserService } from './user.service';

@Controller('/v1/logout')
export class LogoutController {
  constructor(
    private readonly userService: UserService,
    private configService: ConfigService,
    private hydraService: HydraService,
  ) {}
  @Get()
  @Redirect()
  async getLogout(@Query('logout_challenge') challenge: string) {
    try {
      // The challenge is used to fetch information about the login request from ORY Hydra.
      if (!challenge) {
        throw new Error(
          'Expected a login challenge to be set but received none.',
        );
      }

      await this.hydraService.client.getLogoutRequest(challenge);

      const clientBaseUrl = this.configService.get<string>(
        'APP_CLIENT_BASE_URL',
      );

      return {
        url: `${clientBaseUrl}/logout?challenge=${challenge}`,
      };
    } catch (error) {
      throw new HttpException(
        error?.message || 'BadRequest',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post()
  async postLogout(
    @Body()
    { challenge }: LogoutRequest,
  ) {
    try {
      const { data: acceptLogoutResponse } =
        await this.hydraService.client.acceptLogoutRequest(challenge);
      return { redirectUri: acceptLogoutResponse.redirect_to };
    } catch (error) {
      throw new HttpException(
        error.message || 'BadRequest',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
