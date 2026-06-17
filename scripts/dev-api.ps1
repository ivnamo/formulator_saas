param(
    [int]$Port = 8010
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$python = Join-Path $repoRoot ".venv\Scripts\python.exe"

if (-not (Test-Path $python)) {
    throw "Python virtualenv not found at $python. Run the README setup first."
}

if (-not $env:FORMULIA_DB_POOL_SIZE) {
    $env:FORMULIA_DB_POOL_SIZE = "4"
}
if (-not $env:FORMULIA_DB_MAX_OVERFLOW) {
    $env:FORMULIA_DB_MAX_OVERFLOW = "2"
}
if (-not $env:FORMULIA_DB_POOL_TIMEOUT) {
    $env:FORMULIA_DB_POOL_TIMEOUT = "30"
}

& $python -m uvicorn formulia_api.main:app --reload --host 127.0.0.1 --port $Port
