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
   - Node.js backend API
   - React frontend application

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

The PostgreSQL database is initialized with an empty schema. The development team will create schema migrations as needed.

**Database Credentials** (for development):
- Host: localhost (or `database` within Docker network)
- Port: 5434 (host) / 5432 (container)
- Database: budget_analyzer
- User: postgres
- Password: postgres

## Next Steps

Refer to `rundown/techrundown.md` for detailed technical documentation and future implementation plans.
