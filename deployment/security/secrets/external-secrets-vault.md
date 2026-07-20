# External Secrets — Vault integration (staging/production)

## Prerequisites

1. Install [External Secrets Operator](https://external-secrets.io/)
2. Configure Vault KV v2 at path `secret/lateen-os`

## Vault paths

| Path | Keys |
| ---- | ---- |
| `secret/lateen-os/postgres` | password |
| `secret/lateen-os/redis` | password |
| `secret/lateen-os/minio` | secretKey |
| `secret/lateen-os/identity` | jwtSecret |
| `secret/lateen-os/grafana` | adminPassword |

## ClusterSecretStore

```yaml
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: vault-backend
spec:
  provider:
    vault:
      server: https://vault.lateen.io
      path: secret
      version: v2
      auth:
        kubernetes:
          mountPath: kubernetes
          role: lateen-os
          serviceAccountRef:
            name: lateen-os-sa
            namespace: lateen-os
```

Enable in Helm:

```yaml
secrets:
  externalSecrets:
    enabled: true
    secretStoreRef: vault-backend
  vault:
    enabled: true
    path: secret/lateen-os
```
