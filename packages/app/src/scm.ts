import {
  ApiBlueprint,
  configApiRef,
  createApiFactory,
  createFrontendModule,
} from '@backstage/frontend-plugin-api';

import {
  ScmAuth,
  scmIntegrationsApiRef,
  ScmIntegrationsApi,
} from '@backstage/integration-react';

export const scmModule = createFrontendModule({
  pluginId: 'app',
  extensions: [
    ApiBlueprint.make({
      name: 'scm-auth',
      params: {
        factory: ScmAuth.createDefaultApiFactory(),
      },
    }),
    ApiBlueprint.make({
      name: 'scm-integrations',
      params: {
        factory: createApiFactory({
          api: scmIntegrationsApiRef,
          deps: { configApi: configApiRef },
          factory: ({ configApi }) => ScmIntegrationsApi.fromConfig(configApi),
        }),
      },
    }),
  ],
});
