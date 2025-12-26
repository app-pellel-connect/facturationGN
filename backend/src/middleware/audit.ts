import { Request, Response, NextFunction } from 'express';
import pool from '../config/database.js';
import { AuthRequest } from './auth.js';

export const auditLog = async (
  req: Request | AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const originalSend = res.send;

  res.send = function (body: any) {
    // Log après la réponse - uniquement pour les utilisateurs authentifiés
    const authReq = req as AuthRequest;
    if (authReq.user && req.method !== 'GET') {
      const action = `${req.method} ${req.path}`;
      const entityType = req.path.split('/')[1] || 'unknown';
      const entityId = req.params.id || (req.body && req.body.id) || null;

      pool.query(
        `INSERT INTO audit_logs (user_id, company_id, action, entity_type, entity_id, ip_address, user_agent, new_values)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [
          authReq.user.id,
          authReq.user.companyId || null,
          action,
          entityType,
          entityId,
          req.ip || req.socket.remoteAddress,
          req.get('user-agent'),
          req.method === 'POST' || req.method === 'PUT' ? JSON.stringify(req.body) : null,
        ]
      ).catch(console.error);
    }

    return originalSend.call(this, body);
  };

  next();
};

