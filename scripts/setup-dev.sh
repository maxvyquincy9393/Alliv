#!/bin/bash
# ==============================================================================
# Development Environment Setup Script
# ==============================================================================
# This script automates the setup of the COLABMATCH development environment
# ==============================================================================

set -e  # Exit on error

echo "🚀 COLABMATCH Development Environment Setup"
echo "============================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Print colored message
print_message() {
    color=$1
    message=$2
    echo -e "${color}${message}${NC}"
}

# Check prerequisites
echo "📋 Checking prerequisites..."
echo ""

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_message "$GREEN" "✅ Node.js $NODE_VERSION"
else
    print_message "$RED" "❌ Node.js not found. Please install Node.js >= 18"
    exit 1
fi

# Check Python
if command_exists python3 || command_exists python; then
    PYTHON_CMD=$(command_exists python3 && echo "python3" || echo "python")
    PYTHON_VERSION=$($PYTHON_CMD --version)
    print_message "$GREEN" "✅ $PYTHON_VERSION"
else
    print_message "$RED" "❌ Python not found. Please install Python >= 3.11"
    exit 1
fi

# Check Docker (optional)
if command_exists docker; then
    DOCKER_VERSION=$(docker --version)
    print_message "$GREEN" "✅ Docker found: $DOCKER_VERSION"
else
    print_message "$YELLOW" "⚠️  Docker not found (optional for local development)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Setup Backend
echo "🐍 Setting up Backend..."
echo ""

cd backend

# Create virtual environment
if [ ! -d ".venv" ]; then
    print_message "$YELLOW" "Creating Python virtual environment..."
    $PYTHON_CMD -m venv .venv
    print_message "$GREEN" "✅ Virtual environment created"
else
    print_message "$GREEN" "✅ Virtual environment already exists"
fi

# Activate virtual environment
print_message "$YELLOW" "Activating virtual environment..."
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    source .venv/Scripts/activate
else
    source .venv/bin/activate
fi

# Install dependencies
print_message "$YELLOW" "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
pip install -r requirements-test.txt || pip install pytest pytest-asyncio black ruff flake8
print_message "$GREEN" "✅ Python dependencies installed"

# Setup environment file
if [ ! -f ".env" ]; then
    print_message "$YELLOW" "Creating .env file from template..."
    cp ../env.example .env
    
    # Generate secure secrets
    if [ -f "generate_secrets.py" ]; then
        print_message "$YELLOW" "Generating secure JWT secrets..."
        $PYTHON_CMD generate_secrets.py
        print_message "$GREEN" "✅ Secure secrets generated"
    fi
    
    print_message "$GREEN" "✅ .env file created"
    print_message "$YELLOW" "⚠️  Please edit .env file and configure your database and other settings"
else
    print_message "$GREEN" "✅ .env file already exists"
fi

cd ..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Setup Frontend
echo "⚛️  Setting up Frontend..."
echo ""

cd frontend

# Install dependencies
print_message "$YELLOW" "Installing Node.js dependencies..."
npm install
print_message "$GREEN" "✅ Node.js dependencies installed"

# Setup environment file
if [ ! -f ".env" ]; then
    print_message "$YELLOW" "Creating .env file from template..."
    cp env.example .env
    print_message "$GREEN" "✅ .env file created"
    print_message "$YELLOW" "⚠️  Please edit .env file and configure your API URL"
else
    print_message "$GREEN" "✅ .env file already exists"
fi

# Setup Husky
print_message "$YELLOW" "Setting up pre-commit hooks..."
npm run prepare || true
print_message "$GREEN" "✅ Pre-commit hooks configured"

cd ..

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Final instructions
print_message "$GREEN" "✨ Setup Complete!"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Configure your environment files:"
echo "   - backend/.env"
echo "   - frontend/.env"
echo ""
echo "2. Start MongoDB and Redis (if running locally):"
echo "   docker-compose up mongo redis -d"
echo ""
echo "3. Start the development servers:"
echo ""
echo "   Terminal 1 (Backend):"
echo "   cd backend"
echo "   source .venv/bin/activate  # or .venv\\Scripts\\activate on Windows"
echo "   uvicorn app.main:socket_app --reload --port 8080"
echo ""
echo "   Terminal 2 (Frontend):"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "4. Access the application:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:8080"
echo "   API Docs: http://localhost:8080/docs"
echo ""
print_message "$GREEN" "Happy coding! 🚀"
echo ""






