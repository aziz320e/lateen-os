# Deployment Guide — Lateen OS Enterprise v1.0.0-rc.1

## Prerequisites

- Node.js ≥22
- pnpm ≥9
- Docker & Docker Compose
- Kubernetes cluster (production)
- Terraform ≥1.5 (cloud deployment)

## Local Development

```bash
cd infrastructure/docker
docker compose up -d
pnpm install
node release/scripts/validate.mjs
```

## Docker Deployment

See `deployment/docker/images.json` for 25 container images.

```bash
docker compose -f deployment/docker/docker-compose.prod.yml up -d
```

## Kubernetes (Helm)

```bash
helm install lateen-os deployment/helm/lateen-os/ \
  --namespace lateen-os \
  --create-namespace \
  -f deployment/helm/lateen-os/values.yaml
```

## Terraform (Cloud)

```bash
cd deployment/terraform
terraform init
terraform plan
terraform apply
```

## Environment Variables

See `security/environment-validation.md` for required variables.

## Reference

- Full guide: `deployment/docs/DEPLOYMENT-GUIDE.md`
- Scaling: `deployment/docs/SCALING-GUIDE.md`
- CI/CD: `quality/ci-report.md`
