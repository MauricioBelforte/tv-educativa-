# Reset completo del servidor Next.js (limpia cache .next y reinicia)
$port = 3000
$proc = (Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue).OwningProcess
if ($proc -and $proc -ne 0) { Stop-Process -Id $proc -Force -ErrorAction SilentlyContinue; Start-Sleep 2 }
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Write-Host "[OK] Cache .next limpiado, reiniciando servidor..."
Start-Process -WindowStyle Hidden -FilePath "cmd.exe" -ArgumentList "/c npx next dev -p $port"

# Esperar a que el servidor responda (forza compilacion inicial)
$maxWait = 45
for ($i = 0; $i -lt $maxWait; $i++) {
  Start-Sleep 1
  try {
    $r = Invoke-WebRequest -Uri "http://localhost:$port" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    if ($r.StatusCode -eq 200) {
      Write-Host "[OK] Servidor compilado y corriendo en http://localhost:$port"
      exit 0
    }
  } catch {}
  if ($i % 5 -eq 0 -and $i -gt 0) { Write-Host "[...] esperando compilacion... ($i s)" }
}
Write-Host "[ERROR] No se pudo conectar a localhost:$port luego de $maxWait segundos"
exit 1
