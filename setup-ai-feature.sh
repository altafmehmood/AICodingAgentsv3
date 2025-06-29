#!/bin/bash

# AI Risk Analysis Feature Setup Script
# This script helps set up the AI-enhanced risk analysis feature for local development

echo "🤖 AI Risk Analysis Feature Setup"
echo "================================="
echo ""

# Check if we're in the right directory
if [ ! -f "BreachApi/BreachApi.csproj" ]; then
    echo "❌ Error: Please run this script from the repository root directory"
    echo "   (The directory containing BreachApi/ folder)"
    exit 1
fi

echo "📋 Prerequisites Check:"
echo ""

# Check .NET
if command -v dotnet &> /dev/null; then
    DOTNET_VERSION=$(dotnet --version)
    echo "✅ .NET SDK: $DOTNET_VERSION"
else
    echo "❌ .NET SDK not found. Please install .NET 9.0 or later"
    exit 1
fi

# Check Node.js for Angular
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js: $NODE_VERSION"
else
    echo "⚠️  Node.js not found. This is needed for the Angular frontend"
fi

echo ""
echo "🔧 Setting up Backend:"
echo ""

# Navigate to BreachApi directory
cd BreachApi

# Restore packages
echo "📦 Restoring NuGet packages..."
dotnet restore

if [ $? -eq 0 ]; then
    echo "✅ NuGet packages restored successfully"
else
    echo "❌ Failed to restore NuGet packages"
    exit 1
fi

# Build the project
echo "🔨 Building the project..."
dotnet build

if [ $? -eq 0 ]; then
    echo "✅ Project built successfully"
else
    echo "❌ Build failed"
    exit 1
fi

echo ""
echo "🔑 API Key Configuration:"
echo ""

# Prompt for API key
read -p "Do you have an Anthropic Claude API key? (y/n): " has_api_key

if [ "$has_api_key" = "y" ] || [ "$has_api_key" = "Y" ]; then
    echo ""
    echo "Please enter your Anthropic Claude API key:"
    echo "(It will be stored securely using .NET User Secrets)"
    read -s -p "API Key: " api_key
    echo ""
    
    if [ -n "$api_key" ]; then
        # Set user secret
        dotnet user-secrets set "Claude:ApiKey" "$api_key"
        
        if [ $? -eq 0 ]; then
            echo "✅ API key configured successfully using User Secrets"
        else
            echo "❌ Failed to configure API key"
            exit 1
        fi
    else
        echo "❌ No API key provided"
        exit 1
    fi
else
    echo ""
    echo "📝 To get an Anthropic Claude API key:"
    echo "   1. Visit: https://console.anthropic.com/"
    echo "   2. Sign up or log in"
    echo "   3. Go to 'API Keys' section"
    echo "   4. Create a new API key"
    echo ""
    echo "   After obtaining the key, run this command:"
    echo "   dotnet user-secrets set \"Claude:ApiKey\" \"your-api-key-here\""
fi

echo ""
echo "🧪 Running Tests:"
echo ""

# Run tests
cd ../BreachApi.Tests
dotnet test

if [ $? -eq 0 ]; then
    echo "✅ All tests passed"
else
    echo "⚠️  Some tests failed - this is expected if no API key is configured"
fi

echo ""
echo "📱 Frontend Setup:"
echo ""

# Check if Angular is set up
cd ../breach-viewer

if [ -f "package.json" ]; then
    echo "📦 Installing Angular dependencies..."
    npm install
    
    if [ $? -eq 0 ]; then
        echo "✅ Angular dependencies installed"
    else
        echo "❌ Failed to install Angular dependencies"
    fi
else
    echo "❌ Angular project not found"
fi

cd ..

echo ""
echo "🚀 Setup Complete!"
echo "=================="
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Start the Backend API:"
echo "   cd BreachApi"
echo "   dotnet run"
echo "   (API will be available at https://localhost:7001)"
echo ""
echo "2. Start the Angular Frontend:"
echo "   cd breach-viewer"
echo "   npm start"
echo "   (Frontend will be available at http://localhost:4200)"
echo ""
echo "3. Test the AI Feature:"
echo "   - Navigate to the breach list"
echo "   - Click on any breach to view details"
echo "   - Click 'Generate AI Risk Analysis' button"
echo ""
echo "📖 Documentation:"
echo "   - API Setup Guide: BreachApi/README-AI-SETUP.md"
echo "   - API Documentation: https://localhost:7001/swagger (when running)"
echo ""
echo "🔧 Troubleshooting:"
echo "   - If API key issues: Check BreachApi/README-AI-SETUP.md"
echo "   - For CORS errors: Ensure both frontend and backend are running"
echo "   - For rate limiting: Wait 1 minute between multiple AI requests"
echo ""

if [ "$has_api_key" = "y" ] || [ "$has_api_key" = "Y" ]; then
    echo "✅ Your setup is complete and ready to use!"
else
    echo "⚠️  Remember to configure your Anthropic API key to use the AI features"
fi

echo ""
echo "Happy coding! 🎉"