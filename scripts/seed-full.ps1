# Script de seed complet
# Usage: .\scripts\seed-full.ps1

Write-Host "🌱 Peuplement de la base de données (scénario complet)..." -ForegroundColor Cyan
Write-Host ""

Push-Location $PSScriptRoot\..\backend

try {
    npm run seed:full
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors du seed" -ForegroundColor Red
        exit $LASTEXITCODE
    }
} finally {
    Pop-Location
}

