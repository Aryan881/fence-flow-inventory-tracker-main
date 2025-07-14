import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { getDatabase } from '../database/init.js';

const router = express.Router();

// Get all users (admin only)
router.get('/', requireAdmin, [
  query('role').optional().isIn(['admin', 'agency']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { role, page = 1, limit = 20 } = req.query;
    const db = getDatabase();
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (role) {
      whereClause += ' AND role = ?';
      params.push(role);
    }

    const offset = (page - 1) * limit;
    
    // Get total count
    const countResult = await db.get(`
      SELECT COUNT(*) as total
      FROM users
      ${whereClause}
    `, params);
    
    // Get users (excluding password hash)
    const users = await db.all(`
      SELECT 
        id, username, email, role, name, agency_name, phone, address, created_at, updated_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single user by ID (admin only)
router.get('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    const user = await db.get(`
      SELECT 
        id, username, email, role, name, agency_name, phone, address, created_at, updated_at
      FROM users
      WHERE id = ?
    `, [id]);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user (admin only)
router.put('/:id', requireAdmin, [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('role').optional().isIn(['admin', 'agency']).withMessage('Valid role is required'),
  body('agency_name').optional(),
  body('phone').optional(),
  body('address').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = req.body;
    const db = getDatabase();
    
    // Check if user exists
    const existingUser = await db.get('SELECT id FROM users WHERE id = ?', [id]);
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if email is already taken by another user
    if (updateData.email) {
      const emailUser = await db.get('SELECT id FROM users WHERE email = ? AND id != ?', [updateData.email, id]);
      if (emailUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }
    }
    
    const updateFields = [];
    const updateValues = [];
    
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        updateFields.push(`${key} = ?`);
        updateValues.push(updateData[key]);
      }
    });
    
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    updateValues.push(id);
    
    await db.run(`
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);
    
    const updatedUser = await db.get(`
      SELECT 
        id, username, email, role, name, agency_name, phone, address, created_at, updated_at
      FROM users
      WHERE id = ?
    `, [id]);
    
    res.json({
      message: 'User updated successfully',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    // Check if user exists
    const user = await db.get('SELECT id, role FROM users WHERE id = ?', [id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Prevent deleting the last admin
    if (user.role === 'admin') {
      const adminCount = await db.get('SELECT COUNT(*) as count FROM users WHERE role = "admin"', []);
      if (adminCount.count <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin user' });
      }
    }
    
    // Check if user has orders
    const orders = await db.get('SELECT id FROM orders WHERE user_id = ? LIMIT 1', [id]);
    if (orders) {
      return res.status(400).json({ error: 'Cannot delete user that has orders' });
    }
    
    await db.run('DELETE FROM users WHERE id = ?', [id]);
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user statistics
router.get('/stats/overview', requireAdmin, async (req, res) => {
  try {
    const db = getDatabase();
    
    const stats = await db.get(`
      SELECT 
        COUNT(*) as total_users,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_users,
        SUM(CASE WHEN role = 'agency' THEN 1 ELSE 0 END) as agency_users
      FROM users
    `);
    
    res.json({ stats });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 