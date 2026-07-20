# Lateen OS — Stop platform infrastructure
. "$PSScriptRoot/_lib.ps1"

Write-Host "Stopping Lateen OS platform..." -ForegroundColor Cyan
Invoke-Compose @('down')
Write-Host "Platform stopped." -ForegroundColor Green
