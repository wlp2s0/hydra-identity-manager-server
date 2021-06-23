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
    this.client = new AdminApi(
      new Configuration({
        basePath,
      }),
    );
  }
}
