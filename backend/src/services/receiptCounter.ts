import pool from '../db.js';

const MONTHLY_LIMIT = 500;

export async function checkAndIncrementCounter(): Promise<{ allowed: boolean; count: number; limit: number }> {
  try {
    // Get current month's count
    const query = `
      SELECT COUNT(*) as count 
      FROM receipts 
      WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
    `;
    
    const result = await pool.query(query);
    const currentCount = parseInt(result.rows[0].count);
    
    if (currentCount >= MONTHLY_LIMIT) {
      return {
        allowed: false,
        count: currentCount,
        limit: MONTHLY_LIMIT
      };
    }
    
    return {
      allowed: true,
      count: currentCount,
      limit: MONTHLY_LIMIT
    };
  } catch (error) {
    console.error('Receipt counter error:', error);
    throw new Error('Failed to check receipt limit');
  }
}

export async function getCurrentCount(): Promise<{ count: number; limit: number; remaining: number }> {
  try {
    const query = `
      SELECT COUNT(*) as count 
      FROM receipts 
      WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
    `;
    
    const result = await pool.query(query);
    const count = parseInt(result.rows[0].count);
    
    return {
      count,
      limit: MONTHLY_LIMIT,
      remaining: Math.max(0, MONTHLY_LIMIT - count)
    };
  } catch (error) {
    console.error('Get count error:', error);
    throw new Error('Failed to get receipt count');
  }
}
