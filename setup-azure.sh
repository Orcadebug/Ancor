#!/bin/bash

# Azure Setup Script for AI Infrastructure Platform
# Run this in Azure Cloud Shell

echo "🚀 Setting up Azure resources for AI Infrastructure Platform..."

# Variables
RESOURCE_GROUP="ai-platform-rg"
LOCATION="eastus"
STORAGE_ACCOUNT="aiplatformstorage$(date +%s)"
CONTAINER_REGISTRY="aiplatformacr$(date +%s)"

echo "📋 Configuration:"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Location: $LOCATION"
echo "  Storage Account: $STORAGE_ACCOUNT"
echo "  Container Registry: $CONTAINER_REGISTRY"
echo ""

# 1. Create Resource Group
echo "🏗️  Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION

# 2. Create Storage Account
echo "📦 Creating storage account..."
az storage account create \
  --name $STORAGE_ACCOUNT \
  --resource-group $RESOURCE_GROUP \
  --location $LOCATION \
  --sku Standard_LRS \
  --allow-blob-public-access true

# 3. Create Container Registry
echo "🐳 Creating container registry..."
az acr create \
  --resource-group $RESOURCE_GROUP \
  --name $CONTAINER_REGISTRY \
  --sku Basic \
  --admin-enabled true

# 4. Create Service Principal
echo "🔑 Creating service principal..."
SP_OUTPUT=$(az ad sp create-for-rbac --name "ai-platform-sp" --role contributor --scopes /subscriptions/$(az account show --query id -o tsv))

# 5. Get connection strings and keys
echo "🔗 Getting connection strings..."
STORAGE_CONNECTION=$(az storage account show-connection-string --name $STORAGE_ACCOUNT --resource-group $RESOURCE_GROUP --query connectionString -o tsv)
ACR_LOGIN_SERVER=$(az acr show --name $CONTAINER_REGISTRY --resource-group $RESOURCE_GROUP --query loginServer -o tsv)
ACR_USERNAME=$(az acr credential show --name $CONTAINER_REGISTRY --query username -o tsv)
ACR_PASSWORD=$(az acr credential show --name $CONTAINER_REGISTRY --query passwords[0].value -o tsv)

# 6. Output environment variables
echo ""
echo "✅ Azure setup complete!"
echo ""
echo "🔑 Add these environment variables to Railway:"
echo "================================================"
echo "AZURE_CLIENT_ID=$(echo $SP_OUTPUT | jq -r .appId)"
echo "AZURE_CLIENT_SECRET=$(echo $SP_OUTPUT | jq -r .password)"
echo "AZURE_TENANT_ID=$(echo $SP_OUTPUT | jq -r .tenant)"
echo "AZURE_SUBSCRIPTION_ID=$(az account show --query id -o tsv)"
echo "AZURE_RESOURCE_GROUP=$RESOURCE_GROUP"
echo "AZURE_LOCATION=$LOCATION"
echo "AZURE_STORAGE_ACCOUNT=$STORAGE_ACCOUNT"
echo "AZURE_CONTAINER_REGISTRY=$CONTAINER_REGISTRY"
echo "AZURE_STORAGE_CONNECTION_STRING=\"$STORAGE_CONNECTION\""
echo "AZURE_ACR_LOGIN_SERVER=$ACR_LOGIN_SERVER"
echo "AZURE_ACR_USERNAME=$ACR_USERNAME"
echo "AZURE_ACR_PASSWORD=$ACR_PASSWORD"
echo ""
echo "💡 Copy these variables to your Railway backend deployment!"
echo ""
echo "🧪 Test your setup:"
echo "1. Deploy backend to Railway with these variables"
echo "2. Deploy frontend to Vercel"
echo "3. Create a deployment via your platform"
echo "4. Check Azure portal for created resources"
echo ""
echo "💰 Estimated monthly cost: ~$85 (well within student credits)"