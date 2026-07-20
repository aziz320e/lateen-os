# Dependency Validation — v1.0.0-rc.1

## Service Dependencies (from manifest)

```
business-dna-service (root)
├── product-discovery
├── identity-service
│   ├── integration-hub
│   │   └── mission-scheduler
│   ├── marketplace
│   │   └── provisioning
│   │       └── cloud-control-plane
│   └── knowledge-platform
│       └── search-platform
│           └── analytics-platform
└── api-gateway (aggregates all)
```

## Infrastructure Dependencies

| Service | postgres | redis | nats | minio | qdrant | otel |
| ------- | -------- | ----- | ---- | ----- | ------ | ---- |
| business-dna | ✅ | ✅ | ✅ | — | — | ✅ |
| product-discovery | ✅ | ✅ | ✅ | — | ✅ | ✅ |
| identity | ✅ | ✅ | ✅ | — | — | ✅ |
| integration-hub | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| mission-scheduler | ✅ | ✅ | ✅ | — | — | ✅ |
| marketplace | ✅ | ✅ | — | — | — | ✅ |
| provisioning | ✅ | ✅ | — | — | — | ✅ |
| api-gateway | — | ✅ | ✅ | — | — | ✅ |
| knowledge-platform | ✅ | ✅ | — | — | ✅ | ✅ |
| search-platform | — | ✅ | — | — | ✅ | ✅ |
| analytics-platform | — | ✅ | — | — | — | ✅ |
| cloud-control-plane | ✅ | ✅ | — | — | — | ✅ |

## RC Status

✅ Dependency graph validated against `packages/kernel/src/registry/manifest.ts`
