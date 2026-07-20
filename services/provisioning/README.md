# Enterprise Provisioning Platform

Orchestrates complete organization setup across Lateen OS services. **No business logic** — step orchestration only.

## Quick Start

```bash
pnpm --filter @lateen-os/provisioning-service dev   # :4007
pnpm --filter @lateen-os/setup-wizard dev           # :3006
```

## API

| Method | Path | Description |
| ------ | ---- | ----------- |
| POST | `/api/provision` | Start provisioning |
| GET | `/api/provision/:id` | Get job status |
| GET | `/api/provision/status` | Status summary |
| GET | `/api/profiles` | List profiles |

## CLI

```bash
lateen new --name "Acme Print" --profile printing
lateen provision start --name "Acme Corp" --profile enterprise
lateen provision status
lateen organization create --name "My Org" --profile printing
```

## Profiles

Small Business, Enterprise, Manufacturing, Printing, Retail, Healthcare, Construction

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [API.md](./API.md)
