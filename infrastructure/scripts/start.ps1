# Lateen OS — Start platform infrastructure
. "$PSScriptRoot/_lib.ps1"

Write-Host "Starting Lateen OS platform (env: $EnvFile)..." -ForegroundColor Cyan
Invoke-Compose @('up', '-d', '--remove-orphans')
Write-Host "Platform started. Run health.ps1 to verify." -ForegroundColor Green
