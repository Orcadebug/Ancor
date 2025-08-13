#!/bin/bash

echo "🚀 AI Infrastructure Management Platform Setup"
echo "=============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please install Node.js 18+."
    exit 1
fi

echo "✅ Node.js $(node --version) detected"

# Create logs directory for backend
echo "📁 Creating necessary directories..."
mkdir -p backend/logs

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
if npm install; then
    echo "✅ Backend dependencies installed successfully"
else
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd ../UI_Components
if npm install; then
    echo "✅ Frontend dependencies installed successfully"
else
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

cd ..

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "Next steps:"
echo "1. Copy backend/.env.example to backend/.env and configure your environment variables"
echo "2. Set up your Supabase database using backend/src/config/database.sql"
echo "3. Configure your AWS credentials"
echo ""
echo "To start development:"
echo "Backend:  cd backend && npm run dev"
echo "Frontend: cd UI_Components && npm run dev"
echo ""
echo "📚 Check README.md for detailed setup instructions"