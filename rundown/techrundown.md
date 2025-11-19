# Personal Budget Analyzer - Technical Rundown

## Project Overview

**Project Name:** Personal Budget Analyzer

**Purpose:** A personal finance application that helps users gain control of their money by organizing all financial information in one centralized location. The application solves the problem of scattered bills, receipts, transactions, and goals by automatically tracking spending, categorizing expenses, and storing important records.

**Key Features:**
- Centralized financial data management
- Automatic spending tracking
- Expense categorization
- Receipt storage and scanning
- Payment tracking
- Savings goal monitoring
- Financial habit analysis

**Deployment Model:** Local development using Docker containers (no production pipeline initially)

---

## Tech Stack

### Frontend

**React v18.3.1**
- **Type:** UI Library
- **Language:** TypeScript v5.6.3
- **Styling:** Tailwind CSS v3.4.16
- **Why React?**
  - Component-based architecture ideal for dashboard-style financial apps
  - Large ecosystem with excellent charting libraries (Recharts, Chart.js)
  - Strong TypeScript support for type-safe financial calculations
  - Virtual DOM provides smooth UX when rendering large transaction lists
- **Why TypeScript?**
  - Type safety critical for financial calculations and currency handling
  - Better IDE support and autocomplete for complex data structures
  - Reduces runtime errors in money-related operations
  - Improved maintainability for team collaboration
- **Why Tailwind CSS?**
  - Rapid UI development with utility-first classes
  - Consistent design system out of the box
  - Smaller bundle size compared to component libraries
  - Easy to customize for financial data visualization needs

**Additional Frontend Dependencies:**
- **Build Tool:** Vite v6.0.3
  - Lightning-fast HMR for development
  - Optimized build process
  - Native TypeScript support
- **HTTP Client:** Axios v1.7.9
  - Simple API for HTTP requests
  - Automatic JSON transformation
  - Request/response interceptors for auth tokens
- **Routing:** React Router v7.1.1
  - Client-side routing for SPA
  - Nested routes for dashboard sections
- **Form Management:** React Hook Form v7.54.2
  - Performant form handling with minimal re-renders
  - Built-in validation
  - Great for transaction input forms
- **State Management:** TBD (Context API may suffice, or Redux Toolkit v2.5.0 if needed)

---

### Backend

**Node.js v22.12.0 LTS**
- **Runtime:** JavaScript runtime built on Chrome's V8 engine
- **Framework:** Express.js v4.21.2
- **Language:** TypeScript v5.6.3
- **Why Node.js?**
  - JavaScript across full stack reduces context switching
  - Non-blocking I/O ideal for handling multiple concurrent users
  - Excellent package ecosystem (npm)
  - Strong async support for database queries and file operations
- **Why Express?**
  - Minimal and flexible framework
  - Large middleware ecosystem
  - Simple routing for REST API
  - Well-documented and mature

**Additional Backend Dependencies:**
- **ORM:** Prisma v6.2.0 or pg (node-postgres) v8.13.1
  - **Prisma:** Type-safe database client, migrations, schema management
  - **pg:** Lightweight if Prisma feels too heavy
- **Authentication:** jsonwebtoken v9.0.2 + bcrypt v5.1.1
  - JWT for stateless auth
  - bcrypt for password hashing
- **Environment Variables:** dotenv v16.4.7
  - Manage database credentials and secrets
- **Validation:** Zod v3.24.1 or express-validator v7.2.0
  - Runtime type validation for API requests
  - Critical for financial data integrity
- **CORS:** cors v2.8.5
  - Handle cross-origin requests during development
- **File Upload:** multer v1.4.5-lts.1
  - Handle receipt image uploads
  - Memory or disk storage for scanning pipeline
- **Testing:** Jest v29.7.0 + Supertest v7.0.0
  - Unit and integration testing
  - API endpoint testing

---

### Database

