#!/bin/bash
# Deploy Ancor Backend to Railway with GCP Credentials

echo "🚀 Deploying Ancor Backend to Railway..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the backend directory"
    exit 1
fi

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Please install it first:"
    echo "   npm install -g @railway/cli"
    echo "   railway login"
    exit 1
fi

# Check if user is logged in to Railway
if ! railway whoami &> /dev/null; then
    echo "❌ Please login to Railway first:"
    echo "   railway login"
    exit 1
fi

echo "✅ Railway CLI is ready"

# Deploy to Railway
echo "📦 Deploying to Railway..."
railway up

echo ""
echo "🎉 Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Go to https://railway.app/dashboard"
echo "2. Select your ancor-production project"
echo "3. Go to Variables tab"
echo "4. Add your GCP credentials:"
echo "   - GCP_PROJECT_ID=your-project-id"
echo "   - GCP_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com"
echo "   - GCP_KEY_FILE='{\"type\":\"service_account\",...}'"
echo "   - GCP_REGION=us-central1"
echo ""
echo "5. Test the deployment:"
echo "   curl https://ancor-production.up.railway.app/api/test-gcp"
echo ""
echo "💡 Use the format-gcp-credentials.js script to help format your credentials!"