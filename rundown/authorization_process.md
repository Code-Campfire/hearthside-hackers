# Authorization Process - Technical Implementation Notes

## Authentication System

### Overview
Implementing JWT-based authentication with bcrypt password hashing following REST conventions outlined in techrundown.md.

### Architecture
- **Frontend:** React - handles login/register forms, token storage, protected routes
- **Backend:** Express.js - validates credentials, generates JWTs, protects endpoints
- **Database:** PostgreSQL - stores user accounts with hashed passwords

### Security Standards (from techrundown.md)
- Password Storage: bcrypt with salt rounds >= 10
- Authentication: JWT with Authorization header or httpOnly cookies
- Input Validation: Zod schemas for request validation
- SQL Injection Prevention: Parameterized queries (pg library handles this)

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Constraints:**
- Email: Unique, required
- Password: Stored as bcrypt hash (never plain text)
- Timestamps: Automatic creation/update

---

## API Endpoints

### Authentication Routes (`/api/auth/*`)

#### 1. Register User
```
POST /api/auth/register
Content-Type: application/json

Request Body:
{
  "email": "user@example.com",
  "password": "secure_password_123"
}

Response (201 Created):
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "created_at": "2025-11-20T12:00:00Z"
  }
}

Error Response (400 Bad Request):
{
  "success": false,
  "message": "Email already exists"
}
```

#### 2. Login User
```
POST /api/auth/login
Content-Type: application/json

Request Body:
{
  "email": "user@example.com",
  "password": "secure_password_123"
}

Response (200 OK):
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com"
  }
}

Error Response (401 Unauthorized):
{
  "success": false,
  "message": "Invalid email or password"
}
```

#### 3. Get Current User (Protected)
```
GET /api/auth/me
Authorization: Bearer <JWT_TOKEN>

Response (200 OK):
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "created_at": "2025-11-20T12:00:00Z"
  }
}

Error Response (401 Unauthorized):
{
  "success": false,
  "message": "Invalid or missing token"
}
```

---

## Backend Implementation Details

### Dependencies to Install
```json
{
  "bcrypt": "^5.1.1",           // Password hashing
  "jsonwebtoken": "^9.0.2",     // JWT generation/verification
  "zod": "^3.24.1",             // Input validation
  "@types/bcrypt": "^5.0.2",    // TypeScript types
  "@types/jsonwebtoken": "^9.0.7" // TypeScript types
}
```

### File Structure
```
backend/src/
├── index.ts           # Express app setup, routes
├── db.ts              # Database connection
├── auth.ts            # Auth utilities (NEW)
├── middleware/
│   └── auth.ts        # JWT verification middleware (NEW)
├── routes/
│   └── auth.ts        # Authentication endpoints (NEW)
└── types/
    └── index.ts       # TypeScript types (NEW)
```

### Key Functions

#### `auth.ts` - Authentication Utilities
- `hashPassword(password: string): Promise<string>` - Hash password with bcrypt
- `verifyPassword(password: string, hash: string): Promise<boolean>` - Compare password with hash
- `generateToken(userId: number): string` - Generate JWT token
- `verifyToken(token: string): JwtPayload | null` - Verify and decode JWT

#### `middleware/auth.ts` - Middleware
- `authenticateToken(req, res, next)` - Verify JWT in Authorization header, attach user to request

#### `routes/auth.ts` - API Routes
- `POST /register` - Create new user
- `POST /login` - Authenticate user
- `GET /me` - Get current user (protected)

### Environment Variables
```env
JWT_SECRET=your_super_secret_key_here_min_32_chars
JWT_EXPIRES_IN=7d
```

---

## Frontend Implementation Details

### Components
- **LoginPage** - Form for existing users
- **RegisterPage** - Form for new users
- **ProtectedRoute** - Route wrapper that checks for valid token

### Token Management
- Store JWT in localStorage as `authToken`
- Include in API requests via Authorization header: `Authorization: Bearer <token>`
- Clear on logout

### State Management
- User context or state hook to store authenticated user info
- Token validation on app load (call `/api/auth/me`)

### Flow
1. User registers → POST to `/api/auth/register`
2. On success, redirect to login
3. User logs in → POST to `/api/auth/login`
4. Store returned token in localStorage
5. Subsequent requests include token in Authorization header
6. On 401 response, clear token and redirect to login

---

## Implementation Checklist

### Backend
- [x] Create users table in database
- [x] Install dependencies (bcrypt, jsonwebtoken, zod)
- [x] Create auth utilities (`backend/src/auth.ts`)
- [x] Create auth middleware (`backend/src/middleware/auth.ts`)
- [x] Create auth routes (`backend/src/routes/auth.ts`)
- [x] Update `backend/src/index.ts` to use auth routes
- [x] Add JWT_SECRET to `.env`
- [x] Test endpoints with curl or Postman

### Frontend
- [x] Create LoginPage component
- [x] Create RegisterPage component
- [x] Create user context/state for auth (AuthContext)
- [x] Axios automatically includes Authorization header (via axios config in login/me requests)
- [x] Create ProtectedRoute component
- [x] Update App.tsx routing
- [x] Test login/register flow

---

## Testing Strategy

### Backend (to be implemented)
- POST /api/auth/register with valid data
- POST /api/auth/register with duplicate email
- POST /api/auth/register with invalid email
- POST /api/auth/login with valid credentials
- POST /api/auth/login with wrong password
- GET /api/auth/me with valid token
- GET /api/auth/me with invalid token

### Frontend (to be implemented)
- Register form submission
- Login form submission
- Token persistence on page reload
- Protected route access with/without token
- Logout flow

---

## Notes & Decisions

- Using JWT with Authorization header (stateless, easier for REST API)
- Password hashing with bcrypt (industry standard, slow by design for security)
- Zod for validation (type-safe, good error messages)
- No session management needed (JWT is stateless)
- Frontend stores token in localStorage (simple, but consider httpOnly cookie for enhanced security)

