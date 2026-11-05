# Requires GitHub CLI (gh) authenticated as a repository administrator.
# This command is SAFE by default; no remote mutations without -Apply.
[CmdletBinding()]
param([switch]$Apply)

$ErrorActionPreference = 'Stop'
$repository = 'Drako01/indizivo'
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$files = @(
  'config/rulesets/main-development.json',
  'config/rulesets/release-tags.json'
)

function Invoke-Gh {
  param([Parameter(Mandatory)][string[]]$Arguments)
  & gh @Arguments
  if ($LASTEXITCODE -ne 0) { throw "GitHub CLI failed (exit $LASTEXITCODE): $($Arguments -join ' ')" }
}

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  throw "Install GitHub CLI (gh) and authenticate with 'gh auth login' before proceeding."
}
Write-Host "Target repository: $repository"
Write-Host "Action: $(if ($Apply) {'CREATE repository rulesets'} else {'READ-ONLY PREVIEW'})"
Write-Host "WARNING: Required CI checks are intentionally excluded while workflows are disabled."

$rulesetsText = Invoke-Gh @('api',"repos/$repository/rulesets")
$rulesets = @($rulesetsText | ConvertFrom-Json)
foreach ($file in $files) {
  $full = Join-Path $root $file
  if (-not (Test-Path $full)) { throw "Missing ruleset file: $full" }
  $rule = Get-Content $full -Raw | ConvertFrom-Json
  $matching = @($rulesets | Where-Object { $_.name -eq $rule.name })
  if ($matching.Count -gt 0) {
    Write-Host "Already exists: $($rule.name) (id: $($matching[0].id)). No changes will be made."
    continue
  }
  if ($Apply) {
    Write-Host "Creating: $($rule.name)"
    Invoke-Gh @('api','--method','POST',"repos/$repository/rulesets",'--input',$full)
  } else {
    Write-Host "Would create: $($rule.name)"
    Write-Host "  From: $full"
  }
}
if (-not $Apply) {
  Write-Host "DRY RUN completed. Apply only when ready: .\scripts\apply-rulesets.ps1 -Apply"
} else {
  Write-Host "Verify applied server-side rules:"
  Invoke-Gh @('api',"repos/$repository/rulesets")
}
