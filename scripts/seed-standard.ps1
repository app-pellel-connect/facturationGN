# Script de seed standard
# Usage: .\scripts\seed-standard.ps1

Write-Host "🌱 Peuplement de la base de données (scénario standard)..." -ForegroundColor Cyan
Write-Host ""

Push-Location $PSScriptRoot\..\backend

try {
    npm run seed:standard
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors du seed" -ForegroundColor Red
        exit $LASTEXITCODE
    }
} finally {
    Pop-Location
}

