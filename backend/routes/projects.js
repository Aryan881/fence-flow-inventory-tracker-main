import express from 'express';
import { body, validationResult, query } from 'express-validator';
import { authenticateToken, requireAdmin, requireAnyRole } from '../middleware/auth.js';
import { getDatabase } from '../database/init.js';

const router = express.Router();

// Get all projects with optional filtering
router.get('/', requireAnyRole, [
  query('status').optional().isIn(['planning', 'in_progress', 'completed', 'on_hold']),
  query('manager_id').optional().isInt(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { status, manager_id, page = 1, limit = 20 } = req.query;
    const db = getDatabase();
    
    let whereClause = 'WHERE 1=1';
    const params = [];
    
    if (status) {
      whereClause += ' AND p.status = ?';
      params.push(status);
    }
    
    if (manager_id) {
      whereClause += ' AND p.manager_id = ?';
      params.push(manager_id);
    }

    const offset = (page - 1) * limit;
    
    // Get total count
    const countResult = await db.get(`
      SELECT COUNT(*) as total
      FROM projects p
      ${whereClause}
    `, params);
    
    // Get projects with manager info
    const projects = await db.all(`
      SELECT 
        p.*,
        u.name as manager_name,
        u.agency_name as manager_agency
      FROM projects p
      LEFT JOIN users u ON p.manager_id = u.id
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, limit, offset]);

    res.json({
      projects,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: countResult.total,
        pages: Math.ceil(countResult.total / limit)
      }
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single project by ID
router.get('/:id', requireAnyRole, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    const project = await db.get(`
      SELECT 
        p.*,
        u.name as manager_name,
        u.agency_name as manager_agency
      FROM projects p
      LEFT JOIN users u ON p.manager_id = u.id
      WHERE p.id = ?
    `, [id]);
    
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Get project orders
    const orders = await db.all(`
      SELECT 
        o.*,
        u.name as user_name,
        u.agency_name
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.project_id = ?
      ORDER BY o.created_at DESC
    `, [id]);
    
    res.json({ 
      project: { ...project, orders }
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new project (admin only)
router.post('/', requireAdmin, [
  body('name').notEmpty().withMessage('Project name is required'),
  body('description').optional(),
  body('status').isIn(['planning', 'in_progress', 'completed', 'on_hold']).withMessage('Valid status is required'),
  body('start_date').optional().isISO8601().withMessage('Valid start date is required'),
  body('end_date').optional().isISO8601().withMessage('Valid end date is required'),
  body('budget').optional().isFloat({ min: 0 }).withMessage('Valid budget is required'),
  body('manager_id').optional().isInt().withMessage('Valid manager ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, status, start_date, end_date, budget, manager_id } = req.body;
    const db = getDatabase();
    
    // Validate manager if provided
    if (manager_id) {
      const manager = await db.get('SELECT id FROM users WHERE id = ?', [manager_id]);
      if (!manager) {
        return res.status(400).json({ error: 'Manager not found' });
      }
    }
    
    const result = await db.run(`
      INSERT INTO projects (
        name, description, status, start_date, end_date, budget, manager_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [name, description, status, start_date, end_date, budget, manager_id]);
    
    const newProject = await db.get(`
      SELECT 
        p.*,
        u.name as manager_name,
        u.agency_name as manager_agency
      FROM projects p
      LEFT JOIN users u ON p.manager_id = u.id
      WHERE p.id = ?
    `, [result.lastID]);
    
    res.status(201).json({
      message: 'Project created successfully',
      project: newProject
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update project (admin only)
router.put('/:id', requireAdmin, [
  body('name').optional().notEmpty().withMessage('Project name cannot be empty'),
  body('description').optional(),
  body('status').optional().isIn(['planning', 'in_progress', 'completed', 'on_hold']).withMessage('Valid status is required'),
  body('start_date').optional().isISO8601().withMessage('Valid start date is required'),
  body('end_date').optional().isISO8601().withMessage('Valid end date is required'),
  body('budget').optional().isFloat({ min: 0 }).withMessage('Valid budget is required'),
  body('manager_id').optional().isInt().withMessage('Valid manager ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updateData = req.body;
    const db = getDatabase();
    
    // Check if project exists
    const existingProject = await db.get('SELECT id FROM projects WHERE id = ?', [id]);
    if (!existingProject) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Validate manager if being updated
    if (updateData.manager_id) {
      const manager = await db.get('SELECT id FROM users WHERE id = ?', [updateData.manager_id]);
      if (!manager) {
        return res.status(400).json({ error: 'Manager not found' });
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
      UPDATE projects 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);
    
    const updatedProject = await db.get(`
      SELECT 
        p.*,
        u.name as manager_name,
        u.agency_name as manager_agency
      FROM projects p
      LEFT JOIN users u ON p.manager_id = u.id
      WHERE p.id = ?
    `, [id]);
    
    res.json({
      message: 'Project updated successfully',
      project: updatedProject
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete project (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    // Check if project exists
    const project = await db.get('SELECT id FROM projects WHERE id = ?', [id]);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Check if project has orders
    const orders = await db.get('SELECT id FROM orders WHERE project_id = ? LIMIT 1', [id]);
    if (orders) {
      return res.status(400).json({ error: 'Cannot delete project that has orders' });
    }
    
    await db.run('DELETE FROM projects WHERE id = ?', [id]);
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get project statistics
router.get('/stats/overview', requireAnyRole, async (req, res) => {
  try {
    const db = getDatabase();
    
    const stats = await db.get(`
      SELECT 
        COUNT(*) as total_projects,
        SUM(CASE WHEN status = 'planning' THEN 1 ELSE 0 END) as planning_projects,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_projects,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_projects,
        SUM(CASE WHEN status = 'on_hold' THEN 1 ELSE 0 END) as on_hold_projects,
        SUM(budget) as total_budget
      FROM projects
    `);
    
    res.json({ stats });
  } catch (error) {
    console.error('Get project stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router; 