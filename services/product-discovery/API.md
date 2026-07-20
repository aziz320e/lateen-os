# Product Discovery API

Base URL: `http://localhost:4002/api/v1`

OpenAPI: `/docs`

## Endpoints

| Method | Path | Description |
| ------ | ---- | ----------- |
| POST | `/discovery/run` | Start a new discovery run |
| GET | `/discovery/runs?organizationId=` | List runs for organization |
| GET | `/discovery/runs/:id?organizationId=` | Get run by ID |
| GET | `/discovery/recommendations?organizationId=` | List recommendations |

## POST /discovery/run

**Body:**

```json
{
  "organizationId": "00000000-0000-4000-8000-000000000001",
  "keywords": ["signage", "led board"],
  "sources": ["google_trends", "amazon"],
  "runtimeAgentId": "optional-uuid"
}
```

**Response:** `201` — `ProductDiscoveryRun` with stage results

## GET /discovery/runs

**Query:** `organizationId` (required)

**Response:** `200` — array of `ProductDiscoveryRun`

## GET /discovery/runs/:id

**Query:** `organizationId` (required)

**Response:** `200` run | `404` not found

## GET /discovery/recommendations

**Query:**

| Param | Required | Description |
| ----- | -------- | ----------- |
| organizationId | yes | Tenant ID |
| runId | no | Filter by run |
| limit | no | Max results (default 50) |

## Health

| Path | Description |
| ---- | ----------- |
| GET /health | Service health |
| GET /metrics | Metrics note (OTel collector) |

## Events (NATS)

Subject prefix: `lateen.product_discovery`

| Event | When |
| ----- | ---- |
| DiscoveryStarted | Run created |
| SignalsCollected | Stage 1 complete |
| CapabilitiesMatched | Stage 4 complete |
| DecisionRequested | Stage 6 complete |
| RecommendationCreated | Stage 7 complete |

## Business DNA dependency

Reads products, machines, projects, and customers from Business DNA Service (`http://localhost:4001`).

Dev auth header: `Authorization: Bearer dev:<orgId>:product-discovery`
