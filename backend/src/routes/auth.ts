import express from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import pool from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { generateToken, generateRefreshToken } from '../utils/jwt.js';
import { validate } from '../middleware/validation.js';
import { authenticate, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

const signUpSchema = z.object({
  body: z.object({
    email: z.string().email('Email invalide'),
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    full_name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  }),
});

const signInSchema = z.object({
  body: z.object({
    email: z.string().email('Email invalide'),
    password: z.string().min(1, 'Mot de passe requis'),
  }),
});

// Inscription
router.post('/signup', validate(signUpSchema), async (req, res, next) => {
  try {
    const { email, password, full_name } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await pool.query(
      'SELECT id FROM profiles WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Cet email est déjà utilisé' });
    }

    // Vérifier si c'est le premier utilisateur (devient propriétaire)
    const userCount = await pool.query('SELECT COUNT(*) as count FROM profiles');
    const isFirstUser = parseInt(userCount.rows[0].count) === 0;

    // Hasher le mot de passe
    const hashedPassword = await hashPassword(password);

    // Créer l'utilisateur (on stocke le hash dans une table users séparée)
    // Pour simplifier, on va créer une table users pour les credentials
    const userId = randomUUID();
    
    await pool.query('BEGIN');

    try {
      // Créer le profil
      await pool.query(
        `INSERT INTO profiles (id, email, full_name, is_platform_owner)
         VALUES ($1, $2, $3, $4)`,
        [userId, email, full_name, isFirstUser]
      );

      // Créer les credentials (table users pour les mots de passe)
      await pool.query(
        `INSERT INTO users (id, email, password_hash)
         VALUES ($1, $2, $3)`,
        [userId, email, hashedPassword]
      );

      await pool.query('COMMIT');

      // Générer les tokens
      const token = generateToken(userId);
      const refreshToken = generateRefreshToken(userId);

      res.status(201).json({
        message: 'Inscription réussie',
        token,
        refreshToken,
        user: {
          id: userId,
          email,
          full_name,
          is_platform_owner: isFirstUser,
        },
      });
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error: any) {
    next(error);
  }
});

// Connexion
router.post('/signin', validate(signInSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;

    console.log(`[AUTH] Tentative de connexion pour: ${email}`);

    // Récupérer l'utilisateur avec son mot de passe
    const userResult = await pool.query(
      `SELECT u.id, u.password_hash, p.email, p.full_name, p.is_platform_owner
       FROM users u
       JOIN profiles p ON p.id = u.id
       WHERE u.email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      console.log(`[AUTH] Utilisateur non trouvé: ${email}`);
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    const user = userResult.rows[0];

    // Vérifier le mot de passe
    const isValidPassword = await comparePassword(password, user.password_hash);

    if (!isValidPassword) {
      console.log(`[AUTH] Mot de passe incorrect pour: ${email}`);
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Générer les tokens
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);

    console.log(`[AUTH] Connexion réussie pour: ${email}`);

    res.json({
      message: 'Connexion réussie',
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        is_platform_owner: user.is_platform_owner,
      },
    });
  } catch (error: any) {
    console.error('[AUTH] Erreur lors de la connexion:', error);
    next(error);
  }
});

// Rafraîchir le token
router.post('/refresh', async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token manquant' });
    }

    const { verifyRefreshToken } = await import('../utils/jwt.js');
    const decoded = verifyRefreshToken(refreshToken);

    // Générer un nouveau token
    const newToken = generateToken(decoded.userId);

    res.json({
      token: newToken,
    });
  } catch (error: any) {
    return res.status(401).json({ error: 'Refresh token invalide' });
  }
});

// Obtenir le profil actuel
router.get('/me', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const userId = req.userId!;

    const profileResult = await pool.query(
      `SELECT 
        p.id, 
        p.email, 
        p.full_name, 
        p.phone, 
        p.avatar_url, 
        p.is_platform_owner,
        cm.company_id,
        cm.role as company_role,
        c.name as company_name,
        c.status as company_status
      FROM profiles p
      LEFT JOIN company_members cm ON cm.user_id = p.id AND cm.is_active = true
      LEFT JOIN companies c ON c.id = cm.company_id
      WHERE p.id = $1`,
      [userId]
    );

    if (profileResult.rows.length === 0) {
      return res.status(404).json({ error: 'Profil non trouvé' });
    }

    const profile = profileResult.rows[0];

    res.json({
      user: {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        phone: profile.phone,
        avatar_url: profile.avatar_url,
        is_platform_owner: profile.is_platform_owner,
      },
      company: profile.company_id
        ? {
            id: profile.company_id,
            name: profile.company_name,
            status: profile.company_status,
            role: profile.company_role,
          }
        : null,
    });
  } catch (error: any) {
    next(error);
  }
});

export default router;

