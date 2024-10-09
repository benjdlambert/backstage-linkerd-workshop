import React from 'react';
import { SignInPage } from '@backstage/core-components';
import {
  SignInPageBlueprint,
  createFrontendModule,
} from '@backstage/frontend-plugin-api';

const signInPage = SignInPageBlueprint.make({
  name: 'guest',
  params: {
    loader: async () => props =>
      <SignInPage {...props} providers={['guest']} />,
  },
});

export const signInPageModule = createFrontendModule({
  pluginId: 'app',
  extensions: [signInPage],
});
