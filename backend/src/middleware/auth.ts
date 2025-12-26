import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import pool from '../config/database.js';

export interface AuthRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    email: string;
    is_platform_owner: boolean;
    companyId?: string;
    companyRole?: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token d\'authentification manquant' });
    }

    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };
      
      // Récupérer les informations utilisateur depuis la base de données
      const userResult = await pool.query(
        `SELECT 
          p.id, 
          p.email, 
          p.is_platform_owner,
          cm.company_id,
          cm.role as company_role
        FROM profiles p
        LEFT JOIN company_members cm ON cm.user_id = p.id AND cm.is_active = true
        WHERE p.id = $1`,
        [decoded.userId]
      );

      if (userResult.rows.length === 0) {
        return res.status(401).json({ error: 'Utilisateur non trouvé' });
      }

      const user = userResult.rows[0];
      req.userId = user.id;
      req.user = {
        id: user.id,
        email: user.email,
        is_platform_owner: user.is_platform_owner || false,
        companyId: user.company_id || undefined,
        companyRole: user.company_role || undefined,
      };

      next();
    } catch (error) {
      return res.status(401).json({ error: 'Token invalide ou expiré' });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Erreur d\'authentification' });
  }
};

export const requirePlatformOwner = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user?.is_platform_owner) {
    return res.status(403).json({ error: 'Accès réservé au propriétaire de la plateforme' });
  }
  next();
};

export const requireCompanyRole = (roles: string[]) => {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' });
    }

    // Le propriétaire de la plateforme a tous les droits
    if (req.user.is_platform_owner) {
      return next();
    }

    if (!req.user.companyId) {
      return res.status(403).json({ error: 'Aucune entreprise associée' });
    }

    if (!req.user.companyRole || !roles.includes(req.user.companyRole)) {
      return res.status(403).json({ error: 'Permissions insuffisantes' });
    }

    next();
  };
};

export const requireCompanyAccess = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Non authentifié' });
  }

  // Le propriétaire de la plateforme a accès à tout
  if (req.user.is_platform_owner) {
    return next();
  }

  const companyId = req.params.companyId || req.body.company_id || req.query.company_id;

  if (!companyId) {
    return res.status(400).json({ error: 'ID entreprise manquant' });
  }

  if (req.user.companyId !== companyId) {
    return res.status(403).json({ error: 'Accès non autorisé à cette entreprise' });
  }

  next();
};

