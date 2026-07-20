# Lateen OS — Reset platform (removes volumes — destructive)
param(
    [switch]$Force
)

. "$PSScriptRoot/_lib.ps1"

if (-not $Force) {
    Write-Host "WARNING: This will stop all services and DELETE all data volumes." -ForegroundColor Red
    $confirm = Read-Host "Type 'reset' to confirm"
    if ($confirm -ne 'reset') {
        Write-Host "Aborted." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "Resetting Lateen OS platform..." -ForegroundColor Red
Invoke-Compose @('down', '-v', '--remove-orphans')
Write-Host "Platform reset complete. All volumes removed." -ForegroundColor Green
