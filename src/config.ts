import { AdminApi, Configuration } from '@ory/hydra-client';

const hydraAdmin = new AdminApi(
  new Configuration({
    // ToDo: Fix env problem
    basePath: process.env.HYDRA_ADMIN_URL || 'http://localhost:4445',
  }),
);

export { hydraAdmin };
