# Deployment Guide - Vercel

## Project Structure

- **React Frontend** (root) - Vite + React app
- **Next.js Backend** (`vercel_server/`) - API backend
- **Local Backend** (`server/`) - Not deployed (local development only)

## Deploy to Vercel

### Frontend (React + Vite)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (root)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Add environment variable:
   - `VITE_API_URL` = `https://your-backend.vercel.app/api`
5. Deploy

### Backend (Next.js)

1. Go to [vercel.com](https://vercel.com) and create a new project
2. Import the same repository
3. Configure:
   - **Framework Preset:** Next.js
   - **Root Directory:** `vercel_server`
4. Add your environment variables (database, API keys, etc.)
5. Deploy

## Update Frontend API URL

After backend deployment, update frontend environment variable:
```
VITE_API_URL=https://your-nextjs-backend.vercel.app/api
```

Redeploy frontend to apply changes.

## Local Development

Continue using the `server/` folder for local backend development.
