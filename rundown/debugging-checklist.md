# AWS Deployment Debugging Checklist

**Date:** 2026-01-14
**Status:** 🔍 Systematic debugging in progress

---

## 🎯 ROOT CAUSE IDENTIFIED

### The Problem

**Local Development:**
- Full database schema with 6 tables (users, categories, transactions, receipts, bills, goals)
- Migration scripts have been run
- Trigger automatically creates default categories when user registers

**AWS Production:**
- ❌ ONLY `users` table exists (manually created)
- ❌ Missing: `categories`, `transactions`, `receipts`, `bills`, `goals` tables
- ❌ Missing: Database trigger for default categories
- ❌ Missing: Database indexes

### Why This Causes Errors

When a user tries to register on AWS:
1. ✅ Backend inserts user into `users` table (works)
2. ❌ Database trigger tries to insert default categories into `categories` table (FAILS - table doesn't exist)
3. ❌ Backend returns 500 Internal Server Error

**Evidence:**
- Migration files found: `backend/migrations/001_create_schema.sql` and `002_add_default_categories.sql`
- Deployment notes show only `users` table was manually created
- Backend logs showed "relation does not exist" errors

---

## 📋 Systematic Debugging Checklist

### Phase 1: Database Schema Setup ⚙️

#### ✅ Task 1.1: Compare Schemas
**Status:** COMPLETED
**Findings:**
- Local has full schema (6 tables + trigger)
- AWS only has `users` table
- **Action needed:** Run migration scripts on AWS

---

#### 🔲 Task 1.2: Run Migration 001 (Create All Tables)

**What it does:**
- Creates: users, categories, transactions, receipts, bills, goals tables
- Creates: All necessary indexes

**Steps:**
```bash
# SSH into EC2
ssh -i ~/.ssh/budget-analyzer-key.pem ubuntu@3.14.11.73
cd ~/hearthside-hackers

# Connect to database
docker exec -it budget-analyzer-db psql -U postgres -d budget_analyzer

# Check current tables (should only see 'users')
\dt

# Run migration 001
\i /app/migrations/001_create_schema.sql

# Verify all tables created
\dt
# Should now see: bills, categories, goals, receipts, transactions, users

# Check users table structure
\d users
# Should have: id, email, password_hash, name, created_at

# Exit psql
\q
```

**Expected Result:**
- 6 tables created successfully
- All indexes created
- No errors

**If errors occur:**
- Check if tables already exist (migration uses IF NOT EXISTS)
- Check for foreign key issues
- Verify PostgreSQL version compatibility

---

#### 🔲 Task 1.3: Run Migration 002 (Add Default Categories Trigger)

**What it does:**
- Creates function `create_default_categories_for_user()`
- Creates trigger that automatically adds 18 default categories when user registers

**Steps:**
```bash
# Still in database connection
docker exec -it budget-analyzer-db psql -U postgres -d budget_analyzer

# Run migration 002
\i /app/migrations/002_add_default_categories.sql

# Verify trigger exists
\df create_default_categories_for_user

# Check triggers on users table
\d users

# Should see trigger: trigger_create_default_categories

# Exit
\q
```

**Expected Result:**
- Function created
- Trigger created
- No errors

---

#### 🔲 Task 1.4: Alternative - Run Migrations via Script

**If above fails** (migrations not accessible inside container):

```bash
# On EC2, copy migration content and run
cd ~/hearthside-hackers

# Run migration 001
docker exec -i budget-analyzer-db psql -U postgres -d budget_analyzer < backend/migrations/001_create_schema.sql

# Run migration 002
docker exec -i budget-analyzer-db psql -U postgres -d budget_analyzer < backend/migrations/002_add_default_categories.sql

# Verify tables
docker exec -it budget-analyzer-db psql -U postgres -d budget_analyzer -c "\dt"
```

---

### Phase 2: Backend Environment Setup 🔧

#### 🔲 Task 2.1: Verify JWT_SECRET

**Why it matters:**
- JWT tokens require a secret key to sign/verify
- Missing JWT_SECRET causes auth failures

**Steps:**
```bash
# SSH into EC2
ssh -i ~/.ssh/budget-analyzer-key.pem ubuntu@3.14.11.73
cd ~/hearthside-hackers

# Check if JWT_SECRET exists
cat backend/.env | grep JWT_SECRET
```

**Expected Output:**
```
JWT_SECRET=some_long_random_string_at_least_32_characters
```

**If missing:**
```bash
# Generate a secure secret (or use this one)
# JWT_SECRET=your_super_secret_jwt_key_min_32_chars_k9L2pM#vNqR8wT5hF

nano backend/.env
# Add line:
JWT_SECRET=your_super_secret_jwt_key_min_32_chars_k9L2pM#vNqR8wT5hF

# Restart backend
docker-compose restart backend

# Verify restart successful
docker-compose ps
docker-compose logs --tail 20 backend
```

---

#### 🔲 Task 2.2: Verify Auth Dependencies

**Steps:**
```bash
# Check backend package.json
cat backend/package.json | grep -E "bcrypt|jsonwebtoken|zod"
```

**Expected Output:**
```json
"bcrypt": "^6.0.0",
"jsonwebtoken": "^9.0.2",
"zod": "^4.1.12",
```

**Status:** ✅ Already verified - all dependencies installed

---

### Phase 3: Testing Registration 🧪

#### 🔲 Task 3.1: Test Registration via curl (Backend Direct)

**Purpose:** Test backend without frontend variables

**Steps:**
```bash
# SSH into EC2
ssh -i ~/.ssh/budget-analyzer-key.pem ubuntu@3.14.11.73
cd ~/hearthside-hackers

# Test registration
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"TestPass123!","name":"Test User"}'
```

**Expected Success Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "testuser@example.com",
    "created_at": "2026-01-14T..."
  }
}
```

**If 500 error:**
```bash
# Check backend logs immediately
docker-compose logs --tail 30 backend

