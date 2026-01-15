# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal Budget Analyzer is a personal finance application that helps users centralize financial information, track spending, categorize expenses, manage bills, and scan receipts for automatic transaction creation.

**Current State:** Fully functional application with user authentication, transaction management, bill tracking, category management, dashboard analytics, and receipt OCR scanning via Google Cloud Vision API.

**Production URL:** https://budget.charliewunderlich.com (AWS EC2 + nginx + HTTPS via certbot)

## Development Commands

### Docker (Primary Development Method)

```bash
# Start all services (database, backend, frontend)
docker-compose up -d

# View logs
docker-compose logs -f                    # All services
docker-compose logs -f backend            # Backend only
docker-compose logs -f frontend           # Frontend only
docker-compose logs -f database           # Database only

# Rebuild containers after dependency changes
docker-compose up -d --build

# Stop all services
docker-compose down

# Stop and remove volumes (clean database reset)
docker-compose down -v
```

### Backend (Node.js + Express + TypeScript)

```bash
cd backend

# Development with hot-reload (inside Docker by default)
npm run dev

# Build TypeScript to JavaScript
npm run build

# Run compiled code
npm run start

# Run database migrations
npm run migrate

# Tests (not yet implemented)
npm test
```

### Frontend (React + Vite + TypeScript + Tailwind)

```bash
cd frontend

# Development server (inside Docker by default)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

### Database Access

```bash
# Connect to PostgreSQL from host machine
psql -h localhost -p 5434 -U postgres -d budget_analyzer

# Connect to PostgreSQL container
docker exec -it budget-analyzer-db psql -U postgres -d budget_analyzer

# Apply migrations manually
docker exec -i budget-analyzer-db psql -U postgres -d budget_analyzer < backend/migrations/001_create_schema.sql
docker exec -i budget-analyzer-db psql -U postgres -d budget_analyzer < backend/migrations/002_add_default_categories.sql
```

## Architecture

### Three-Tier Architecture

1. **Frontend (React SPA)** - Port 5174
   - Vite dev server with HMR
   - Tailwind CSS for styling
   - Axios for API communication
   - React Router for navigation
   - AuthContext for authentication state

2. **Backend (Express API)** - Port 3001
   - TypeScript with ES Modules
   - JWT authentication with bcrypt password hashing
   - Rate limiting on auth endpoints
   - CORS allowlist via environment variable
   - Zod for request validation

3. **Database (PostgreSQL 17)** - Port 5434 (host) / 5432 (container)
   - Alpine-based Docker image
   - Persistent volume: `postgres_data`
   - 7 tables: users, categories, transactions, receipts, bills, goals

### Key Architectural Decisions

**ES Modules Import Pattern (Backend):**
```typescript
import pkg from 'pg';
const { Pool } = pkg;
```
This pattern is necessary because `pg` doesn't provide named exports in ESM mode.

**Authentication Flow:**
- Registration: Email validation, bcrypt hash (10 rounds), store user
- Login: Verify password, generate JWT (7 day expiry)
- Protected routes: Bearer token in Authorization header
- Frontend: Token stored in localStorage, auto-verified on mount

**Docker Networking:**
- Services communicate via Docker network using service names
- Backend connects to database using hostname `database` (not `localhost`)
- Frontend makes API calls to `http://localhost:3001` from browser

**Port Mappings:**
- Database: 5434:5432 (avoids conflicts with local PostgreSQL)
- Backend: 3001:3001
- Frontend: 5174:5173

## Code Organization

