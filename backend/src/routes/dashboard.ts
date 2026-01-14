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

router.get('/income', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const incomeQuery = `
      SELECT COALESCE(SUM(amount), 0) as total_income
      FROM transactions
      WHERE user_id = $1
        AND transaction_type = 'income'
        AND transaction_date >= $2
        AND transaction_date <= $3
    `;
    const incomeResult = await pool.query(incomeQuery, [
      userId,
      startOfMonth.toISOString().split('T')[0],
      endOfMonth.toISOString().split('T')[0],
    ]);

    const totalIncome = parseFloat(incomeResult.rows[0].total_income);

    res.status(200).json({
      success: true,
      data: {
        monthlyIncome: totalIncome,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly income',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/expenses', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const expenseQuery = `
      SELECT COALESCE(SUM(amount), 0) as total_expenses
      FROM transactions
      WHERE user_id = $1
        AND transaction_type = 'expense'
        AND transaction_date >= $2
        AND transaction_date <= $3
    `;
    const expenseResult = await pool.query(expenseQuery, [
      userId,
      startOfMonth.toISOString().split('T')[0],
      endOfMonth.toISOString().split('T')[0],
    ]);

    const totalExpenses = parseFloat(expenseResult.rows[0].total_expenses);

    res.status(200).json({
      success: true,
      data: {
        monthlyExpenses: totalExpenses,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch monthly expenses',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/goals', authenticateToken, async (_req: Request, res: Response) => {
  try {
    const activeGoals = 0;

    res.status(200).json({
      success: true,
      data: {
        activeGoals,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active goals',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
