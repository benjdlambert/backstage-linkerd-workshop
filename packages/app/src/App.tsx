import { createApp } from '@backstage/frontend-defaults';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import catalogImportPlugin from '@backstage/plugin-catalog-import/alpha';
import linkerdPlugin from '@backstage-community/plugin-linkerd/alpha';
import { signInPageModule } from './SignInPage';
import { scmModule } from './scm';

export default createApp({
  features: [
    catalogPlugin,
    linkerdPlugin,
    signInPageModule,
    scmModule,
    catalogImportPlugin,
  ],
});
