import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import pool from '../db.js';

const router = Router();

// Basic XSS sanitization helper
const sanitizeString = (str: string): string => {
  return str
    .trim()
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .substring(0, 255); // Limit length
};

declare global {
  namespace Express {
    interface Request {
      userId?: number;
    }
  }
}

router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { bill_name, amount, due_day, category_id, is_paid } = req.body;

    if (!bill_name || !amount || !due_day) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: bill_name, amount, due_day',
      });
      return;
    }

    if (typeof bill_name !== 'string' || bill_name.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'bill_name must be a non-empty string',
      });
      return;
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 0) {
      res.status(400).json({
        success: false,
        message: 'amount must be a valid positive number',
      });
      return;
    }
    const parsedDueDay = parseInt(due_day);
    if (isNaN(parsedDueDay) || parsedDueDay < 1 || parsedDueDay > 31) {
      res.status(400).json({
        success: false,
        message: 'due_day must be between 1 and 31',
      });
      return;
    }

    if (category_id) {
      const categoryCheck = await pool.query(
        'SELECT id FROM categories WHERE id = $1 AND user_id = $2 AND is_active = true',
        [category_id, userId]
      );

      if (categoryCheck.rows.length === 0) {
        res.status(400).json({
          success: false,
          message: 'Invalid category_id: category does not exist or does not belong to this user',
        });
        return;
      }
    }

    const query = `
      INSERT INTO bills (user_id, bill_name, amount, due_day, category_id, is_paid)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await pool.query(query, [
      userId,
      sanitizeString(bill_name),
      parsedAmount,
      parsedDueDay,
      category_id || null,
      is_paid !== undefined ? is_paid : false,
    ]);

    res.status(201).json({
      success: true,
      message: 'Bill created successfully',
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create bill',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { is_paid } = req.query;

    let whereClause = 'WHERE b.user_id = $1';
    const queryParams: (number | boolean)[] = [userId!];
    let paramCount = 2;

    if (is_paid !== undefined) {
      whereClause += ` AND b.is_paid = $${paramCount}`;
      queryParams.push(is_paid === 'true');
      paramCount++;
    }

    const query = `
      SELECT b.*, c.name as category_name, c.type as category_type
      FROM bills b
      LEFT JOIN categories c ON b.category_id = c.id
      ${whereClause}
      ORDER BY b.due_day ASC, b.created_at DESC
    `;

    const result = await pool.query(query, queryParams);

    res.status(200).json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bills',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const query = `
      SELECT b.*, c.name as category_name, c.type as category_type
      FROM bills b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.id = $1 AND b.user_id = $2
    `;

    const result = await pool.query(query, [id, userId]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Bill not found',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bill',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { bill_name, amount, due_day, category_id, is_paid } = req.body;

    const checkQuery = `
      SELECT * FROM bills
      WHERE id = $1 AND user_id = $2
    `;
    const checkResult = await pool.query(checkQuery, [id, userId]);

    if (checkResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Bill not found or does not belong to this user',
      });
      return;
    }

    const updates: string[] = [];
    const values: (string | number | boolean)[] = [];
    let paramCount = 1;

    if (bill_name !== undefined) {
      if (typeof bill_name !== 'string' || bill_name.trim().length === 0) {
        res.status(400).json({
          success: false,
          message: 'bill_name must be a non-empty string',
        });
        return;
      }
      updates.push(`bill_name = $${paramCount}`);
      values.push(sanitizeString(bill_name));
      paramCount++;
    }
    if (amount !== undefined) {
      const parsedAmount = parseFloat(amount);
      if (isNaN(parsedAmount) || parsedAmount < 0) {
        res.status(400).json({
          success: false,
          message: 'amount must be a valid positive number',
        });
        return;
      }
      updates.push(`amount = $${paramCount}`);
      values.push(parsedAmount);
      paramCount++;
    }
    if (due_day !== undefined) {
      const parsedDueDay = parseInt(due_day);
      if (isNaN(parsedDueDay) || parsedDueDay < 1 || parsedDueDay > 31) {
        res.status(400).json({
          success: false,
          message: 'due_day must be between 1 and 31',
        });
        return;
      }
      updates.push(`due_day = $${paramCount}`);
      values.push(parsedDueDay);
      paramCount++;
    }
    if (category_id !== undefined) {
      if (category_id !== null) {
        const categoryCheck = await pool.query(
          'SELECT id FROM categories WHERE id = $1 AND user_id = $2 AND is_active = true',
          [category_id, userId]
        );

        if (categoryCheck.rows.length === 0) {
          res.status(400).json({
            success: false,
            message: 'Invalid category_id: category does not exist or does not belong to this user',
          });
          return;
        }
      }
      updates.push(`category_id = $${paramCount}`);
      values.push(category_id);
      paramCount++;
    }
    if (is_paid !== undefined) {
      updates.push(`is_paid = $${paramCount}`);
      values.push(is_paid);
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
      UPDATE bills
      SET ${updates.join(', ')}
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [...values, id, userId]);

    res.status(200).json({
      success: true,
      message: 'Bill updated successfully',
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update bill',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const query = `
      DELETE FROM bills
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    const result = await pool.query(query, [id, userId]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Bill not found or does not belong to this user',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Bill deleted successfully',
      data: result.rows[0],
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete bill',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