### Backend Structure
```
backend/src/
├── index.ts              # Express app setup, middleware, route mounting
├── db.ts                 # PostgreSQL connection pool
├── auth.ts               # JWT & bcrypt utilities
├── middleware/
│   ├── auth.ts           # authenticateToken middleware
│   ├── rateLimit.ts      # In-memory rate limiter
│   └── upload.ts         # Multer config for receipt uploads
├── routes/
│   ├── auth.ts           # POST /register, /login, GET /me
│   ├── transaction.ts    # CRUD for transactions
│   ├── receipt.ts        # Receipt scanning & confirmation
│   ├── bills.ts          # CRUD for recurring bills
│   ├── categories.ts     # Category management
│   └── dashboard.ts      # Dashboard stats endpoints
└── services/
    ├── visionOcr.ts      # Google Cloud Vision API integration
    ├── receiptParser.ts  # Parse OCR text to structured data
    └── receiptCounter.ts # Monthly scan limit tracking
```

### Frontend Structure
```
frontend/src/
├── main.tsx              # React app entry point
├── App.tsx               # Router setup & AuthProvider
├── contexts/
│   └── AuthContext.tsx   # Auth state, login/register/logout
├── pages/
│   ├── HomePage.tsx      # Dashboard with stats & quick actions
│   ├── LoginPage.tsx     # Login form
│   ├── RegisterPage.tsx  # Registration form
│   ├── TransactionPage.tsx   # Transaction list & CRUD
│   ├── ReceiptScannerPage.tsx # Receipt upload workflow
│   └── Bills.tsx         # Bills management
├── components/
│   ├── ProtectedRoute.tsx    # Route guard
│   ├── ReceiptUploader.tsx   # Drag-drop file upload
│   └── ReceiptReview.tsx     # Edit OCR results before saving
├── Helper/               # Modal components
│   ├── AddTransactionModel.tsx
│   ├── EditTransactionModal.tsx
│   ├── NewBillModal.tsx
│   ├── EditBillModal.tsx
│   ├── BillDetailsModal.tsx
│   ├── BillCard.tsx
│   ├── UpcomingBills.tsx
│   ├── AllRecurringBills.tsx
│   └── CategorySelector.tsx
├── services/             # API client layer (axios)
│   ├── transactionAPI.ts
│   ├── receiptAPI.ts
│   ├── billsAPI.ts
│   └── dashboardAPI.ts
└── types/
    └── receipt.ts        # TypeScript interfaces
```

### Database Migrations
```
backend/migrations/
├── 001_create_schema.sql     # Core tables: users, categories, transactions, receipts, bills, goals
└── 002_add_default_categories.sql  # Trigger to auto-create 18 default categories for new users
```

## Database Schema

### Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| users | User accounts | id, email (unique), password_hash, name |
| categories | Transaction categories | id, user_id, name, type (income/expense), is_active |
| transactions | Financial transactions | id, user_id, amount (DECIMAL 12,2), transaction_date (DATE), transaction_type, category_id |
| receipts | Scanned receipts | id, user_id, transaction_id, image_url, merchant_name, total_amount, receipt_date, extracted_data (JSON), processing_status |
| bills | Recurring bills | id, user_id, bill_name, amount, due_day (1-31), category_id, is_paid |
| goals | Savings goals | id, user_id, goal_name, target_amount, current_amount, deadline |

**Default Categories (auto-created for new users):**
- Expense: Utilities, Groceries, Rent/Mortgage, Transportation, Entertainment, Healthcare, Insurance, Dining Out, Shopping, Education, Personal Care, Subscriptions, Savings, Debt Payment
- Income: Salary, Freelance, Investments, Other Income

## API Endpoints

### Authentication (`/api/auth`)
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | /register | No | Create account (rate limited) |
| POST | /login | No | Get JWT token (rate limited) |
| GET | /me | Yes | Get current user info |

### Transactions (`/api/transactions`)
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | / | Yes | List transactions (paginated) |
| POST | / | Yes | Create transaction |
| GET | /:id | Yes | Get single transaction |
| PUT | /:id | Yes | Update transaction |
| DELETE | /:id | Yes | Delete transaction |

### Receipts (`/api/receipts`)
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| POST | /scan | Yes | Upload & OCR scan receipt |
| GET | /limit | Yes | Get monthly scan limit status |
| GET | /:id | Yes | Get receipt details |
| POST | /:id/confirm | Yes | Create transaction from receipt |

