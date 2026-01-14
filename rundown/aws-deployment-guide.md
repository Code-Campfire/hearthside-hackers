# AWS EC2 Deployment Guide - Personal Budget Analyzer

This guide will walk you through deploying the Personal Budget Analyzer to AWS EC2 with a custom domain and SSL.

## Prerequisites

- [x] AWS account created
- [x] GoDaddy domain registered
- [ ] AWS CLI installed (optional, but helpful)
- [ ] SSH key pair for EC2 access

---

## Part 1: Launch EC2 Instance

### Step 1.1: Create EC2 Instance

1. **Log in to AWS Console:** https://console.aws.amazon.com
2. **Navigate to EC2:** Search for "EC2" in the top search bar
3. **Click "Launch Instance"**

### Step 1.2: Configure Instance

**Name and tags:**
```
Name: budget-analyzer-server
```

**Application and OS Images (AMI):**
```
- Select: Ubuntu Server 24.04 LTS (or 22.04 LTS)
- Architecture: 64-bit (x86)
- AMI: Ubuntu Server 24.04 LTS (Free tier eligible)
```

**Instance type:**
```
- Select: t2.micro (Free tier eligible)
- 1 vCPU, 1 GB RAM
```

**Key pair (login):**
```
- Click "Create new key pair"
- Key pair name: budget-analyzer-key
- Key pair type: RSA
- Private key file format: .pem (for Mac/Linux) or .ppk (for Windows/PuTTY)
- Click "Create key pair" - downloads file
- SAVE THIS FILE SECURELY - you need it to SSH into your server
```

**Network settings:**
```
- Click "Edit"
- Auto-assign public IP: Enable
- Firewall (security groups): Create security group
- Security group name: budget-analyzer-sg
- Description: Security group for budget analyzer app

Add these rules:
1. SSH
   - Type: SSH
   - Protocol: TCP
   - Port: 22
   - Source: My IP (or Anywhere for easier access - less secure)

2. HTTP
   - Type: HTTP
   - Protocol: TCP
   - Port: 80
   - Source: Anywhere (0.0.0.0/0, ::/0)

3. HTTPS
   - Type: HTTPS
   - Protocol: TCP
   - Port: 443
   - Source: Anywhere (0.0.0.0/0, ::/0)

4. Custom TCP (Frontend dev server - temporary)
   - Type: Custom TCP
   - Protocol: TCP
   - Port: 5173
   - Source: Anywhere (0.0.0.0/0, ::/0)

5. Custom TCP (Backend API - temporary)
   - Type: Custom TCP
   - Protocol: TCP
   - Port: 3001
   - Source: Anywhere (0.0.0.0/0, ::/0)
```

**Configure storage:**
```
- Size: 20 GB (free tier allows up to 30 GB)
- Volume type: gp3
- Delete on termination: Yes (default)
```

**Advanced details:**
- Leave as default for now

### Step 1.3: Launch Instance

1. **Click "Launch instance"**
2. Wait for instance state to show "Running" (takes 1-2 minutes)
3. **Note your Public IPv4 address** (something like 3.25.45.67)

---

## Part 2: Connect to EC2 Instance

### Step 2.1: Set Key Permissions (Mac/Linux)

```bash
# Move key to .ssh directory (recommended)
mv ~/Downloads/budget-analyzer-key.pem ~/.ssh/

# Set correct permissions
chmod 400 ~/.ssh/budget-analyzer-key.pem
```

### Step 2.2: Connect via SSH

```bash
# Replace <YOUR_EC2_PUBLIC_IP> with your actual IP
ssh -i ~/.ssh/budget-analyzer-key.pem ubuntu@<YOUR_EC2_PUBLIC_IP>

# Example:
# ssh -i ~/.ssh/budget-analyzer-key.pem ubuntu@3.25.45.67

# Type "yes" when prompted about authenticity
```

