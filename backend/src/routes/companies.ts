import express from 'express';
import { z } from 'zod';
import pool from '../config/database.js';
import { authenticate, requirePlatformOwner, requireCompanyRole, AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

const createCompanySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Le nom est requis'),
    email: z.string().email('Email invalide'),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().default('Guinée'),
    siret: z.string().optional(),
    logo_url: z.string().optional(),
    currency: z.string().default('GNF'),
    tax_rate: z.number().default(18),
  }),
});

const updateCompanySchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    postal_code: z.string().optional(),
    country: z.string().optional(),
    siret: z.string().optional(),
    logo_url: z.string().optional(),
    currency: z.string().optional(),
    tax_rate: z.number().optional(),
    status: z.enum(['pending', 'approved', 'suspended', 'rejected']).optional(),
    rejection_reason: z.string().optional(),
  }),
});

// Créer une entreprise
router.post('/', authenticate, validate(createCompanySchema), async (req: AuthRequest, res, next) => {
  try {
    const companyData = req.body;
    const userId = req.userId!;

    const result = await pool.query(
      `INSERT INTO companies (name, email, phone, address, city, postal_code, country, siret, logo_url, currency, tax_rate)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        companyData.name,
        companyData.email,
        companyData.phone,
        companyData.address,
        companyData.city,
        companyData.postal_code,
        companyData.country,
        companyData.siret,
        companyData.logo_url,
        companyData.currency,
        companyData.tax_rate,
      ]
    );

    const company = result.rows[0];

    // Créer l'abonnement par défaut (trial)
    await pool.query(
      `INSERT INTO subscriptions (company_id, plan_name, status, max_users, max_invoices_per_month, max_clients)
       VALUES ($1, 'trial', 'trial', 3, 50, 20)`,
      [company.id]
    );

    // Ajouter le créateur comme admin de l'entreprise
    await pool.query(
      `INSERT INTO company_members (company_id, user_id, role, invited_by)
       VALUES ($1, $2, 'company_admin', $2)`,
      [company.id, userId]
    );

    res.status(201).json(company);
  } catch (error: any) {
    next(error);
  }
});

// Lister toutes les entreprises (propriétaire uniquement)
router.get('/', authenticate, requirePlatformOwner, async (req: AuthRequest, res, next) => {
  try {
    // Vérifier d'abord si la colonne company_id existe dans la table clients
    const columnCheck = await pool.query(
      `SELECT column_name 
       FROM information_schema.columns 
       WHERE table_schema = 'public' 
       AND table_name = 'clients' 
       AND column_name = 'company_id'`
    );

    let clientCountQuery = '0 as client_count';
    if (columnCheck.rows.length > 0) {
      // La colonne existe, on peut faire le JOIN normal
      clientCountQuery = 'COUNT(DISTINCT cl.id) as client_count';
    }

    const result = await pool.query(
      `SELECT c.*, 
              COUNT(DISTINCT cm.id) as member_count,
              ${clientCountQuery},
              COUNT(DISTINCT inv.id) as invoice_count
       FROM companies c
       LEFT JOIN company_members cm ON cm.company_id = c.id AND cm.is_active = true
       ${columnCheck.rows.length > 0 ? 'LEFT JOIN clients cl ON cl.company_id = c.id' : ''}
       LEFT JOIN invoices inv ON inv.company_id = c.id
       GROUP BY c.id
       ORDER BY c.created_at DESC`
    );

    res.json(result.rows);
  } catch (error: any) {
    // Si l'erreur concerne la colonne company_id de clients, la table n'est peut-être pas migrée
    if (error.code === '42703' && error.message?.includes('company_id')) {
      console.error('[COMPANIES] Erreur: La table clients n\'a peut-être pas été migrée correctement.');
      console.error('[COMPANIES] Vérifiez que les migrations ont été exécutées: npm run migrate');
      return res.status(500).json({ 
        error: 'Erreur de base de données', 
        message: 'La table clients nécessite une migration. Exécutez: npm run migrate' 
      });
    }
    next(error);
  }
});

// Obtenir une entreprise
router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    // Vérifier l'accès
    if (!req.user?.is_platform_owner && req.user?.companyId !== id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    const result = await pool.query(
      `SELECT c.*, 
              s.plan_name, s.status as subscription_status, s.expires_at,
              COUNT(DISTINCT cm.id) as member_count
       FROM companies c
       LEFT JOIN subscriptions s ON s.company_id = c.id
       LEFT JOIN company_members cm ON cm.company_id = c.id AND cm.is_active = true
       WHERE c.id = $1
       GROUP BY c.id, s.plan_name, s.status, s.expires_at`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    next(error);
  }
});

// Mettre à jour une entreprise
router.put('/:id', authenticate, validate(updateCompanySchema), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Vérifier les permissions
    if (!req.user?.is_platform_owner) {
      if (req.user?.companyId !== id) {
        return res.status(403).json({ error: 'Accès non autorisé' });
      }
      // Les admins d'entreprise ne peuvent pas changer le statut
      delete updateData.status;
      delete updateData.rejection_reason;
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

    if (updateData.status === 'approved' && !updateData.approved_at) {
      fields.push(`approved_at = NOW()`);
      fields.push(`approved_by = $${paramIndex}`);
      values.push(req.userId);
    }

    values.push(id);

    const result = await pool.query(
      `UPDATE companies 
       SET ${fields.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Entreprise non trouvée' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    next(error);
  }
});

// Supprimer une entreprise (propriétaire uniquement)
router.delete('/:id', authenticate, requirePlatformOwner, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    await pool.query('DELETE FROM companies WHERE id = $1', [id]);

    res.json({ message: 'Entreprise supprimée' });
  } catch (error: any) {
    next(error);
  }
});

export default router;

