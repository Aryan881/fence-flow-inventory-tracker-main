#!/bin/bash

# Fence Flow Inventory Tracker - Development Startup Script

echo "🚀 Starting Fence Flow Inventory Tracker..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js and npm are installed"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    cd backend
    npm install
    cd ..
fi

# Initialize database if it doesn't exist
if [ ! -f "backend/data/inventory.db" ]; then
    echo "🗄️ Initializing database..."
    cd backend
    npm run init-db
    cd ..
fi

echo "✅ Dependencies and database are ready"

# Start backend server in background
echo "🔧 Starting backend server on http://localhost:3001..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend server
echo "🌐 Starting frontend server on http://localhost:8080..."
npm run dev &
FRONTEND_PID=$!

echo ""
echo "🎉 Fence Flow Inventory Tracker is starting up!"
echo ""
echo "📱 Frontend: http://localhost:8080"
echo "🔧 Backend API: http://localhost:3001/api"
echo "📊 Health Check: http://localhost:3001/api/health"
echo ""
echo "🔐 Default Login Credentials:"
echo "   Admin: username=admin, password=admin123"
echo "   Agency: username=agency1, password=agency123"
echo ""
echo "Press Ctrl+C to stop both servers"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    echo "✅ Servers stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait 