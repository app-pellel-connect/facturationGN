#!/bin/bash
# Script de démarrage pour FactureGN
# Ce script installe les dépendances, build et démarre le projet

set -e  # Arrêter en cas d'erreur

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
print_step() {
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo ""
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
    echo ""
}

print_info() {
    echo -e "${YELLOW}📦 $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Parse des arguments
DEV=false
BUILD=false
NO_INSTALL=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --dev)
            DEV=true
            shift
            ;;
        --build)
            BUILD=true
            shift
            ;;
        --no-install)
            NO_INSTALL=true
            shift
            ;;
        *)
            echo "Usage: $0 [--dev] [--build] [--no-install]"
            exit 1
            ;;
    esac
done

echo -e "${CYAN}🚀 Démarrage de FactureGN${NC}"
echo ""

# Étape 1: Installation des dépendances
if [ "$NO_INSTALL" = false ]; then
    print_step "1️⃣  Installation des dépendances"
    
    # Frontend
    if [ -f "package.json" ]; then
        print_info "Installation des dépendances frontend..."
        npm install
        print_success "Installation des dépendances frontend terminée"
    fi
    
    # Backend
    if [ -f "backend/package.json" ]; then
        print_info "Installation des dépendances backend..."
        cd backend
        npm install
        cd ..
        print_success "Installation des dépendances backend terminée"
    fi
else
    echo -e "${YELLOW}⏭️  Installation des dépendances ignorée (--no-install)${NC}"
    echo ""
fi

# Étape 2: Build (si demandé ou en mode production)
if [ "$BUILD" = true ] || [ "$DEV" = false ]; then
    print_step "2️⃣  Build du projet"
    
    # Build Backend
    if [ -f "backend/package.json" ]; then
        print_info "Build du backend..."
        cd backend
        npm run build
        cd ..
        print_success "Build du backend terminé"
    fi
    
    # Build Frontend
    if [ -f "package.json" ]; then
        print_info "Build du frontend..."
        npm run build
        print_success "Build du frontend terminé"
        
        # Vérifier que le dossier dist existe
        if [ ! -d "dist" ]; then
            print_error "Le dossier dist n'existe pas après le build"
            exit 1
        fi
    fi
fi

# Étape 3: Démarrage
print_step "3️⃣  Démarrage des serveurs"

if [ "$DEV" = true ]; then
    echo -e "${GREEN}🔧 Mode développement${NC}"
    echo ""
    
    # Démarrer le backend en arrière-plan
    if [ -f "backend/package.json" ]; then
        print_info "Démarrage du backend (mode dev)..."
        cd backend
        npm run dev > ../backend.log 2>&1 &
        BACKEND_PID=$!
        cd ..
        print_success "Backend démarré (port 3001, PID: $BACKEND_PID)"
    fi
    
    # Attendre un peu pour que le backend démarre
    sleep 2
    
    # Fonction de nettoyage
    cleanup() {
        echo ""
        echo -e "${YELLOW}Arrêt des serveurs...${NC}"
        if [ ! -z "$BACKEND_PID" ]; then
            kill $BACKEND_PID 2>/dev/null || true
        fi
        exit 0
    }
    
    trap cleanup SIGINT SIGTERM
    
    # Démarrer le frontend
    echo -e "${YELLOW}⚛️  Démarrage du frontend (mode dev)...${NC}"
    echo ""
    echo -e "${CYAN}📍 Frontend: http://localhost:8080${NC}"
    echo -e "${CYAN}📍 Backend:  http://localhost:3001${NC}"
    echo ""
    echo -e "${YELLOW}Appuyez sur Ctrl+C pour arrêter les serveurs${NC}"
    echo ""
    
    npm run dev
else
    echo -e "${GREEN}🚀 Mode production${NC}"
    echo ""
    
    # Vérifier que le build existe
    if [ ! -d "dist" ]; then
        print_error "Le dossier dist n'existe pas. Veuillez d'abord build le projet avec --build"
        exit 1
    fi
    
    if [ ! -f "backend/dist/index.js" ]; then
        print_error "Le backend n'est pas build. Veuillez d'abord build le projet avec --build"
        exit 1
    fi
    
    # Démarrer le backend en arrière-plan
    print_info "Démarrage du backend..."
    cd backend
    npm start > ../backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    print_success "Backend démarré (port 3001, PID: $BACKEND_PID)"
    
    # Attendre un peu pour que le backend démarre
    sleep 2
    
    # Fonction de nettoyage
    cleanup() {
        echo ""
        echo -e "${YELLOW}Arrêt des serveurs...${NC}"
        if [ ! -z "$BACKEND_PID" ]; then
            kill $BACKEND_PID 2>/dev/null || true
        fi
        exit 0
    }
    
    trap cleanup SIGINT SIGTERM
    
    # Démarrer le frontend
    print_info "Démarrage du frontend..."
    echo ""
    echo -e "${CYAN}📍 Frontend: http://localhost:4173${NC}"
    echo -e "${CYAN}📍 Backend:  http://localhost:3001${NC}"
    echo ""
    echo -e "${YELLOW}Appuyez sur Ctrl+C pour arrêter les serveurs${NC}"
    echo ""
    
    npm run preview
fi

