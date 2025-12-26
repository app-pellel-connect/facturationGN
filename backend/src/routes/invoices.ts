import express from 'express';
import { z } from 'zod';
import pool from '../config/database.js';
import { authenticate, requireCompanyRole, AuthRequest } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = express.Router();

const invoiceItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().min(0).default(1),
  unit_price: z.number().min(0),
  total: z.number().min(0),
});

const createInvoiceSchema = z.object({
  body: z.object({
    client_id: z.string().uuid().nullable().optional(),
    invoice_number: z.string().min(1),
    status: z.enum(['draft', 'sent', 'partial', 'paid', 'cancelled']).default('draft'),
    issue_date: z.string().optional(),
    due_date: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    tax_rate: z.number().default(18),
    items: z.array(invoiceItemSchema).min(1),
  }),
});

const updateInvoiceSchema = z.object({
  body: z.object({
    client_id: z.string().uuid().nullable().optional(),
    status: z.enum(['draft', 'sent', 'partial', 'paid', 'cancelled']).optional(),
    issue_date: z.string().optional(),
    due_date: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    tax_rate: z.number().optional(),
    items: z.array(invoiceItemSchema).optional(),
  }),
});

// Lister les factures
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
        i.*,
        c.name as client_name,
        json_agg(
          json_build_object(
            'id', ii.id,
            'description', ii.description,
            'quantity', ii.quantity,
            'unit_price', ii.unit_price,
            'total', ii.total
          )
        ) FILTER (WHERE ii.id IS NOT NULL) as items
       FROM invoices i
       LEFT JOIN clients c ON c.id = i.client_id
       LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
       WHERE i.company_id = $1
       GROUP BY i.id, c.name
       ORDER BY i.created_at DESC`,
      [companyId]
    );

    res.json(result.rows);
  } catch (error: any) {
    next(error);
  }
});

// Obtenir une facture
router.get('/:id', authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        i.*,
        c.name as client_name,
        c.email as client_email,
        c.phone as client_phone,
        json_agg(
          json_build_object(
            'id', ii.id,
            'description', ii.description,
            'quantity', ii.quantity,
            'unit_price', ii.unit_price,
            'total', ii.total
          )
        ) FILTER (WHERE ii.id IS NOT NULL) as items
       FROM invoices i
       LEFT JOIN clients c ON c.id = i.client_id
       LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
       WHERE i.id = $1
       GROUP BY i.id, c.name, c.email, c.phone`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }

    const invoice = result.rows[0];

    // Vérifier l'accès
    if (!req.user?.is_platform_owner && req.user?.companyId !== invoice.company_id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    res.json(invoice);
  } catch (error: any) {
    next(error);
  }
});

// Créer une facture
router.post('/', authenticate, requireCompanyRole(['company_admin', 'company_manager']), validate(createInvoiceSchema), async (req: AuthRequest, res, next) => {
  try {
    const companyId = req.user?.is_platform_owner 
      ? req.body.company_id || req.query.company_id as string
      : req.user?.companyId;

    if (!companyId) {
      return res.status(400).json({ error: 'ID entreprise requis' });
    }

    const { items, ...invoiceData } = req.body;

    // Calculer les totaux
    const subtotal = items.reduce((sum: number, item: any) => sum + item.total, 0);
    const taxRate = invoiceData.tax_rate || 18;
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;

    await pool.query('BEGIN');

    try {
      // Créer la facture
      const invoiceResult = await pool.query(
        `INSERT INTO invoices (
          company_id, client_id, invoice_number, status, issue_date, due_date,
          subtotal, tax_rate, tax_amount, total, notes, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          companyId,
          invoiceData.client_id,
          invoiceData.invoice_number,
          invoiceData.status || 'draft',
          invoiceData.issue_date || new Date().toISOString().split('T')[0],
          invoiceData.due_date,
          subtotal,
          taxRate,
          taxAmount,
          total,
          invoiceData.notes,
          req.userId,
        ]
      );

      const invoice = invoiceResult.rows[0];

      // Créer les items
      if (items.length > 0) {
        const itemValues = items.map((item: any, index: number) => {
          const baseIndex = index * 4;
          return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4})`;
        }).join(', ');

        const itemParams: any[] = [];
        items.forEach((item: any) => {
          itemParams.push(invoice.id, item.description, item.quantity, item.unit_price, item.total);
        });

        await pool.query(
          `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total)
           VALUES ${itemValues}`,
          itemParams
        );
      }

      await pool.query('COMMIT');

      // Récupérer la facture complète
      const fullInvoiceResult = await pool.query(
        `SELECT 
          i.*,
          c.name as client_name,
          json_agg(
            json_build_object(
              'id', ii.id,
              'description', ii.description,
              'quantity', ii.quantity,
              'unit_price', ii.unit_price,
              'total', ii.total
            )
          ) FILTER (WHERE ii.id IS NOT NULL) as items
         FROM invoices i
         LEFT JOIN clients c ON c.id = i.client_id
         LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
         WHERE i.id = $1
         GROUP BY i.id, c.name`,
        [invoice.id]
      );

      res.status(201).json(fullInvoiceResult.rows[0]);
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error: any) {
    next(error);
  }
});

