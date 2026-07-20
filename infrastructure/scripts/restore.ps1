# Lateen OS — Restore platform data from backup
param(
    [Parameter(Mandatory = $true)]
    [string]$BackupId
)

. "$PSScriptRoot/_lib.ps1"

$backupDir = Join-Path $BackupRoot $BackupId
if (-not (Test-Path $backupDir)) {
    Write-Error "Backup not found: $backupDir"
}

$envVars = Read-LateenEnv
$pgUser = Get-EnvDefault $envVars 'LATEEN_POSTGRES_USER' 'lateen'
$sqlFile = Join-Path $backupDir 'postgres-all.sql'

Write-Host "Restoring from $backupDir..." -ForegroundColor Cyan

if (Test-Path $sqlFile) {
    Write-Host "  PostgreSQL..."
    Get-Content $sqlFile | docker exec -i lateen-postgres psql -U $pgUser 2>$null
}

$redisDump = Join-Path $backupDir 'redis-dump.rdb'
if (Test-Path $redisDump) {
    Write-Host "  Redis (requires restart)..."
    docker compose -f $ComposeFile stop redis 2>$null
    docker cp $redisDump lateen-redis:/data/dump.rdb
    docker compose -f $ComposeFile start redis 2>$null
}

Write-Host "Restore complete. Verify with health.ps1" -ForegroundColor Green
Write-Host "Note: MinIO and Qdrant volume restore may require manual volume copy for full recovery." -ForegroundColor Yellow
