# Google Workspace — Sync

## Supported Modes

- manual
- scheduled
- realtime
- bidirectional

## Entities

- `email`
- `calendar`
- `contacts`

## Pull

```typescript
const result = await provider.sync.pull(config, 'email');
```

## Push

```typescript
const result = await provider.sync.push(config, 'email', records);
```