// Mettre à jour une facture
router.put('/:id', authenticate, requireCompanyRole(['company_admin', 'company_manager']), validate(updateInvoiceSchema), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;
    const { items, ...updateData } = req.body;

    // Vérifier que la facture appartient à l'entreprise de l'utilisateur
    const invoiceCheck = await pool.query(
      'SELECT company_id FROM invoices WHERE id = $1',
      [id]
    );

    if (invoiceCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }

    if (!req.user?.is_platform_owner && req.user?.companyId !== invoiceCheck.rows[0].company_id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    await pool.query('BEGIN');

    try {
      // Mettre à jour les items si fournis
      if (items) {
        // Supprimer les anciens items
        await pool.query('DELETE FROM invoice_items WHERE invoice_id = $1', [id]);

        // Ajouter les nouveaux items
        if (items.length > 0) {
          const itemValues = items.map((item: any, index: number) => {
            const baseIndex = index * 4;
            return `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5})`;
          }).join(', ');

          const itemParams: any[] = [];
          items.forEach((item: any) => {
            itemParams.push(id, item.description, item.quantity, item.unit_price, item.total);
          });

          await pool.query(
            `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total)
             VALUES ${itemValues}`,
            itemParams
          );
        }

        // Recalculer les totaux
        const subtotalResult = await pool.query(
          'SELECT COALESCE(SUM(total), 0) as subtotal FROM invoice_items WHERE invoice_id = $1',
          [id]
        );
        const subtotal = parseFloat(subtotalResult.rows[0].subtotal);

        const invoiceResult = await pool.query(
          'SELECT tax_rate FROM invoices WHERE id = $1',
          [id]
        );
        const taxRate = updateData.tax_rate || invoiceResult.rows[0].tax_rate || 18;
        const taxAmount = subtotal * (taxRate / 100);
        const total = subtotal + taxAmount;

        updateData.subtotal = subtotal;
        updateData.tax_rate = taxRate;
        updateData.tax_amount = taxAmount;
        updateData.total = total;
      }

      // Mettre à jour la facture
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

      if (fields.length > 0) {
        values.push(id);
        await pool.query(
          `UPDATE invoices 
           SET ${fields.join(', ')}
           WHERE id = $${paramIndex}`,
          values
        );
      }

      await pool.query('COMMIT');

      // Récupérer la facture mise à jour
      const fullInvoiceResult = await pool.query(
        `SELECT 
          i.*,
          c.name as client_name,
          json_agg(
            json_build_object(
              'id', ii.id,
              'description', ii.description,
              'quantity', ii.quantity,
              'unit_price', ii.unit_price,
              'total', ii.total
            )
          ) FILTER (WHERE ii.id IS NOT NULL) as items
         FROM invoices i
         LEFT JOIN clients c ON c.id = i.client_id
         LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
         WHERE i.id = $1
         GROUP BY i.id, c.name`,
        [id]
      );

      res.json(fullInvoiceResult.rows[0]);
    } catch (error) {
      await pool.query('ROLLBACK');
      throw error;
    }
  } catch (error: any) {
    next(error);
  }
});

// Supprimer une facture
router.delete('/:id', authenticate, requireCompanyRole(['company_admin', 'company_manager']), async (req: AuthRequest, res, next) => {
  try {
    const { id } = req.params;

    // Vérifier que la facture appartient à l'entreprise de l'utilisateur
    const invoiceCheck = await pool.query(
      'SELECT company_id FROM invoices WHERE id = $1',
      [id]
    );

    if (invoiceCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Facture non trouvée' });
    }

    if (!req.user?.is_platform_owner && req.user?.companyId !== invoiceCheck.rows[0].company_id) {
      return res.status(403).json({ error: 'Accès non autorisé' });
    }

    await pool.query('DELETE FROM invoices WHERE id = $1', [id]);

    res.json({ message: 'Facture supprimée' });
  } catch (error: any) {
    next(error);
  }
});

export default router;

