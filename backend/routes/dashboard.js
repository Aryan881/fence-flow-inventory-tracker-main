import express from 'express';
import { requireAdmin } from '../middleware/auth.js';
import { getDatabase } from '../database/init.js';

const router = express.Router();

// Admin dashboard summary
router.get('/summary', requireAdmin, async (req, res) => {
  try {
    const db = getDatabase();
    // Projects
    const totalProjects = (await db.get('SELECT COUNT(*) as count FROM projects')).count;
    const completedProjects = (await db.get("SELECT COUNT(*) as count FROM projects WHERE status = 'completed' ")).count;
    const ongoingProjects = (await db.get("SELECT COUNT(*) as count FROM projects WHERE status = 'in_progress' ")).count;
    // Products
    const totalProducts = (await db.get('SELECT COUNT(*) as count FROM products')).count;
    const readyProducts = (await db.get("SELECT COUNT(*) as count FROM products WHERE stock_quantity > min_stock_level AND status = 'active' ")).count;
    const inProductionProducts = (await db.get("SELECT COUNT(*) as count FROM products WHERE status = 'active' AND stock_quantity <= min_stock_level ")).count;
    const underMaintenanceProducts = (await db.get("SELECT COUNT(*) as count FROM products WHERE status = 'inactive' ")).count;
    // Orders
    const totalOrders = (await db.get('SELECT COUNT(*) as count FROM orders')).count;
    const pendingOrders = (await db.get("SELECT COUNT(*) as count FROM orders WHERE status = 'pending' ")).count;
    // System status
    const systemStatus = 'Online';
    res.json({
      totalProjects,
      completedProjects,
      ongoingProjects,
      totalProducts,
      readyProducts,
      inProductionProducts,
      underMaintenanceProducts,
      totalOrders,
      pendingOrders,
      systemStatus
    });
  } catch (error) {
    console.error('Dashboard summary error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 