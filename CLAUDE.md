# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal Budget Analyzer is a personal finance application that helps users centralize financial information, track spending, categorize expenses, and manage budgets/goals. Currently in early development with base infrastructure only.

**Current State:** Base setup with Docker containerization, health check endpoint, and connection verification UI. Database schema and API endpoints are to be implemented by the development team.

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

# Stop and remove volumes (clean database)
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
```

## Architecture

### Three-Tier Architecture

1. **Frontend (React SPA)** - Port 5174
   - Vite dev server with HMR
   - Tailwind CSS for styling
   - Axios for API communication
   - Environment-based API URL configuration via `VITE_API_URL`

2. **Backend (Express API)** - Port 3001
   - TypeScript with ES Modules (`"type": "module"` in package.json)
   - CORS enabled for frontend communication
   - Database connection pooling via `pg` library
   - Health check endpoint: `GET /api/health`

3. **Database (PostgreSQL)** - Port 5434 (host) / 5432 (container)
   - Alpine-based Docker image
   - Persistent volume: `postgres_data`
   - Empty schema (to be defined by team)

### Key Architectural Decisions

**ES Modules Import Pattern (Backend):**
The backend uses ES Modules. The `pg` library requires special import handling:
```typescript
import pkg from 'pg';
const { Pool } = pkg;
```
This pattern is necessary because `pg` doesn't provide named exports in ESM mode.

**Database Connection:**
- Connection pooling is centralized in `backend/src/db.ts`
- Export: `checkDatabaseConnection()` for health checks
- Export: `pool` (default) for query execution
- Connection details read from environment variables

**Docker Networking:**
- Services communicate via Docker network using service names
- Backend connects to database using hostname `database` (not `localhost`)
- Frontend makes API calls to `http://localhost:3001` from browser (not Docker network)

**Port Mappings:**
- Database: 5434:5432 (to avoid conflicts with local PostgreSQL)
- Backend: 3001:3001
- Frontend: 5174:5173 (to avoid conflicts)

### Environment Variables

**Backend (`backend/.env`):**
```
PORT=3001
DB_HOST=database          # Use "database" inside Docker, "localhost" for local dev
DB_PORT=5432              # Container port, not host port
DB_NAME=budget_analyzer
DB_USER=postgres
DB_PASSWORD=postgres
```

**Frontend (`frontend/.env`):**
```
VITE_API_URL=http://localhost:3001
```

All `.env` files are gitignored. Reference `.env.example` files for configuration templates.

## Code Organization

### Backend Structure
```
backend/src/
├── index.ts    # Express app setup, middleware, routes
└── db.ts       # PostgreSQL connection pool and utilities
```

**Future API Structure (Not Yet Implemented):**
API endpoints will follow RESTful conventions under `/api/*`. Schema design, migrations, and endpoint implementation are team responsibilities.

### Frontend Structure
```
frontend/src/
├── main.tsx    # React app entry point
├── App.tsx     # Root component with health check logic
└── index.css   # Tailwind CSS imports
```

**Connection Status Logic:**
The `App.tsx` component fetches `/api/health` on mount to verify backend and database connectivity. "Connected" displays in green only when both are operational.

## Database Schema

**Current State:** Empty database with no tables.

**Team Responsibility:**
- Define schema based on requirements (Users, Transactions, Categories, Budgets, Goals, Receipts, Bills)
- Create migration strategy (Prisma or raw SQL)
- Handle currency precision (DECIMAL type recommended)
- Handle timezones for date/time fields

**Planned Technologies:**
- ORM: Prisma (preferred) or raw `pg` queries
- Migrations: Prisma Migrate or custom SQL scripts
- Validation: Zod or express-validator for request validation

## Financial Data Handling

This application handles financial data. Critical considerations:

1. **Currency Precision:** Use `DECIMAL(19, 4)` or similar in PostgreSQL, never floats
2. **Calculations:** All money math must use libraries like `decimal.js` or perform calculations in smallest currency unit (cents)
3. **Type Safety:** TypeScript types for all financial operations
4. **Validation:** Server-side validation of all transaction amounts, dates, categories
5. **ACID Compliance:** PostgreSQL transactions for multi-step financial operations

## Future Development Areas

**Planned Features (See `rundown/techrundown.md`):**
- Authentication (JWT + bcrypt)
- Receipt scanning (Tesseract.js or cloud OCR)
- Recurring transaction detection
- Budget tracking and alerts
- Financial reporting/analytics
- Export to CSV/PDF

**Testing Strategy (To Be Implemented):**
- Backend: Jest + Supertest for API endpoints
- Frontend: Jest + React Testing Library
- 100% coverage required for financial calculations and authentication

**Performance Considerations:**
- Database indexing on `user_id`, `date`, `category_id`
- Pagination for transaction lists (50-100 records/page)
- Image optimization for receipt uploads

## Common Issues

**Backend won't start:**
- Check `docker-compose logs backend` for errors
- Verify database is healthy: `docker-compose ps`
- Ensure `backend/src/db.ts` uses the correct `pg` import pattern

**Frontend shows "Not Connected":**
- Verify backend is running: `curl http://localhost:3001/api/health`
- Check CORS configuration in `backend/src/index.ts`
- Verify `VITE_API_URL` in `frontend/.env`

**Database connection errors:**
- Inside Docker: Use `DB_HOST=database`
- Outside Docker: Use `DB_HOST=localhost` and `DB_PORT=5434`
- Check database health: `docker-compose ps` (should show "healthy")

**Port conflicts:**
- PostgreSQL: Change `5434` in `docker-compose.yml` if needed
- Frontend: Change `5174` in `docker-compose.yml` if needed
- Backend: Change `PORT` in `backend/.env` and `docker-compose.yml`

## Additional Resources

- Full tech stack details: `rundown/techrundown.md`
- Setup instructions: `README.md`
- API design principles, security considerations, and architecture diagrams: `rundown/techrundown.md`
