import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { authenticateToken, requireAdmin, requireAnyRole } from '../middleware/auth.js';
import { getDatabase } from '../database/init.js';

const router = express.Router();

// Get all products with optional filtering
router.get('/', [
  query('category').optional().isInt(),
  query('status').optional().isIn(['active', 'inactive', 'discontinued']),
  query('search').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { category, status, search, page = 1, limit = 20 } = req.query;
    const db = getDatabase();
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (category) {
      whereClause += ' AND p.category_id = ?';
      params.push(category);
    }
    
    if (status) {
      whereClause += ' AND p.status = ?';
      params.push(status);
    }
    
    if (search) {
      whereClause += ' AND (p.name LIKE ? OR p.description LIKE ? OR p.sku LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const offset = (page - 1) * limit;
    
    // Get total count
    const countResult = await db.get(`
      SELECT COUNT(*) as total
      FROM products p
      ${whereClause}
    `, params);
    
    // Get products with category info
    const products = await db.all(`
      SELECT 
        p.*,
        c.name as category_name,
        c.description as category_description
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit)
      }
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    const product = await db.get(`
      SELECT 
        p.*,
        c.name as category_name,
        c.description as category_description
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [id]);
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json({ product });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new product (admin only)
router.post('/', requireAdmin, [
  body('name').notEmpty().withMessage('Product name is required'),
  body('description').optional(),
  body('category_id').isInt().withMessage('Valid category ID is required'),
  body('sku').notEmpty().withMessage('SKU is required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
  body('cost').optional().isFloat({ min: 0 }),
  body('stock_quantity').optional().isInt({ min: 0 }),
  body('min_stock_level').optional().isInt({ min: 0 }),
  body('status').optional().isIn(['active', 'inactive', 'discontinued']),
  body('specifications').optional(),
  body('supplier_info').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      name, description, category_id, sku, price, cost,
      stock_quantity = 0, min_stock_level = 10,
      status = 'active', specifications, supplier_info
    } = req.body;
    
    const db = getDatabase();
    
    // Check if SKU already exists
    const existingProduct = await db.get('SELECT id FROM products WHERE sku = ?', [sku]);
    if (existingProduct) {
      return res.status(400).json({ error: 'SKU already exists' });
    }
    
    // Check if category exists
    const category = await db.get('SELECT id FROM categories WHERE id = ?', [category_id]);
    if (!category) {
      return res.status(400).json({ error: 'Category not found' });
    }
    
    const result = await db.run(`
      INSERT INTO products (
        name, description, category_id, sku, price, cost,
        stock_quantity, min_stock_level, status, specifications, supplier_info
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [name, description, category_id, sku, price, cost, stock_quantity, min_stock_level, status, specifications, supplier_info]);
    
    const newProduct = await db.get(`
      SELECT 
        p.*,
        c.name as category_name,
        c.description as category_description
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [result.lastID]);
    
    res.status(201).json({
      message: 'Product created successfully',
      product: newProduct
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update product (admin only)
router.put('/:id', requireAdmin, [
  body('name').optional().notEmpty().withMessage('Product name cannot be empty'),
  body('description').optional(),
  body('category_id').optional().isInt().withMessage('Valid category ID is required'),
  body('price').optional().isFloat({ min: 0 }).withMessage('Valid price is required'),
  body('cost').optional().isFloat({ min: 0 }),
  body('min_stock_level').optional().isInt({ min: 0 }),
  body('status').optional().isIn(['active', 'inactive', 'discontinued']),
  body('specifications').optional(),
  body('supplier_info').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = req.body;
    const db = getDatabase();
    
    // Check if product exists
    const existingProduct = await db.get('SELECT id FROM products WHERE id = ?', [id]);
    if (!existingProduct) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Check if category exists if being updated
    if (updateData.category_id) {
      const category = await db.get('SELECT id FROM categories WHERE id = ?', [updateData.category_id]);
      if (!category) {
        return res.status(400).json({ error: 'Category not found' });
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
      UPDATE products 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);
    
    const updatedProduct = await db.get(`
      SELECT 
        p.*,
        c.name as category_name,
        c.description as category_description
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [id]);
    
    res.json({
      message: 'Product updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete product (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    // Check if product exists
    const product = await db.get('SELECT id FROM products WHERE id = ?', [id]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // Check if product is used in any orders
    const orderItems = await db.get('SELECT id FROM order_items WHERE product_id = ? LIMIT 1', [id]);
    if (orderItems) {
      return res.status(400).json({ error: 'Cannot delete product that has been ordered' });
    }
    
    await db.run('DELETE FROM products WHERE id = ?', [id]);
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update stock quantity (admin only)
router.patch('/:id/stock', requireAdmin, [
  body('quantity').isInt().withMessage('Valid quantity is required'),
  body('type').isIn(['in', 'out', 'adjustment']).withMessage('Valid transaction type is required'),
  body('notes').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { quantity, type, notes } = req.body;
    const db = getDatabase();
    
    // Get current product
    const product = await db.get('SELECT id, stock_quantity FROM products WHERE id = ?', [id]);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    let newQuantity = product.stock_quantity;
    if (type === 'in') {
      newQuantity += quantity;
    } else if (type === 'out') {
      newQuantity -= quantity;
      if (newQuantity < 0) {
        return res.status(400).json({ error: 'Insufficient stock' });
      }
    } else if (type === 'adjustment') {
      newQuantity = quantity;
    }
    
    // Update stock quantity
    await db.run('UPDATE products SET stock_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newQuantity, id]);
    
    // Record transaction
    await db.run(`
      INSERT INTO inventory_transactions (
        product_id, transaction_type, quantity, reference_type, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [id, type, quantity, 'manual', notes, req.user.id]);
    
    const updatedProduct = await db.get(`
      SELECT 
        p.*,
        c.name as category_name,
        c.description as category_description
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `, [id]);
    
    res.json({
      message: 'Stock updated successfully',
      product: updatedProduct
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get low stock products
router.get('/low-stock/list', requireAnyRole, async (req, res) => {
  try {
    const db = getDatabase();
    
    const lowStockProducts = await db.all(`
      SELECT 
        p.*,
        c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.stock_quantity <= p.min_stock_level AND p.status = 'active'
      ORDER BY p.stock_quantity ASC
    `);
    
    res.json({ products: lowStockProducts });
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 