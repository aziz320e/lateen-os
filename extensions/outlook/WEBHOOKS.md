# Outlook — Webhooks

Path: `/webhooks/outlook`

## Events

- `installed` — Extension installed
- `connected` — Provider connected
- `disconnected` — Provider disconnected
- `sync_started` — Sync job started
- `sync_completed` — Sync job completed
- `sync_failed` — Sync job failed

## Registration

```typescript
await provider.webhook.register(config, ['connected', 'sync_completed']);
```
