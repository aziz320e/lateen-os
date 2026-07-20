# Lateen OS — Deployment Platform

Production deployment artifacts for Lateen OS (Epic 18).

## Structure

```
deployment/
├── docker/           # Multi-stage Dockerfiles + image manifest
├── helm/lateen-os/   # Complete Helm chart (dev/staging/prod)
├── kubernetes/       # Kustomize base + overlays
├── terraform/        # Azure, AWS, DigitalOcean modules
├── monitoring/       # Dashboards, alerts, SLOs, logging
├── security/         # TLS, pod security, secrets integration
├── docs/             # Guides, runbooks, incident response
└── scripts/          # Validation scripts
```

## Quick Start

```bash
helm upgrade --install lateen-os deployment/helm/lateen-os \
  -f deployment/helm/lateen-os/values-dev.yaml \
  --namespace lateen-os --create-namespace
```

## Documentation

- [Deployment Guide](docs/DEPLOYMENT-GUIDE.md)
- [Operations Guide](docs/OPERATIONS-GUIDE.md)
- [Production Readiness Report](../docs/architecture/production-readiness-report-v1.md)

## Validation

```bash
./deployment/scripts/validate-all.sh
```
