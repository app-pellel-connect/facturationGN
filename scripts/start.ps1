# Script de démarrage pour FactureGN
# Ce script installe les dépendances, build et démarre le projet

param(
    [switch]$Dev = $false,
    [switch]$Build = $false,
    [switch]$NoInstall = $false
)

Write-Host "🚀 Démarrage de FactureGN" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Stop"

# Fonction pour exécuter une commande et vérifier le résultat
function Invoke-Command {
    param([string]$Command, [string]$Description)
    
    Write-Host "📦 $Description..." -ForegroundColor Yellow
    $result = Invoke-Expression $Command
    
    if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne $null) {
        Write-Host "❌ Erreur lors de: $Description" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ $Description terminé" -ForegroundColor Green
    Write-Host ""
}

# Étape 1: Installation des dépendances
if (-not $NoInstall) {
    Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "1️⃣  Installation des dépendances" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    # Frontend
    if (Test-Path "package.json") {
        Invoke-Command -Command "npm install" -Description "Installation des dépendances frontend"
    }
    
    # Backend
    if (Test-Path "backend/package.json") {
        Push-Location backend
        Invoke-Command -Command "npm install" -Description "Installation des dépendances backend"
        Pop-Location
    }
} else {
    Write-Host "⏭️  Installation des dépendances ignorée (--NoInstall)" -ForegroundColor Yellow
    Write-Host ""
}

# Étape 2: Build (si demandé ou en mode production)
if ($Build -or -not $Dev) {
    Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "2️⃣  Build du projet" -ForegroundColor Cyan
    Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""
    
    # Build Backend
    if (Test-Path "backend/package.json") {
        Push-Location backend
        Invoke-Command -Command "npm run build" -Description "Build du backend"
        Pop-Location
    }
    
    # Build Frontend (nécessaire pour le mode production)
    if (Test-Path "package.json") {
        Invoke-Command -Command "npm run build" -Description "Build du frontend"
        
        # Vérifier que le dossier dist existe
        if (-not (Test-Path "dist")) {
            Write-Host "❌ Le dossier dist n'existe pas après le build" -ForegroundColor Red
            exit 1
        }
    }
}

# Étape 3: Démarrage
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "3️⃣  Démarrage des serveurs" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

if ($Dev) {
    Write-Host "🔧 Mode développement" -ForegroundColor Green
    Write-Host ""
    
    # Démarrer le backend en mode dev
    if (Test-Path "backend/package.json") {
        Write-Host "🌐 Démarrage du backend (mode dev)..." -ForegroundColor Yellow
        $backendJob = Start-Job -ScriptBlock {
            Set-Location $using:PWD\backend
            npm start
        }
        Write-Host "✅ Backend démarré (port 3001)" -ForegroundColor Green
        Write-Host ""
    }
    
    # Démarrer le frontend en mode dev
    Write-Host "⚛️  Démarrage du frontend (mode dev)..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📍 Frontend: http://localhost:8080" -ForegroundColor Cyan
    Write-Host "📍 Backend:  http://localhost:3001" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Appuyez sur Ctrl+C pour arrêter les serveurs" -ForegroundColor Yellow
    Write-Host ""
    
    npm run dev --prefix .
} else {
    Write-Host "🚀 Mode production" -ForegroundColor Green
    Write-Host ""
    
    # Vérifier que le build existe
    if (-not (Test-Path "dist")) {
        Write-Host "❌ Le dossier dist n'existe pas. Veuillez d'abord build le projet avec --Build" -ForegroundColor Red
        exit 1
    }
    
    if (-not (Test-Path "backend/dist/index.js")) {
        Write-Host "❌ Le backend n'est pas build. Veuillez d'abord build le projet avec --Build" -ForegroundColor Red
        exit 1
    }
    
    # Démarrer le backend
    Write-Host "🌐 Démarrage du backend..." -ForegroundColor Yellow
    $backendJob = Start-Job -ScriptBlock {
        Set-Location $using:PWD\backend
        npm start
    }
    Write-Host "✅ Backend démarré (port 3001)" -ForegroundColor Green
    Write-Host ""
    
    # Attendre un peu pour que le backend démarre
    Start-Sleep -Seconds 2
    
    # Démarrer le frontend
    Write-Host "⚛️  Démarrage du frontend..." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📍 Frontend: http://localhost:4173" -ForegroundColor Cyan
    Write-Host "📍 Backend:  http://localhost:3001" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Appuyez sur Ctrl+C pour arrêter les serveurs" -ForegroundColor Yellow
    Write-Host ""
    
    npm run preview
}

