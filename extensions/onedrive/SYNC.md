# OneDrive — Sync

## Supported Modes

- manual
- scheduled
- realtime
- bidirectional

## Entities

- `files`

## Pull

```typescript
const result = await provider.sync.pull(config, 'files');
```

## Push

```typescript
const result = await provider.sync.push(config, 'files', records);
```
