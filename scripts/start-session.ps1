param(
  [ValidateSet('local', 'radmin')]
  [string] $Mode = 'local'
)

$repoRoot = Split-Path -Parent $PSScriptRoot
$backendPath = Join-Path $repoRoot 'backend'
$envPath = Join-Path $backendPath '.env'
$backendLog = Join-Path $repoRoot 'backend-local.log'
$siteLog = Join-Path $repoRoot "$Mode-site.log"

function Get-RadminIp {
  try {
    $address = Get-NetIPAddress -AddressFamily IPv4 -InterfaceAlias '*Radmin*' -ErrorAction Stop |
      Where-Object { $_.IPAddress -and $_.IPAddress -notlike '169.254.*' } |
      Select-Object -First 1 -ExpandProperty IPAddress
    if ($address) { return $address }
  } catch {
    # fallback below
  }

  try {
    $address = Get-NetIPAddress -AddressFamily IPv4 -ErrorAction Stop |
      Where-Object { $_.IPAddress -like '26.*' } |
      Select-Object -First 1 -ExpandProperty IPAddress
    if ($address) { return $address }
  } catch {
    # handled by caller
  }

  return ''
}

function Stop-PortListener {
  param([int] $Port)

  $listeners = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
  foreach ($listener in $listeners) {
    if ($listener.OwningProcess) {
      try {
        Stop-Process -Id $listener.OwningProcess -Force -ErrorAction Stop
        Write-Host "Processo na porta $Port encerrado: $($listener.OwningProcess)"
      } catch {
        Write-Warning "Nao consegui encerrar o processo $($listener.OwningProcess) na porta $Port."
      }
    }
  }
}

function Test-TcpPort {
  param(
    [string] $HostName,
    [int] $Port
  )

  $client = New-Object System.Net.Sockets.TcpClient
  try {
    $async = $client.BeginConnect($HostName, $Port, $null, $null)
    $connected = $async.AsyncWaitHandle.WaitOne(1200, $false)
    if (-not $connected) { return $false }
    $client.EndConnect($async)
    return $true
  } catch {
    return $false
  } finally {
    $client.Close()
  }
}

function Update-CorsOrigins {
  param([string] $SiteUrl)

  if (-not (Test-Path $envPath)) {
    Write-Warning ".env nao encontrado em $envPath. Pulei ajuste de CORS."
    return
  }

  $content = Get-Content $envPath -Raw
  $defaultOrigins = @(
    'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    $SiteUrl
  ) | Where-Object { $_ } | Select-Object -Unique
  $nextLine = 'CORS_ORIGINS=' + ($defaultOrigins -join ',')

  if ($content -match '(?m)^CORS_ORIGINS=.*$') {
    $content = $content -replace '(?m)^CORS_ORIGINS=.*$', $nextLine
  } else {
    $content = $content.TrimEnd() + "`r`n$nextLine"
  }

  Set-Content -Path $envPath -Value ($content.TrimEnd() + "`r`n") -Encoding UTF8
}

if (-not (Test-Path $backendPath)) {
  Write-Error "Backend nao encontrado em: $backendPath"
  exit 1
}

if ($Mode -eq 'radmin') {
  $privateIp = Get-RadminIp
  if (-not $privateIp) {
    Write-Error 'Nao encontrei IP do Radmin. Abra o Radmin VPN e confirme que ele esta conectado.'
    exit 1
  }
  $apiUrl = "http://$privateIp`:3001"
  $siteUrl = "http://$privateIp`:5500"
} else {
  $apiUrl = 'http://localhost:3001'
  $siteUrl = 'http://localhost:5500'
}

Set-Location $repoRoot
Write-Host "Modo: $Mode"
Write-Host "API: $apiUrl"
Write-Host "Site: $siteUrl"

Update-CorsOrigins -SiteUrl $siteUrl

Stop-PortListener -Port 3001
Stop-PortListener -Port 5500
Start-Sleep -Seconds 1

$backendArgs = "/c cd /d `"$backendPath`" && npm.cmd run start > `"$backendLog`" 2>&1"
Start-Process -FilePath 'cmd.exe' -ArgumentList $backendArgs -WindowStyle Hidden | Out-Null

Write-Host 'Subindo backend local...'
$backendOk = $false
for ($i = 0; $i -lt 20; $i += 1) {
  try {
    $health = Invoke-RestMethod -Uri 'http://localhost:3001/health' -TimeoutSec 3
    if ($health.ok -eq $true -and $health.database -eq 'up') {
      $backendOk = $true
      break
    }
  } catch {
    # wait and retry
  }
  Start-Sleep -Seconds 1
}

if (-not $backendOk) {
  Write-Error 'Backend ou banco local nao respondeu corretamente em localhost:3001/health.'
  if (Test-Path $backendLog) { Get-Content $backendLog -Tail 80 }
  exit 1
}

npm.cmd run set:api-url -- $apiUrl
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm.cmd run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$siteArgs = "/c cd /d `"$repoRoot`" && node scripts/serve-dist.mjs --host=0.0.0.0 --port=5500 > `"$siteLog`" 2>&1"
Start-Process -FilePath 'cmd.exe' -ArgumentList $siteArgs -WindowStyle Hidden | Out-Null

Write-Host 'Subindo site local...'
$siteOk = $false
for ($i = 0; $i -lt 15; $i += 1) {
  if (Test-TcpPort -HostName '127.0.0.1' -Port 5500) {
    $siteOk = $true
    break
  }
  Start-Sleep -Seconds 1
}

if (-not $siteOk) {
  Write-Error 'Site local nao respondeu em localhost:5500/index.html.'
  if (Test-Path $siteLog) { Get-Content $siteLog -Tail 80 }
  exit 1
}

Write-Host ''
Write-Host 'OmniVita esta pronto.'
Write-Host "Abra: $siteUrl/index.html"
Write-Host "Health da API: $apiUrl/health"
Write-Host ''
Write-Host 'Se o Windows pedir permissao de firewall para Node.js, permita em redes privadas.'
