# WhatsApp Business — Sync

## Supported Modes

- manual
- scheduled
- realtime
- bidirectional

## Entities

- `messages`

## Pull

```typescript
const result = await provider.sync.pull(config, 'messages');
```

## Push

```typescript
const result = await provider.sync.push(config, 'messages', records);
```
