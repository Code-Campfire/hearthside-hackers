import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../db.js';

const router = Router();

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId
    const { amount, transaction_date, description, merchant_name, transaction_type, category_id} = req.body

    if (!amount || !transaction_date || !transaction_type || !merchant_name) {
      res.status(400).json({
        success: false,
        message:
          'Missing required fields: amount, transaction_date, transaction_type, merchant_name',
      });
      return;
    }

    if (!['income', 'expense'].includes(transaction_type.toLowerCase())) {
      res.status(400).json({ success: false, message: 'transaction_type must be either "income" or "expense"'})
      return
    }
    const query = `
      INSERT INTO transactions (user_id, amount, transaction_date, description, merchant_name, transaction_type, category_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `
    const result = await pool.query(query, [
      userId,
      parseFloat(amount),
      transaction_date,
      description || null,
      merchant_name,
      transaction_type.toLowerCase(),
      category_id || null,
    ]);

    res.status(201).json({
      success: true,
      message: 'Transaction added successfully',
      data: result.rows[0],
    })
} catch (error) {
    console.error('Error adding transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add transaction',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { limit = 50, offset = 0 } = req.query;

    const query = `
      SELECT * FROM transactions
      WHERE user_id = $1
      ORDER BY transaction_date DESC, created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await pool.query(query, [
      userId,
      parseInt(limit as string),
      parseInt(offset as string),
    ]);

    const countQuery = 'SELECT COUNT(*) FROM transactions WHERE user_id = $1';
    const countResult = await pool.query(countQuery, [userId]);
    const total = parseInt(countResult.rows[0].count);

    res.status(200).json({
      success: true,
      data: result.rows,
      pagination: {
        total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const query = `
      SELECT * FROM transactions
      WHERE id = $1 AND user_id = $2
    `;

    const result = await pool.query(query, [id, userId]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const {amount, transaction_date, description, merchant_name, transaction_type, category_id} = req.body;

    const checkQuery = `
      SELECT * FROM transactions
      WHERE id = $1 AND user_id = $2
    `;
    const checkResult = await pool.query(checkQuery, [id, userId]);

    if (checkResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Transaction not found or does not belong to this user',
      });
      return;
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (amount !== undefined) {
      updates.push(`amount = $${paramCount}`);
      values.push(parseFloat(amount));
      paramCount++;
    }
    if (transaction_date !== undefined) {
      updates.push(`transaction_date = $${paramCount}`);
      values.push(transaction_date);
      paramCount++;
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      values.push(description);
      paramCount++;
    }
    if (merchant_name !== undefined) {
      updates.push(`merchant_name = $${paramCount}`);
      values.push(merchant_name);
      paramCount++;
    }
    if (transaction_type !== undefined) {
      if (!['income', 'expense'].includes(transaction_type.toLowerCase())) {
        res.status(400).json({
          success: false,
          message: 'transaction_type must be either "income" or "expense"',
        });
        return;
      }
      updates.push(`transaction_type = $${paramCount}`);
      values.push(transaction_type.toLowerCase());
      paramCount++;
    }
    if (category_id !== undefined) {
      updates.push(`category_id = $${paramCount}`);
      values.push(category_id);
      paramCount++;
    }

    if (updates.length === 0) {
      res.status(400).json({
        success: false,
        message: 'No fields to update',
      });
      return;
    }

    const updateQuery = `
      UPDATE transactions
      SET ${updates.join(', ')}
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [...values, id, userId]);

    res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error updating transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update transaction',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const query = `
      DELETE FROM transactions
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [id, userId]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Transaction not found or does not belong to this user',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete transaction',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router