### Bills (`/api/bills`)
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | / | Yes | List bills (filterable by is_paid) |
| POST | / | Yes | Create bill |
| GET | /:id | Yes | Get single bill |
| PUT | /:id | Yes | Update bill |
| DELETE | /:id | Yes | Delete bill |

### Categories (`/api/categories`)
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | / | Yes | List active categories |
| POST | / | Yes | Create category |
| GET | /:id | Yes | Get single category |
| PUT | /:id | Yes | Update category |
| DELETE | /:id | Yes | Soft delete (set is_active=false) |

### Dashboard (`/api/dashboard`)
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | /income | Yes | Current month's total income |
| GET | /expenses | Yes | Current month's total expenses |
| GET | /goals | Yes | Active goals count |

### Health Check
| Method | Endpoint | Auth | Purpose |
|--------|----------|------|---------|
| GET | /api/health | No | Check backend & database status |

## Environment Variables

### Backend (`backend/.env`)
```bash
# Server
PORT=3001

# Database
DB_HOST=database          # Use "database" inside Docker, "localhost" for local dev
DB_PORT=5432
DB_NAME=budget_analyzer
DB_USER=postgres
DB_PASSWORD=postgres

# Authentication (REQUIRED - no fallback in production)
JWT_SECRET=your-strong-secret-key-here
JWT_EXPIRES_IN=7d

# Security
CORS_ORIGIN=http://localhost:5174    # Comma-separated for multiple origins
AUTH_RATE_LIMIT_WINDOW_MS=900000     # 15 minutes
AUTH_RATE_LIMIT_MAX=20               # Max requests per window

# Receipt Scanner (optional - for Google Cloud Vision)
GOOGLE_APPLICATION_CREDENTIALS=/app/config/google-vision-key.json
MAX_RECEIPT_SIZE_MB=10
ALLOWED_RECEIPT_FORMATS=jpg,jpeg,png,pdf
RECEIPT_STORAGE_PATH=/app/uploads/receipts
```

### Frontend (`frontend/.env`)
```bash
VITE_API_URL=http://localhost:3001
```

## Security Features

**Authentication:**
- Passwords hashed with bcrypt (10 salt rounds)
- JWT tokens with configurable expiry
- JWT_SECRET required at startup (no hardcoded fallback)

**Rate Limiting:**
- Auth endpoints: 20 requests per 15 minutes per IP
- Returns 429 with X-RateLimit-* headers when exceeded

**Authorization:**
- All data queries filtered by user_id from JWT
- Category ownership verified before transaction/receipt creation
- Users cannot access other users' data

**Input Validation:**
- Zod schemas for registration/login
- Field-level error messages returned
- XSS prevention on bill names (removes <> characters)

**CORS:**
- Dynamic origin validation from CORS_ORIGIN env var
- Multiple origins supported (comma-separated)

## Financial Data Handling

- **Currency Precision:** DECIMAL(12, 2) in PostgreSQL
- **Date Handling:** DATE type (not TIMESTAMP), ISO 8601 format (YYYY-MM-DD)
- **Amount Storage:** Stored as dollars with 2 decimal places (not cents)
- **Display:** Intl.NumberFormat for currency formatting on frontend

## Receipt Scanner

**Technology:** Google Cloud Vision API (free tier: 1,000 requests/month)

**Workflow:**
1. User uploads receipt image (JPG, PNG, or PDF, max 10MB)
2. Image optimized with sharp (resize to 1600px, 85% JPEG quality)
3. Google Vision API extracts text
4. receiptParser.ts extracts merchant, date, total from OCR text
5. User reviews/edits extracted data
6. Confirmation creates transaction linked to receipt

**Parsing Heuristics (receiptParser.ts):**
- **Total:** Largest dollar amount on receipt
- **Subtotal:** Second largest dollar amount
- **Tax:** Calculated as total - subtotal (validated < 25% of total)
- **Merchant:** First non-address, non-phone line in top 5 lines
- **Date:** First date pattern found (MM/DD/YYYY, YYYY-MM-DD, etc.)

