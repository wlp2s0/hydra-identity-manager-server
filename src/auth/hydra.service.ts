import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdminApi, Configuration } from '@ory/hydra-client';

@Injectable()
export class HydraService {
  client: AdminApi;
  constructor(private configService: ConfigService) {
    const basePath =
      configService.get<string>('APP_HYDRA_ADMIN_URL') ||
      'http://localhost:4445';

    const username = configService.get<string>('APP_HYDRA_ADMIN_USERNAME');
    const password = configService.get<string>('APP_HYDRA_ADMIN_PASSWORD');

    this.client = new AdminApi(
      new Configuration({
        basePath,
        baseOptions: { auth: { username, password } },
      }),
    );
  }
}
