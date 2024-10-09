import { createBackend } from '@backstage/backend-defaults';

const backend = createBackend();

backend.add(import('@backstage/plugin-app-backend/alpha'));

// auth plugin
backend.add(import('@backstage/plugin-auth-backend'));
// See https://backstage.io/docs/backend-system/building-backends/migrating#the-auth-plugin
backend.add(import('@backstage/plugin-auth-backend-module-guest-provider'));
// See https://backstage.io/docs/auth/guest/provider

// catalog plugin
backend.add(import('@backstage/plugin-catalog-backend/alpha'));

// kubernetes plugin
backend.add(import('@backstage/plugin-kubernetes-backend/alpha'));

// linkerd plugin
backend.add(import('@backstage-community/plugin-linkerd-backend'));

backend.start();
