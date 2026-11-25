#Imports a code-signing PFX into the runner/user cert store and sets bundle.windows.certificateThumbprint
#for Tauri (see src-tauri/tauri.windows.conf.json). Requires WINDOWS_CERTIFICATE (base64 .pfx) and
#WINDOWS_CERTIFICATE_PASSWORD.

$ErrorActionPreference = 'Stop'

$configPath = Join-Path $PSScriptRoot '..\..\src-tauri\tauri.windows.conf.json'
if (-not (Test-Path $configPath)) {
  throw "Missing $configPath"
}

$certB64 = $env:WINDOWS_CERTIFICATE
$certPassword = $env:WINDOWS_CERTIFICATE_PASSWORD
$timestampUrl = if ($env:WINDOWS_TIMESTAMP_URL) { $env:WINDOWS_TIMESTAMP_URL } else { 'http://timestamp.digicert.com' }

if ([string]::IsNullOrWhiteSpace($certB64) -or [string]::IsNullOrWhiteSpace($certPassword)) {
  Write-Warning 'WINDOWS_CERTIFICATE or WINDOWS_CERTIFICATE_PASSWORD is not set; Windows installer will be UNSIGNED (SmartScreen will warn).'
  exit 0
}

New-Item -ItemType Directory -Force -Path $env:RUNNER_TEMP\agentinspect-cert | Out-Null
$pfxPath = Join-Path $env:RUNNER_TEMP 'agentinspect-cert\signing.pfx'
[IO.File]::WriteAllBytes($pfxPath, [Convert]::FromBase64String($certB64))

$securePassword = ConvertTo-SecureString -String $certPassword -Force -AsPlainText
$cert = Import-PfxCertificate -FilePath $pfxPath -CertStoreLocation 'Cert:\CurrentUser\My' -Password $securePassword
if (-not $cert.Thumbprint) {
  throw 'Imported signing certificate has no thumbprint.'
}

Write-Host "Imported signing certificate: $($cert.Subject)"
Write-Host "Thumbprint: $($cert.Thumbprint)"

$config = Get-Content $configPath -Raw | ConvertFrom-Json
if (-not $config.bundle) {
  $config | Add-Member -MemberType NoteProperty -Name bundle -Value ([pscustomobject]@{})
}
if (-not $config.bundle.windows) {
  $config.bundle | Add-Member -MemberType NoteProperty -Name windows -Value ([pscustomobject]@{})
}
$config.bundle.windows | Add-Member -Force -MemberType NoteProperty -Name certificateThumbprint -Value $cert.Thumbprint
$config.bundle.windows | Add-Member -Force -MemberType NoteProperty -Name digestAlgorithm -Value 'sha256'
$config.bundle.windows | Add-Member -Force -MemberType NoteProperty -Name timestampUrl -Value $timestampUrl
$config.bundle.windows | Add-Member -Force -MemberType NoteProperty -Name tsp -Value $false

$config | ConvertTo-Json -Depth 10 | Set-Content -Encoding utf8 $configPath

Write-Host 'Updated tauri.windows.conf.json for Authenticode signing.'