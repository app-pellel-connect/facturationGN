# Script de seed de la base de données (scénario standard)
# Usage: .\scripts\seed.ps1 [--scenario=standard]

param(
    [string]$Scenario = "standard"
)

$validScenarios = @("empty", "minimal", "standard", "full")

if ($Scenario -notin $validScenarios) {
    Write-Host "❌ Scénario invalide: $Scenario" -ForegroundColor Red
    Write-Host "Scénarios disponibles: empty, minimal, standard, full" -ForegroundColor Yellow
    exit 1
}

Write-Host "🌱 Peuplement de la base de données avec le scénario: $Scenario" -ForegroundColor Cyan
Write-Host ""

Push-Location $PSScriptRoot\..\backend

try {
    if ($Scenario -eq "standard") {
        npm run seed
    } else {
        npm run "seed:$Scenario"
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors du seed" -ForegroundColor Red
        exit $LASTEXITCODE
    }
} finally {
    Pop-Location
}

