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
import { verify } from 'argon2';
import { HydraService } from './hydra.service';
import { LoginRequest } from './requests/LoginRequest';
import { UserService } from './user.service';

@Controller('/v1/login')
export class LoginController {
  constructor(
    private readonly userService: UserService,
    private configService: ConfigService,
    private hydraService: HydraService,
  ) {}
  @Get()
  @Redirect()
  async getLogin(@Query('login_challenge') challenge: string) {
    try {
      // The challenge is used to fetch information about the login request from ORY Hydra.
      if (!challenge) {
        throw new Error(
          'Expected a login challenge to be set but received none.',
        );
      }

      const { data: body } = await this.hydraService.client.getLoginRequest(
        challenge,
      );

      // If hydra was already able to authenticate the user, skip will be true and we do not need to re-authenticate
      // the user.
      if (body.skip) {
        // You can apply logic here, for example update the number of times the user logged in.
        // ...

        // Now it's time to grant the login request. You could also deny the request if something went terribly wrong
        // (e.g. your arch-enemy logging in...)
        // All we need to do is to confirm that we indeed want to log in the user.
        const { data: responseBody } =
          await this.hydraService.client.acceptLoginRequest(challenge, {
            subject: body.subject,
          });

        // All we need to do now is to redirect the user back to hydra!
        return { url: responseBody.redirect_to };
      }

      const clientBaseUrl = this.configService.get<string>(
        'APP_CLIENT_BASE_URL',
      );

      // If authentication can't be skipped we MUST show the login UI.
      return {
        url: `${clientBaseUrl}/login?challenge=${challenge}`,
      };
    } catch (error) {
      throw new HttpException(
        error?.message || 'BadRequest',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post()
  async postLogin(
    @Body()
    { challenge, submit, email, password, remember = true }: LoginRequest,
  ) {
    try {
      // The challenge is now a hidden input field, so let's take it from the request body instead
      // Let's see if the user decided to accept or reject the consent request..
      if (submit === 'Deny access') {
        // Looks like the consent request was denied by the user
        const { data: responseBody } =
          await this.hydraService.client.rejectLoginRequest(challenge, {
            error: 'access_denied',
            error_description: 'The resource owner denied the request',
          });

        // All we need to do now is to redirect the browser back to hydra!
        return { redirectUri: responseBody.redirect_to };
      }
      // Let's check if the user provided valid credentials. Of course, you'd use a database or some third-party service
      // for this!
      const user = await this.userService.findByEmail(email);

      const verified = await verify(user.password, password);

      if (!verified) {
        // Looks like the user provided invalid credentials, let's show the ui again...
        throw new Error('The username / password combination is not correct');
      }

      // Seems like the user authenticated! Let's tell hydra...
      const { data: acceptLoginResponse } =
        await this.hydraService.client.acceptLoginRequest(challenge, {
          // Subject is an alias for user ID. A subject can be a random string, a UUID, an email address, ....
          subject: email,

          // This tells hydra to remember the browser and automatically authenticate the user in future requests. This will
          // set the "skip" parameter in the other route to true on subsequent requests!
          remember,

          // When the session expires, in seconds. Set this to 0 so it will never expire.
          remember_for: 3600,

          // Sets which "level" (e.g. 2-factor authentication) of authentication the user has. The value is really arbitrary
          // and optional. In the context of OpenID Connect, a value of 0 indicates the lowest authorization level.
          // acr: '0',
          //
          // If the environment variable CONFORMITY_FAKE_CLAIMS is set we are assuming that
          // the app is built for the automated OpenID Connect Conformity Test Suite. You
          // can peak inside the code for some ideas, but be aware that all data is fake
          // and this only exists to fake a login system which works in accordance to OpenID Connect.
          //
          // If that variable is not set, the ACR value will be set to the default passed here ('0')
          acr: '0',
        });

      // All we need to do now is to redirect the user back to hydra!
      return { redirectUri: acceptLoginResponse.redirect_to };

      // You could also deny the login request which tells hydra that no one authenticated!
      // hydra.rejectLoginRequest(challenge, {
      //   error: 'invalid_request',
      //   errorDescription: 'The user did something stupid...'
      // })
      //   .then(({body}) => {
      //     // All we need to do now is to redirect the browser back to hydra!
      //     res.redirect(String(body.redirectTo));
      //   })
      //   // This will handle any error that happens when making HTTP calls to hydra
      //   .catch(next);
    } catch (error) {
      throw new HttpException(
        error.message || 'BadRequest',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
