# Lateen OS — Restart platform infrastructure
. "$PSScriptRoot/_lib.ps1"

Write-Host "Restarting Lateen OS platform..." -ForegroundColor Cyan
Invoke-Compose @('down')
Invoke-Compose @('up', '-d', '--remove-orphans')
Write-Host "Platform restarted." -ForegroundColor Green
