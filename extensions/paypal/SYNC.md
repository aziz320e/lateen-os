# PayPal — Sync

## Supported Modes

- manual
- scheduled
- realtime
- bidirectional

## Entities

- `payments`
- `payouts`

## Pull

```typescript
const result = await provider.sync.pull(config, 'payments');
```

## Push

```typescript
const result = await provider.sync.push(config, 'payments', records);
```
