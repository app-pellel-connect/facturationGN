import express from 'express';
import pool from '../config/database.js';
import { authenticate, requirePlatformOwner, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Lister les logs d'audit (propriétaire uniquement)
router.get('/', authenticate, requirePlatformOwner, async (req: AuthRequest, res, next) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const companyId = req.query.company_id as string | undefined;

    let query = `
      SELECT 
        al.*,
        p.full_name,
        p.email,
        c.name as company_name
      FROM audit_logs al
      LEFT JOIN profiles p ON p.id = al.user_id
      LEFT JOIN companies c ON c.id = al.company_id
    `;

    const params: any[] = [];
    if (companyId) {
      query += ' WHERE al.company_id = $1';
      params.push(companyId);
    }

    query += ' ORDER BY al.created_at DESC LIMIT $' + (params.length + 1);
    params.push(limit);

    const result = await pool.query(query, params);

    res.json(result.rows);
  } catch (error: any) {
    next(error);
  }
});

export default router;

