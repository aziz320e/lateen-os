# WooCommerce — Sync

## Supported Modes

- manual
- scheduled
- realtime
- bidirectional

## Entities

- `orders`
- `products`

## Pull

```typescript
const result = await provider.sync.pull(config, 'orders');
```

## Push

```typescript
const result = await provider.sync.push(config, 'orders', records);
```
