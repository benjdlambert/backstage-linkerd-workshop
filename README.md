# linkerd + backstage workshop

### Prerequisites

Make sure that you've followed the setup guide for linkerd + backstage, and have a local backstage project using:

```bash
npx @backstage/create-app@latest
```

### Architecture

TODO

### Step 1: Populate the Catalog

First off, we're going to want to populate the catalog with some entities that we can use to visualize the linkerd service mesh. We're going to want to add some entities that are respective of the services that we have running in the cluster.

Let's look at a sample `catalog-info.yaml` file that we can use to populate the catalog:

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: linkerd
  description: The linkerd service mesh control plane
spec:
  type: service
  lifecycle: production
  owner: team-a
```

TODO

https://github.com/kflynn/faces-rollouts/blob/main/catalog.yaml

### Step -1: Install the Kubernetes Backend Plugin (if not already installed)

By default the Kubernetes plugin is already installed in new Backstage workspaces, but if you need help installing it in an existing workspace you can follow the below guide:

First off, from the Backstage workspace root, let's install the Kubernetes backend plugin:

```bash
cd packages/backend
yarn add @backstage/plugin-kubernetes-backend
```

And then we need to add the plugin to the backend. Open `packages/backend/src/index.ts` and add the following before `backend.start()`.

```ts
// Add in the kubernetes backend plugin
backend.add(import("@backstage/plugin-kubernetes-backend"));
```

### Step 1: Configure the Kubernetes Plugin

The Kubernetes plugin is going to act as a proxy so that we can communicate with the Kubernetes API, and proxy requests to the `linkerd viz` service and pods that are running with the control plane. We're going to want to configure this with a service account locally at least so that we can access the K8s API with a secure token, but this might be configured differently in a production environment.

Theres also some [extensive configuration documentation](https://backstage.io/docs/plugins/kubernetes/configuration) available on the Backstage.io microsite.

First off, we need to create a service account in the Kubernetes cluster that we can use to access the API. We can do this by creating a new service account and cluster role binding:

```bash
kubectl create sa -n default backstage-service-account

kubectl apply -f - <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: backstage
  namespace: default
  annotations:
    kubernetes.io/service-account.name: backstage-service-account
type: kubernetes.io/service-account-token
EOF

kubectl apply -f - <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: backstage-read-only
  namespace: default
rules:
  - apiGroups:
      - '*'
    resources:
      - pods
      - configmaps
      - services
      - deployments
      - replicasets
      - horizontalpodautoscalers
      - ingresses
      - statefulsets
      - limitranges
      - resourcequotas
      - daemonsets
      - services/proxy
    verbs:
      - get
      - list
      - watch
  - apiGroups:
      - batch
    resources:
      - jobs
      - cronjobs
    verbs:
      - get
      - list
      - watch
  - apiGroups:
      - metrics.k8s.io
    resources:
      - pods
    verbs:
      - get
      - list
EOF

kubectl create clusterrolebinding -n default backstage-read-only \
  --clusterrole=backstage-read-only \
  --serviceaccount=default:backstage-service-account
```

Now it's worth noting that these permissions are pretty broad, but they're read-only. You can adjust these permissions to be more restrictive if you'd like.

And then finally to get the token that we need to use to configure the Kubernetes plugin, we can run:

```bash
BACKSTAGE_SERVICE_ACCOUNT_TOKEN=$(kubectl -n default get secret backstage -o go-template='{{.data.token | base64decode}}')
```

We can run the above command with `export` at the beginning in the same terminal as the `yarn dev` command, and then update the config in `app-config.yaml` underneath the `k8s` section. You can run `kubectl config view --minify --output json` to find the server URL if you don't know it already.

```yaml
kubernetes:
  serviceLocatorMethod:
    type: "multiTenant"
  clusterLocatorMethods:
    - type: "config"
      clusters:
        - name: "workshop-cluster"
          authProvider: "serviceAccount"
          url: SERVER_URL
          serviceAccountToken: ${BACKSTAGE_SERVICE_ACCOUNT_TOKEN}
          skipTLSVerify: true
