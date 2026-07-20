# Pod Security Standards

Lateen OS enforces **restricted** Pod Security on the `lateen-os` namespace.

## Requirements

| Control | Setting |
| ------- | ------- |
| runAsNonRoot | true |
| runAsUser | 10001 (apps), image-specific (infra) |
| readOnlyRootFilesystem | recommended |
| allowPrivilegeEscalation | false |
| seccompProfile | RuntimeDefault |
| capabilities | drop ALL |

## Helm values

```yaml
global:
  podSecurity:
    runAsNonRoot: true
    runAsUser: 10001
    fsGroup: 10001
```

## Verification

```bash
kubectl label namespace lateen-os \
  pod-security.kubernetes.io/enforce=restricted \
  pod-security.kubernetes.io/audit=restricted \
  pod-security.kubernetes.io/warn=restricted
```
