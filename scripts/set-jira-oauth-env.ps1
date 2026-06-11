[CmdletBinding()]
param(
    [string]$TargetPath = ".env.local",
    [string]$ClientId = "",
    [string]$RedirectUri = "",
    [string]$SiteUrl = ""
)

$ErrorActionPreference = "Stop"

$workspacePath = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot ".."))
$targetFullPath = [System.IO.Path]::GetFullPath((Join-Path $workspacePath $TargetPath))

if (-not $targetFullPath.StartsWith($workspacePath, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to write outside the workspace."
}

function Read-PlainSecret {
    param(
        [string]$Prompt,
        [bool]$Required = $true
    )

    $secureValue = Read-Host $Prompt -AsSecureString
    $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureValue)

    try {
        $plainValue = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
        if ($Required -and [string]::IsNullOrWhiteSpace($plainValue)) {
            throw "$Prompt cannot be empty."
        }
        return $plainValue
    }
    finally {
        if ($bstr -ne [IntPtr]::Zero) {
            [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
        }
    }
}

if ([string]::IsNullOrWhiteSpace($ClientId)) {
    $ClientId = Read-Host "Atlassian OAuth Client ID"
}
if ([string]::IsNullOrWhiteSpace($ClientId)) {
    throw "FORMULIA_JIRA_OAUTH_CLIENT_ID cannot be empty."
}

$clientSecret = Read-PlainSecret "Atlassian OAuth Client Secret"

if ([string]::IsNullOrWhiteSpace($RedirectUri)) {
    $RedirectUri = Read-Host "Atlassian OAuth Redirect URI"
}
if ([string]::IsNullOrWhiteSpace($RedirectUri)) {
    throw "FORMULIA_JIRA_OAUTH_REDIRECT_URI cannot be empty."
}

if ([string]::IsNullOrWhiteSpace($SiteUrl)) {
    $SiteUrl = Read-Host "Jira site URL (optional; e.g. https://example.atlassian.net)"
}
$cloudId = Read-Host "Jira Cloud ID (optional until you have an access token)"
$accessToken = Read-PlainSecret "Jira OAuth Access Token (optional; press Enter if pending)" $false

$parentPath = Split-Path -Parent $targetFullPath
if (-not (Test-Path -LiteralPath $parentPath)) {
    New-Item -ItemType Directory -Path $parentPath | Out-Null
}

$lines = @()
if (Test-Path -LiteralPath $targetFullPath) {
    $lines = @(Get-Content -LiteralPath $targetFullPath)
}

$values = [ordered]@{
    "FORMULIA_JIRA_OAUTH_CLIENT_ID" = $ClientId.Trim()
    "FORMULIA_JIRA_OAUTH_CLIENT_SECRET" = $clientSecret.Trim()
    "FORMULIA_JIRA_OAUTH_REDIRECT_URI" = $RedirectUri.Trim()
}

if (-not [string]::IsNullOrWhiteSpace($SiteUrl)) {
    $values["FORMULIA_JIRA_SITE_URL"] = $SiteUrl.Trim().TrimEnd("/")
}
if (-not [string]::IsNullOrWhiteSpace($cloudId)) {
    $values["FORMULIA_JIRA_CLOUD_ID"] = $cloudId.Trim()
}
if (-not [string]::IsNullOrWhiteSpace($accessToken)) {
    $values["FORMULIA_JIRA_OAUTH_ACCESS_TOKEN"] = $accessToken.Trim()
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
Write-Host "Saved Jira OAuth settings to $targetFullPath"
Write-Host "Restart the API process so it loads the updated local env file."