```

Now when we go to one of the entities we should see the Kubernetes tab on the entity page is populated with the pods and services that are deployed and running in the cluster.

### Step 2: Install the linkerd plugin

Now that we've got kubernetes running, we can install the linkerd plugin. We can do this by installing both the backend and frontend plugin.

Let's start with the backend plugin:

```bash
cd packages/backend
yarn add @backstage-community/plugin-linkerd-backend
```

And then we need to add the plugin to the backend. Open `packages/backend/src/index.ts` and add the following before `backend.start()`.

```ts
// Add in the linkerd backend plugin
backend.add(import("@backstage-community/plugin-linkerd-backend"));
```

And then we can install the frontend plugin:

```bash
cd packages/app
yarn add @backstage-community/plugin-linkerd
```

And then we need to add the components to the app. Open `packages/app/src/components/catalog/EntityPage.tsx` and add the following import:

```tsx
import {
  LinkerdDependenciesCard,
  LinkerdIsMeshedBanner,
  LinkerdEdgesTable,
} from "@backstage-community/plugin-linkerd";
```

And now we want to use these components in the relevant places. The `isMeshedBanner` can be placed inside the `entityWarningContent` like so:

```ts
const entityWarningContent = (
  <>
    <EntitySwitch>
      <EntitySwitch.Case if={isOrphan}>
        <Grid item xs={12}>
          <EntityOrphanWarning />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>
    <EntitySwitch>
      <EntitySwitch.Case if={hasRelationWarnings}>
        <Grid item xs={12}>
          <EntityRelationWarning />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>
    <EntitySwitch>
      <EntitySwitch.Case if={hasCatalogProcessingErrors}>
        <Grid item xs={12}>
          <EntityProcessingErrorsPanel />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>
    /* Add this block */
    <EntitySwitch>
      <EntitySwitch.Case if={isKubernetesAvailable}>
        <Grid item xs={12}>
          <LinkerdIsMeshedBanner />
        </Grid>
      </EntitySwitch.Case>
    </EntitySwitch>
  </>
);
```

And then the other cards can be added to a new tab in the `EntityPage.tsx` file:

```tsx
const serviceEntityPage = (
  <EntityLayout>
    <EntityLayout.Route path="/" title="Overview">
      {overviewContent}
    </EntityLayout.Route>

    <EntityLayout.Route path="/ci-cd" title="CI/CD">
      {cicdContent}
    </EntityLayout.Route>

    <EntityLayout.Route
      path="/kubernetes"
      title="Kubernetes"
      if={isKubernetesAvailable}
    >
      <EntityKubernetesContent />
    </EntityLayout.Route>
    ...

    /* Add this block */
    <EntityLayout.Route
      path="/linkerd"
      title="linkerd"
      if={isKubernetesAvailable}
    >
      <>
        <LinkerdEdgesTable />
        <LinkerdDependenciesCard />
      </>
    </EntityLayout.Route>

```

Thats it!

### Common problems:

Might run into issues locally with the `linkerd viz` service not being able to be proxied to a running cluster:

```json
{
  "error": {
    "name": "Error",
    "message": "Request failed with status 400 Bad Request, It appears that you are trying to reach this service with a host of '$IP_ADDRESS'.\nThis does not match /^(localhost|127\\.0\\.0\\.1|web\\.linkerd-viz\\.svc\\.cluster\\.local|web\\.linkerd-viz\\.svc|\\[::1\\])(:\\d+)?$/ and has been denied for security reasons.\nPlease see https://linkerd.io/dns-rebinding for an explanation of what is happening and how to fix it.\n"
  }
}
```

You'll need to edit the `linkerd-viz` `web` deployment to update or remove the `-enforced-host` flag. You can do this by running:

```bash
kubectl edit deployment -n linkerd-viz web
```

And searching for `-enforced-host`.
