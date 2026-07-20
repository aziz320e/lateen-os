# ERPNext — Sync

## Supported Modes

- manual
- scheduled
- realtime
- bidirectional

## Entities

- `items`
- `orders`
- `invoices`

## Pull

```typescript
const result = await provider.sync.pull(config, 'items');
```

## Push

```typescript
const result = await provider.sync.push(config, 'items', records);
```