**Monthly Limit:** 500 scans per month (tracked in database)

## Fresh Setup Instructions

For a clean local environment after pulling this branch:

```bash
# 1. Clone/pull the latest code
git pull origin cww-edits

# 2. Stop and remove existing containers and volumes
docker-compose down -v

# 3. Start fresh containers
docker-compose up -d

# 4. Wait for database to be healthy (check with docker-compose ps)

# 5. Apply migrations
docker exec -i budget-analyzer-db psql -U postgres -d budget_analyzer < backend/migrations/001_create_schema.sql
docker exec -i budget-analyzer-db psql -U postgres -d budget_analyzer < backend/migrations/002_add_default_categories.sql

# 6. Verify health check
curl http://localhost:3001/api/health

# 7. Access frontend at http://localhost:5174
```

## Production Deployment (AWS EC2)

**Server:** EC2 instance at `3.14.11.73`
**Domain:** `budget.charliewunderlich.com`
**SSH:** `ssh -i ~/.ssh/budget-analyzer-key.pem ubuntu@3.14.11.73`

### Deployment Steps

```bash
# SSH into EC2
ssh -i ~/.ssh/budget-analyzer-key.pem ubuntu@3.14.11.73
cd ~/hearthside-hackers

# Pull latest from develop
git pull origin develop

# Rebuild containers
docker-compose down
docker-compose up -d --build
```

### Key Production Config

**docker-compose.yml environment:**
- `JWT_SECRET` - Strong unique secret (not the dev one)
- `CORS_ORIGIN=https://budget.charliewunderlich.com`

**frontend/.env:**
- `VITE_API_URL=https://budget.charliewunderlich.com`

**vite.config.ts:**
- `allowedHosts: ['budget.charliewunderlich.com']`

### Seed Demo Data

```bash
docker exec -i budget-analyzer-db psql -U postgres -d budget_analyzer < backend/scripts/seed-demo-data.sql
```

### HTTPS Setup (already configured)

```bash
sudo certbot --nginx -d budget.charliewunderlich.com
```

## Common Issues

**Backend won't start / JWT_SECRET error:**
- The backend requires `JWT_SECRET` to be set. Check docker-compose.yml has it defined.
- Never use the local development secret in production.

**Axios errors / CORS issues:**
- Verify `CORS_ORIGIN` in docker-compose.yml matches your frontend URL
- For local dev: `CORS_ORIGIN=http://localhost:5174`

**Registration returns 400:**
- Password must be at least 6 characters
- Email must be valid format
- Check response body for field-level errors

**"Not Connected" on frontend:**
- Verify backend is running: `curl http://localhost:3001/api/health`
- Check `VITE_API_URL` in frontend/.env matches backend URL
- Check CORS configuration

**Database connection errors:**
- Inside Docker: Use `DB_HOST=database`
- Outside Docker: Use `DB_HOST=localhost` and `DB_PORT=5434`
- Check database health: `docker-compose ps`

**Receipt scanner not working:**
- Requires Google Cloud Vision API credentials
- Place service account JSON at `backend/config/google-vision-key.json`
- Set `GOOGLE_APPLICATION_CREDENTIALS` env var

**Port conflicts:**
- PostgreSQL: Change `5434` in docker-compose.yml
- Frontend: Change `5174` in docker-compose.yml
- Backend: Change `PORT` in docker-compose.yml

## Pending Features

**Savings Goals:** The goals table exists but the UI is not yet implemented. Schema supports:
- `goal_name`, `target_amount`, `current_amount`, `deadline`

## Additional Resources

- Technical details: `rundown/techrundown.md`
- Receipt scanner docs: `rundown/receipt-scanner-rundown.md`
- Authorization flow: `rundown/authorization_process.md`
- Deployment notes: `rundown/deployment-progress.md`
- Demo data script: `backend/scripts/seed-demo-data.sql`
