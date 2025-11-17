#!/bin/bash
# Creates an Azure AD App Registration for AMS OAuth2 authentication
# Run this before deploying with azd

set -e

APP_NAME="${1:-agents-arbiters-ams}"

echo "Creating App Registration: $APP_NAME"

# Check if app already exists
APP_ID=$(az ad app list --display-name "$APP_NAME" --query "[0].appId" -o tsv)

if [ -z "$APP_ID" ]; then
  echo "Creating new App Registration..."
  APP_ID=$(az ad app create \
    --display-name "$APP_NAME" \
    --identifier-uris "api://$APP_NAME" \
    --query "appId" -o tsv)
  echo "✅ Created App Registration with ID: $APP_ID"
else
  echo "✅ App Registration already exists with ID: $APP_ID"
fi

# Get tenant ID
TENANT_ID=$(az account show --query tenantId -o tsv)

# Output configuration
echo ""
echo "============================================"
echo "AMS OAuth2 Configuration"
echo "============================================"
echo "App ID (Client ID): $APP_ID"
echo "Tenant ID: $TENANT_ID"
echo "Scope: api://$APP_NAME/.default"
echo "Issuer URL: https://login.microsoftonline.com/$TENANT_ID/v2.0"
echo ""
echo "Add these to your deployment parameters:"
echo "  amsAppId=$APP_ID"
echo "  amsTenantId=$TENANT_ID"
echo "============================================"
