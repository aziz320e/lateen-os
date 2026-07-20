# Database migrations

Prisma migrations live in `prisma/migrations/`.

```bash
pnpm --filter @lateen-os/business-dna-service db:migrate
pnpm --filter @lateen-os/business-dna-service db:migrate:deploy
pnpm --filter @lateen-os/business-dna-service db:seed
```

See [DATABASE.md](../../DATABASE.md).
