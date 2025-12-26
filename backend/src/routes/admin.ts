import express from 'express';
import pool from '../config/database.js';
import { authenticate, requirePlatformOwner, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Statistiques admin (propriétaire uniquement)
router.get('/stats', authenticate, requirePlatformOwner, async (req: AuthRequest, res, next) => {
  try {
    // Statistiques des entreprises
    const companiesResult = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'suspended') as suspended,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected
       FROM companies`
    );

    // Total utilisateurs
    const usersResult = await pool.query('SELECT COUNT(*) as total FROM profiles');

    res.json({
      totalCompanies: parseInt(companiesResult.rows[0].total),
      pendingCompanies: parseInt(companiesResult.rows[0].pending),
      approvedCompanies: parseInt(companiesResult.rows[0].approved),
      suspendedCompanies: parseInt(companiesResult.rows[0].suspended),
      rejectedCompanies: parseInt(companiesResult.rows[0].rejected),
      totalUsers: parseInt(usersResult.rows[0].total),
    });
  } catch (error: any) {
    next(error);
  }
});

export default router;

