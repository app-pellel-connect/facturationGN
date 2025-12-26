#!/usr/bin/env node
/**
 * Script pour générer des secrets JWT sécurisés
 * Usage: node scripts/generate-secrets.js
 */

const crypto = require('crypto');

console.log('🔐 Génération de secrets JWT sécurisés\n');
console.log('='.repeat(60));
console.log('Copiez ces valeurs dans Vercel Dashboard > Environment Variables\n');

// Générer JWT_SECRET
const jwtSecret = crypto.randomBytes(64).toString('hex');
console.log('JWT_SECRET=' + jwtSecret);

// Générer JWT_REFRESH_SECRET
const jwtRefreshSecret = crypto.randomBytes(64).toString('hex');
console.log('\nJWT_REFRESH_SECRET=' + jwtRefreshSecret);

console.log('\n' + '='.repeat(60));
console.log('\n✅ Secrets générés avec succès!');
console.log('\n⚠️  IMPORTANT:');
console.log('   - Ne partagez JAMAIS ces secrets');
console.log('   - Utilisez des secrets différents pour chaque environnement');
console.log('   - Stockez-les uniquement dans Vercel Dashboard (pas dans Git)');
console.log('\n');

