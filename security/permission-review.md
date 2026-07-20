# Permission Review — v1.0.0-rc.1

## Identity Model

- **Roles:** admin, operator, developer, viewer
- **Scopes:** tenant-scoped resources
- **Enforcement:** Identity service + API Gateway

## Service Permissions

| Service | Auth Required | Tenant Isolated |
| ------- | ------------- | ----------------- |
| business-dna-service | ✅ | ✅ |
| identity-service | ✅ | ✅ |
| product-discovery | ✅ | ✅ |
| integration-hub | ✅ | ✅ |
| mission-scheduler | ✅ | ✅ |
| marketplace | ✅ | ✅ |
| provisioning | ✅ | ✅ |
| api-gateway | ✅ | ✅ |
| knowledge-platform | ✅ | ✅ |
| search-platform | ✅ | ✅ |
| analytics-platform | ✅ | ✅ |
| cloud-control-plane | ✅ | ✅ |

## Extension Permissions

Extensions declare required permissions in manifest schema (`packages/extension-system/`).

## RC Status

✅ Pass — permission model documented and enforced at gateway layer.
