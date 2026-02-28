# 🚀 Deployment Guide - Lawyer Case Management System

Deploy your application to VPS with Caddy reverse proxy.

## 📋 Prerequisites

- VPS Server: `72.61.180.111`
- SSH Access: `ssh mohammedx@72.61.180.111`
- Domain: `CihanAttorney.quantumkrd.com`
- Caddy installed on VPS

## 🎯 Deployment Steps

### Step 1: Prepare Your Local Project

Before deploying, you need to build the frontend and prepare environment files.

#### 1.1 Build Frontend for Production

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (if not already installed)
npm install

# Build for production
npm run build
```

This creates a `dist` folder with optimized static files.

#### 1.2 Update Production Environment Variables

Edit `backend/.env.production` and update:
- `DB_PASSWORD`: Your PostgreSQL password
- `JWT_SECRET`: Generate a strong secret (use: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)

### Step 2: Set Up VPS Server

SSH into your server:
```bash
ssh mohammedx@72.61.180.111
```

#### 2.1 Install Required Software

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (using NodeSource)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2 globally
sudo npm install -g pm2

# Verify Caddy is installed
caddy version
```

#### 2.2 Set Up PostgreSQL Database

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt, run:
CREATE DATABASE lawyer_db;
CREATE USER postgres WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE lawyer_db TO postgres;
\q
```

#### 2.3 Create Application Directories

```bash
sudo mkdir -p /var/www/lawyer-app/{backend,frontend}
sudo mkdir -p /var/log/pm2
sudo mkdir -p /var/log/caddy
sudo chown -R mohammedx:mohammedx /var/www/lawyer-app
```

### Step 3: Upload Files to VPS

From your **local machine** (Windows), run these commands in PowerShell:

```powershell
# Upload backend files
scp -r backend mohammedx@72.61.180.111:/var/www/lawyer-app/

# Upload frontend build
scp -r frontend\dist\* mohammedx@72.61.180.111:/var/www/lawyer-app/frontend/

# Upload configuration files
scp ecosystem.config.cjs mohammedx@72.61.180.111:/var/www/lawyer-app/
scp Caddyfile mohammedx@72.61.180.111:~/

# Upload production environment file as .env
scp backend\.env.production mohammedx@72.61.180.111:/var/www/lawyer-app/backend/.env
```

### Step 4: Configure Backend on VPS

SSH back into your VPS:

```bash
ssh mohammedx@72.61.180.111

# Navigate to backend
cd /var/www/lawyer-app/backend

# Install dependencies (production only)
npm install --production

# Create uploads directory
mkdir -p uploads
chmod 775 uploads

# Test the backend (optional)
node src/server.js
# Press Ctrl+C to stop
```

### Step 5: Start Backend with PM2

```bash
cd /var/www/lawyer-app

# Start the application
pm2 start ecosystem.config.cjs

# Save PM2 configuration
pm2 save

# Set PM2 to start on boot
pm2 startup
# Copy and run the command it outputs

# Check status
pm2 status
pm2 logs lawyer-backend
```

### Step 6: Configure Caddy

```bash
# Copy Caddyfile to Caddy config directory
sudo cp ~/Caddyfile /etc/caddy/Caddyfile

# Test Caddy configuration
sudo caddy validate --config /etc/caddy/Caddyfile

# Restart Caddy
sudo systemctl restart caddy

# Enable Caddy to start on boot
sudo systemctl enable caddy

# Check Caddy status
sudo systemctl status caddy
```

### Step 7: Configure DNS

In your domain provider's DNS settings for `quantumkrd.com`, add/update:

```
Type: A
Name: CihanAttorney
Value: 72.61.180.111
TTL: 3600 (or Auto)
```

Wait 5-10 minutes for DNS propagation.

### Step 8: Verify Deployment

1. **Check Backend API:**
   ```bash
   curl http://localhost:5000/api/health
   ```

2. **Check Caddy Reverse Proxy:**
   ```bash
   curl https://CihanAttorney.quantumkrd.com/api/health
   ```

3. **Visit in Browser:**
   - Navigate to: `https://CihanAttorney.quantumkrd.com`
   - Caddy will automatically provision SSL certificate