**PostgreSQL v17.2**
- **Type:** Relational Database Management System
- **Why PostgreSQL?**
  - ACID compliance critical for financial transactions
  - Excellent JSON support for flexible data storage (receipts, metadata)
  - Strong data integrity constraints
  - Superior performance with complex queries
  - Support for advanced features (triggers, stored procedures)
  - Free and open-source
- **Schema:** To be defined by development team
  - Base database will be initialized
  - Schema migrations handled via Prisma or raw SQL scripts

**Expected Tables (for reference):**
- Users
- Accounts
- Transactions
- Categories
- Budgets
- Goals
- Receipts
- Bills

---

### DevOps & Infrastructure

**Docker v27.4.1**
- **Why Docker?**
  - Consistent development environment across team
  - Isolated services (frontend, backend, database)
  - Easy onboarding for new developers
  - Simulates production-like environment locally
  - Simplified dependency management

**Docker Compose v2.31.0**
- **Why Docker Compose?**
  - Orchestrate multi-container setup
  - Single command to start entire application
  - Network isolation between services
  - Volume management for database persistence

**Services:**
1. **PostgreSQL Container**
   - Official postgres:17.2-alpine image
   - Persistent volume for data storage
   - Exposed on port 5432
2. **Backend Container**
   - Node.js 22-alpine base image
   - Express API server
   - Exposed on port 3001
3. **Frontend Container**
   - Node.js 22-alpine base image
   - Vite dev server
   - Exposed on port 5173

---

## Advanced Features

### Receipt Scanning

**Technology Options:**
- **Tesseract.js v5.1.1** (OCR in JavaScript)
  - Client-side or server-side text extraction
  - Free and open-source
- **Google Cloud Vision API** or **AWS Textract**
  - More accurate OCR
  - Paid service
  - Better for handwritten receipts
- **Image Processing:** Sharp v0.33.5
  - Resize and optimize uploaded images
  - Prepare images for OCR pipeline

**Workflow:**
1. User uploads receipt image
2. Image stored in file system or cloud storage
3. OCR extracts text (merchant, date, amount, items)
4. Parser attempts to structure data
5. User reviews and confirms extracted data
6. Transaction automatically created

---

## Architecture Overview

### Application Architecture

```
┌─────────────────────────────────────────────┐
│          Frontend (React + Vite)            │
│  - TypeScript                               │
│  - Tailwind CSS                             │
│  - React Router                             │
│  - Axios for API calls                      │
└─────────────────┬───────────────────────────┘
                  │ HTTP/REST
                  │ (port 5173 → 3001)
┌─────────────────▼───────────────────────────┐
│       Backend (Node.js + Express)           │
│  - TypeScript                               │
│  - REST API endpoints                       │
│  - JWT authentication                       │
│  - File upload handling                     │
│  - Business logic                           │
└─────────────────┬───────────────────────────┘
                  │ SQL queries
                  │ (port 3001 → 5432)
┌─────────────────▼───────────────────────────┐
│         Database (PostgreSQL)               │
│  - User data                                │
│  - Transactions                             │
│  - Categories, Budgets, Goals               │
│  - Receipt metadata                         │
└─────────────────────────────────────────────┘
```

### Data Flow Example: Adding a Transaction

1. User fills out transaction form in React
2. React Hook Form validates input
3. POST request sent to `/api/transactions`
4. Express middleware validates JWT token
5. Zod schema validates request body
6. Express controller processes request
7. Prisma/pg inserts record into PostgreSQL
8. Response sent back to frontend
9. React updates UI with new transaction

---

## Development Setup

### Prerequisites
- Docker Desktop v4.37.2 or later
- Node.js v22.12.0 (for local development outside Docker)
- npm v10.9.2 or yarn v1.22.22
- Git v2.47.1

