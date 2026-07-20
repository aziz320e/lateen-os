# Stripe — Sync

## Supported Modes

- manual
- scheduled
- realtime
- bidirectional

## Entities

- `payments`
- `customers`
- `subscriptions`

## Pull

```typescript
const result = await provider.sync.pull(config, 'payments');
```

## Push

```typescript
const result = await provider.sync.push(config, 'payments', records);
```
