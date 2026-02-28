#!/bin/bash

# Lawyer Case Management System - Deployment Script
# This script should be run on your VPS server

set -e  # Exit on error

echo "🚀 Starting Lawyer App Deployment..."

# Configuration
APP_DIR="/var/www/lawyer-app"
DOMAIN="CihanAttorney.quantumkrd.com"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}📦 Step 1: Installing system dependencies...${NC}"
sudo apt update
sudo apt install -y nodejs npm postgresql postgresql-contrib git

echo -e "${YELLOW}📦 Step 2: Installing PM2 globally...${NC}"
sudo npm install -g pm2

echo -e "${YELLOW}📂 Step 3: Creating application directory...${NC}"
sudo mkdir -p $APP_DIR
sudo mkdir -p $APP_DIR/backend
sudo mkdir -p $APP_DIR/frontend
sudo mkdir -p /var/log/pm2
sudo mkdir -p /var/log/caddy

echo -e "${YELLOW}🔧 Step 4: Setting up PostgreSQL database...${NC}"
echo "Please run these commands manually in PostgreSQL:"
echo "  sudo -u postgres psql"
echo "  CREATE DATABASE lawyer_db;"
echo "  CREATE USER postgres WITH ENCRYPTED PASSWORD 'your_password';"
echo "  GRANT ALL PRIVILEGES ON DATABASE lawyer_db TO postgres;"
echo "  \\q"
read -p "Press Enter after setting up the database..."

echo -e "${YELLOW}📋 Step 5: Copying application files...${NC}"
echo "Upload your files to the server using:"
echo "  scp -r ./backend mohammedx@72.61.180.111:$APP_DIR/"
echo "  scp -r ./frontend/dist mohammedx@72.61.180.111:$APP_DIR/frontend/"
echo "  scp ./ecosystem.config.cjs mohammedx@72.61.180.111:$APP_DIR/"
echo "  scp ./backend/.env.production mohammedx@72.61.180.111:$APP_DIR/backend/.env"
read -p "Press Enter after uploading files..."

echo -e "${YELLOW}📦 Step 6: Installing backend dependencies...${NC}"
cd $APP_DIR/backend
npm install --production

echo -e "${YELLOW}🔒 Step 7: Setting up permissions...${NC}"
sudo chown -R $USER:$USER $APP_DIR
chmod -R 755 $APP_DIR
sudo mkdir -p $APP_DIR/backend/uploads
sudo chmod -R 775 $APP_DIR/backend/uploads

echo -e "${YELLOW}🚀 Step 8: Starting backend with PM2...${NC}"
cd $APP_DIR
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup

echo -e "${YELLOW}🌐 Step 9: Configuring Caddy...${NC}"
sudo cp $APP_DIR/../Caddyfile /etc/caddy/Caddyfile
sudo systemctl restart caddy
sudo systemctl enable caddy

echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo "🔍 Useful commands:"
echo "  pm2 status             - Check application status"
echo "  pm2 logs lawyer-backend - View backend logs"
echo "  pm2 restart lawyer-backend - Restart backend"
echo "  sudo systemctl status caddy - Check Caddy status"
echo "  sudo journalctl -u caddy -f - View Caddy logs"
echo ""
echo "🌐 Your application should now be available at: https://$DOMAIN"
