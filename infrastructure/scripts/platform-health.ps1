#!/usr/bin/env pwsh
# Unified platform health check — probes all integrated services and infrastructure.

$ErrorActionPreference = 'Stop'

$businessDna = $env:BUSINESS_DNA_BASE_URL ?? $env:LATEEN_BUSINESS_DNA_BASE_URL ?? 'http://localhost:4001'
$productDiscovery = $env:PRODUCT_DISCOVERY_BASE_URL ?? $env:LATEEN_PRODUCT_DISCOVERY_BASE_URL ?? 'http://localhost:4002'

function Test-Endpoint {
  param([string]$Name, [string]$Url)
  try {
    $response = Invoke-WebRequest -Uri $Url -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
      Write-Host "[OK] $Name — $Url"
      return $true
    }
    Write-Host "[DEGRADED] $Name — HTTP $($response.StatusCode)"
    return $false
  } catch {
    Write-Host "[DOWN] $Name — $($_.Exception.Message)"
    return $false
  }
}

Write-Host "Lateen OS Platform Health Check"
Write-Host "================================"

$checks = @(
  @{ Name = 'business-dna-service'; Url = "$businessDna/health" },
  @{ Name = 'product-discovery-service'; Url = "$productDiscovery/health" },
  @{ Name = 'platform-health'; Url = "$productDiscovery/platform/health" }
)

$allOk = $true
foreach ($check in $checks) {
  if (-not (Test-Endpoint -Name $check.Name -Url $check.Url)) {
    $allOk = $false
  }
}

if (-not $allOk) {
  Write-Host "`nPlatform health: DEGRADED"
  exit 1
}

Write-Host "`nPlatform health: OK"
exit 0
