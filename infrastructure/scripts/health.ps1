# Lateen OS — Platform health checks
. "$PSScriptRoot/_lib.ps1"

$envVars = Read-LateenEnv
$failed = 0
$passed = 0

function Write-Check {
    param([string]$Name, [bool]$Ok, [string]$Detail = '')
    if ($Ok) {
        Write-Host "[OK]   $Name" -ForegroundColor Green
        if ($Detail) { Write-Host "       $Detail" -ForegroundColor DarkGray }
        $script:passed++
    } else {
        Write-Host "[FAIL] $Name" -ForegroundColor Red
        if ($Detail) { Write-Host "       $Detail" -ForegroundColor DarkGray }
        $script:failed++
    }
}

Write-Host "`nLateen OS Platform Health Check" -ForegroundColor Cyan
Write-Host "Env file: $EnvFile`n" -ForegroundColor DarkGray

# Docker Compose service status
try {
    $psOutput = & docker @(Get-ComposeBaseArgs) + @('ps', '--format', '{{.Name}}|{{.Status}}') 2>$null
    $running = @{}
    foreach ($line in $psOutput) {
        if ($line -match '^(.+)\|(.+)$') {
            $running[$Matches[1]] = $Matches[2]
        }
    }
} catch {
    $running = @{}
}

# PostgreSQL
$pgUser = Get-EnvDefault $envVars 'LATEEN_POSTGRES_USER' 'lateen'
$pgDb = Get-EnvDefault $envVars 'LATEEN_POSTGRES_DB' 'lateen_os'
$pgOk = $false
try {
    docker exec lateen-postgres pg_isready -U $pgUser -d $pgDb 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) { $pgOk = $true }
} catch { }
Write-Check 'PostgreSQL' $pgOk ($running['lateen-postgres'])

# Redis
$redisPass = Get-EnvDefault $envVars 'LATEEN_REDIS_PASSWORD' ''
$redisOk = $false
try {
    $r = docker exec lateen-redis redis-cli -a $redisPass ping 2>$null
    if ($r -match 'PONG') { $redisOk = $true }
} catch { }
Write-Check 'Redis' $redisOk ($running['lateen-redis'])

# NATS
$natsPort = Get-EnvDefault $envVars 'LATEEN_NATS_HOST_MONITORING_PORT' '8222'
$natsOk = Test-HttpEndpoint "http://localhost:${natsPort}/healthz"
Write-Check 'NATS' $natsOk ($running['lateen-nats'])

# MinIO
$minioPort = Get-EnvDefault $envVars 'LATEEN_MINIO_HOST_API_PORT' '9000'
$minioOk = Test-HttpEndpoint "http://localhost:${minioPort}/minio/health/live"
Write-Check 'MinIO' $minioOk ($running['lateen-minio'])

# Qdrant
$qdrantPort = Get-EnvDefault $envVars 'LATEEN_QDRANT_HOST_HTTP_PORT' '6333'
$qdrantOk = Test-HttpEndpoint "http://localhost:${qdrantPort}/healthz"
Write-Check 'Qdrant' $qdrantOk ($running['lateen-qdrant'])

# Grafana
$grafanaPort = Get-EnvDefault $envVars 'LATEEN_GRAFANA_HOST_PORT' '3000'
$grafanaOk = Test-HttpEndpoint "http://localhost:${grafanaPort}/api/health"
Write-Check 'Grafana' $grafanaOk ($running['lateen-grafana'])

# Prometheus
$promPort = Get-EnvDefault $envVars 'LATEEN_PROMETHEUS_HOST_PORT' '9090'
$promOk = Test-HttpEndpoint "http://localhost:${promPort}/-/healthy"
Write-Check 'Prometheus' $promOk ($running['lateen-prometheus'])

# OpenTelemetry Collector
$otelPort = Get-EnvDefault $envVars 'LATEEN_OTEL_HEALTH_PORT' '13133'
$otelOk = Test-HttpEndpoint "http://localhost:${otelPort}/"
Write-Check 'OpenTelemetry Collector' $otelOk ($running['lateen-otel-collector'])

# PgAdmin
$pgadminPort = Get-EnvDefault $envVars 'LATEEN_PGADMIN_HOST_PORT' '5050'
$pgadminOk = Test-HttpEndpoint "http://localhost:${pgadminPort}/misc/ping"
Write-Check 'PgAdmin' $pgadminOk ($running['lateen-pgadmin'])

Write-Host "`nSummary: $passed passed, $failed failed" -ForegroundColor $(if ($failed -eq 0) { 'Green' } else { 'Yellow' })
if ($failed -gt 0) { exit 1 }
