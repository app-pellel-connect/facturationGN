import express from 'express';
import { z } from 'zod';
import pool from '../config/database.js';
import { hashPassword } from '../utils/password.js';
import { authenticate, requireCompanyRole, AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

const createMemberSchema = z.object({
  body: z.object({
    email: z.string().email('Email invalide'),
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    full_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    role: z.enum(['company_admin', 'company_manager', 'company_user']).default('company_user'),
    company_id: z.string().uuid().optional(),
  }),
});

const updateMemberSchema = z.object({
  body: z.object({
    role: z.enum(['company_admin', 'company_manager', 'company_user']).optional(),
    is_active: z.boolean().optional(),
  }),
});

// Lister les membres de l'entreprise
router.get('/', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.is_platform_owner 
      ? req.query.company_id as string
      : req.user?.companyId;

    if (!companyId) {
      return res.status(400).json({ error: 'ID entreprise requis' });
    }

    const result = await pool.query(
      `SELECT 
        cm.id,
        cm.role,
        cm.is_active,
        cm.joined_at,
        p.id as user_id,
        p.email,
        p.full_name,
        p.phone,
        p.avatar_url
       FROM company_members cm
       JOIN profiles p ON p.id = cm.user_id
       WHERE cm.company_id = $1
       ORDER BY cm.created_at DESC`,
      [companyId]
    );

    res.json(result.rows);
  } catch (error: any) {
    next(error);
  }
});

// Créer un membre (inviter)
router.post('/', authenticate, requireCompanyRole(['company_admin']), validate(createMemberSchema), async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.is_platform_owner 
      ? req.body.company_id || req.query.company_id as string
      : req.user?.companyId;

    if (!companyId) {
      return res.status(400).json({ error: 'ID entreprise requis' });
    }

    const { email, password, full_name, role } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await pool.query(
      'SELECT id FROM profiles WHERE email = $1',
      [email]
    );

    let userId: string;

    if (existingUser.rows.length > 0) {
      userId = existingUser.rows[0].id;
    } else {
      // Créer un nouvel utilisateur
      userId = crypto.randomUUID();
      const hashedPassword = await hashPassword(password);

      await pool.query('BEGIN');

      try {
        await pool.query(
          `INSERT INTO profiles (id, email, full_name)
           VALUES ($1, $2, $3)`,
          [userId, email, full_name]
        );

        await pool.query(
          `INSERT INTO users (id, email, password_hash)
           VALUES ($1, $2, $3)`,
          [userId, email, hashedPassword]
        );

        await pool.query('COMMIT');
      } catch (error) {
        await pool.query('ROLLBACK');
        throw error;
      }
    }

    // Vérifier si l'utilisateur est déjà membre
    const existingMember = await pool.query(
      'SELECT id FROM company_members WHERE company_id = $1 AND user_id = $2',
      [companyId, userId]
    );

    if (existingMember.rows.length > 0) {
      return res.status(400).json({ error: 'Cet utilisateur est déjà membre de l\'entreprise' });
    }

    // Ajouter le membre
    const result = await pool.query(
      `INSERT INTO company_members (company_id, user_id, role, invited_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [companyId, userId, role, req.userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    next(error);
  }
});

// Mettre à jour un membre
router.put('/:id', authenticate, requireCompanyRole(['company_admin']), validate(updateMemberSchema), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Vérifier que le membre appartient à l'entreprise
    const memberCheck = await pool.query(
      'SELECT company_id FROM company_members WHERE id = $1',
      [id]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Membre non trouvé' });
    }

    if (!req.user?.is_platform_owner && req.user?.companyId !== memberCheck.rows[0].company_id) {
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
      `UPDATE company_members 
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

// Supprimer un membre
router.delete('/:id', authenticate, requireCompanyRole(['company_admin']), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    // Vérifier que le membre appartient à l'entreprise
    const memberCheck = await pool.query(
      'SELECT company_id FROM company_members WHERE id = $1',
      [id]
    );

    if (memberCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Membre non trouvé' });
    }

    if (!req.user?.is_platform_owner && req.user?.companyId !== memberCheck.rows[0].company_id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    await pool.query('DELETE FROM company_members WHERE id = $1', [id]);

    res.json({ message: 'Membre supprimé' });
  } catch (error: any) {
    next(error);
  }
});

export default router;

