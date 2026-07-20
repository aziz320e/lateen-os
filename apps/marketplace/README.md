# Lateen Marketplace App

Next.js 15 frontend for the Lateen OS extension marketplace.

## Development

```bash
pnpm --filter @lateen-os/marketplace dev
```

Open [http://localhost:3005](http://localhost:3005).

Requires `@lateen-os/marketplace-service` running on port 4006.

## Features

- Browse and search extensions
- Extension detail pages (versions, permissions, dependencies, reviews)
- Publisher directory
- One-click install via BFF

## Environment

Copy `.env.example` to `.env.local`:

```
NEXT_PUBLIC_LATEEN_MARKETPLACE_BASE_URL=http://localhost:4006
```
