# QuickBooks — Sync

## Supported Modes

- manual
- scheduled
- realtime
- bidirectional

## Entities

- `invoices`
- `accounts`
- `customers`

## Pull

```typescript
const result = await provider.sync.pull(config, 'invoices');
```

## Push

```typescript
const result = await provider.sync.push(config, 'invoices', records);
```