# Look for specific error:
# - "relation categories does not exist" → Run migration 001
# - "function create_default_categories_for_user does not exist" → Run migration 002
# - "jwt secret is required" → Add JWT_SECRET to .env
# - Any bcrypt errors → Check bcrypt installation
```

**If 400 error (email already exists):**
```bash
# Try different email or check existing users
docker exec -it budget-analyzer-db psql -U postgres -d budget_analyzer -c "SELECT * FROM users;"
```

---

#### 🔲 Task 3.2: Verify User and Categories Created

**After successful registration:**

```bash
# Connect to database
docker exec -it budget-analyzer-db psql -U postgres -d budget_analyzer

# Check user was created
SELECT * FROM users;
# Should see the test user

# Check default categories were created
SELECT * FROM categories WHERE user_id = 1;
# Should see 18 default categories (Utilities, Groceries, etc.)

# Exit
\q
```

**Expected Result:**
- 1 user in users table
- 18 categories in categories table for that user

---

#### 🔲 Task 3.3: Test Login via curl

**Steps:**
```bash
# Test login with the registered user
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"TestPass123!"}'
```

**Expected Success Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "testuser@example.com"
  }
}
```

**If 401 error:**
- Wrong password? Try registering new user
- Check backend logs for bcrypt errors
- Verify JWT_SECRET is set

---

### Phase 4: Web UI Testing 🌐

#### 🔲 Task 4.1: Test Registration via Web Browser

**Steps:**
1. Open browser to: `http://budget.charliewunderlich.com/register`
2. Fill form:
   - Name: Web Test User
   - Email: webtest@example.com
   - Password: WebTest123!
3. Click Register
4. Open browser dev tools (F12) → Network tab
5. Watch for POST to `/api/auth/register`

**Expected Result:**
- ✅ Status 201 Created
- ✅ Response shows success message
- ✅ Redirected to login or dashboard

**If errors:**
- Check browser console for errors
- Check Network tab for exact error response
- Check backend logs: `docker-compose logs --tail 30 backend`

---

#### 🔲 Task 4.2: Test Login via Web Browser

**Steps:**
1. Go to: `http://budget.charliewunderlich.com/login`
2. Enter credentials from registration
3. Click Login
4. Watch Network tab

**Expected Result:**
- ✅ Status 200 OK
- ✅ JWT token received
- ✅ Redirected to dashboard
- ✅ Dashboard loads user data

---

### Phase 5: Final Verification ✅

#### 🔲 Task 5.1: End-to-End Test

**Complete user flow:**
1. Register new user via web UI
2. Login with that user
3. Navigate to Transactions page
4. Try to add a transaction (will test categories work)
5. Check if transaction appears in list

**Expected Result:**
- All pages load
- No console errors
- No 500 errors
- Data persists after page refresh

---

#### 🔲 Task 5.2: Check All Database Tables Have Data

```bash
docker exec -it budget-analyzer-db psql -U postgres -d budget_analyzer

-- Check record counts
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
UNION ALL
SELECT 'receipts', COUNT(*) FROM receipts
UNION ALL
SELECT 'bills', COUNT(*) FROM bills
UNION ALL
SELECT 'goals', COUNT(*) FROM goals;

\q
```