**For Windows (using PuTTY):**
- Use PuTTYgen to convert .pem to .ppk
- Use PuTTY with the .ppk key file
- Host: ubuntu@<YOUR_EC2_PUBLIC_IP>

---

## Part 3: Install Docker & Docker Compose

### Step 3.1: Update System

```bash
sudo apt update
sudo apt upgrade -y
```

### Step 3.2: Install Docker

```bash
# Install Docker
sudo apt install docker.io -y

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add ubuntu user to docker group (avoid needing sudo)
sudo usermod -aG docker ubuntu

# Log out and back in for group changes to take effect
exit
# Then SSH back in
ssh -i ~/.ssh/budget-analyzer-key.pem ubuntu@<YOUR_EC2_PUBLIC_IP>

# Verify Docker installation
docker --version
```

### Step 3.3: Install Docker Compose

```bash
# Install Docker Compose
sudo apt install docker-compose -y

# Verify installation
docker-compose --version
```

### Step 3.4: Install Git

```bash
sudo apt install git -y
git --version
```

---

## Part 4: Clone and Configure Your Application

### Step 4.1: Clone Repository

```bash
# Clone your repo (replace with your actual repo URL)
git clone https://github.com/YOUR_USERNAME/hearthside-hackers.git

# Navigate to project
cd hearthside-hackers
```

### Step 4.2: Configure Environment Variables

**Backend environment:**
```bash
# Create backend .env file
cat > backend/.env << 'EOF'
PORT=3001
DB_HOST=database
DB_PORT=5432
DB_NAME=budget_analyzer
DB_USER=postgres
DB_PASSWORD=your_secure_password_here_change_this
NODE_ENV=production
EOF
```

**Frontend environment:**
```bash
# Create frontend .env file
# Replace YOUR_DOMAIN with your actual domain
cat > frontend/.env << 'EOF'
VITE_API_URL=http://YOUR_DOMAIN.com
EOF

# Example:
# VITE_API_URL=http://mybudgetapp.com
```

**IMPORTANT:** Change `your_secure_password_here_change_this` to a strong password!

### Step 4.3: Update Docker Compose for Production (Optional)

You can use your existing `docker-compose.yml` as-is for now. Later, you might want to create a `docker-compose.prod.yml` for production-specific settings.

---

## Part 5: Deploy Application

### Step 5.1: Start Docker Containers

```bash
# Start all services (database, backend, frontend)
docker-compose up -d

# View logs to ensure everything started correctly
docker-compose logs -f

# Press Ctrl+C to exit logs

# Check running containers
docker-compose ps
```

### Step 5.2: Verify Application is Running

```bash
# Check backend health
curl http://localhost:3001/api/health

# Should return JSON with database: "connected"

# Check frontend (from your local browser)
# Open: http://<YOUR_EC2_PUBLIC_IP>:5173
```

---

## Part 6: Configure GoDaddy DNS

### Step 6.1: Get Your EC2 Public IP

```bash
# In AWS EC2 Console, find your instance's "Public IPv4 address"
# Example: 3.25.45.67
```

### Step 6.2: Update GoDaddy DNS Records

1. **Log in to GoDaddy:** https://www.godaddy.com
2. **Go to:** My Products → Domains → Your Domain → DNS
3. **Add/Edit DNS Records:**

**A Record for root domain:**
```
Type: A
Name: @
Value: <YOUR_EC2_PUBLIC_IP>
TTL: 600 seconds (10 minutes)
```

**A Record for www subdomain:**
```
Type: A
Name: www
Value: <YOUR_EC2_PUBLIC_IP>
TTL: 600 seconds
```

**Save changes**

### Step 6.3: Wait for DNS Propagation

- DNS changes take 5-30 minutes (sometimes up to 48 hours)
- Check propagation: https://dnschecker.org
- Enter your domain and check if it resolves to your EC2 IP

### Step 6.4: Test Domain

```bash
# From your local machine (after DNS propagates)
curl http://yourdomain.com:5173
curl http://yourdomain.com:3001/api/health
```

---

## Part 7: Set Up Nginx Reverse Proxy

Right now, users need to access your app with port numbers (`:5173`, `:3001`). Let's fix that with nginx.

### Step 7.1: Install Nginx

```bash
# SSH into your EC2 instance
sudo apt install nginx -y

# Start nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 7.2: Configure Nginx

```bash
# Create nginx config for your app
sudo nano /etc/nginx/sites-available/budget-analyzer

# Paste this configuration (replace YOUR_DOMAIN.com):
```

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN.com www.YOUR_DOMAIN.com;

    # Frontend (React app)
    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Save and exit:** Ctrl+X, then Y, then Enter

### Step 7.3: Enable Configuration

```bash
# Create symbolic link to enable site
sudo ln -s /etc/nginx/sites-available/budget-analyzer /etc/nginx/sites-enabled/

# Remove default nginx site
sudo rm /etc/nginx/sites-enabled/default

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

### Step 7.4: Test Your Domain

```bash
# From your local browser:
http://yourdomain.com

# Should now show your app WITHOUT port numbers!
```

---

## Part 8: Set Up SSL (HTTPS) with Let's Encrypt

### Step 8.1: Install Certbot

```bash
# Install Certbot and nginx plugin
sudo apt install certbot python3-certbot-nginx -y
```

### Step 8.2: Obtain SSL Certificate

```bash
# Replace YOUR_DOMAIN.com with your actual domain
sudo certbot --nginx -d YOUR_DOMAIN.com -d www.YOUR_DOMAIN.com

# Follow the prompts:
# - Enter your email address
# - Agree to terms of service (Y)
# - Share email with EFF (optional - Y or N)
# - Certbot will automatically configure nginx for HTTPS

# Choose option 2: Redirect HTTP to HTTPS (recommended)
```

### Step 8.3: Test HTTPS

```bash
# From your browser:
https://yourdomain.com

# Should show secure lock icon and your app!
```

### Step 8.4: Update Frontend Environment

```bash
# Update frontend .env to use HTTPS
nano frontend/.env

# Change to:
VITE_API_URL=https://YOUR_DOMAIN.com
```

```bash
# Rebuild frontend container
docker-compose up -d --build frontend
```

### Step 8.5: Auto-Renewal

```bash
# Certbot automatically sets up auto-renewal
# Test renewal process:
sudo certbot renew --dry-run

# If successful, you're all set! Certificates auto-renew every 90 days.
```

---

## Part 9: Final Verification

### Step 9.1: Test Everything

From your browser, test:
- [ ] https://yourdomain.com → Shows frontend
- [ ] https://yourdomain.com/api/health → Shows backend health
- [ ] Create a test transaction (if implemented)
- [ ] Upload a receipt (if implemented)

### Step 9.2: Monitor Application

```bash
# View logs
docker-compose logs -f

# Check running containers
docker-compose ps

# Check nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Check SSL certificate expiry
sudo certbot certificates
```

---

## Part 10: Maintenance Commands

### Useful Commands

```bash
# SSH into server
ssh -i ~/.ssh/budget-analyzer-key.pem ubuntu@<YOUR_EC2_IP>

# Restart all containers
docker-compose restart

# Stop all containers
docker-compose down

# Start all containers
docker-compose up -d

# Rebuild after code changes
git pull origin main
docker-compose up -d --build

# View database
docker exec -it budget-analyzer-db psql -U postgres -d budget_analyzer

# Check disk space
df -h

# Check memory usage
free -h

# Restart nginx
sudo systemctl restart nginx
```

### Update Application

```bash
# Pull latest code
cd ~/hearthside-hackers
git pull origin main

# Rebuild and restart containers
docker-compose up -d --build

# Check logs
docker-compose logs -f
```

---

## Troubleshooting

### Frontend shows "Not Connected"

```bash
# Check backend is running
docker-compose ps
curl http://localhost:3001/api/health

# Check backend logs
docker-compose logs backend

# Verify database connection
docker-compose logs database
```

### Domain doesn't resolve

```bash
# Check DNS propagation
# Visit: https://dnschecker.org

# Check nginx is running
sudo systemctl status nginx

# Check nginx configuration
sudo nginx -t

# View nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### SSL certificate issues

```bash
# Renew certificate manually
sudo certbot renew

# Check certificate status
sudo certbot certificates

# Test nginx configuration
sudo nginx -t
```

### Port conflicts

```bash
# Check what's using port 80
sudo lsof -i :80

# Check what's using port 443
sudo lsof -i :443
```

---

## Cost Monitoring

### Set Up Billing Alert

1. **Go to:** AWS Console → CloudWatch → Billing
2. **Create Alarm:**
   - Metric: EstimatedCharges
   - Threshold: $1 (or your preferred amount)
   - Email: Your email address
3. **Confirm subscription** via email

### Check Current Charges

1. **Go to:** AWS Console → Billing Dashboard
2. **View:** Month-to-date charges
3. **Free tier usage:** Shows remaining free tier hours

---

## Terminating Resources (After Demo)

### When you're done with the demo:

```bash
# SSH into EC2
ssh -i ~/.ssh/budget-analyzer-key.pem ubuntu@<YOUR_EC2_IP>

# Stop containers (optional - saves data)
docker-compose down

# Or remove everything including volumes
docker-compose down -v
```

### Terminate EC2 Instance

1. **AWS Console → EC2 → Instances**
2. **Select your instance**
3. **Instance State → Terminate instance**
4. **Confirm termination**

**IMPORTANT:** "Stop" pauses the instance (still charges for storage). "Terminate" deletes it completely (no charges).

---

## Architecture Diagram

```
Internet
    ↓
[GoDaddy DNS] → yourdomain.com points to EC2 IP
    ↓
[AWS EC2 Instance]
    ↓
[Nginx Reverse Proxy] :80, :443
    ├─→ / → Frontend :5173 (React/Vite)
    └─→ /api → Backend :3001 (Node/Express)
              ↓
         [PostgreSQL Container] :5432
```

---

## Resume/Interview Talking Points

**What you built:**
- "Deployed full-stack TypeScript application to AWS EC2 with Docker"
- "Configured RDS PostgreSQL database with connection pooling"
- "Set up nginx reverse proxy with SSL termination using Let's Encrypt"
- "Configured custom domain DNS routing through GoDaddy"
- "Implemented security groups for network isolation"
- "Set up CloudWatch billing alarms for cost monitoring"

**Technologies:**
- AWS EC2 (t2.micro compute instance)
- Docker & Docker Compose (containerization)
- PostgreSQL (relational database)
- Nginx (reverse proxy & load balancer)
- Let's Encrypt (SSL/TLS certificates)
- Ubuntu Server (Linux administration)

**Skills demonstrated:**
- Cloud deployment (AWS)
- DevOps (Docker, nginx, SSL)
- Linux server administration
- Network configuration (DNS, security groups)
- Database administration
- Cost optimization (free tier usage)

---

## Next Steps

1. **Implement database schema** (see CLAUDE.md)
2. **Add authentication** (JWT + bcrypt)
3. **Deploy receipt scanner feature** (see receipt-scanner-rundown.md)
4. **Set up CI/CD** (GitHub Actions for auto-deployment)
5. **Add monitoring** (CloudWatch logs)

---

## Resources

- AWS EC2 Documentation: https://docs.aws.amazon.com/ec2
- Docker Documentation: https://docs.docker.com
- Nginx Documentation: https://nginx.org/en/docs
- Let's Encrypt Documentation: https://letsencrypt.org/docs
- Certbot Documentation: https://certbot.eff.org/docs

---

**Date Created:** 2026-01-13
**Last Updated:** 2026-01-13
