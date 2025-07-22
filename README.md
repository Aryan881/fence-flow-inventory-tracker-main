# Fence Flow Inventory Tracker

A comprehensive inventory management system designed for defense agencies and organizations. This full-stack application provides secure inventory tracking, order management, and procurement capabilities.

## 🚀 Features

### Admin Features
- **Dashboard Overview**: Real-time statistics and system status
- **Project Management**: Create, edit, and track defense projects
- **Product Management**: Full CRUD operations for inventory items
- **Order Management**: Process and track agency orders
- **User Management**: Manage agency accounts and permissions

### Agency Features
- **Product Catalog**: Browse available inventory items
- **Shopping Cart**: Add items and manage quantities
- **Order History**: View past orders and their status
- **Secure Authentication**: Role-based access control

### Technical Features
- **Real-time Inventory Tracking**: Automatic stock updates
- **Order Processing**: Complete order lifecycle management
- **Secure API**: JWT-based authentication
- **Responsive Design**: Modern UI with shadcn/ui components
- **Database Transactions**: ACID compliance for data integrity

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **shadcn/ui** for modern UI components
- **Tailwind CSS** for styling
- **React Router** for navigation
- **React Query** for data fetching
- **React Hook Form** for form management

### Backend
- **Node.js** with Express.js
- **SQLite** database for data persistence
- **JWT** for authentication
- **bcryptjs** for password hashing
- **express-validator** for input validation
- **multer** for file uploads

## 📋 Prerequisites

- Node.js 18+ and npm
- Git

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd fence-flow-inventory-tracker-main
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 3. Initialize Database
```bash
cd backend
npm run init-db
cd ..
```

### 4. Start the Application

#### Option A: Start Both Servers (Recommended)
```bash
# Terminal 1: Start backend server
cd backend
npm run dev

# Terminal 2: Start frontend server
npm run dev
```

#### Option B: Start Individual Servers
```bash
# Backend only (runs on http://localhost:3001)
cd backend && npm run dev

# Frontend only (runs on http://localhost:8080)
npm run dev
```

### 5. Access the Application
- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/api/health

## 🔐 Default Login Credentials

### Admin Access
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: System Administrator

### Agency Access
- **Username**: `agency1`
- **Password**: `agency123`
- **Role**: Defense Agency

## 📁 Project Structure

```
fence-flow-inventory-tracker-main/
├── src/                          # Frontend source code
│   ├── components/               # React components
│   │   ├── admin/               # Admin-specific components
│   │   ├── auth/                # Authentication components
│   │   ├── user/                # Agency-specific components
│   │   └── ui/                  # Reusable UI components
│   ├── context/                 # React context providers
│   ├── hooks/                   # Custom React hooks
│   ├── lib/                     # Utility libraries
│   └── pages/                   # Page components
├── backend/                     # Backend source code
│   ├── database/                # Database initialization
│   ├── middleware/              # Express middleware
│   ├── routes/                  # API routes
│   ├── scripts/                 # Database scripts
│   └── uploads/                 # File uploads directory
├── public/                      # Static assets
└── package.json                 # Frontend dependencies
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Backend Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Frontend URL
FRONTEND_URL=http://localhost:8080

# Database Configuration
DB_PATH=./data/inventory.db
```

### Vite Configuration

The frontend is configured to proxy API calls to the backend:

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3001',
      changeOrigin: true,
      secure: false,
    }
  }
}
```

## 📊 Database Schema

### Core Tables
- **users**: User accounts and authentication
- **projects**: Defense project management
- **products**: Inventory items and specifications
- **orders**: Order management and tracking
- **order_items**: Individual items in orders
- **inventory_transactions**: Stock movement tracking
- **categories**: Product categorization

### Sample Data
The system comes pre-loaded with:
- Default admin and agency users
- Sample defense projects
- Common inventory categories
- Sample products with realistic specifications

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Admin and agency permissions
- **Input Validation**: Server-side validation for all inputs
- **Password Hashing**: bcrypt for secure password storage
- **CORS Protection**: Configured for secure cross-origin requests
- **Rate Limiting**: Protection against brute force attacks

## 🚀 Deployment

### Production Build
```bash
# Build frontend
npm run build

# Start production backend
cd backend
npm start
```

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure a strong `JWT_SECRET`
3. Set up proper database backups
4. Configure reverse proxy (nginx recommended)
5. Set up SSL certificates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the API documentation at `/api/health`
- Review the database schema in `backend/database/init.js`
- Examine the component structure in `src/components/`

## 🔄 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change password

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Orders
- `GET /api/orders` - List orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order details
- `PATCH /api/orders/:id/status` - Update order status

### Projects
- `GET /api/projects` - List projects
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics

---

## ✅ Final Manual Testing Checklist

Before deploying or handing off, run through this checklist to ensure everything works as expected:

### Authentication
- [ ] Can log in as admin (`admin` / `admin123`)
- [ ] Can log in as agency (`agency1` / `agency123`)
- [ ] Invalid credentials show error

### Admin Dashboard
- [ ] Dashboard stats load correctly
- [ ] Can view, add, edit, and delete projects
- [ ] Can view, add, edit, and delete products
- [ ] Can view and process orders
- [ ] Can view and manage users

### Agency Dashboard
- [ ] Product catalog loads and can search/filter
- [ ] Can add products to cart and adjust quantities
- [ ] Can place an order (with shipping address)
- [ ] Order history updates after placing an order

### General
- [ ] All API errors are shown as user-friendly messages
- [ ] Loading spinners appear during API calls
- [ ] Logout works and clears session

---

## 🚀 Deployment Instructions

### 1. Environment Variables
Create a `.env` file in the `backend/` directory with the following:
```env
PORT=3001
NODE_ENV=production
JWT_SECRET=your-very-secret-key
FRONTEND_URL=http://localhost:8080
DB_PATH=./data/inventory.db
```

### 2. Production Build
- **Frontend:**
  ```bash
  npm run build
  # Serves static files from dist/
  ```
- **Backend:**
  ```bash
  cd backend
  npm run start
  # or
  node server.js
  ```

### 3. (Optional) Docker Deployment
If you want Docker support, request Dockerfiles for both frontend and backend.

### 4. Access
- **Frontend:** http://localhost:8080
- **Backend API:** http://localhost:3001/api

---

For further improvements, consider adding automated tests or Docker support for easier deployment.

# 🚀 One-Command Docker Start

You can run the entire project (frontend + backend) with a single command using Docker Compose:

```bash
docker-compose up --build
```

- Frontend: http://localhost:8080
- Backend API: http://localhost:3001/api

---