### Initial Setup Steps

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd hearthside-hackers
   ```

2. **Environment Configuration**
   - Copy `.env.example` to `.env`
   - Configure database credentials
   - Set JWT secret
   - Configure any API keys (if using cloud OCR)

3. **Start Docker Containers**
   ```bash
   docker-compose up -d
   ```

4. **Database Initialization**
   - Database container starts with empty PostgreSQL instance
   - Development team will create schema migrations
   - Run migrations: `npm run migrate` (to be implemented)

5. **Access Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - Database: localhost:5432

---

## Database Setup Notes

**Current Scope:**
- Docker container with PostgreSQL 17.2
- Empty database initialized
- pgAdmin or CLI access configured
- Volume mounted for data persistence

**Team Responsibility:**
- Define schema based on application requirements
- Create migration scripts
- Seed initial data (categories, etc.)
- Set up indexes and constraints

**Schema Design Considerations:**
- User authentication and authorization
- Transaction categorization (many-to-one or many-to-many?)
- Recurring bills vs one-time transactions
- Goal tracking with progress updates
- Receipt image metadata and OCR results
- Currency handling (decimal precision)
- Date/time handling (timezones)

---

## Security Considerations

1. **Authentication:** JWT with httpOnly cookies or Authorization header
2. **Password Storage:** bcrypt with salt rounds >= 10
3. **SQL Injection:** Use parameterized queries (Prisma handles this)
4. **XSS Protection:** Sanitize user inputs, React handles most XSS by default
5. **CSRF:** Implement CSRF tokens if using cookie-based auth
6. **Rate Limiting:** express-rate-limit for API endpoints
7. **File Upload Validation:** Check file types, size limits for receipts
8. **Environment Variables:** Never commit secrets to Git

---

## Testing Strategy

### Frontend Testing
- **Unit Tests:** Jest + React Testing Library
- **Component Tests:** Test user interactions, form submissions
- **E2E Tests:** Playwright or Cypress (optional)

### Backend Testing
- **Unit Tests:** Jest for business logic
- **Integration Tests:** Supertest for API endpoints
- **Database Tests:** In-memory SQLite or test database

### Test Coverage Goals
- Critical paths: 80%+ coverage
- Financial calculations: 100% coverage
- Authentication: 100% coverage

---

## Performance Considerations

1. **Database Indexing:** Index frequently queried columns (user_id, date, category_id)
2. **Query Optimization:** Use joins efficiently, avoid N+1 queries
3. **Pagination:** Limit transaction list queries (50-100 records per page)
4. **Image Optimization:** Compress receipt images before storage
5. **Caching:** Redis for session storage (future enhancement)
6. **Bundle Size:** Code splitting in React for faster initial load

---

## Future Enhancements

1. **Production Deployment:**
   - AWS, DigitalOcean, or Vercel
   - CI/CD pipeline with GitHub Actions
   - Automated testing and deployment

2. **Additional Features:**
   - Bank account integration (Plaid API)
   - Budget recommendations with AI
   - Recurring transaction detection
   - Export to CSV/PDF
   - Mobile responsive design or native app
   - Multi-currency support
   - Shared budgets for families

3. **Monitoring:**
   - Error tracking (Sentry)
   - Analytics (PostHog, Mixpanel)
   - Performance monitoring (New Relic)

---

## Team Workflow

1. **Version Control:** Git with feature branch workflow
2. **Code Reviews:** Pull requests required before merging
3. **Documentation:** Update this file as architecture evolves
4. **Communication:** Slack/Discord for real-time, GitHub Issues for tasks
5. **Sprint Planning:** Define tasks, assign owners, set deadlines

---

## Getting Help

- **React Docs:** https://react.dev
- **TypeScript Docs:** https://www.typescriptlang.org/docs
- **Express Docs:** https://expressjs.com
- **PostgreSQL Docs:** https://www.postgresql.org/docs
- **Docker Docs:** https://docs.docker.com
- **Tailwind CSS Docs:** https://tailwindcss.com/docs

---

## Changelog

- **2025-11-18:** Initial technical rundown created
  - Defined tech stack with versions
  - Outlined architecture
  - Established database setup approach
  - Documented advanced features (receipt scanning)
  - Set local Docker-based development environment
