import express from 'express';
import { z } from 'zod';
import pool from '../config/database.js';
import { authenticate, requireCompanyRole, AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

const createPaymentSchema = z.object({
  body: z.object({
    invoice_id: z.string().uuid(),
    amount: z.number().min(0.01, 'Le montant doit être supérieur à 0'),
    payment_method: z.string().default('cash'),
    payment_type: z.enum(['full', 'partial']).default('partial'),
    reference: z.string().optional().nullable(),
    notes: z.string().optional().nullable(),
    paid_at: z.string().optional(),
  }),
});

// Lister les paiements d'une facture
router.get('/invoice/:invoiceId', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { invoiceId } = req.params;

    // Vérifier l'accès à la facture
    const invoiceCheck = await pool.query(
      `SELECT company_id FROM invoices WHERE id = $1`,
      [invoiceId]
    );

    if (invoiceCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }

    if (!req.user?.is_platform_owner && req.user?.companyId !== invoiceCheck.rows[0].company_id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const result = await pool.query(
      `SELECT p.*, pr.full_name as recorded_by_name
       FROM payments p
       LEFT JOIN profiles pr ON pr.id = p.recorded_by
       WHERE p.invoice_id = $1
       ORDER BY p.paid_at DESC`,
      [invoiceId]
    );

    res.json(result.rows);
  } catch (error: any) {
    next(error);
  }
});

// Créer un paiement
router.post('/', authenticate, requireCompanyRole(['company_admin', 'company_manager']), validate(createPaymentSchema), async (req: AuthRequest, res, next) => {
  try {
    const { invoice_id, amount, payment_method, payment_type, reference, notes, paid_at } = req.body;

    // Vérifier l'accès à la facture
    const invoiceCheck = await pool.query(
      `SELECT company_id, total, paid_amount FROM invoices WHERE id = $1`,
      [invoice_id]
    );

    if (invoiceCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }

    const invoice = invoiceCheck.rows[0];

    if (!req.user?.is_platform_owner && req.user?.companyId !== invoice.company_id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    // Vérifier que le montant ne dépasse pas le solde
    const currentPaid = parseFloat(invoice.paid_amount || 0);
    const remaining = parseFloat(invoice.total) - currentPaid;

    if (amount > remaining) {
      return res.status(400).json({ 
        error: `Le montant dépasse le solde restant (${remaining.toFixed(2)})` 
      });
    }

    const result = await pool.query(
      `INSERT INTO payments (invoice_id, amount, payment_method, payment_type, reference, notes, paid_at, recorded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        invoice_id,
        amount,
        payment_method,
        payment_type,
        reference,
        notes,
        paid_at || new Date().toISOString(),
        req.userId,
      ]
    );

    // Le trigger mettra à jour automatiquement paid_amount et status de la facture
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    next(error);
  }
});

// Supprimer un paiement
router.delete('/:id', authenticate, requireCompanyRole(['company_admin', 'company_manager']), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    // Vérifier l'accès au paiement via la facture
    const paymentCheck = await pool.query(
      `SELECT p.invoice_id, i.company_id 
       FROM payments p
       JOIN invoices i ON i.id = p.invoice_id
       WHERE p.id = $1`,
      [id]
    );

    if (paymentCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Paiement non trouvé' });
    }

    if (!req.user?.is_platform_owner && req.user?.companyId !== paymentCheck.rows[0].company_id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    await pool.query('DELETE FROM payments WHERE id = $1', [id]);

    res.json({ message: 'Paiement supprimé' });
  } catch (error: any) {
    next(error);
  }
});

export default router;

