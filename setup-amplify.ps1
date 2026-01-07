# AuraNotes - Amplify Setup and Migration Script for Windows

Write-Host "🚀 Setting up AWS Amplify for AuraNotes..." -ForegroundColor Green
Write-Host "This will replace the localStorage system with cloud persistence." -ForegroundColor Yellow
Write-Host ""

# Step 1: Generate Amplify configuration
Write-Host "Step 1: Starting Amplify sandbox..." -ForegroundColor Cyan
Write-Host "This will create amplify_outputs.json with your database connection info." -ForegroundColor Gray

try {
    npx ampx sandbox --once
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Amplify sandbox configured successfully!" -ForegroundColor Green
        Write-Host ""
        
        # Step 2: Start the development server
        Write-Host "Step 2: Starting the application with Amplify..." -ForegroundColor Cyan
        Write-Host "🔐 You'll see an authentication screen first - sign up to create your account." -ForegroundColor Yellow
        Write-Host "📁 Your folders and notes will now persist in AWS DynamoDB (no more localStorage issues!)" -ForegroundColor Green
        Write-Host ""
        
        npm run dev
    } else {
        throw "Amplify sandbox setup failed"
    }
}
catch {
    Write-Host "❌ Amplify sandbox setup failed. Please check your AWS credentials." -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Make sure you have AWS CLI configured: aws configure" -ForegroundColor Gray
    Write-Host "2. Or set environment variables: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY" -ForegroundColor Gray
    Write-Host "3. Then run: npx ampx sandbox" -ForegroundColor Gray
}