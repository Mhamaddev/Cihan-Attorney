# Lawyer App - Windows Deployment Helper Script
# Run this script from the project root directory: .\deploy-windows.ps1

$ErrorActionPreference = "Stop"

Write-Host "🚀 Lawyer App Deployment Helper" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$VPS_USER = "mohammedx"
$VPS_HOST = "72.61.180.111"
$VPS_PATH = "/var/www/lawyer-app"

# Step 1: Build Frontend
Write-Host "📦 Step 1: Building frontend for production..." -ForegroundColor Yellow
Set-Location frontend

if (-not (Test-Path "node_modules")) {
    Write-Host "   Installing frontend dependencies..." -ForegroundColor Gray
    npm install
}

Write-Host "   Building frontend..." -ForegroundColor Gray
npm run build

if (-not (Test-Path "dist")) {
    Write-Host "❌ Build failed - dist folder not found!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Frontend build successful!" -ForegroundColor Green
Set-Location ..

# Step 2: Upload Backend Files
Write-Host ""
Write-Host "📤 Step 2: Uploading backend files..." -ForegroundColor Yellow
Write-Host "   This will take a moment..." -ForegroundColor Gray

scp -r backend "$VPS_USER@$VPS_HOST`:$VPS_PATH/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to upload backend files!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Backend files uploaded!" -ForegroundColor Green

# Step 3: Upload Frontend Build
Write-Host ""
Write-Host "📤 Step 3: Uploading frontend build..." -ForegroundColor Yellow

# Create temporary directory structure to upload dist contents to frontend/
ssh "$VPS_USER@$VPS_HOST" "mkdir -p $VPS_PATH/frontend"
scp -r frontend\dist\* "$VPS_USER@$VPS_HOST`:$VPS_PATH/frontend/"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to upload frontend files!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Frontend files uploaded!" -ForegroundColor Green

# Step 4: Upload Configuration Files
Write-Host ""
Write-Host "📤 Step 4: Uploading configuration files..." -ForegroundColor Yellow

scp ecosystem.config.cjs "$VPS_USER@$VPS_HOST`:$VPS_PATH/"
scp Caddyfile "$VPS_USER@$VPS_HOST`:~/"
scp backend\.env.production "$VPS_USER@$VPS_HOST`:$VPS_PATH/backend/.env"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to upload configuration files!" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Configuration files uploaded!" -ForegroundColor Green

# Step 5: Install Dependencies and Restart
Write-Host ""
Write-Host "⚙️  Step 5: Installing dependencies and restarting services..." -ForegroundColor Yellow

$remoteCommands = @"
cd $VPS_PATH/backend && \
npm install --production && \
mkdir -p uploads && \
chmod 775 uploads && \
cd $VPS_PATH && \
pm2 restart lawyer-backend || pm2 start ecosystem.config.cjs && \
sudo cp ~/Caddyfile /etc/caddy/Caddyfile && \
sudo systemctl reload caddy
"@

ssh "$VPS_USER@$VPS_HOST" $remoteCommands

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Some commands may have failed. Check the output above." -ForegroundColor Yellow
} else {
    Write-Host "✅ Services restarted successfully!" -ForegroundColor Green
}

# Summary
Write-Host ""
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✨ Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Your application should be available at:" -ForegroundColor White
Write-Host "  https://CihanAttorney.quantumkrd.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "To check status, SSH into your server and run:" -ForegroundColor White
Write-Host "  ssh $VPS_USER@$VPS_HOST" -ForegroundColor Gray
Write-Host "  pm2 status" -ForegroundColor Gray
Write-Host "  pm2 logs lawyer-backend" -ForegroundColor Gray
Write-Host ""
