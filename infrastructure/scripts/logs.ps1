# Lateen OS — View platform logs
param(
    [string]$Service = '',
    [switch]$Follow
)

. "$PSScriptRoot/_lib.ps1"

$args = @('logs')
if ($Follow) { $args += '-f' }
if ($Service) { $args += $Service }

Invoke-Compose @args
