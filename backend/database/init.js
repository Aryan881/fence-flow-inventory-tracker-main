import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db;

export const getDatabase = () => db;

export const initDatabase = async () => {
  try {
    // Create data directory if it doesn't exist
    const dataDir = join(__dirname, '..', 'data');
    await import('fs').then(fs => {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
    });

    // Open database connection
    db = await open({
      filename: join(dataDir, 'inventory.db'),
      driver: sqlite3.Database
    });

    // Create tables
    await createTables();
    
    // Seed initial data
    await seedInitialData();
    
    console.log('✅ Database initialized successfully');
    return db;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

const createTables = async () => {
  // Users table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('admin', 'agency')),
      name TEXT NOT NULL,
      agency_name TEXT,
      phone TEXT,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Projects table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL CHECK (status IN ('planning', 'in_progress', 'completed', 'on_hold')),
      start_date DATE,
      end_date DATE,
      budget DECIMAL(10,2),
      manager_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (manager_id) REFERENCES users (id)
    )
  `);

  // Categories table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Products table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      category_id INTEGER,
      sku TEXT UNIQUE,
      price DECIMAL(10,2) NOT NULL,
      cost DECIMAL(10,2),
      stock_quantity INTEGER DEFAULT 0,
      min_stock_level INTEGER DEFAULT 10,
      status TEXT NOT NULL CHECK (status IN ('active', 'inactive', 'discontinued')),
      image_url TEXT,
      specifications TEXT,
      supplier_info TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories (id)
    )
  `);

  // Orders table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      project_id INTEGER,
      status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'processing', 'shipped', 'delivered', 'cancelled')),
      total_amount DECIMAL(10,2) NOT NULL,
      shipping_address TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id),
      FOREIGN KEY (project_id) REFERENCES projects (id)
    )
  `);

  // Order items table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      total_price DECIMAL(10,2) NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders (id),
      FOREIGN KEY (product_id) REFERENCES products (id)
    )
  `);

  // Inventory transactions table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS inventory_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      transaction_type TEXT NOT NULL CHECK (transaction_type IN ('in', 'out', 'adjustment')),
      quantity INTEGER NOT NULL,
      reference_type TEXT CHECK (reference_type IN ('order', 'manual', 'return')),
      reference_id INTEGER,
      notes TEXT,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products (id),
      FOREIGN KEY (created_by) REFERENCES users (id)
    )
  `);

  // Create indexes for better performance
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
    CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
    CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_inventory_transactions_product ON inventory_transactions(product_id);
  `);

  console.log('✅ Database tables created successfully');
};

const seedInitialData = async () => {
  try {
    // Check if data already exists
    const userCount = await db.get('SELECT COUNT(*) as count FROM users');
    if (userCount.count > 0) {
      console.log('✅ Database already seeded');
      return;
    }

    // Create default admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    await db.run(`
      INSERT INTO users (username, email, password_hash, role, name, agency_name)
      VALUES (?, ?, ?, ?, ?, ?)
    `, ['admin', 'admin@adrde.gov', adminPassword, 'admin', 'System Administrator', 'ADRDE']);

    // Create default agency user
    const agencyPassword = await bcrypt.hash('agency123', 10);
    await db.run(`
      INSERT INTO users (username, email, password_hash, role, name, agency_name)
      VALUES (?, ?, ?, ?, ?, ?)
    `, ['agency1', 'agency1@adrde.gov', agencyPassword, 'agency', 'Defense Agency 1', 'Defense Agency 1']);

    // Create categories
    const categories = [
      'Fencing Materials',
      'Security Equipment',
      'Construction Tools',
      'Electronic Components',
      'Safety Equipment',
      'Office Supplies'
    ];

    for (const category of categories) {
      await db.run(`
        INSERT INTO categories (name, description)
        VALUES (?, ?)
      `, [category, `${category} for defense projects`]);
    }

    // Create sample projects
    await db.run(`
      INSERT INTO projects (name, description, status, start_date, end_date, budget, manager_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      'Perimeter Security Enhancement',
      'Upgrade perimeter fencing and security systems',
      'in_progress',
      '2024-01-15',
      '2024-06-30',
      500000.00,
      1
    ]);

    await db.run(`
      INSERT INTO projects (name, description, status, start_date, end_date, budget, manager_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      'Base Infrastructure Modernization',
      'Modernize base infrastructure and facilities',
      'planning',
      '2024-03-01',
      '2024-12-31',
      750000.00,
      1
    ]);

    // Create sample products
    const products = [
      {
        name: 'High-Security Fence Panel',
        description: 'Heavy-duty security fence panel with anti-climb design',
        category: 'Fencing Materials',
        sku: 'FENCE-001',
        price: 250.00,
        cost: 180.00,
        stock_quantity: 50,
        status: 'active'
      },
      {
        name: 'Surveillance Camera System',
        description: '4K surveillance camera with night vision and motion detection',
        category: 'Security Equipment',
        sku: 'CAM-001',
        price: 1200.00,
        cost: 800.00,
        stock_quantity: 25,
        status: 'active'
      },
      {
        name: 'Security Gate Controller',
        description: 'Automated gate controller with RFID access',
        category: 'Security Equipment',
        sku: 'GATE-001',
        price: 850.00,
        cost: 600.00,
        stock_quantity: 15,
        status: 'active'
      },
      {
        name: 'Construction Drill Set',
        description: 'Professional grade drill set for construction work',
        category: 'Construction Tools',
        sku: 'TOOL-001',
        price: 450.00,
        cost: 320.00,
        stock_quantity: 30,
        status: 'active'
      },
      {
        name: 'Safety Helmet',
        description: 'High-visibility safety helmet with chin strap',
        category: 'Safety Equipment',
        sku: 'SAFETY-001',
        price: 35.00,
        cost: 25.00,
        stock_quantity: 100,
        status: 'active'
      }
    ];

    for (const product of products) {
      const categoryResult = await db.get('SELECT id FROM categories WHERE name = ?', [product.category]);
      await db.run(`
        INSERT INTO products (name, description, category_id, sku, price, cost, stock_quantity, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        product.name,
        product.description,
        categoryResult.id,
        product.sku,
        product.price,
        product.cost,
        product.stock_quantity,
        product.status
      ]);
    }

    console.log('✅ Initial data seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  }
}; 