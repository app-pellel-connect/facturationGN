import express from 'express';
import { z } from 'zod';
import pool from '../config/database.js';
import { authenticate, requirePlatformOwner, AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

const updateSubscriptionSchema = z.object({
  body: z.object({
    plan_name: z.string().optional(),
    status: z.enum(['trial', 'active', 'expired', 'cancelled']).optional(),
    max_users: z.number().optional(),
    max_invoices_per_month: z.number().optional(),
    max_clients: z.number().optional(),
    expires_at: z.string().optional(),
  }),
});

// Lister toutes les subscriptions (propriétaire uniquement)
router.get('/', authenticate, requirePlatformOwner, async (req: AuthRequest, res, next) => {
  try {
    const result = await pool.query(
      `SELECT s.*, c.name as company_name
       FROM subscriptions s
       LEFT JOIN companies c ON c.id = s.company_id
       ORDER BY s.created_at DESC`
    );

    res.json(result.rows);
  } catch (error: any) {
    next(error);
  }
});

// Obtenir une subscription
router.get('/:id', authenticate, requirePlatformOwner, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT s.*, c.name as company_name
       FROM subscriptions s
       LEFT JOIN companies c ON c.id = s.company_id
       WHERE s.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Abonnement non trouvé' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    next(error);
  }
});

// Mettre à jour une subscription
router.put('/:id', authenticate, requirePlatformOwner, validate(updateSubscriptionSchema), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.keys(updateData).forEach((key) => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = $${paramIndex}`);
        values.push(updateData[key]);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Aucune donnée à mettre à jour' });
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE subscriptions 
       SET ${fields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Abonnement non trouvé' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    next(error);
  }
});

export default router;

