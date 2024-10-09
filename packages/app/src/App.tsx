import { createApp } from '@backstage/frontend-defaults';
import catalogPlugin from '@backstage/plugin-catalog/alpha';
import linkerdPlugin from '@backstage-community/plugin-linkerd/alpha';

export default createApp({
  features: [catalogPlugin, linkerdPlugin],
});
