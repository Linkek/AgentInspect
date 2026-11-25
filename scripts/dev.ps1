# AgentInspect — Tauri dev (loads .env + MSVC env when available)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

if (Test-Path ".\.env") {
  Get-Content ".\.env" | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.*)$') {
      [System.Environment]::SetEnvironmentVariable($matches[1].Trim(), $matches[2].Trim(), "Process")
    }
  }
}

$vcvars = @(
  "${env:ProgramFiles(x86)}\Microsoft Visual Studio\18\BuildTools\VC\Auxiliary\Build\vcvars64.bat",
  "${env:ProgramFiles}\Microsoft Visual Studio\18\Community\VC\Auxiliary\Build\vcvars64.bat",
  "${env:ProgramFiles}\Microsoft Visual Studio\2022\Community\VC\Auxiliary\Build\vcvars64.bat",
  "${env:ProgramFiles(x86)}\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($vcvars) {
  Write-Host "Using MSVC environment: $vcvars"
  cmd /c "`"$vcvars`" && set" | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
      Set-Item -Path "env:$($matches[1])" -Value $matches[2]
    }
  }
} else {
  Write-Warning "vcvars64.bat not found — install 'Desktop development with C++' in Visual Studio."
}

pnpm tauri dev