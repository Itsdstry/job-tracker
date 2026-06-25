# Job Tracker Pro

A polished full-stack job application tracker with:

- React + TypeScript + Vite frontend
- Express + TypeScript + Prisma backend
- Authentication, dashboard, application management, and profile features

## Project structure

- frontend/: Vite + React app
- backend/: Express + Prisma API

## Local development

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm run dev
```

## Environment setup

Copy the example env files and adjust values:

```bash
cp frontend/.env.example frontend/.env
cp backend/.env.example backend/.env
```

## Deployment notes

- Frontend: deploy to Vercel or Netlify
- Backend: deploy to Render, Railway, or Fly.io
- Make sure to set production environment variables for both apps

## Publish to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```