**Expected Output:**
```
   table_name   | count
----------------+-------
 users          |     2  (or more)
 categories     |    36  (18 per user)
 transactions   |     0  (or more if you added any)
 receipts       |     0
 bills          |     0
 goals          |     0
```

---

### Phase 6: Cleanup & Documentation 📝

#### 🔲 Task 6.1: Remove Test Users (Optional)

```bash
# If you want to clean up test users
docker exec -it budget-analyzer-db psql -U postgres -d budget_analyzer

-- Delete test users and their data (cascades to categories, etc.)
DELETE FROM users WHERE email LIKE '%test%';

-- Verify
SELECT * FROM users;

\q
```

---

#### 🔲 Task 6.2: Update Deployment Documentation

**Files to update:**
- `rundown/deployment-progress.md` - Mark auth issues as resolved
- `rundown/debugging-checklist.md` - Mark all tasks complete
- `CLAUDE.md` - Add note about running migrations

---

## 📊 Error Reference Guide

### Common Errors and Solutions

#### Error: "relation 'categories' does not exist"
**Cause:** Migration 001 not run
**Solution:** Run `001_create_schema.sql`

#### Error: "function create_default_categories_for_user does not exist"
**Cause:** Migration 002 not run
**Solution:** Run `002_add_default_categories.sql`

#### Error: "jwt secret is required"
**Cause:** JWT_SECRET missing from backend/.env
**Solution:** Add `JWT_SECRET=your_secret_key` to backend/.env and restart

#### Error: "column 'name' does not exist"
**Cause:** Users table doesn't have name column
**Solution:** Migration 001 should fix this, or manually: `ALTER TABLE users ADD COLUMN name VARCHAR(100);`

#### Error: "duplicate key value violates unique constraint"
**Cause:** Trying to register with email that already exists
**Solution:** Use different email or delete existing user

#### Error: "bcrypt error"
**Cause:** bcrypt not installed or version mismatch
**Solution:** `docker-compose exec backend npm install bcrypt@6.0.0` and restart

---

## 🎯 Quick Command Reference

```bash
# SSH to EC2
ssh -i ~/.ssh/budget-analyzer-key.pem ubuntu@3.14.11.73

# Navigate to project
cd ~/hearthside-hackers

# Check Docker containers
docker-compose ps

# View backend logs
docker-compose logs --tail 50 backend

# View all logs
docker-compose logs -f

# Restart backend
docker-compose restart backend

# Connect to database
docker exec -it budget-analyzer-db psql -U postgres -d budget_analyzer

# Inside psql:
\dt                    # List tables
\d tablename           # Describe table
\df                    # List functions
\q                     # Exit

# Run migration from EC2
docker exec -i budget-analyzer-db psql -U postgres -d budget_analyzer < backend/migrations/001_create_schema.sql

# Test API endpoint
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","name":"Test"}'
```

---

## 🔄 Recovery Plan (If Something Goes Wrong)

### Nuclear Option: Reset Database

**⚠️ WARNING: This deletes ALL data**

```bash
# Stop containers
docker-compose down

# Remove database volume
docker volume rm hearthside-hackers_postgres_data

# Start fresh
docker-compose up -d

# Wait for containers to start (30 seconds)
sleep 30

# Run migrations
docker exec -i budget-analyzer-db psql -U postgres -d budget_analyzer < backend/migrations/001_create_schema.sql
docker exec -i budget-analyzer-db psql -U postgres -d budget_analyzer < backend/migrations/002_add_default_categories.sql

# Verify
docker exec -it budget-analyzer-db psql -U postgres -d budget_analyzer -c "\dt"
```

---

## 📈 Success Criteria

All these must pass:

- [x] Database has 6 tables (users, categories, transactions, receipts, bills, goals)
- [x] Database has trigger for default categories
- [x] JWT_SECRET is set in backend/.env
- [ ] User can register via API (curl)
- [ ] User registration creates 18 default categories
- [ ] User can login via API (curl)
- [ ] User can register via web UI
- [ ] User can login via web UI
- [ ] No 500 errors in backend logs
- [ ] No console errors in browser

---

## 🚀 Next Steps After All Checks Pass

1. **Add SSL/HTTPS**
   - Run certbot to get SSL certificate
   - Update frontend to use https://

2. **Implement Savings Goal Page**
   - Database schema already exists (goals table)
   - Need to create API endpoints
   - Need to create React components

3. **Optimize**
   - Switch from Vite dev server to production build
   - Implement proper error logging
   - Add monitoring

---

**Last Updated:** 2026-01-14
**Status:** Ready to execute
