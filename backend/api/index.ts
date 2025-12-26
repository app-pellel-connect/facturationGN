import type { VercelRequest, VercelResponse } from '@vercel/node';
import app from '../src/index.js';

/**
 * Handler Vercel Serverless pour l'API Express
 * Ce fichier adapte l'application Express pour fonctionner avec Vercel Functions
 */
export default function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Vercel gère automatiquement la conversion de la requête/réponse Express
  return app(req as any, res as any);
}

