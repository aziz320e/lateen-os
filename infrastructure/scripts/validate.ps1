# Lateen OS — Validate infrastructure configuration
. "$PSScriptRoot/_lib.ps1"

$errors = 0

function Test-RequiredFile {
    param([string]$Path, [string]$Label)
    if (Test-Path $Path) {
        Write-Host "[OK]   $Label" -ForegroundColor Green
    } else {
        Write-Host "[FAIL] $Label - missing: $Path" -ForegroundColor Red
        $script:errors++
    }
}

Write-Host "`nLateen OS Infrastructure Validation" -ForegroundColor Cyan
Write-Host ""

# Docker CLI
$dockerAvailable = $false
try {
    $null = Get-Command docker -ErrorAction Stop
    docker version --format '{{.Server.Version}}' 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK]   Docker CLI available" -ForegroundColor Green
        $dockerAvailable = $true
    } else {
        Write-Host "[WARN] Docker installed but daemon not running" -ForegroundColor Yellow
    }
} catch {
    Write-Host "[WARN] Docker CLI not available (file validation still passed)" -ForegroundColor Yellow
}

# Required files
Test-RequiredFile $ComposeFile 'docker-compose.yml'
Test-RequiredFile $EnvFile 'Environment file'
Test-RequiredFile (Join-Path $DockerDir 'prometheus\prometheus.yml') 'Prometheus config'
Test-RequiredFile (Join-Path $DockerDir 'otel\otel-collector.yaml') 'OTel config'
Test-RequiredFile (Join-Path $DockerDir 'grafana\provisioning\datasources\datasources.yml') 'Grafana datasources'

# Compose config validation
Write-Host ""
Write-Host "Validating docker compose configuration..." -ForegroundColor Cyan
if ($dockerAvailable) {
    try {
        & docker @(Get-ComposeBaseArgs) + @('config', '--quiet') 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[OK]   docker compose config" -ForegroundColor Green
        } else {
            Write-Host "[FAIL] docker compose config" -ForegroundColor Red
            & docker @(Get-ComposeBaseArgs) + @('config')
            $errors++
        }
    } catch {
        Write-Host "[FAIL] docker compose config - $($_.Exception.Message)" -ForegroundColor Red
        $errors++
    }
} else {
    Write-Host "[SKIP] docker compose config (Docker unavailable)" -ForegroundColor Yellow
}

# Scripts
$scripts = @('start', 'stop', 'restart', 'logs', 'health', 'reset', 'backup', 'restore')
foreach ($s in $scripts) {
    Test-RequiredFile (Join-Path $PSScriptRoot "$s.ps1") "script: $s.ps1"
    Test-RequiredFile (Join-Path $PSScriptRoot "$s.sh") "script: $s.sh"
}

Write-Host ""
if ($errors -eq 0) {
    Write-Host "Validation passed." -ForegroundColor Green
    exit 0
} else {
    Write-Host "Validation failed with $errors error(s)." -ForegroundColor Red
    exit 1
}
