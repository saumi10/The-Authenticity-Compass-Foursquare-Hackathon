#!/bin/bash

# Foursquare Authenticity Compass Setup Script
# This script will set up the complete project structure

echo "🧭 Setting up Foursquare Authenticity Compass..."
echo "================================================="

# Create project directory
PROJECT_NAME="foursquare-authenticity-compass"

if [ -d "$PROJECT_NAME" ]; then
    echo "❌ Directory $PROJECT_NAME already exists!"
    read -p "Do you want to remove it and continue? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rm -rf "$PROJECT_NAME"
        echo "✅ Removed existing directory"
    else
        echo "❌ Setup cancelled"
        exit 1
    fi
fi

echo "📁 Creating project structure..."
mkdir -p "$PROJECT_NAME"
cd "$PROJECT_NAME"

# Create directory structure
mkdir -p src/api src/utils src/config public/assets/icons docs

echo "📦 Initializing package.json..."
cat > package.json << 'EOF'
{
  "name": "foursquare-authenticity-compass",
  "version": "1.0.0",
  "description": "Discover authentic local experiences using Foursquare API and AI scoring",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [
    "foursquare",
    "authenticity",
    "local",
    "discovery",
    "hackathon"
  ],
  "author": "Your Name",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "node-fetch": "^3.3.2"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  },
  "type": "module"
}
EOF

echo "🔧 Creating environment configuration..."
cat > .env.example << 'EOF'
# Foursquare API Configuration
# Get your API key from: https://foursquare.com/developers/signup
FOURSQUARE_API_KEY=your_foursquare_api_key_here

# Server Configuration
PORT=3000

# Development
NODE_ENV=development
EOF

echo "📄 Creating .gitignore..."
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Build
dist/
build/
EOF

echo "📋 Setup complete! Next steps:"
echo "================================"
echo "1. 🔑 Get your Foursquare API key:"
echo "   → Visit: https://foursquare.com/developers/signup"
echo "   → Create an account and new app"
echo "   → Copy your API key"
echo ""
echo "2. 📝 Configure environment:"
echo "   → cp .env.example .env"
echo "   → Edit .env and add your API key"
echo ""
echo "3. 📦 Install dependencies:"
echo "   → npm install"
echo ""
echo "4. 🚀 Start development server:"
echo "   → npm run dev"
echo ""
echo "5. 🌐 Open in browser:"
echo "   → http://localhost:3000"
echo ""
echo "⚠️  Important: You'll need to copy the remaining files manually:"
echo "   - server.js (Express server)"
echo "   - src/api/foursquare.js (Foursquare API integration)"
echo "   - src/utils/authenticity.js (Authenticity scoring)"
echo "   - src/config/config.js (Configuration)"
echo "   - public/index.html (Frontend HTML)"
echo "   - public/styles.css (Frontend CSS)"
echo "   - public/script.js (Frontend JavaScript)"
echo "   - README.md (Documentation)"
echo ""
echo "📚 All file contents are available in the Claude artifacts above!"
echo "🎉 Happy coding!"