## 🔧 Useful Commands

### PM2 Commands
```bash
pm2 status                      # Show all processes
pm2 logs lawyer-backend        # View logs
pm2 restart lawyer-backend     # Restart app
pm2 stop lawyer-backend        # Stop app
pm2 delete lawyer-backend      # Remove app
pm2 monit                      # Monitor resources
```

### Caddy Commands
```bash
sudo systemctl status caddy     # Check Caddy status
sudo systemctl restart caddy    # Restart Caddy
sudo systemctl stop caddy       # Stop Caddy
sudo systemctl start caddy      # Start Caddy
sudo journalctl -u caddy -f     # View live logs
```

### PostgreSQL Commands
```bash
sudo -u postgres psql lawyer_db          # Connect to database
sudo systemctl status postgresql         # Check PostgreSQL status
sudo systemctl restart postgresql        # Restart PostgreSQL
```

## 🔄 Updating Your Application

When you make changes and want to redeploy:

### Update Backend:
```bash
# On local machine
scp -r backend\src mohammedx@72.61.180.111:/var/www/lawyer-app/backend/

# On VPS
ssh mohammedx@72.61.180.111
cd /var/www/lawyer-app/backend
npm install --production  # If package.json changed
pm2 restart lawyer-backend
```

### Update Frontend:
```bash
# On local machine
cd frontend
npm run build
scp -r dist\* mohammedx@72.61.180.111:/var/www/lawyer-app/frontend/

# No restart needed - Caddy serves static files
```

## 🔒 Security Recommendations

1. **Firewall Configuration:**
   ```bash
   sudo ufw allow 22/tcp      # SSH
   sudo ufw allow 80/tcp      # HTTP
   sudo ufw allow 443/tcp     # HTTPS
   sudo ufw enable
   ```

2. **Change Default PostgreSQL Port (optional):**
   Edit `/etc/postgresql/*/main/postgresql.conf`

3. **Regular Updates:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   npm update -g pm2
   ```

4. **Backup Database:**
   ```bash
   pg_dump -U postgres lawyer_db > backup_$(date +%Y%m%d).sql
   ```

## 🐛 Troubleshooting

### Backend Not Starting:
```bash
pm2 logs lawyer-backend --lines 100
# Check for errors in database connection or missing environment variables
```

### Caddy SSL Issues:
```bash
sudo journalctl -u caddy -n 50
# Ensure DNS is pointing to your server
# Check if port 443 is open
```

### Database Connection Failed:
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check connection
sudo -u postgres psql -c "SELECT version();"

# Verify .env file in backend directory
cat /var/www/lawyer-app/backend/.env
```

### 502 Bad Gateway:
- Check if backend is running: `pm2 status`
- Check backend logs: `pm2 logs lawyer-backend`
- Verify port 5000 in use: `sudo netstat -tlnp | grep 5000`

## 📞 Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs lawyer-backend`
2. Check Caddy logs: `sudo journalctl -u caddy -f`
3. Verify services are running: `pm2 status` and `sudo systemctl status caddy`

## ✅ Deployment Checklist

- [ ] Frontend built successfully (`npm run build`)
- [ ] Production environment variables configured
- [ ] PostgreSQL database created on VPS
- [ ] Application files uploaded to `/var/www/lawyer-app`
- [ ] Backend dependencies installed
- [ ] PM2 process running
- [ ] Caddy configured and running
- [ ] DNS A record pointing to VPS IP
- [ ] HTTPS certificate auto-provisioned by Caddy
- [ ] Application accessible at `https://CihanAttorney.quantumkrd.com`

---

**Your application should now be live! 🎉**

Visit: https://CihanAttorney.quantumkrd.com
