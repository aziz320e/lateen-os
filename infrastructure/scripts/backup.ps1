# Lateen OS — Backup platform data
. "$PSScriptRoot/_lib.ps1"

$envVars = Read-LateenEnv
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backupDir = Join-Path $BackupRoot $timestamp
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

Write-Host "Backing up to $backupDir..." -ForegroundColor Cyan

# PostgreSQL
$pgUser = Get-EnvDefault $envVars 'LATEEN_POSTGRES_USER' 'lateen'
Write-Host "  PostgreSQL..."
docker exec lateen-postgres pg_dumpall -U $pgUser | Out-File -FilePath (Join-Path $backupDir 'postgres-all.sql') -Encoding utf8

# Redis
Write-Host "  Redis..."
docker exec lateen-redis redis-cli -a (Get-EnvDefault $envVars 'LATEEN_REDIS_PASSWORD' '') BGSAVE 2>$null | Out-Null
Start-Sleep -Seconds 2
docker cp lateen-redis:/data/dump.rdb (Join-Path $backupDir 'redis-dump.rdb') 2>$null

# Qdrant snapshot metadata
Write-Host "  Qdrant..."
try {
    $qdrantPort = Get-EnvDefault $envVars 'LATEEN_QDRANT_HOST_HTTP_PORT' '6333'
    Invoke-WebRequest -Uri "http://localhost:$qdrantPort/collections" -UseBasicParsing -OutFile (Join-Path $backupDir 'qdrant-collections.json')
} catch {
    Write-Host "  Qdrant backup skipped (service may be down)" -ForegroundColor Yellow
}

# Compose env snapshot
Copy-Item $EnvFile (Join-Path $backupDir 'env.snapshot')

# Volume manifest
Invoke-Compose @('ps', '-a') | Out-File (Join-Path $backupDir 'compose-ps.txt')

Write-Host "Backup complete: $backupDir" -ForegroundColor Green
