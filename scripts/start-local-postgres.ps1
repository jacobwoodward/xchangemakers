$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$dataDir = Join-Path $repoRoot '.postgres-data'
$logFile = Join-Path $dataDir 'postgres.log'
$port = 5433
$databaseUrl = 'postgresql://xchangemakers:xchangemakers@localhost:5433/xchangemakers'

$binCandidates = @(
  'C:\Program Files\PostgreSQL\17\bin',
  'C:\Program Files\PostgreSQL\16\bin',
  'C:\Program Files\PostgreSQL\15\bin'
)

$pgBin = $binCandidates | Where-Object { Test-Path (Join-Path $_ 'pg_ctl.exe') } | Select-Object -First 1
if (-not $pgBin) {
  throw 'Could not find a local PostgreSQL bin directory. Install PostgreSQL or use Docker compose for the db service.'
}

$initdb = Join-Path $pgBin 'initdb.exe'
$pgCtl = Join-Path $pgBin 'pg_ctl.exe'
$createdb = Join-Path $pgBin 'createdb.exe'
$psql = Join-Path $pgBin 'psql.exe'

if (-not (Test-Path (Join-Path $dataDir 'PG_VERSION'))) {
  New-Item -ItemType Directory -Force -Path $dataDir | Out-Null
  & $initdb -D $dataDir -U xchangemakers --auth=trust --encoding=UTF8 --locale=C
}

$listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if (-not $listener) {
  & $pgCtl -D $dataDir -l $logFile -o "-p $port" start
}

$ready = $false
for ($i = 0; $i -lt 20; $i++) {
  $listener = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  if ($listener) {
    $ready = $true
    break
  }
  Start-Sleep -Milliseconds 500
}

if (-not $ready) {
  throw "PostgreSQL did not start on port $port. Check $logFile."
}

$dbExists = & $psql -h localhost -p $port -U xchangemakers -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = 'xchangemakers'"
if ($dbExists.Trim() -ne '1') {
  & $createdb -h localhost -p $port -U xchangemakers xchangemakers
}

Push-Location $repoRoot
try {
  $env:DATABASE_URL = $databaseUrl
  node db-init.js
} finally {
  Pop-Location
}

Write-Host "Local xChangeMakers database is ready on port $port."
