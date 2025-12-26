import express from 'express';
import { z } from 'zod';
import pool from '../config/database.js';
import { authenticate, requireCompanyRole, AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

const createClientSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Le nom est requis'),
    email: z.string().email().optional().nullable(),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    postal_code: z.string().optional().nullable(),
    country: z.string().default('Guinée'),
    siret: z.string().optional().nullable(),
  }),
});

const updateClientSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional().nullable(),
    phone: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    postal_code: z.string().optional().nullable(),
    country: z.string().optional(),
    siret: z.string().optional().nullable(),
  }),
});

// Lister les clients
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.is_platform_owner 
      ? req.query.company_id as string
      : req.user?.companyId;

    if (!companyId) {
      return res.status(400).json({ error: 'ID entreprise requis' });
    }

    const result = await pool.query(
      `SELECT * FROM clients 
       WHERE company_id = $1 
       ORDER BY created_at DESC`,
      [companyId]
    );

    res.json(result.rows);
  } catch (error: any) {
    next(error);
  }
});

// Obtenir un client
router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT c.* FROM clients c
       WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    const client = result.rows[0];

    // Vérifier l'accès
    if (!req.user?.is_platform_owner && req.user?.companyId !== client.company_id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    res.json(client);
  } catch (error: any) {
    next(error);
  }
});

// Créer un client
router.post('/', authenticate, requireCompanyRole(['company_admin', 'company_manager']), validate(createClientSchema), async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.is_platform_owner 
      ? req.body.company_id || req.query.company_id as string
      : req.user?.companyId;

    if (!companyId) {
      return res.status(400).json({ error: 'ID entreprise requis' });
    }

    const clientData = req.body;

    const result = await pool.query(
      `INSERT INTO clients (company_id, name, email, phone, address, city, postal_code, country, siret, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        companyId,
        clientData.name,
        clientData.email,
        clientData.phone,
        clientData.address,
        clientData.city,
        clientData.postal_code,
        clientData.country,
        clientData.siret,
        req.userId,
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    next(error);
  }
});

// Mettre à jour un client
router.put('/:id', authenticate, requireCompanyRole(['company_admin', 'company_manager']), validate(updateClientSchema), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Vérifier que le client appartient à l'entreprise de l'utilisateur
    const clientCheck = await pool.query(
      'SELECT company_id FROM clients WHERE id = $1',
      [id]
    );

    if (clientCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    if (!req.user?.is_platform_owner && req.user?.companyId !== clientCheck.rows[0].company_id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

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
      `UPDATE clients 
       SET ${fields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    res.json(result.rows[0]);
  } catch (error: any) {
    next(error);
  }
});

// Supprimer un client
router.delete('/:id', authenticate, requireCompanyRole(['company_admin', 'company_manager']), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    // Vérifier que le client appartient à l'entreprise de l'utilisateur
    const clientCheck = await pool.query(
      'SELECT company_id FROM clients WHERE id = $1',
      [id]
    );

    if (clientCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Client non trouvé' });
    }

    if (!req.user?.is_platform_owner && req.user?.companyId !== clientCheck.rows[0].company_id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    await pool.query('DELETE FROM clients WHERE id = $1', [id]);

    res.json({ message: 'Client supprimé' });
  } catch (error: any) {
    next(error);
  }
});

export default router;

