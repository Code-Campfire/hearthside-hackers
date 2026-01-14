Changes Summary (2026-01-14)

Scope
- Backend auth hardening for public AWS deployment
- Database schema consistency and migration approach
- Data reset for a clean local environment

Backend changes
- Require JWT_SECRET at startup and remove fallback secret: backend/src/index.ts, backend/src/auth.ts
  - Why: public AWS deploy should not run with a hardcoded secret
- Add CORS allowlist via CORS_ORIGIN env var: backend/src/index.ts
  - Why: restrict requests to known frontend origins
- Add simple in-memory rate limiter for auth routes: backend/src/middleware/rateLimit.ts, backend/src/routes/auth.ts
  - Why: reduce brute-force attempts on login/register
- Fix receipt route order and add auth checks: backend/src/routes/receipt.ts
  - Why: /limit was unreachable; ensure userId is present
- Add category ownership checks for transactions and receipt confirm: backend/src/routes/transaction.ts, backend/src/routes/receipt.ts
  - Why: prevent attaching another user's category_id
- Normalize bill amounts to store dollars (no cents conversion): backend/src/routes/bills.ts
  - Why: schema uses DECIMAL(12,2); avoid unit mismatch
- Fix dashboard totals to use decimal sums (no divide-by-100): backend/src/routes/dashboard.ts
  - Why: transactions are stored as decimals, not cents

Database and migrations
- Update base schema to use DATE columns for transaction_date, receipt_date, deadline: backend/migrations/001_create_schema.sql
- Normalize bill storage to DECIMAL dollars (no conversion): backend/migrations/001_create_schema.sql + backend/src/routes/bills.ts
- Keep only base migrations for fresh DB: backend/migrations/001_create_schema.sql, backend/migrations/002_add_default_categories.sql
- Removed older upgrade migrations: backend/migrations/003_alter_date_columns.sql, backend/migrations/004_fix_bill_amount_units.sql
- Added migration runner script: backend/scripts/run-migrations.ts
- Added npm script: "migrate": "tsx scripts/run-migrations.ts" in backend/package.json

Docker/env config
- Added backend env vars in docker-compose.yml:
  - JWT_SECRET
  - JWT_EXPIRES_IN
  - CORS_ORIGIN
  - AUTH_RATE_LIMIT_WINDOW_MS
  - AUTH_RATE_LIMIT_MAX

Local reset actions performed
- Wiped Docker volume and recreated containers:
  - docker-compose down -v
  - docker-compose up -d
- Applied migrations to fresh DB:
  - backend/migrations/001_create_schema.sql
  - backend/migrations/002_add_default_categories.sql

Notes
- Registration failures with short passwords now return 400 responses by design.
- For AWS, set JWT_SECRET and CORS_ORIGIN to your real values (do not reuse the local secret).

AWS EC2 to-do (to run after pulling this branch)
- Ensure backend env vars are set in the deployment (compose or systemd):
  - JWT_SECRET (strong, unique)
  - JWT_EXPIRES_IN (e.g. 7d)
  - CORS_ORIGIN (your frontend domain)
  - AUTH_RATE_LIMIT_WINDOW_MS / AUTH_RATE_LIMIT_MAX (optional defaults OK)
- Reset DB if starting clean:
  - docker-compose down -v
  - docker-compose up -d
- Apply migrations on EC2:
  - docker exec -i budget-analyzer-db psql -U postgres -d budget_analyzer < backend/migrations/001_create_schema.sql
  - docker exec -i budget-analyzer-db psql -U postgres -d budget_analyzer < backend/migrations/002_add_default_categories.sql
- Restart backend after env changes:
  - docker-compose up -d backend

Verification checklist
- Health check: GET http://<host>:3001/api/health returns database "connected"
- Register/login flows succeed with valid inputs
- Invalid registration (short password) returns 400 with field errors
- Create a bill and verify amounts are correct in UI and DB
- Dashboard totals match manual transaction sums
