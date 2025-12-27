User Profile Management — Technical Rundown
Overview

This feature adds a profile page where authenticated users can view and update their basic account information and personal preferences. It builds directly on our existing JWT authentication system.

Users will be able to:

View their profile (name, email, account age)

Update their name and email

Choose a preferred currency (for displaying amounts in the app)

Turn email notifications on/off

Database Changes

We are adding two new preference fields to the existing users table. No new tables required.

ALTER TABLE users
ADD COLUMN preferred_currency VARCHAR(3) DEFAULT 'USD',
ADD COLUMN email_notifications BOOLEAN DEFAULT TRUE;


Updated user fields include:

name — editable

email — editable + must remain unique

preferred_currency — new (ex: USD, EUR, GBP)

email_notifications — new (boolean toggle)

created_at, id, password_hash — unchanged

API Endpoints
View Profile (already exists)
GET /api/auth/me
Authorization: Bearer <JWT_TOKEN>


We’re reusing this endpoint for displaying profile details.

Update Profile (new)
PUT /api/users/profile
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json


Example payload:

{
  "name": "Jane Doe",
  "email": "new@example.com",
  "preferred_currency": "EUR",
  "email_notifications": false
}


Validation rules:

At least one field is required

Email must be valid format + unique

Currency must be a valid 3-letter code

email_notifications must be boolean

Example success response:

{
  "success": true,
  "message": "Profile updated successfully",
  "user": {
    "id": 1,
    "email": "new@example.com",
    "name": "Jane Doe",
    "preferred_currency": "EUR",
    "email_notifications": false,
    "created_at": "2025-11-25T22:28:11.760Z"
  }
}

Implementation Plan
Backend

Add new route file: backend/src/routes/users.ts

Register /api/users route group in backend/src/index.ts

Reuse existing authenticateToken middleware

Validate request body with Zod

If email is being changed, check for duplicates

Update only the provided fields

Return the updated user (excluding password hash)

Frontend

Add a new ProfilePage.tsx for viewing/editing profile

Add /profile route to App.tsx

Extend AuthContext to include updateProfile()

Display current values and allow editing in a simple form

After successful update, refresh local user state

Dependencies

No new dependencies required.
Using existing: Zod, Express, pg, JWT, React, axios.

Technical Decisions

Adding currency + notification preferences now keeps profile settings in one place and supports future budgeting features.

Even though we aren’t sending emails yet, storing the email_notifications flag lets us build toward that later.

Email verification is not included for MVP (adds complexity to auth flows). This will be added in a later ticket.

/api/users/profile is kept separate from /api/auth to separate authentication logic from user account data.

Security Notes

JWT required for all profile actions

Users can only update their own profile (userId from token)

Email uniqueness enforced at DB level

Zod validation prevents bad data

Parameterized queries prevent SQL injection

Password hash is never returned to the client

Testing Plan
Manual Testing

Log in and navigate to /profile

Update name → verify it saves

Update email to one already used → verify error

Change currency → verify it updates

Toggle email notifications → verify it updates

Refresh the page → values should persist

Logout/login → updated profile should load correctly

API Testing (example)
# Get token
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  | jq -r '.token')

# Update profile
curl -X PUT http://localhost:3001/api/users/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"preferred_currency":"EUR","email_notifications":false}'

Known Limitations (MVP)

No email verification when changing email

No actual email sending yet (just storing preference)

No password change flow (separate ticket)

No profile picture or additional settings

No account deletion flow

Future upgrades: email verification, SendGrid integration, more preferences, audit logs, profile photos.

Database Migration (optional script)
docker exec budget-analyzer-db psql -U postgres -d budget_analyzer -c \
"ALTER TABLE users
 ADD COLUMN IF NOT EXISTS preferred_currency VARCHAR(3) DEFAULT 'USD',
 ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT TRUE;"

Summary

This feature adds a basic but essential user profile system where users can update their personal info and set two key preferences. It fits cleanly into our existing architecture, requires minimal backend changes, and lays the groundwork for future budgeting and notification features.