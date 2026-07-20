# Lateen OS — Infrastructure script library (PowerShell)

$ErrorActionPreference = 'Stop'

$InfraRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$DockerDir = Join-Path $InfraRoot 'docker'
$ComposeFile = Join-Path $DockerDir 'docker-compose.yml'
$EnvFile = if ($env:LATEEN_ENV_FILE) {
    $env:LATEEN_ENV_FILE
} else {
    Join-Path $InfraRoot 'environments\.env.development'
}
$BackupRoot = Join-Path $InfraRoot 'backups'

function Get-ComposeBaseArgs {
    return @(
        'compose',
        '--project-directory', $DockerDir,
        '--env-file', $EnvFile,
        '-f', $ComposeFile
    )
}

function Invoke-Compose {
    param(
        [Parameter(Mandatory = $true, ValueFromRemainingArguments = $true)]
        [string[]]$Args
    )
    & docker @(Get-ComposeBaseArgs) + $Args
    if ($LASTEXITCODE -ne 0) {
        throw "docker compose failed with exit code $LASTEXITCODE"
    }
}

function Read-LateenEnv {
    $vars = @{}
    if (-not (Test-Path $EnvFile)) {
        return $vars
    }
    Get-Content $EnvFile | ForEach-Object {
        $line = $_.Trim()
        if ($line -eq '' -or $line.StartsWith('#')) { return }
        $eq = $line.IndexOf('=')
        if ($eq -gt 0) {
            $key = $line.Substring(0, $eq).Trim()
            $val = $line.Substring($eq + 1).Trim()
            $vars[$key] = $val
        }
    }
    return $vars
}

function Get-EnvDefault {
    param(
        [hashtable]$Vars,
        [string]$Key,
        [string]$Default
    )
    if ($Vars.ContainsKey($Key) -and $Vars[$Key]) {
        return $Vars[$Key]
    }
    return $Default
}

function Test-HttpEndpoint {
    param(
        [string]$Url,
        [int]$TimeoutSec = 5
    )
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSec
        return $response.StatusCode -ge 200 -and $response.StatusCode -lt 400
    } catch {
        return $false
    }
}
