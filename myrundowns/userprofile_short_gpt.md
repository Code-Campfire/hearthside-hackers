# User Profile Management — Technical Rundown (Short Version)

## Overview

Add a profile page where logged-in users can view and update their basic account information and preferences. This builds on the existing JWT auth system.

**Users will be able to update:**

- Name
- Email (must stay unique)
- Preferred currency
- Email notification preference

---

## Database Changes

Add two new fields to the existing `users` table:

```sql
ALTER TABLE users
ADD COLUMN preferred_currency VARCHAR(3) DEFAULT 'USD',
ADD COLUMN email_notifications BOOLEAN DEFAULT TRUE;
```

No new tables required.

---

## API Endpoints

### View Profile (existing)

`GET /api/auth/me` — reused for displaying current user info.

### Update Profile (new)

`PUT /api/users/profile`  
Accepts any combination of:  
`name`, `email`, `preferred_currency`, `email_notifications`.

**Validation:**

- At least one field required
- Email must be valid + unique
- Currency must be a valid 3-letter code
- Email notifications must be boolean

---

## Implementation Plan

### Backend

- Add route: `/api/users/profile`
- Reuse existing JWT middleware
- Validate input with Zod
- Check duplicate email when applicable
- Update only provided fields
- Return updated user (excluding password hash)

### Frontend

- Add `ProfilePage.tsx` for viewing/editing profile
- Add `/profile` route
- Add `updateProfile()` method to AuthContext
- Show simple form to update fields

---

## Security

- All profile actions require a valid JWT
- Users can only update **their own** profile
- Email uniqueness enforced at DB level
- No password updates in this flow

---

## Testing

**Manual testing:**

- Update name/email
- Test duplicate email
- Change currency
- Toggle email notifications
- Refresh & relogin to confirm persistence

---

## Limitations (MVP)

- No email verification for email changes
- No actual email sending yet (just storing preference)
- No password update, profile photo, or account deletion

---
