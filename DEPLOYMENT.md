# Deployment Guide - Vercel

## Project Structure

- **React Frontend** (root) - Vite + React app
- **Next.js Backend** (`vercel_server/`) - API backend (serverless functions)
- **Local Backend** (`server/`) - Not deployed (local development only)

## Deploy to Vercel (Single Project)

Your project is configured as a monorepo - both frontend and backend deploy together.

### Prerequisites

1. MongoDB Atlas account with a database created
2. GitHub repository with your code
3. Vercel account

### Deployment Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect the configuration from `vercel.json`

3. **Add Environment Variable**
   - In project settings, go to "Environment Variables"
   - Add: `MONGO_URI` = `mongodb+srv://username:password@cluster.mongodb.net/database_name`
   - Apply to Production, Preview, and Development

4. **Deploy**
   - Click "Deploy"
   - Wait for build to complete

### How It Works

- **Frontend**: Builds to `dist/` and serves at root (`/`)
- **Backend**: API routes available at `/api/*`
- **Routing**: `vercel.json` rewrites `/api/*` to `vercel_server/app/api/*`
- **Same Domain**: No CORS issues, everything on one domain
- **API Base**: React app uses `/api` (already configured in App.jsx)

### API Endpoints

All endpoints are available at `/api`:

**Students:**
- `GET /api/students` - Get all students
- `POST /api/students` - Create student
- `PUT /api/students/:id` - Update student
- `PUT /api/students/:id/archive` - Archive student
- `PUT /api/students/:id/clear-dues` - Clear dues

**Schedule:**
- `GET /api/schedule` - Get all classes
- `POST /api/schedule` - Create class
- `PUT /api/schedule/:id/status` - Update class status
- `DELETE /api/schedule/:id` - Delete class

### Environment Variables

Required in Vercel:
```
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name
```

### Vercel Configuration

The `vercel.json` file configures:
- Build command: `npm run build`
- Output directory: `dist`
- Serverless functions for API routes
- URL rewrites for API routing

## Local Development

Continue using the `server/` folder for local backend:

1. Create `.env` file in `server/` folder:
   ```
   MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/database_name
   PORT=5000
   ```

2. Run local backend:
   ```bash
   cd server
   npm install
   node server.js
   ```

3. Run frontend (in root):
   ```bash
   npm install
   npm run dev
   ```

4. Update `App.jsx` API_BASE to `http://localhost:5000/api` for local development

## Troubleshooting

- **Build fails**: Check that all dependencies are in `package.json`
- **API not working**: Verify `MONGO_URI` is set in Vercel environment variables
- **Database connection fails**: Check MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
- **404 on API routes**: Ensure `vercel.json` rewrites are correct
