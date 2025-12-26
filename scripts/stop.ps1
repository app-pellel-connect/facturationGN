# Script d'arrêt pour FactureGN
# Ce script arrête tous les processus liés au projet (frontend et backend)

Write-Host "🛑 Arrêt de FactureGN..." -ForegroundColor Yellow
Write-Host ""

$stoppedAny = $false

# Arrêter les processus sur les ports spécifiques (méthode la plus fiable)
$ports = @(3001, 8080, 5173, 4173)

foreach ($port in $ports) {
    try {
        $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
        
        if ($connections) {
            $uniquePids = $connections | Select-Object -ExpandProperty OwningProcess -Unique
            
            if ($uniquePids) {
                Write-Host "⏹️  Arrêt des processus sur le port $port..." -ForegroundColor Yellow
                foreach ($pid in $uniquePids) {
                    try {
                        $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
                        if ($process) {
                            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                            Write-Host "   ✓ Processus $pid (port $port) arrêté" -ForegroundColor Green
                            $stoppedAny = $true
                        }
                    } catch {
                        Write-Host "   ⚠ Impossible d'arrêter le processus $pid" -ForegroundColor Yellow
                    }
                }
                Write-Host ""
            }
        }
    } catch {
        # Port non utilisé ou erreur
    }
}

# Arrêter les jobs PowerShell si existants
$jobs = Get-Job -State Running -ErrorAction SilentlyContinue
if ($jobs) {
    Write-Host "⏹️  Arrêt des jobs PowerShell..." -ForegroundColor Yellow
    $jobs | ForEach-Object {
        try {
            Stop-Job -Id $_.Id -ErrorAction SilentlyContinue
            Remove-Job -Id $_.Id -ErrorAction SilentlyContinue
            Write-Host "   ✓ Job $($_.Id) arrêté" -ForegroundColor Green
            $stoppedAny = $true
        } catch {
            Write-Host "   ⚠ Impossible d'arrêter le job $($_.Id)" -ForegroundColor Yellow
        }
    }
    Write-Host ""
}

if ($stoppedAny) {
    Write-Host "✅ Tous les processus ont été arrêtés" -ForegroundColor Green
} else {
    Write-Host "ℹ️  Aucun processus à arrêter" -ForegroundColor Cyan
}
Write-Host ""
