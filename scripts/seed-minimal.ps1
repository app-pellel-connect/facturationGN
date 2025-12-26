# Script de seed minimal
# Usage: .\scripts\seed-minimal.ps1

Write-Host "🌱 Peuplement de la base de données (scénario minimal)..." -ForegroundColor Cyan
Write-Host ""

Push-Location $PSScriptRoot\..\backend

try {
    npm run seed:minimal
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors du seed" -ForegroundColor Red
        exit $LASTEXITCODE
    }
} finally {
    Pop-Location
}

