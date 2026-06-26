# Job Tracker Pro

A full-stack job application tracker built with React, TypeScript, and Node.js. Track applications through a Kanban board, visualize progress with charts, and manage the full hiring pipeline in one place.

**Live demo:** https://job-tracker-pro-gray.vercel.app

---

## Features

- **Kanban board** — drag-and-drop applications across status columns (Applied → Interview → Technical Test → Offer / Rejected)
- **Dashboard** — charts for monthly activity, status distribution, top companies, and salary ranges
- **Authentication** — JWT access + refresh token rotation; password reset via email
- **CSV export** — download filtered applications with one click
- **Dark mode** — system-aware theme toggle
- **Responsive** — mobile-first layout with slide-out navigation

## Tech Stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, TypeScript, Vite, TanStack Query, React Router, Recharts, Tailwind CSS |
| Backend | Node.js, Express, TypeScript, Prisma ORM, PostgreSQL |
| Auth | JWT (15m access / 7d refresh rotation), bcrypt, Nodemailer |
| Infra | Vercel (frontend), Render (backend + PostgreSQL) |

## Project Structure

```
job-tracker-pro/
├── frontend/
│   ├── src/
│   │   ├── features/          # Feature-colocated components, hooks, services
│   │   │   ├── applications/
│   │   │   ├── auth/
│   │   │   └── dashboard/
│   │   ├── components/        # Shared UI components
│   │   ├── context/           # AuthContext, ThemeContext
│   │   ├── pages/             # Route-level pages
│   │   └── services/          # Axios instance + API interceptors
└── backend/
    ├── src/
    │   ├── controllers/
    │   ├── services/          # Business logic
    │   ├── routes/
    │   ├── middlewares/       # Auth, validation, error handling
    │   └── utils/
    └── prisma/
        └── schema.prisma
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database

### Backend

```bash
cd backend
cp .env.example .env        # fill in DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET
npm install
npx prisma db push
npm run dev                 # http://localhost:3001
```

### Frontend

```bash
cd frontend
cp .env.example .env        # set VITE_API_URL=http://localhost:3001/api
npm install
npm run dev                 # http://localhost:5173
```

### Environment Variables

**Backend (`backend/.env`)**

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for access tokens |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens |
| `FRONTEND_URL` | Allowed CORS origin |
| `SMTP_HOST` | SMTP server (optional — for password reset emails) |
| `SMTP_PORT` | SMTP port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password / app password |

**Frontend (`frontend/.env`)**

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL |

## API Overview

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Rotate access token |
| POST | `/api/auth/logout` | Revoke refresh token |
| POST | `/api/auth/forgot-password` | Send reset email |
| POST | `/api/auth/reset-password` | Reset password with token |
| GET | `/api/applications` | List applications (paginated, filterable) |
| POST | `/api/applications` | Create application |
| PATCH | `/api/applications/:id` | Update application |
| DELETE | `/api/applications/:id` | Delete application |
| GET | `/api/applications/export` | Export CSV |
| GET | `/api/dashboard/stats` | Aggregate statistics |
| GET | `/api/dashboard/charts` | Chart data |

## License

MIT
