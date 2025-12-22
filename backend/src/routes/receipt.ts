import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { receiptUpload } from '../middleware/upload.js';
import { extractTextFromImage } from '../services/visionOcr.js';
import { parseReceiptText } from '../services/receiptParser.js';
import { checkAndIncrementCounter, getCurrentCount } from '../services/receiptCounter.js';
import pool from '../db.js';

const router = Router();

// Extend Express Request to include file and userId
declare global {
  namespace Express {
    interface Request {
      userId?: number;
      file?: Express.Multer.File;
    }
  }
}

// POST /api/receipts/scan - Upload and scan receipt
router.post(
  '/scan',
  authenticateToken,
  receiptUpload.single('receipt'),
  async (req: Request, res: Response) => {
    try {
      const userId = req.userId;
      const file = req.file;

      if (!file) {
        res.status(400).json({
          success: false,
          message: 'No receipt image provided',
        });
        return;
      }

      // Check monthly limit
      const limitCheck = await checkAndIncrementCounter();
      if (!limitCheck.allowed) {
        res.status(429).json({
          success: false,
          message: `Monthly receipt scan limit reached (${limitCheck.limit} scans/month). Limit resets next month.`,
          error: 'LIMIT_REACHED',
          data: {
            count: limitCheck.count,
            limit: limitCheck.limit
          }
        });
        return;
      }

      // Extract text using Vision API
      const ocrResult = await extractTextFromImage(file.path);

      // Parse text into structured data
      const parsed = parseReceiptText(ocrResult.fullText, ocrResult.lines);

      // Store in database
      const query = `
        INSERT INTO receipts (
          user_id,
          image_url,
          merchant_name,
          total_amount,
          receipt_date,
          extracted_data,
          processing_status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const result = await pool.query(query, [
        userId,
        file.path, // Local file path
        parsed.merchant_name,
        parsed.total_amount,
        parsed.receipt_date,
        JSON.stringify(parsed.extracted_data),
        'processed',
      ]);

      const receipt = result.rows[0];

      res.status(201).json({
        success: true,
        message: 'Receipt scanned successfully',
        data: {
          receiptId: receipt.id,
          merchant: receipt.merchant_name,
          date: receipt.receipt_date,
          total: receipt.total_amount,
          extractedData: receipt.extracted_data,
          confidence: parsed.confidence,
          rawText: ocrResult.fullText.substring(0, 500), // Limit response size
        },
      });
    } catch (error) {
      console.error('Receipt scan error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to scan receipt',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

// GET /api/receipts/:id - Get receipt details
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const query = `
      SELECT * FROM receipts
      WHERE id = $1 AND user_id = $2
    `;

    const result = await pool.query(query, [id, userId]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Receipt not found',
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
      message: 'Failed to fetch receipt',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// POST /api/receipts/:id/confirm - Create transaction from receipt
router.post('/:id/confirm', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.userId;
    const { id } = req.params;
    const { merchant_name, transaction_date, amount, description, category_id } = req.body;

    // Validate required fields
    if (!merchant_name || !transaction_date || !amount) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: merchant_name, transaction_date, amount',
      });
      return;
    }

    // Verify receipt belongs to user
    const receiptQuery = `
      SELECT * FROM receipts WHERE id = $1 AND user_id = $2
    `;
    const receiptResult = await pool.query(receiptQuery, [id, userId]);

    if (receiptResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: 'Receipt not found or does not belong to this user',
      });
      return;
    }

    // Create transaction
    const transactionQuery = `
      INSERT INTO transactions (
        user_id,
        amount,
        transaction_date,
        description,
        merchant_name,
        transaction_type,
        category_id
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const transactionResult = await pool.query(transactionQuery, [
      userId,
      parseFloat(amount),
      transaction_date,
      description || `Receipt from ${merchant_name}`,
      merchant_name,
      'expense', // Receipts are typically expenses
      category_id || null,
    ]);

    const transaction = transactionResult.rows[0];

    // Link receipt to transaction
    await pool.query(
      'UPDATE receipts SET transaction_id = $1, processing_status = $2 WHERE id = $3',
      [transaction.id, 'confirmed', id]
    );

    res.status(201).json({
      success: true,
      message: 'Transaction created from receipt',
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to create transaction',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/receipts/limit - Check current scan limit
router.get('/limit', authenticateToken, async (req: Request, res: Response) => {
  try {
    const stats = await getCurrentCount();

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get limit info',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
