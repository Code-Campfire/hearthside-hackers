# Personal Budget Analyzer

A personal finance application built with React, Node.js, Express, and PostgreSQL.

## Prerequisites

- Docker Desktop v4.37.2 or later
- Docker Compose v2.31.0 or later

## Quick Start

1. **Clone the repository**
   ```bash
   git clone git@github.com:Code-Campfire/hearthside-hackers.git
   cd hearthside-hackers
   ```

2. **Environment Setup** (Optional - defaults are already configured)

   The project includes `.env` files with default values for local development. You can customize them if needed:

   - `backend/.env` - Backend server and database configuration
   - `frontend/.env` - Frontend API URL configuration

   Reference the `.env.example` files for available options.

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

   This will start three containers:
   - PostgreSQL database
   - Node.js backend API (automatically runs database migrations on startup)
   - React frontend application

   **First-time setup:** Database migrations will run automatically, creating all necessary tables:
   - users
   - categories (with 18 default categories per user)
   - transactions
   - receipts
   - bills
   - goals

4. **Access the application**
   - Frontend: http://localhost:5174
   - Backend API: http://localhost:3001
   - Database: localhost:5434

5. **Stop the application**
   ```bash
   docker-compose down
   ```

## Project Structure

```
.
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── index.ts     # Express server
│   │   └── db.ts        # PostgreSQL connection
│   ├── Dockerfile
│   └── package.json
├── frontend/            # React + TypeScript + Tailwind
│   ├── src/
│   │   ├── App.tsx      # Main app component
│   │   └── main.tsx
│   ├── Dockerfile
│   └── package.json
├── rundown/
│   └── techrundown.md   # Technical documentation
└── docker-compose.yml   # Docker orchestration
```

## Current Features

- **Hello World Page**: Simple home page displaying "Hello World"
- **Connection Status**: Shows "Connected" in green when the backend and database are successfully connected
- **Health Check Endpoint**: `/api/health` endpoint to verify backend and database connectivity

## Tech Stack

### Frontend
- React v18.3.1
- TypeScript v5.6.3
- Tailwind CSS v3.4.16
- Vite v7.2.2
- Axios v1.7.9

### Backend
- Node.js v22
- Express.js v4.21.2
- TypeScript v5.6.3
- PostgreSQL driver (pg) v8.13.1

### Database
- PostgreSQL v17.2

### DevOps
- Docker
- Docker Compose

## API Endpoints

### Health Check
- **GET** `/api/health`
  - Returns backend and database connection status
  - Response:
    ```json
    {
      "status": "ok",
      "message": "Backend and database are connected",
      "database": "connected"
    }
    ```

## Development

The application runs in development mode with hot-reloading enabled for both frontend and backend.

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f database
```

### Rebuild Containers
```bash
docker-compose up -d --build
```

## Database

The PostgreSQL database is automatically initialized with the full schema when you start the application for the first time. Database migrations are handled by `backend/scripts/run-migrations.js` which runs on backend startup.

**Database Schema Includes:**
- `users` - User accounts with authentication
- `categories` - Expense/income categories (18 defaults created per user)
- `transactions` - Financial transactions
- `receipts` - Receipt uploads with OCR data
- `bills` - Recurring bills
- `goals` - Savings goals

**Database Credentials** (for development):
- Host: localhost (or `database` within Docker network)
- Port: 5434 (host) / 5432 (container)
- Database: budget_analyzer
- User: postgres
- Password: postgres

### Manual Database Access

```bash
# Connect to database
docker exec -it budget-analyzer-db psql -U postgres -d budget_analyzer

# View all tables
\dt

# Exit
\q
```

## Troubleshooting

### Backend won't start or shows migration errors

**Check backend logs:**
```bash
docker-compose logs backend
```

**Look for migration output:**
- `🔄 Starting database migrations...`
- `✅ Migration 001 complete (tables created)`
- `✅ Migration 002 complete (trigger created)`

**If migrations fail:**
1. Ensure database is healthy: `docker-compose ps`
2. Restart backend: `docker-compose restart backend`
3. If still failing, recreate containers: `docker-compose up -d --force-recreate`

### Registration fails with "relation does not exist" error

This means migrations didn't run. Fix:

```bash
# Recreate backend container to trigger migrations
docker-compose up -d --force-recreate backend

# Verify tables were created
docker exec budget-analyzer-db psql -U postgres -d budget_analyzer -c "\dt"

# Should show 6 tables: bills, categories, goals, receipts, transactions, users
```

### Frontend shows "Not Connected"

1. Verify backend is running: `docker-compose ps`
2. Check backend health: `curl http://localhost:3001/api/health`
3. Check CORS configuration in `backend/src/index.ts`

### Port conflicts

If you see "port already allocated" errors:
- Change port mappings in `docker-compose.yml`
- Or stop conflicting services on your machine

## Next Steps

Refer to `rundown/techrundown.md` for detailed technical documentation and future implementation plans.
