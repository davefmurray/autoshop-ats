# AutoShop ATS

Simple applicant tracking system for automotive shops.

## Tech Stack

- **Backend:** FastAPI + SQLAlchemy + Pydantic
- **Frontend:** React + Vite + TypeScript + Tailwind CSS + TanStack Table
- **Database:** Supabase (Postgres)
- **Auth:** Supabase Auth
- **Storage:** Supabase Storage (resumes)
- **Deployment:** Railway

## Features

- Public application form for job candidates
- Admin dashboard with sortable/filterable applicant list
- Applicant detail view with notes timeline
- Status pipeline: NEW > CONTACTED > PHONE_SCREEN > IN_PERSON_1 > IN_PERSON_2 > OFFER_SENT > HIRED/REJECTED
- Resume upload to Supabase Storage
- Real-time data with TanStack Query

## Quick Start

### 1. Supabase Setup

1. Create project at supabase.com
2. Run `supabase/migrations/001_initial_schema.sql` in SQL Editor
3. Create storage bucket named `resumes` (public)

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env  # Edit with Supabase creds
uvicorn app.main:app --reload
```

### 3. Frontend

```bash
cd frontend
npm install
cp .env.example .env  # Edit with API URL + Supabase
npm run dev
```

## Environment Variables

See `.env.example` files in `/backend` and `/frontend`

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/applicants | Public | Submit application |
| GET | /api/applicants | Auth | List applicants |
| GET | /api/applicants/{id} | Auth | Get detail |
| PATCH | /api/applicants/{id} | Auth | Update |
| DELETE | /api/applicants/{id} | Auth | Delete |
| GET | /api/applicants/{id}/notes | Auth | List notes |
| POST | /api/applicants/{id}/notes | Auth | Add note |

## License

MIT
