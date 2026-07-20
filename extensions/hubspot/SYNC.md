# HubSpot — Sync

## Supported Modes

- manual
- scheduled
- realtime
- bidirectional

## Entities

- `contacts`
- `deals`
- `companies`

## Pull

```typescript
const result = await provider.sync.pull(config, 'contacts');
```

## Push

```typescript
const result = await provider.sync.push(config, 'contacts', records);
```
