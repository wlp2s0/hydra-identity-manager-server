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
import { ConsentRequestSession } from '@ory/hydra-client';
import { HydraService } from './hydra.service';
import { ConsentRequest } from './requests/ConsentRequest';

@Controller('/v1/consent')
export class ConsentController {
  constructor(
    private configService: ConfigService,
    private hydraService: HydraService,
  ) {}
  @Get()
  @Redirect()
  async getConsent(@Query('consent_challenge') challenge: string) {
    try {
      // The challenge is used to fetch information about the consent request from ORY hydraAdmin.
      if (!challenge) {
        throw new Error(
          'Expected a login challenge to be set but received none.',
        );
      }

      // This section processes consent requests and either shows the consent UI or
      // accepts the consent request right away if the user has given consent to this
      // app before
      const { data: body } = await this.hydraService.client.getConsentRequest(
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
          await this.hydraService.client.acceptConsentRequest(challenge, {
            // We can grant all scopes that have been requested - hydra already checked for us that no additional scopes
            // are requested accidentally.
            grant_scope: body.requested_scope,

            // ORY Hydra checks if requested audiences are allowed by the client, so we can simply echo this.
            grant_access_token_audience: body.requested_access_token_audience,

            // The session allows us to set session data for id and access tokens
            session: {
              // This data will be available when introspecting the token. Try to avoid sensitive information here,
              // unless you limit who can introspect tokens.
              access_token: { email: body.subject },
              // This data will be available in the ID token.
              id_token: { email: body.subject },
            },
          });

        // All we need to do now is to redirect the user back to hydra!
        return { url: responseBody.redirect_to };
      }
      const clientBaseUrl = this.configService.get<string>(
        'APP_CLIENT_BASE_URL',
      );
      // If authentication can't be skipped we MUST show the login UI.
      return {
        // ToDo: serialize requestedScopes
        url: `${clientBaseUrl}/consent?challenge=${challenge}&clientName=${body?.client?.client_name}`,
      };
    } catch (error) {
      throw new HttpException(
        error?.message || 'BadRequest',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @Post()
  async postConsent(
    @Body() { submit, challenge, grantScope, remember = true }: ConsentRequest,
  ) {
    try {
      // The challenge is now a hidden input field, so let's take it from the request body instead
      // Let's see if the user decided to accept or reject the consent request..
      if (submit === 'Deny access') {
        // Looks like the consent request was denied by the user
        const { data: responseBody } =
          await this.hydraService.client.rejectConsentRequest(challenge, {
            error: 'access_denied',
            error_description: 'The resource owner denied the request',
          });

        // All we need to do now is to redirect the browser back to hydra!
        return { redirectUri: responseBody.redirect_to };
      }

      if (!Array.isArray(grantScope)) {
        grantScope = [grantScope];
      }

      // The session allows us to set session data for id and access tokens
      const session: ConsentRequestSession = {
        // This data will be available when introspecting the token. Try to avoid sensitive information here,
        // unless you limit who can introspect tokens.
        access_token: {
          // foo: 'bar'
        },

        // This data will be available in the ID token.
        id_token: {
          // baz: 'bar'
        },
      };

      // Here is also the place to add data to the ID or access token. For example,
      // if the scope 'profile' is added, add the family and given name to the ID Token claims:
      // if (grantScope.indexOf('profile')) {
      //   session.id_token.family_name = 'Doe'
      //   session.id_token.given_name = 'John'
      // }

      // Let's fetch the consent request again to be able to set `grantAccessTokenAudience` properly.
      const { data: getConsentResponse } =
        await this.hydraService.client.getConsentRequest(challenge);

      const { data: acceptConsenteResponse } =
        await this.hydraService.client.acceptConsentRequest(challenge, {
          // We can grant all scopes that have been requested - hydra already checked for us that no additional scopes
          // are requested accidentally.
          grant_scope: getConsentResponse.requested_scope,

          // If the environment variable CONFORMITY_FAKE_CLAIMS is set we are assuming that
          // the app is built for the automated OpenID Connect Conformity Test Suite. You
          // can peak inside the code for some ideas, but be aware that all data is fake
          // and this only exists to fake a login system which works in accordance to OpenID Connect.
          //
          // If that variable is not set, the session will be used as-is.
          session,

          // ORY Hydra checks if requested audiences are allowed by the client, so we can simply echo this.
          grant_access_token_audience:
            getConsentResponse.requested_access_token_audience,

          // This tells hydra to remember this consent request and allow the same client to request the same
          // scopes from the same user, without showing the UI, in the future.
          remember: Boolean(remember),

          // When this "remember" sesion expires, in seconds. Set this to 0 so it will never expire.
          remember_for: 3600,
        });

      // All we need to do now is to redirect the user back to hydra!
      return { redirectUri: acceptConsenteResponse.redirect_to };

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
      console.error(error);
    }
  }
}
