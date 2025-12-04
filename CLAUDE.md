# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AutoShop ATS** is a multi-tenant applicant tracking system designed specifically for automotive repair shops. The application allows job applicants to submit applications via a public form and provides authenticated shop owners/managers with a dashboard to track, filter, and manage applicants through a defined status pipeline.

## Tech Stack

**Backend:**
- FastAPI (Python web framework)
- Supabase Python client (database + auth + storage)
- Pydantic (data validation)
- python-jose (JWT authentication)

**Frontend:**
- React 19 with TypeScript
- Vite (build tool)
- React Router v7 (routing)
- TanStack Query (server state management)
- TanStack Table (data tables)
- Tailwind CSS (styling)
- Supabase JS client (auth + realtime)

**Database & Infrastructure:**
- Supabase (Postgres database + Auth + Storage)
- Railway (backend deployment)

## Architecture

### Multi-Tenant Structure

The application uses a **shop-based multi-tenancy** model:
- Each shop has a unique `slug` used in the public application form URL (`/apply?shop=<slug>`)
- Users (shop owners/staff) authenticate via Supabase Auth
- User profiles are linked to shops via `profiles.shop_id`
- All applicant data is scoped to shops via `applicants.shop_id`
- RLS (Row Level Security) policies enforce tenant isolation

### Authentication Flow

1. **Frontend:** Users sign in via Supabase Auth (email/password)
2. **Frontend:** Obtains JWT access token from Supabase session
3. **Frontend → Backend:** Sends JWT in `Authorization: Bearer <token>` header
4. **Backend:** Validates JWT using `SUPABASE_JWT_SECRET` (see `app/auth.py`)
5. **Backend:** Extracts `user_id` from JWT, fetches `shop_id` from `profiles` table
6. **Backend:** Returns data filtered by user's `shop_id`

### Data Model

**Core Tables:**

- **shops**: Shop information (name, slug, settings)
- **profiles**: User profiles linked to auth.users (extends Supabase Auth)
- **applicants**: Job applicants with status pipeline
- **applicant_notes**: Timestamped notes/activity log per applicant

**Status Pipeline:**
`NEW → CONTACTED → PHONE_SCREEN → IN_PERSON_1 → IN_PERSON_2 → OFFER_SENT → HIRED/REJECTED`

### Backend Structure

```
backend/app/
├── main.py              # FastAPI app setup, CORS, router registration
├── config.py            # Pydantic settings (env vars)
├── auth.py              # JWT verification, current_user dependency
├── supabase_client.py   # Supabase client singleton
├── database.py          # SQLAlchemy setup (currently unused - Supabase client used instead)
├── models/              # SQLAlchemy models (defined but not actively used)
├── schemas/             # Pydantic schemas for request/response validation
└── routers/
    ├── applicants.py    # CRUD endpoints for applicants
    ├── notes.py         # CRUD endpoints for applicant notes
    ├── shops.py         # Shop lookup and creation endpoints
    ├── upload.py        # Resume upload presigned URL generation
    └── constants.py     # Static data (statuses, positions)
```

**Key Pattern:** The backend uses **Supabase client directly** instead of SQLAlchemy ORM for database operations. SQLAlchemy models exist but are not actively used.

### Frontend Structure

```
frontend/src/
├── App.tsx              # Router setup, QueryClient provider
├── main.tsx             # React root, Supabase client initialization
├── components/
│   ├── Layout.tsx       # Main layout wrapper with navigation
│   ├── ProtectedRoute.tsx  # Auth + shop ownership guard
│   └── StatusBadge.tsx  # Status pill component
├── pages/
│   ├── Login.tsx        # Supabase auth login form
│   ├── SetupShop.tsx    # First-time shop creation wizard
│   ├── Apply.tsx        # Public application form
│   ├── Dashboard.tsx    # Admin applicant list with TanStack Table
│   └── ApplicantView.tsx  # Applicant detail + notes timeline
├── hooks/
│   └── useAuth.tsx      # Auth context provider (session, user, shop)
└── lib/
    ├── api.ts           # Backend API client functions
    ├── supabase.ts      # Supabase client singleton
    └── types.ts         # TypeScript type definitions
```

## Common Development Tasks

### Running Locally

