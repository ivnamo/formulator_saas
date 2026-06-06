[CmdletBinding()]
param(
    [string]$TargetPath = ".env.local",
    [string]$Model = "gpt-5-nano"
)

$ErrorActionPreference = "Stop"

$workspacePath = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$targetFullPath = [System.IO.Path]::GetFullPath((Join-Path $workspacePath $TargetPath))

if (-not $targetFullPath.StartsWith($workspacePath, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to write outside the workspace."
}

$secureKey = Read-Host "OpenAI API key" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)

try {
    $plainKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
    if ([string]::IsNullOrWhiteSpace($plainKey)) {
        throw "OPENAI_API_KEY cannot be empty."
    }
    if (-not $plainKey.StartsWith("sk-")) {
        Write-Warning "The value does not start with sk-. It will be saved anyway."
    }

    $parentPath = Split-Path -Parent $targetFullPath
    if (-not (Test-Path -LiteralPath $parentPath)) {
        New-Item -ItemType Directory -Path $parentPath | Out-Null
    }

    $lines = @()
    if (Test-Path -LiteralPath $targetFullPath) {
        $lines = @(Get-Content -LiteralPath $targetFullPath)
    }

    $values = [ordered]@{
        "OPENAI_API_KEY" = $plainKey
        "REQUIREMENT_PARSER_PROVIDER" = "llm"
        "REQUIREMENT_PARSER_MODEL" = $Model
    }

    foreach ($name in $values.Keys) {
        $pattern = "^\s*$([regex]::Escape($name))\s*="
        $replacement = "$name=$($values[$name])"
        $updated = $false
        $lines = @(
            foreach ($line in $lines) {
                if ($line -match $pattern) {
                    $updated = $true
                    $replacement
                } else {
                    $line
                }
            }
        )
        if (-not $updated) {
            $lines += $replacement
        }
    }

    Set-Content -LiteralPath $targetFullPath -Value $lines -Encoding utf8
    Write-Host "Saved OPENAI_API_KEY and requirement parser settings to $targetFullPath"
    Write-Host "Restart the API process so it loads the updated local env file."
}
finally {
    if ($bstr -ne [IntPtr]::Zero) {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
    }
}
