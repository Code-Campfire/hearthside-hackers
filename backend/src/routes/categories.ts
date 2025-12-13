import express from 'express';
import pool from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      `SELECT id, name, type, is_active, created_at
       FROM categories
       WHERE user_id = $1 AND is_active = true
       ORDER BY name ASC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const categoryId = parseInt(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (isNaN(categoryId)) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }

    const result = await pool.query(
      `SELECT id, name, type, is_active, created_at
       FROM categories
       WHERE id = $1 AND user_id = $2`,
      [categoryId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const { name, type } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    if (name.length > 80) {
      return res.status(400).json({ error: 'Category name must be 80 characters or less' });
    }

    const validTypes = ['expense', 'income', 'both'];
    if (!type || !validTypes.includes(type)) {
      return res.status(400).json({ error: 'Type must be one of: expense, income, both' });
    }

    const duplicateCheck = await pool.query(
      'SELECT id FROM categories WHERE user_id = $1 AND LOWER(name) = LOWER($2)',
      [userId, name.trim()]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(409).json({ error: 'A category with this name already exists' });
    }

    const result = await pool.query(
      `INSERT INTO categories (user_id, name, type, is_active)
       VALUES ($1, $2, $3, true)
       RETURNING id, name, type, is_active, created_at`,
      [userId, name.trim(), type]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const categoryId = parseInt(req.params.id);
    const { name, type, is_active } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (isNaN(categoryId)) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }

    const existingCategory = await pool.query(
      'SELECT id FROM categories WHERE id = $1 AND user_id = $2',
      [categoryId, userId]
    );

    if (existingCategory.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return res.status(400).json({ error: 'Category name cannot be empty' });
      }
      if (name.length > 80) {
        return res.status(400).json({ error: 'Category name must be 80 characters or less' });
      }

      const duplicateCheck = await pool.query(
        'SELECT id FROM categories WHERE user_id = $1 AND LOWER(name) = LOWER($2) AND id != $3',
        [userId, name.trim(), categoryId]
      );

      if (duplicateCheck.rows.length > 0) {
        return res.status(409).json({ error: 'A category with this name already exists' });
      }

      updates.push(`name = $${paramCount++}`);
      values.push(name.trim());
    }

    if (type !== undefined) {
      const validTypes = ['expense', 'income', 'both'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: 'Type must be one of: expense, income, both' });
      }
      updates.push(`type = $${paramCount++}`);
      values.push(type);
    }

    if (is_active !== undefined) {
      if (typeof is_active !== 'boolean') {
        return res.status(400).json({ error: 'is_active must be a boolean' });
      }
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(categoryId, userId);

    const result = await pool.query(
      `UPDATE categories
       SET ${updates.join(', ')}
       WHERE id = $${paramCount++} AND user_id = $${paramCount++}
       RETURNING id, name, type, is_active, created_at`,
      values
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = req.userId;
    const categoryId = parseInt(req.params.id);

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (isNaN(categoryId)) {
      return res.status(400).json({ error: 'Invalid category ID' });
    }

    const result = await pool.query(
      `UPDATE categories
       SET is_active = false
       WHERE id = $1 AND user_id = $2
       RETURNING id`,
      [categoryId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
