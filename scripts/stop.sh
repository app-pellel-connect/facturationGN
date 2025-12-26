#!/bin/bash
# Script d'arrêt pour FactureGN
# Ce script arrête tous les processus liés au projet (frontend et backend)

echo "🛑 Arrêt de FactureGN..."
echo ""

# Fonction pour arrêter les processus sur un port
stop_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    
    if [ -n "$pids" ]; then
        echo "⏹️  Arrêt des processus sur le port $port..."
        echo "$pids" | xargs kill -9 2>/dev/null
        echo "   ✓ Processus arrêtés"
        echo ""
    fi
}

# Arrêter les processus sur les ports spécifiques
stop_port 3001  # Backend
stop_port 8080  # Frontend dev
stop_port 5173  # Frontend Vite dev

# Arrêter les processus Node.js liés au projet
echo "⏹️  Arrêt des processus Node.js..."
pkill -f "vite" 2>/dev/null
pkill -f "preview" 2>/dev/null
pkill -f "facturationGN" 2>/dev/null

echo "✅ Tous les processus ont été arrêtés"
echo ""

