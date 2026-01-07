#!/bin/bash

# AuraNotes - Amplify Setup and Migration Script

echo "🚀 Setting up AWS Amplify for AuraNotes..."
echo "This will replace the localStorage system with cloud persistence."
echo ""

# Step 1: Generate Amplify configuration
echo "Step 1: Starting Amplify sandbox..."
echo "This will create amplify_outputs.json with your database connection info."
npx ampx sandbox --once

if [ $? -eq 0 ]; then
    echo "✅ Amplify sandbox configured successfully!"
    echo ""
    
    # Step 2: Start the development server
    echo "Step 2: Starting the application with Amplify..."
    echo "🔐 You'll see an authentication screen first - sign up to create your account."
    echo "📁 Your folders and notes will now persist in AWS DynamoDB (no more localStorage issues!)"
    echo ""
    
    npm run dev
else
    echo "❌ Amplify sandbox setup failed. Please check your AWS credentials."
    echo ""
    echo "Troubleshooting:"
    echo "1. Make sure you have AWS CLI configured: aws configure"
    echo "2. Or set environment variables: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY"
    echo "3. Then run: npx ampx sandbox"
fi