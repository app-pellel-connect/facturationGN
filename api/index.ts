/**
 * Point d'entrée Vercel Serverless pour l'API
 * 
 * Vercel détecte automatiquement ce fichier dans le dossier api/ à la racine
 * et le traite comme une fonction serverless.
 * 
 * IMPORTANT: Vercel compile automatiquement le TypeScript dans les fonctions serverless.
 * On importe depuis le source TypeScript, pas depuis le compilé.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
// Import depuis le source TypeScript - Vercel compile automatiquement
// Utiliser .js dans l'import car c'est un module ES (TypeScript le résout vers .ts)
import app from '../backend/src/index.js';

export default function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  return app(req as any, res as any);
}

