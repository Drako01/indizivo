# Indizivo Enterprise AAA — local comprehensive QA, stores all output in logs.log
# pwsh -NoProfile -File .\verify-indizivo.ps1
[CmdletBinding()]
param([switch]$SkipInstall,[switch]$SkipE2E)
$ErrorActionPreference='Stop'
$PSNativeCommandUseErrorActionPreference=$false
Set-Location -LiteralPath $PSScriptRoot
$log=Join-Path $PSScriptRoot 'logs.log'
$results=[System.Collections.Generic.List[object]]::new()
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
@(
  'INDIZIVO ENTERPRISE AAA - FULL LOCAL VALIDATION',
  "Date: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss zzz')",
  "Root: $PSScriptRoot",
  'Reference (stable main): 59 unit tests PASS, 67.68% lines, Windows Extension Host E2E PASS',
  'This script never pushes, merges, publishes, changes GitHub rulesets or enables CI.'
) | Set-Content -LiteralPath $log -Encoding utf8

function Run-Check {
  param([string]$Name,[string]$Exe,[string[]]$Argv,[switch]$WarnOnly)
  $start=Get-Date
  @('','==================================================',"START: $Name",
    "COMMAND: $Exe $($Argv -join ' ')") |
    Tee-Object -FilePath $log -Append | Out-Null
  Write-Host "[Indizivo] $Name" -ForegroundColor Cyan
  $global:LASTEXITCODE=0
  $exitCode=1
  try {
    & $Exe @Argv 2>&1 | Tee-Object -FilePath $log -Append | Out-Host
    if($null -eq $global:LASTEXITCODE){$exitCode=0}
    else{$exitCode=[int]$global:LASTEXITCODE}
  } catch {
    "EXCEPTION: $($_.Exception.Message)" |
      Tee-Object -FilePath $log -Append | Out-Host
    $exitCode=1
  }
  $seconds=[math]::Round(((Get-Date)-$start).TotalSeconds,2)
  $status=if($exitCode -eq 0){'PASS'}elseif($WarnOnly){'WARN'}else{'FAIL'}
  $results.Add([pscustomobject]@{
    Check=$Name;Status=$status;ExitCode=$exitCode;Seconds=$seconds
  })
  "RESULT: $status | Exit: $exitCode | Duration: $seconds s" |
    Tee-Object -FilePath $log -Append | Out-Host
  return [int]$exitCode
}

try {
  Run-Check 'Git branch' 'git' @('branch','--show-current') | Out-Null
  Run-Check 'Git revision' 'git' @('rev-parse','HEAD') | Out-Null
  Run-Check 'Git working tree' 'git' @('status','--short') | Out-Null
  Run-Check 'Node version' 'node' @('--version') | Out-Null
  Run-Check 'npm version' 'npm' @('--version') | Out-Null
  $installed=0
  if(-not $SkipInstall){
    $installed=Run-Check 'Locked dependencies npm ci' 'npm' @('ci')
  }
  if($installed -eq 0){
    Run-Check 'Strict TypeScript compiler' 'npm' @('run','typecheck') | Out-Null
    Run-Check 'TypeScript lint' 'npm' @('run','lint:types') | Out-Null
    Run-Check 'Security hygiene' 'npm' @('run','lint:security') | Out-Null
    Run-Check 'Unit and integration tests' 'npm' @('test') | Out-Null
    if(-not $SkipE2E){
      Run-Check 'Full release + real Extension Host + installed VSIX smoke' 'npm' @('run','release:check') | Out-Null
    } else {
      'SKIP (explicit): VS Code E2E and installed VSIX smoke' |
        Tee-Object -FilePath $log -Append | Out-Null
    }
    Run-Check 'Coverage vs baseline' 'npm' @('run','test:coverage') | Out-Null
    Run-Check 'Performance benchmark' 'npm' @('run','benchmark') | Out-Null
    Run-Check 'Production dependency audit' 'npm' @('audit','--omit=dev') | Out-Null
    Run-Check 'Full dependency audit' 'npm' @('audit') -WarnOnly | Out-Null
    Run-Check 'Local ruleset verification' 'npm' @('run','rulesets:check') | Out-Null
    Run-Check 'GitHub live rulesets (read only)' 'gh' @(
      'api','repos/Drako01/indizivo/rulesets',
      '--jq','.[] | "\(.name) | \(.enforcement) | \(.id)"') | Out-Null
    Run-Check 'Git whitespace check' 'git' @('diff','--check') | Out-Null
  } else {
    'BLOCKED: npm ci failed; running tests with incomplete dependencies is invalid.' |
      Tee-Object -FilePath $log -Append | Out-Host
  }
} finally {
  $pass=@($results|Where-Object Status -eq PASS).Count
  $fail=@($results|Where-Object Status -eq FAIL).Count
  $warn=@($results|Where-Object Status -eq WARN).Count
  @('','================ FINAL SUMMARY ================',
    ($results|Format-Table -AutoSize|Out-String),
    "TOTAL: $($results.Count)","PASS: $pass","FAIL: $fail","WARN: $warn",
    "LOG FILE: $log") | Tee-Object -FilePath $log -Append | Out-Host
}
if($fail -gt 0){exit 1}
exit 0
