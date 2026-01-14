# Deployment Progress - Session Notes

**Date:** 2026-01-13
**Status:** Partially deployed - frontend working, auth has bugs

---

## Current Deployment Status

### ✅ What's Working

1. **AWS EC2 Instance**
   - Instance ID: running
   - Public IP: `3.14.11.73`
   - SSH Access: `ssh -i ~/.ssh/budget-analyzer-key.pem ubuntu@3.14.11.73`
   - Location: WSL key stored at `~/.ssh/budget-analyzer-key.pem`

2. **Docker Containers**
   - All three containers running: database, backend, frontend
   - Commands:
     ```bash
     docker-compose ps  # Check status
     docker-compose logs -f  # View logs
     ```

3. **Domain Configuration**
   - Domain: `charliewunderlich.com`
   - Subdomain: `budget.charliewunderlich.com`
   - GoDaddy DNS: A record pointing to `3.14.11.73`
   - DNS is propagating correctly

4. **Frontend**
   - Accessible at: `http://budget.charliewunderlich.com`
   - Vite dev server running successfully
   - Fixed Vite `allowedHosts` issue with config in `frontend/vite.config.ts`
   - Port mapping: `5174:5173` (host:container)

5. **Backend**
   - Running on port 3001
   - API accessible at: `http://budget.charliewunderlich.com/api/*`
   - Health check working: `http://budget.charliewunderlich.com/api/health`

6. **Database**
   - PostgreSQL 17.2 running in Docker container
   - Connection working
   - Users table created with columns: `id`, `email`, `password_hash`, `created_at`, `updated_at`, `name`
   - Access: `docker exec -it budget-analyzer-db psql -U postgres -d budget_analyzer`

7. **Nginx**
   - Reverse proxy configured
   - Routes `/` to frontend (port 5174)
   - Routes `/api` to backend (port 3001)
   - Config: `/etc/nginx/sites-available/budget-analyzer`

---

### ⚠️ What's NOT Working

1. **User Registration**
   - Error: 500 Internal Server Error
   - Backend logs show: `column "name" of relation "users" does not exist` (FIXED by adding name column)
   - New errors appearing after trying to register
   - Need to check backend logs again

2. **User Login**
   - Error: 401 Unauthorized
   - May be related to registration issues
   - Can't test properly until registration works

3. **SSL/HTTPS**
   - Not yet configured
   - Currently using HTTP only (not secure)
   - Need to run: `sudo certbot --nginx -d budget.charliewunderlich.com`

---

## Environment Configuration

### Backend Environment (`backend/.env`)
```
PORT=3001
DB_HOST=database
DB_PORT=5432
DB_NAME=budget_analyzer
DB_USER=postgres
DB_PASSWORD=Xk9mP#vL2nQ$wR8jT5hF
NODE_ENV=production
```

**Note:** May be missing `JWT_SECRET` - need to verify!

### Frontend Environment (`frontend/.env`)
```
VITE_API_URL=http://budget.charliewunderlich.com
```

---

## Database Schema

### Users Table (Created)
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  name VARCHAR(255)  -- Added manually to fix registration error
);
```

**To view:** `\d users` in psql

---

## Key Files Modified for Deployment

1. **`frontend/vite.config.ts`**
   - Added `allowedHosts` configuration to allow domain access
   - Current config:
     ```typescript
     export default defineConfig({
       plugins: [react()],
       server: {
         host: true,
         port: 5173,
         allowedHosts: [
           'budget.charliewunderlich.com'
         ]
       }
     })
     ```

2. **`frontend/Dockerfile`**
   - Updated CMD to include `--host` flag
   - Current: `CMD ["npm", "run", "dev", "--", "--host"]`

3. **Nginx Config** (`/etc/nginx/sites-available/budget-analyzer`)
   - Proxies requests from domain to Docker containers
   - Frontend: `proxy_pass http://localhost:5174;`
   - Backend: `proxy_pass http://localhost:3001;`

---

## Git Branch

**Currently deployed from:** `develop` branch

**Commands used:**
```bash
git clone https://github.com/Code-Campfire/hearthside-hackers.git
cd hearthside-hackers
git checkout develop
```

**Important:** Changes to `vite.config.ts` and `Dockerfile` on EC2 are NOT pushed to GitHub yet.

**To persist changes:**
1. Make same changes locally on your development machine
2. Commit and push to `develop` branch
3. Future deployments will have these changes

---

## Next Steps to Debug Auth Issues

### Step 1: Check if JWT_SECRET is set
```bash
# SSH into EC2
ssh -i ~/.ssh/budget-analyzer-key.pem ubuntu@3.14.11.73
cd hearthside-hackers

# Check backend .env
cat backend/.env | grep JWT_SECRET
```

**If JWT_SECRET is missing:**
```bash
# Add it to backend/.env
nano backend/.env
# Add line: JWT_SECRET=your_super_secret_key_here_at_least_32_characters_long

# Restart backend
docker-compose restart backend
```

### Step 2: Check Backend Logs
```bash
# View recent backend errors
docker-compose logs --tail 50 backend

# Or watch live logs
docker-compose logs -f backend
```

### Step 3: Test Registration via curl
```bash
# Test directly on EC2
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","name":"Test User"}'
```

### Step 4: Check if bcrypt is installed
```bash
# Check backend package.json
cat backend/package.json | grep bcrypt

# If missing, install it
cd backend
docker-compose exec backend npm install bcrypt @types/bcrypt
docker-compose restart backend
```

---

## SSL Setup (When Auth is Fixed)

**Install Certbot:**
```bash
sudo apt install certbot python3-certbot-nginx -y
```

**Get Certificate:**
```bash
sudo certbot --nginx -d budget.charliewunderlich.com
```

**Update frontend .env after SSL:**
```bash
nano frontend/.env
# Change to: VITE_API_URL=https://budget.charliewunderlich.com

# Rebuild frontend
docker-compose up -d --build frontend
```

---

## Useful Commands Reference

### SSH & Navigation
```bash
# Connect to EC2
ssh -i ~/.ssh/budget-analyzer-key.pem ubuntu@3.14.11.73

# Navigate to project
cd ~/hearthside-hackers
```

### Docker Commands
```bash
# Check status
docker-compose ps

# View logs
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f database

# Restart services
docker-compose restart
docker-compose restart backend

# Rebuild after code changes
docker-compose up -d --build

# Stop everything
docker-compose down

# Nuclear option (remove everything including volumes)
docker-compose down -v
```

### Database Commands
```bash
# Connect to database
docker exec -it budget-analyzer-db psql -U postgres -d budget_analyzer

# Inside psql:
\dt                    # List tables
\d users               # Describe users table
SELECT * FROM users;   # View all users
\q                     # Quit
```

### Nginx Commands
```bash
# Test nginx config
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Restart nginx
sudo systemctl restart nginx

# View logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Git Commands
```bash
# Pull latest changes from GitHub
git pull origin develop

# Check current branch
git branch

# View git status
git status
```

---

## AWS Console Access

**EC2 Instance Details:**
- Region: (check AWS console)
- Instance type: t2.micro (free tier)
- Security groups: Open ports 22, 80, 443, 3001, 5174
- Key pair: `budget-analyzer-key.pem`

**To access AWS console:**
1. Go to: https://console.aws.amazon.com
2. Login with your domain email
3. Navigate to EC2 → Instances
4. Find instance with IP `3.14.11.73`

---

## Cost Monitoring

**Current usage:**
- EC2 t2.micro: Free tier (12 months)
- No RDS (using Docker PostgreSQL instead)
- Minimal data transfer

**Set up billing alert:**
1. AWS Console → CloudWatch → Billing
2. Create alarm for $1 threshold

---

## Local Development Workflow

**When making changes locally:**

1. **Make changes on your local machine**
   ```bash
   cd ~/workspace/hearthside-hackers
   # Edit files
   ```

2. **Test locally with Docker**
   ```bash
   docker-compose up -d
   ```

3. **Commit and push to GitHub**
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin develop
   ```

4. **Deploy to EC2**
   ```bash
   # SSH into EC2
   ssh -i ~/.ssh/budget-analyzer-key.pem ubuntu@3.14.11.73
   cd hearthside-hackers

   # Pull latest changes
   git pull origin develop

   # Rebuild and restart
   docker-compose up -d --build
   ```

---

## Known Issues & Fixes Applied

### Issue 1: Frontend "Blocked request" Error
**Problem:** Vite blocking requests from domain
**Fix:** Added `allowedHosts: ['budget.charliewunderlich.com']` to `vite.config.ts`
**Status:** ✅ Fixed

### Issue 2: Users Table Missing
**Problem:** Backend error "relation users does not exist"
**Fix:** Created users table in PostgreSQL
**Status:** ✅ Fixed

### Issue 3: Missing "name" Column
**Problem:** Backend error "column name does not exist"
**Fix:** `ALTER TABLE users ADD COLUMN name VARCHAR(255);`
**Status:** ✅ Fixed

### Issue 4: Port Confusion
**Problem:** Frontend exposed on 5174, not 5173
**Fix:** Updated nginx config to proxy to port 5174
**Status:** ✅ Fixed

### Issue 5: Registration/Login Errors
**Problem:** 500/401 errors when trying to register/login
**Fix:** TBD - needs debugging
**Status:** ⚠️ In Progress

---

## Questions to Answer Next Session

1. **Is JWT_SECRET set in backend .env?**
2. **Are all auth dependencies installed?** (bcrypt, jsonwebtoken, zod)
3. **What are the new errors after adding name column?**
4. **Does the backend auth.ts file exist and is it configured correctly?**

---

## Savings Goal Page (Deferred)

**Original task:** Add a savings goal page to the application

**Status:** Not started - waiting until deployment issues are resolved

**Will need to discuss:**
- Database schema for goals table
- API endpoints for CRUD operations
- Frontend UI/UX design
- Integration with existing dashboard

---

## Resources & Documentation

**Project Documentation:**
- Main docs: `CLAUDE.md`
- Tech stack: `rundown/techrundown.md`
- Auth details: `rundown/authorization_process.md`
- AWS deployment: `rundown/aws-deployment-guide.md`
- This file: `rundown/deployment-progress.md`

**External Resources:**
- AWS EC2 Console: https://console.aws.amazon.com/ec2
- GoDaddy DNS: https://www.godaddy.com (My Products → Domains)
- DNS Checker: https://dnschecker.org

---

## Contact Info & Credentials

**Domain:** charliewunderlich.com (registered with GoDaddy)
**AWS Account:** Registered with domain email
**EC2 SSH Key:** Stored at `~/.ssh/budget-analyzer-key.pem` (WSL)
**Database Password:** `Xk9mP#vL2nQ$wR8jT5hF` (in backend/.env on EC2)

**GitHub Repo:** https://github.com/Code-Campfire/hearthside-hackers

---

## Session Summary

**Time spent:** ~2-3 hours
**Progress:** Got app deployed to AWS with custom domain, frontend loading successfully
**Blockers:** Authentication endpoints have errors that need debugging
**Next priority:** Fix auth issues, then add SSL

---

**Last Updated:** 2026-01-13
**Next Session:** Continue debugging auth errors, then implement savings goal page
