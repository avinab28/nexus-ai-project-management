# NEXUS Deployment & Production Guide

This guide details running NEXUS locally with zero-configuration SQLite or deploying to production using Docker, PostgreSQL, and cloud environments (Neon, Supabase, Render, Railway, Vercel).

---

## 1. Local Zero-Setup Quickstart

Requirements:
- Node.js 18+ or 20+
- npm 9+

### Step-by-Step:

1. **Clone & Install Dependencies**:
   ```bash
   git clone <repository-url>
   cd "NEXUS-AI Project Management"
   npm install
   cd backend && npm install && cd ../frontend && npm install && cd ..
   ```

2. **Configure Environment Variables**:
   In `backend/.env`:
   ```env
   PORT=5000
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="nexus-super-secret-enterprise-jwt-key"
   GEMINI_API_KEY="" # Optional: fallback heuristic runs automatically if absent
   ```

3. **Initialize Database & Seed Realistic Demo Data**:
   ```bash
   cd backend
   npx prisma db push
   npm run seed
   cd ..
   ```

4. **Launch Application (Frontend + Backend concurrently)**:
   ```bash
   npm run dev
   ```
   - Frontend runs on: `http://localhost:5173`
   - Backend API runs on: `http://localhost:5000`

---

## 2. Docker & Docker Compose Deployment

For containerized environments with managed PostgreSQL:

1. **Review `docker-compose.yml`**:
   ```yaml
   version: '3.8'

   services:
     postgres:
       image: postgres:16-alpine
       container_name: nexus-postgres
       environment:
         POSTGRES_USER: nexus
         POSTGRES_PASSWORD: nexus_secure_password
         POSTGRES_DB: nexus_db
       ports:
         - "5432:5432"
       volumes:
         - postgres_data:/var/lib/postgresql/data

     backend:
       build:
         context: ./backend
         dockerfile: Dockerfile
       container_name: nexus-backend
       ports:
         - "5000:5000"
       environment:
         PORT: 5000
         DATABASE_URL: "postgresql://nexus:nexus_secure_password@postgres:5432/nexus_db?schema=public"
         JWT_SECRET: "your-production-jwt-secret-string"
         GEMINI_API_KEY: "${GEMINI_API_KEY}"
       depends_on:
         - postgres

     frontend:
       build:
         context: ./frontend
         dockerfile: Dockerfile
       container_name: nexus-frontend
       ports:
         - "80:80"
       depends_on:
         - backend

   volumes:
     postgres_data:
   ```

2. **Run Containers**:
   ```bash
   docker compose up -d --build
   ```

---

## 3. Switching to Production PostgreSQL

NEXUS includes dual-mode Prisma schemas:
- `backend/prisma/schema.prisma` (Active SQLite development)
- `backend/prisma/schema.postgresql.prisma` (Production PostgreSQL with Enums)

To switch to PostgreSQL:
```bash
cp backend/prisma/schema.postgresql.prisma backend/prisma/schema.prisma
# Update DATABASE_URL in backend/.env to your PostgreSQL connection string
cd backend
npx prisma generate
npx prisma db push
npm run seed
```

---

## 4. Production Cloud Targets

### Backend (Render / Railway / Fly.io):
- Build Command: `npm install && npm run build`
- Start Command: `npm start`
- Environment Variables:
  - `DATABASE_URL`: `postgresql://...`
  - `JWT_SECRET`: 64+ char random string
  - `GEMINI_API_KEY`: Your Google AI Studio API Key

### Frontend (Vercel / Netlify / Cloudflare Pages):
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variables:
  - Set `VITE_API_URL` if deploying backend to a separate domain or configure rewrites.
