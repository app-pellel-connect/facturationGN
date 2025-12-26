import express from 'express';
import pool from '../config/database.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Statistiques du tableau de bord
router.get('/stats', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.is_platform_owner 
      ? req.query.company_id as string
      : req.user?.companyId;

    if (!companyId) {
      return res.status(400).json({ error: 'ID entreprise requis' });
    }

    // Statistiques générales
    const statsResult = await pool.query(
      `SELECT 
        (SELECT COUNT(*) FROM clients WHERE company_id = $1) as total_clients,
        (SELECT COUNT(*) FROM invoices WHERE company_id = $1) as total_invoices,
        (SELECT COUNT(*) FROM invoices WHERE company_id = $1 AND status = 'paid') as paid_invoices,
        (SELECT COUNT(*) FROM invoices WHERE company_id = $1 AND status = 'sent') as sent_invoices,
        (SELECT COUNT(*) FROM invoices WHERE company_id = $1 AND status = 'draft') as draft_invoices,
        (SELECT COALESCE(SUM(total), 0) FROM invoices WHERE company_id = $1) as total_revenue,
        (SELECT COALESCE(SUM(paid_amount), 0) FROM invoices WHERE company_id = $1) as total_paid,
        (SELECT COALESCE(SUM(balance), 0) FROM invoices WHERE company_id = $1) as total_outstanding`,
      [companyId]
    );

    // Factures en retard
    const overdueResult = await pool.query(
      `SELECT COUNT(*) as count, COALESCE(SUM(balance), 0) as amount
       FROM invoices
       WHERE company_id = $1
         AND status != 'paid'
         AND status != 'cancelled'
         AND due_date < CURRENT_DATE`,
      [companyId]
    );

    // Revenus par mois (6 derniers mois)
    const revenueResult = await pool.query(
      `SELECT 
        DATE_TRUNC('month', created_at) as month,
        COALESCE(SUM(total), 0) as revenue
       FROM invoices
       WHERE company_id = $1
         AND created_at >= NOW() - INTERVAL '6 months'
       GROUP BY DATE_TRUNC('month', created_at)
       ORDER BY month DESC`,
      [companyId]
    );

    res.json({
      ...statsResult.rows[0],
      overdue: {
        count: parseInt(overdueResult.rows[0].count),
        amount: parseFloat(overdueResult.rows[0].amount),
      },
      revenueByMonth: revenueResult.rows,
    });
  } catch (error: any) {
    next(error);
  }
});

export default router;

