#!/usr/bin/env node
/**
 * Script de démarrage pour FactureGN
 * Usage: npm start [--dev] [--build] [--no-install]
 */

const { spawn } = require('child_process');
const fs = require('fs');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logStep(message) {
  log('═══════════════════════════════════════', colors.cyan);
  log(message, colors.cyan);
  log('═══════════════════════════════════════', colors.cyan);
  console.log('');
}

function logSuccess(message) {
  log(`✅ ${message}`, colors.green);
  console.log('');
}

function logInfo(message) {
  log(`📦 ${message}`, colors.yellow);
}

function logError(message) {
  log(`❌ ${message}`, colors.red);
}

function execCommand(command, description, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    logInfo(`${description}...`);
    const [cmd, ...args] = command.split(' ');
    const child = spawn(cmd, args, {
      cwd,
      stdio: 'inherit',
      shell: true,
    });
    
    child.on('error', (error) => {
      logError(`${description} échoué: ${error.message}`);
      reject(error);
    });
    
    child.on('close', (code) => {
      if (code !== 0) {
        logError(`${description} échoué avec le code ${code}`);
        reject(new Error(`Command failed with code ${code}`));
        return;
      }
      logSuccess(`${description} terminé`);
      resolve();
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const isDev = args.includes('--dev') || !args.includes('--prod');
  const shouldBuild = args.includes('--build');
  const noInstall = args.includes('--no-install');

  log('🚀 Démarrage de FactureGN', colors.cyan);
  console.log('');

  // Étape 1: Installation des dépendances
  if (!noInstall) {
    logStep('1️⃣  Installation des dépendances');

    // Frontend
    if (fs.existsSync('package.json')) {
      try {
        await execCommand('npm install', 'Installation des dépendances frontend');
      } catch (error) {
        logError('Erreur lors de l\'installation frontend');
        process.exit(1);
      }
    }

    // Backend
    if (fs.existsSync('backend/package.json')) {
      try {
        await execCommand('npm install', 'Installation des dépendances backend', 'backend');
      } catch (error) {
        logError('Erreur lors de l\'installation backend');
        process.exit(1);
      }
    }
  } else {
    log('⏭️  Installation des dépendances ignorée (--no-install)', colors.yellow);
    console.log('');
  }

  // Étape 2: Build (si demandé ou en mode production)
  if (shouldBuild || !isDev) {
    logStep('2️⃣  Build du projet');

    // Build Backend
    if (fs.existsSync('backend/package.json')) {
      try {
        await execCommand('npm run build', 'Build du backend', 'backend');
      } catch (error) {
        logError('Erreur lors du build backend');
        process.exit(1);
      }
    }

    // Build Frontend
    if (fs.existsSync('package.json')) {
      try {
        await execCommand('npm run build', 'Build du frontend');
      } catch (error) {
        logError('Erreur lors du build frontend');
        process.exit(1);
      }
    }
  }

  // Étape 3: Démarrage
  logStep('3️⃣  Démarrage des serveurs');

  const processes = [];

  // Fonction de nettoyage
  const cleanup = () => {
    log('\nArrêt des serveurs...', colors.yellow);
    processes.forEach(p => {
      try {
        if (process.platform === 'win32') {
          spawn('taskkill', ['/pid', p.pid, '/f', '/t'], { stdio: 'ignore' });
        } else {
          p.kill();
        }
      } catch (e) {
        // Ignore
      }
    });
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  if (isDev) {
    log('🔧 Mode développement', colors.green);
    console.log('');

    // Démarrer le backend
    if (fs.existsSync('backend/package.json')) {
      logInfo('Démarrage du backend (mode dev)...');
      const backend = spawn('npm', ['run', 'dev'], {
        cwd: 'backend',
        stdio: 'inherit',
        shell: true,
      });
      processes.push(backend);
      logSuccess('Backend démarré (port 3001)');
    }

    // Attendre un peu
    await new Promise(resolve => setTimeout(resolve, 2000));

    logInfo('Démarrage du frontend (mode dev)...');
    console.log('');
    log('📍 Frontend: http://localhost:8080', colors.cyan);
    log('📍 Backend:  http://localhost:3001', colors.cyan);
    console.log('');
    log('Appuyez sur Ctrl+C pour arrêter les serveurs', colors.yellow);
    console.log('');

    // Démarrer le frontend (bloquant)
    const frontend = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      shell: true,
    });
    processes.push(frontend);
    
    frontend.on('close', cleanup);
  } else {
    log('🚀 Mode production', colors.green);
    console.log('');

    // Démarrer le backend
    if (fs.existsSync('backend/dist/index.js')) {
      logInfo('Démarrage du backend...');
      const backend = spawn('npm', ['start'], {
        cwd: 'backend',
        stdio: 'inherit',
        shell: true,
      });
      processes.push(backend);
      logSuccess('Backend démarré (port 3001)');
    }

    // Attendre un peu
    await new Promise(resolve => setTimeout(resolve, 2000));

    logInfo('Démarrage du frontend...');
    
    // Démarrer le frontend (bloquant)
    const frontend = spawn('npm', ['run', 'preview'], {
      stdio: 'inherit',
      shell: true,
    });
    processes.push(frontend);
    
    frontend.on('close', cleanup);
  }
}

main().catch(error => {
  logError(`Erreur: ${error.message}`);
  process.exit(1);
});