**Backend:**
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # Configure Supabase credentials
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env  # Configure API URL and Supabase keys
npm run dev  # Runs on http://localhost:5173
```

### Database Migrations

Migrations are stored in `supabase/migrations/` as SQL files:
- `001_initial_schema.sql` - Base schema (single-tenant)
- `002_multi_tenant_schema.sql` - Multi-tenant updates (shops table, RLS policies)

**To apply migrations:**
1. Open Supabase dashboard → SQL Editor
2. Copy/paste SQL from migration file
3. Execute

**Important:** This project does NOT use Alembic or automated migrations. All schema changes are manual SQL migrations run directly in Supabase.

### Testing Authentication

The backend expects a valid Supabase JWT token. To test authenticated endpoints:

1. **Get a token from the frontend:**
   - Sign in via `/login`
   - Open browser DevTools → Application → Local Storage → `sb-<project>-auth-token`
   - Copy the `access_token` value

2. **Use in API requests:**
   ```bash
   curl http://localhost:8000/api/applicants \
     -H "Authorization: Bearer <access_token>"
   ```

### Adding New Endpoints

**Backend (FastAPI):**
1. Create/update router in `backend/app/routers/`
2. Define Pydantic schemas in `backend/app/schemas/`
3. Use `Depends(get_current_user)` for protected routes
4. Filter queries by `current_user["shop_id"]`
5. Register router in `backend/app/main.py`

**Frontend (React):**
1. Add API client function to `frontend/src/lib/api.ts`
2. Use `fetchWithAuth()` helper for authenticated requests
3. Create TanStack Query hooks in page components
4. Update TypeScript types in `frontend/src/lib/types.ts`

## Environment Variables

### Backend (.env)

**Required:**
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_KEY` - Service role key (for admin operations)
- `SUPABASE_JWT_SECRET` - JWT secret for token verification (Settings → API → JWT Secret)

**Optional:**
- `FRONTEND_URL` - Frontend origin for CORS (default: http://localhost:5173)
- `DATABASE_URL` - Direct Postgres connection string (not currently used)

### Frontend (.env)

**Required:**
- `VITE_API_URL` - Backend API base URL (e.g., http://localhost:8000)
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Supabase anon/public key

## Key Design Patterns

### Supabase Client Usage

**Backend uses service role key** for admin operations:
```python
from app.supabase_client import get_supabase
supabase = get_supabase()  # Uses service role key
result = supabase.table("applicants").select("*").execute()
```

**Frontend uses anon key** with RLS:
```typescript
import { supabase } from './lib/supabase';
const { data, error } = await supabase.from('applicants').select('*');
```

### Protected Routes Pattern

All admin endpoints require authentication. The pattern:

**Backend:**
```python
@router.get("/api/applicants")
def list_applicants(current_user: dict = Depends(get_current_user)):
    shop_id = current_user["shop_id"]
    # Query filtered by shop_id
```

**Frontend:**
```tsx
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
```

### Notes Auto-Creation

When applicant status changes, an automatic note is created:
```python
# In applicants.py update endpoint
if status_changed:
    supabase.table("applicant_notes").insert({
        "applicant_id": applicant_id,
        "added_by": current_user["full_name"] or "System",
        "message": f"Status changed to {new_status}"
    }).execute()
```

### Resume Upload (S3 Presigned URLs)

The backend generates Supabase Storage presigned URLs:
```python
# POST /api/upload/resume
# Returns: {"upload_url": "...", "public_url": "..."}
```

Frontend uploads directly to Supabase Storage:
```typescript
const { upload_url, public_url } = await uploadResume(file);
await fetch(upload_url, { method: 'PUT', body: file });
// Store public_url in applicant.form_data.resume_url
```

## Database Schema Notes

**Column Naming:**
- Backend schemas use `snake_case` (e.g., `full_name`, `shop_id`)
- Database columns use `snake_case`
- Frontend types mirror backend naming

**JSON Columns:**
- `applicants.form_data` - Stores flexible form responses (certifications, resume URL, etc.)
- `applicants.internal_data` - Reserved for internal notes/metadata not exposed to applicants

**Timestamps:**
- All tables use `timestamptz` (timezone-aware timestamps)
- `updated_at` automatically updated via Postgres trigger

## Critical Dependencies

**Backend:**
- `supabase>=2.0.0` - Supabase Python client (uses REST API)
- `python-jose[cryptography]` - JWT decoding/verification

**Frontend:**
- `@supabase/supabase-js` - Supabase JS client (auth + database + storage)
- `@tanstack/react-query` - Server state caching and synchronization
- `@tanstack/react-table` - Headless table component for applicant list
- `react-router-dom` - Client-side routing

## Deployment

**Backend (Railway):**
- Dockerfile included at `backend/Dockerfile`
- Set environment variables in Railway dashboard
- Auto-deploys from main branch (if connected to GitHub)

**Frontend (Railway/Vercel/Netlify):**
- Build command: `npm run build`
- Output directory: `dist`
- Set `VITE_*` environment variables in hosting platform

**Database (Supabase):**
- Managed Postgres database
- RLS policies enforce security
- Storage bucket `resumes` must be created manually (Settings → Storage)

## Important Notes

- **No SQLAlchemy migrations:** Database changes are manual SQL migrations in `supabase/migrations/`
- **RLS is critical:** All tables have Row Level Security policies - test them carefully
- **Shop isolation:** Always filter by `shop_id` in authenticated endpoints
- **JWT verification:** Backend validates Supabase JWTs using shared secret - ensure `SUPABASE_JWT_SECRET` matches Supabase dashboard value
- **CORS:** Backend allows `http://localhost:5173` by default - update `FRONTEND_URL` for production
