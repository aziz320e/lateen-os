# Lateen OS — Deployment Guide

Architecture v1.0 (locked). This guide covers production deployment using Helm, Kubernetes, and Terraform.

## Prerequisites

- Kubernetes 1.29+
- Helm 3.14+
- Terraform 1.6+
- Container registry access (`ghcr.io/lateen-os`)
- (Production) cert-manager, External Secrets Operator, ingress-nginx

## Quick Start — Development

```bash
# 1. Build images locally (optional)
./deployment/scripts/validate-images.sh

# 2. Install platform
helm upgrade --install lateen-os deployment/helm/lateen-os \
  -f deployment/helm/lateen-os/values-dev.yaml \
  --namespace lateen-os \
  --create-namespace

# 3. Verify
kubectl get pods -n lateen-os
kubectl get ingress -n lateen-os
```

## Cloud Provisioning

```bash
cd deployment/terraform
cp terraform.tfvars.example terraform.tfvars
# Edit cloud_provider and region

terraform init
terraform plan
terraform apply
```

Supported providers: **Azure** (AKS), **AWS** (EKS), **DigitalOcean** (DOKS).

## Environment Matrix

| Environment | Values file | Ingress host | Replicas | External Secrets |
| ----------- | ----------- | ------------ | -------- | ---------------- |
| Development | `values-dev.yaml` | dev.lateen.local | 1 | No |
| Staging | `values-staging.yaml` | staging.lateen.io | 2 | Yes |
| Production | `values-prod.yaml` | app.lateen.io | 3+ | Yes + Vault |

## Deploy Staging / Production

```bash
helm upgrade --install lateen-os deployment/helm/lateen-os \
  -f deployment/helm/lateen-os/values-prod.yaml \
  --set global.imageTag=<git-sha> \
  --namespace lateen-os \
  --create-namespace
```

## CI/CD

GitHub Actions workflows:

| Workflow | Trigger | Purpose |
| -------- | ------- | ------- |
| `ci.yml` | PR / push | Lint, typecheck, build, test |
| `deploy.yml` | Push / manual | Docker build, security scan, SBOM, Helm/Terraform validation, deploy |

Manual production deploy: Actions → Deploy → Run workflow → select `production`.

## Port Map

| Component | Port |
| --------- | ---- |
| AI Product Manager | 3000 |
| Business DNA Studio | 3001 |
| CEO Cockpit | 3002 |
| Customer Portal | 3003 |
| Lateen Assistant | 3004 |
| Business DNA Service | 4001 |
| Product Discovery | 4002 |
| Identity Service | 4003 |
| Integration Hub | 4004 |
| Mission Scheduler | 4005 |

## TLS

Apply cert-manager resources from `deployment/security/tls/certificates.yaml` before enabling TLS in Helm values.

## Secrets

- **Dev**: Helm-generated Kubernetes Secret
- **Staging/Prod**: External Secrets → Vault (see `deployment/security/secrets/external-secrets-vault.md`)

## Validation

```bash
./deployment/scripts/validate-all.sh
```

See also: [Operations Guide](./OPERATIONS-GUIDE.md), [Scaling Guide](./SCALING-GUIDE.md).
