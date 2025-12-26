# Script pour exécuter les migrations puis le seed (scénario standard)
# Usage: .\scripts\migrate-seed.ps1 [--scenario=standard]

param(
    [string]$Scenario = "standard"
)

$validScenarios = @("minimal", "standard", "full")

if ($Scenario -notin $validScenarios) {
    Write-Host "❌ Scénario invalide: $Scenario" -ForegroundColor Red
    Write-Host "Scénarios disponibles: minimal, standard, full" -ForegroundColor Yellow
    exit 1
}

Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Migration et Seed de la base de données" -ForegroundColor Cyan
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
    Write-Host "2️⃣  Peuplement de la base de données..." -ForegroundColor Yellow
    Write-Host ""
    npm run "seed:$Scenario"
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors du seed" -ForegroundColor Red
        exit $LASTEXITCODE
    }
    
    Write-Host ""
    Write-Host "✅ Migration et seed terminés avec succès!" -ForegroundColor Green
} finally {
    Pop-Location
}

