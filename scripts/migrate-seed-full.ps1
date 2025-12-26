# Script pour exécuter les migrations puis le seed (scénario complet)
# Usage: .\scripts\migrate-seed-full.ps1

Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Migration et Seed (scénario complet)" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

Push-Location $PSScriptRoot\..\backend

try {
    # Étape 1: Migration
    Write-Host "1️⃣  Exécution des migrations..." -ForegroundColor Yellow
    Write-Host ""
    npm run migrate
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de la migration" -ForegroundColor Red
        exit $LASTEXITCODE
    }
    
    Write-Host ""
    
    # Étape 2: Seed
    Write-Host "2️⃣  Peuplement de la base de données (complet)..." -ForegroundColor Yellow
    Write-Host ""
    npm run seed:full
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors du seed" -ForegroundColor Red
        exit $LASTEXITCODE
    }
    
    Write-Host ""
    Write-Host "✅ Migration et seed terminés avec succès!" -ForegroundColor Green
} finally {
    Pop-Location
}

