import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { authenticateToken, requireAdmin, requireAnyRole } from '../middleware/auth.js';
import { getDatabase } from '../database/init.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Get all orders with optional filtering
router.get('/', requireAnyRole, [
  query('status').optional().isIn(['pending', 'approved', 'processing', 'shipped', 'delivered', 'cancelled']),
  query('user_id').optional().isInt(),
  query('project_id').optional().isInt(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, user_id, project_id, page = 1, limit = 20 } = req.query;
    const db = getDatabase();
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    // Agency users can only see their own orders
    if (req.user.role === 'agency') {
      whereClause += ' AND o.user_id = ?';
      params.push(req.user.id);
    }
    
    if (status) {
      whereClause += ' AND o.status = ?';
      params.push(status);
    }
    
    if (user_id && req.user.role === 'admin') {
      whereClause += ' AND o.user_id = ?';
      params.push(user_id);
    }
    
    if (project_id) {
      whereClause += ' AND o.project_id = ?';
      params.push(project_id);
    }

    const offset = (page - 1) * limit;
    
    // Get total count
    const countResult = await db.get(`
      SELECT COUNT(*) as total
      FROM orders o
      ${whereClause}
    `, params);
    
    // Get orders with user and project info
    const orders = await db.all(`
      SELECT 
        o.*,
        u.name as user_name,
        u.agency_name,
        p.name as project_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN projects p ON o.project_id = p.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit)
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single order by ID
router.get('/:id', requireAnyRole, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    // Get order with user and project info
    const order = await db.get(`
      SELECT 
        o.*,
        u.name as user_name,
        u.agency_name,
        p.name as project_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN projects p ON o.project_id = p.id
      WHERE o.id = ?
    `, [id]);
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Agency users can only see their own orders
    if (req.user.role === 'agency' && order.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get order items
    const orderItems = await db.all(`
      SELECT 
        oi.*,
        p.name as product_name,
        p.sku,
        p.image_url
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [id]);
    
    res.json({ 
      order: { ...order, items: orderItems }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new order
router.post('/', requireAnyRole, [
  body('project_id').optional().isInt(),
  body('shipping_address').optional(),
  body('notes').optional(),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.product_id').isInt().withMessage('Valid product ID is required'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Valid quantity is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { project_id, shipping_address, notes, items } = req.body;
    const db = getDatabase();
    
    // Validate project if provided
    if (project_id) {
      const project = await db.get('SELECT id FROM projects WHERE id = ?', [project_id]);
      if (!project) {
        return res.status(400).json({ error: 'Project not found' });
      }
    }
    
    // Validate products and calculate total
    let totalAmount = 0;
    const validatedItems = [];
    
    for (const item of items) {
      const product = await db.get('SELECT id, name, price, stock_quantity FROM products WHERE id = ? AND status = "active"', [item.product_id]);
      if (!product) {
        return res.status(400).json({ error: `Product ${item.product_id} not found or inactive` });
      }
      
      if (product.stock_quantity < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      }
      
      const itemTotal = product.price * item.quantity;
      totalAmount += itemTotal;
      
      validatedItems.push({
        ...item,
        product,
        unit_price: product.price,
        total_price: itemTotal
      });
    }
    
    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;
    
    // Create order
    const orderResult = await db.run(`
      INSERT INTO orders (
        order_number, user_id, project_id, status, total_amount, shipping_address, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [orderNumber, req.user.id, project_id, 'pending', totalAmount, shipping_address, notes]);
    
    const orderId = orderResult.lastID;
    
    // Create order items and update inventory
    for (const item of validatedItems) {
      await db.run(`
        INSERT INTO order_items (
          order_id, product_id, quantity, unit_price, total_price
        ) VALUES (?, ?, ?, ?, ?)
      `, [orderId, item.product_id, item.quantity, item.unit_price, item.total_price]);
      
      // Update product stock
      const newStock = item.product.stock_quantity - item.quantity;
      await db.run('UPDATE products SET stock_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newStock, item.product_id]);
      
      // Record inventory transaction
      await db.run(`
        INSERT INTO inventory_transactions (
          product_id, transaction_type, quantity, reference_type, reference_id, notes, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [item.product_id, 'out', item.quantity, 'order', orderId, `Order ${orderNumber}`, req.user.id]);
    }
    
    // Get created order with items
    const createdOrder = await db.get(`
      SELECT 
        o.*,
        u.name as user_name,
        u.agency_name,
        p.name as project_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN projects p ON o.project_id = p.id
      WHERE o.id = ?
    `, [orderId]);
    
    const orderItems = await db.all(`
      SELECT 
        oi.*,
        p.name as product_name,
        p.sku,
        p.image_url
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [orderId]);
    
    res.status(201).json({
      message: 'Order created successfully',
      order: { ...createdOrder, items: orderItems }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update order status (admin only)
router.patch('/:id/status', requireAdmin, [
  body('status').isIn(['pending', 'approved', 'processing', 'shipped', 'delivered', 'cancelled']).withMessage('Valid status is required'),
  body('notes').optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status, notes } = req.body;
    const db = getDatabase();
    
    // Get order
    const order = await db.get('SELECT id, status FROM orders WHERE id = ?', [id]);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    // Update order status
    await db.run(`
      UPDATE orders 
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [status, id]);
    
    // If order is cancelled, restore inventory
    if (status === 'cancelled' && order.status !== 'cancelled') {
      const orderItems = await db.all('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [id]);
      
      for (const item of orderItems) {
        // Get current stock
        const product = await db.get('SELECT stock_quantity FROM products WHERE id = ?', [item.product_id]);
        const newStock = product.stock_quantity + item.quantity;
        
        // Update stock
        await db.run('UPDATE products SET stock_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newStock, item.product_id]);
        
        // Record inventory transaction
        await db.run(`
          INSERT INTO inventory_transactions (
            product_id, transaction_type, quantity, reference_type, reference_id, notes, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [item.product_id, 'in', item.quantity, 'order', id, 'Order cancellation - stock restored', req.user.id]);
      }
    }
    
    const updatedOrder = await db.get(`
      SELECT 
        o.*,
        u.name as user_name,
        u.agency_name,
        p.name as project_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN projects p ON o.project_id = p.id
      WHERE o.id = ?
    `, [id]);
    
    res.json({
      message: 'Order status updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get order statistics
router.get('/stats/overview', requireAnyRole, async (req, res) => {
  try {
    const db = getDatabase();
    
    let whereClause = '';
    const params = [];
    
    // Agency users can only see their own stats
    if (req.user.role === 'agency') {
      whereClause = 'WHERE user_id = ?';
      params.push(req.user.id);
    }
    
    const stats = await db.get(`
      SELECT 
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) as approved_orders,
        SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END) as processing_orders,
        SUM(CASE WHEN status = 'shipped' THEN 1 ELSE 0 END) as shipped_orders,
        SUM(CASE WHEN status = 'delivered' THEN 1 ELSE 0 END) as delivered_orders,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_orders,
        SUM(total_amount) as total_value
      FROM orders
      ${whereClause}
    `, params);
    
    res.json({ stats });
  } catch (error) {
    console.error('Get order stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 