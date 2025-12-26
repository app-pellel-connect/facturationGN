# Script pour lister les migrations
# Usage: .\scripts\migrate-list.ps1

Write-Host "📋 Liste des migrations..." -ForegroundColor Cyan
Write-Host ""

Push-Location $PSScriptRoot\..\backend

try {
    npm run migrate:list
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erreur lors de la liste des migrations" -ForegroundColor Red
        exit $LASTEXITCODE
    }
} finally {
    Pop-Location
}

