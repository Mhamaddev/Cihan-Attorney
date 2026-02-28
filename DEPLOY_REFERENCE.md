# Quick Deployment Reference

## 🚀 Quick Deploy from Windows

```powershell
# From project root directory
.\deploy-windows.ps1
```

## 🔑 SSH Access
```bash
ssh mohammedx@72.61.180.111
```

## 📍 Important Paths on VPS
- **Application:** `/var/www/lawyer-app/`
- **Backend:** `/var/www/lawyer-app/backend/`
- **Frontend:** `/var/www/lawyer-app/frontend/`
- **PM2 Logs:** `/var/log/pm2/`
- **Caddy Logs:** `/var/log/caddy/`

## 🎯 First Time Setup on VPS

```bash
# 1. Create PostgreSQL Database
sudo -u postgres psql
CREATE DATABASE lawyer_db;
CREATE USER postgres WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE lawyer_db TO postgres;
\q

# 2. Upload files from Windows
.\deploy-windows.ps1

# 3. SSH to VPS and start services
ssh mohammedx@72.61.180.111
cd /var/www/lawyer-app
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup

# 4. Configure Caddy
sudo cp ~/Caddyfile /etc/caddy/Caddyfile
sudo systemctl restart caddy
sudo systemctl enable caddy
```

## 🔄 Redeploy After Changes

### Quick Update (from Windows):
```powershell
.\deploy-windows.ps1
```

### Manual Backend Update:
```bash
# SSH to VPS
ssh mohammedx@72.61.180.111
cd /var/www/lawyer-app/backend
git pull  # if using git, or re-upload files
npm install --production
pm2 restart lawyer-backend
```

### Manual Frontend Update:
```powershell
# Local: Build frontend
cd frontend
npm run build

# Upload to VPS
scp -r dist\* mohammedx@72.61.180.111:/var/www/lawyer-app/frontend/
```

## 📊 Monitoring Commands

```bash
# PM2 Status
pm2 status
pm2 logs lawyer-backend
pm2 monit

# System Resources
htop
df -h
free -m

# Caddy Status
sudo systemctl status caddy
sudo journalctl -u caddy -f

# PostgreSQL
sudo systemctl status postgresql
sudo -u postgres psql lawyer_db
```

## 🐛 Troubleshooting

### Backend Issues:
```bash
# Check logs
pm2 logs lawyer-backend --lines 100

# Restart backend
pm2 restart lawyer-backend

# Check if backend is listening
sudo netstat -tlnp | grep 5000
curl http://localhost:5000/api/health
```

### Caddy Issues:
```bash
# Check Caddy logs
sudo journalctl -u caddy -n 50

# Test configuration
sudo caddy validate --config /etc/caddy/Caddyfile

# Restart Caddy
sudo systemctl restart caddy
```

### Database Issues:
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
sudo -u postgres psql -d lawyer_db -c "SELECT version();"

# View connections
sudo -u postgres psql -d lawyer_db -c "SELECT * FROM pg_stat_activity;"
```

### Port Already in Use:
```bash
# Find process using port 5000
sudo lsof -i :5000
# or
sudo netstat -tlnp | grep 5000

# Kill process if needed
sudo kill -9 <PID>
```

## 🔒 Security Checklist

```bash
# Firewall
sudo ufw status
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Update system
sudo apt update && sudo apt upgrade -y

# Check for failed login attempts
sudo journalctl -u ssh | grep "Failed password"
```

## 📦 Environment Variables

### Backend (.env in /var/www/lawyer-app/backend/):
```env
PORT=5000
NODE_ENV=production
DB_USER=postgres
DB_HOST=localhost
DB_NAME=lawyer_db
DB_PASSWORD=your_password
DB_PORT=5432
JWT_SECRET=your_jwt_secret
CORS_ORIGIN=https://CihanAttorney.quantumkrd.com
```

### Frontend (built into production build):
```env
VITE_API_URL=https://CihanAttorney.quantumkrd.com/api
```

## 🌐 DNS Configuration

**Domain:** CihanAttorney.quantumkrd.com  
**Type:** A Record  
**Name:** CihanAttorney  
**Value:** 72.61.180.111  
**TTL:** 3600

## 📞 Testing Endpoints

```bash
# Health Check (API)
curl https://CihanAttorney.quantumkrd.com/api/health

# Health Check (Direct to Backend)
curl http://localhost:5000/api/health

# View Frontend
curl https://CihanAttorney.quantumkrd.com
```

## 🔄 Backup Database

```bash
# Create backup
pg_dump -U postgres lawyer_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
psql -U postgres lawyer_db < backup_20260228_120000.sql
```

## 🎯 Application URLs

- **Production**: https://CihanAttorney.quantumkrd.com
- **API Health**: https://CihanAttorney.quantumkrd.com/api/health
- **Uploads**: https://CihanAttorney.quantumkrd.com/uploads/

---

**For detailed instructions, see [DEPLOYMENT.md](./DEPLOYMENT.md)**
