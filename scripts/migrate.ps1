# Script de migration de la base de données
# Usage: .\scripts\migrate.ps1

Write-Host "🔄 Exécution des migrations..." -ForegroundColor Cyan
Write-Host ""

Push-Location $PSScriptRoot\..\backend

try {
    npm run migrate
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de la migration" -ForegroundColor Red
        exit $LASTEXITCODE
    }
} finally {
    Pop-Location
}

