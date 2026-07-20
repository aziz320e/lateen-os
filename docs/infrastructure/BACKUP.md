# Backup and Restore

> Procedures for Lateen OS platform data

## Overview

Backup scripts capture platform state to `infrastructure/backups/<timestamp>/`.

| Component | Backup method |
| --------- | ------------- |
| PostgreSQL | `pg_dumpall` SQL dump |
| Redis | RDB snapshot copy |
| Qdrant | Collections metadata JSON |
| Environment | Env file snapshot |
| Compose state | `docker compose ps` manifest |

MinIO and Qdrant **full volume backups** require additional manual steps for complete recovery (see below).

---

## Backup

### PowerShell

```powershell
.\infrastructure\scripts\backup.ps1
```

### Bash

```bash
./infrastructure/scripts/backup.sh
```

### Output structure

```
infrastructure/backups/20260718-224500/
├── postgres-all.sql
├── redis-dump.rdb
├── qdrant-collections.json
├── env.snapshot
└── compose-ps.txt
```

---

## Restore

### PowerShell

```powershell
.\infrastructure\scripts\restore.ps1 -BackupId 20260718-224500
```

### Bash

```bash
./infrastructure/scripts/restore.sh 20260718-224500
```

### Prerequisites

- Platform must be running (`start.ps1`)
- PostgreSQL container must be healthy

---

## Manual volume backup (full)

For complete MinIO and Qdrant data recovery:

### Stop services

```powershell
.\infrastructure\scripts\stop.ps1
```

### Export volumes

```powershell
docker run --rm -v lateen-minio-data:/data -v ${PWD}/infrastructure/backups/manual:/backup alpine tar czf /backup/minio-data.tar.gz -C /data .
docker run --rm -v lateen-qdrant-data:/data -v ${PWD}/infrastructure/backups/manual:/backup alpine tar czf /backup/qdrant-data.tar.gz -C /data .
```

### Restore volumes

```powershell
docker run --rm -v lateen-minio-data:/data -v ${PWD}/infrastructure/backups/manual:/backup alpine sh -c "cd /data && tar xzf /backup/minio-data.tar.gz"
docker run --rm -v lateen-qdrant-data:/data -v ${PWD}/infrastructure/backups/manual:/backup alpine sh -c "cd /data && tar xzf /backup/qdrant-data.tar.gz"
```

---

## Reset vs backup

| Operation | Containers | Volumes | Data |
| --------- | ---------- | ------- | ---- |
| `stop.ps1` | Removed | Kept | Preserved |
| `reset.ps1` | Removed | **Deleted** | **Lost** |
| `backup.ps1` | Running | Kept | Copied to backup dir |

Always run `backup.ps1` before `reset.ps1` if you need to preserve data.

---

## Recommended schedule (local dev)

| Frequency | Action |
| --------- | ------ |
| Before schema changes | `backup.ps1` |
| Before `reset.ps1` | `backup.ps1` |
| Weekly (active dev) | `backup.ps1` |

---

## Production note

This backup approach is for **local development**. Production deployments require:

- Automated scheduled backups
- Off-site storage
- Point-in-time recovery for PostgreSQL
- MinIO bucket replication
- Tested restore runbooks

Production infrastructure is out of scope for Epic 2.
