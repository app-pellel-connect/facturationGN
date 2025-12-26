# Script pour réinitialiser le suivi des migrations
# Usage: .\scripts\migrate-reset.ps1
# ⚠️  ATTENTION: Cette commande réinitialise uniquement le suivi des migrations
# Les tables de la base de données ne sont PAS supprimées

Write-Host "⚠️  Réinitialisation du suivi des migrations..." -ForegroundColor Yellow
Write-Host ""

$confirmation = Read-Host "Êtes-vous sûr de vouloir continuer? (O/N)"
if ($confirmation -ne "O" -and $confirmation -ne "o" -and $confirmation -ne "Y" -and $confirmation -ne "y") {
    Write-Host "❌ Opération annulée" -ForegroundColor Yellow
    exit 0
}

Push-Location $PSScriptRoot\..\backend

try {
    npm run migrate:reset
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de la réinitialisation" -ForegroundColor Red
        exit $LASTEXITCODE
    }
} finally {
    Pop-Location
}

