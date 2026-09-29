# NEXUS — 100% Free Cloud Deployment Guide

This guide explains how to deploy **NEXUS — AI Project Management & Workflow Control Platform** completely free using **GitHub Pages** (Frontend) and **Render / Neon** (Backend API + PostgreSQL Database).

---

## Part 1: Push Your Code to GitHub

If you haven't pushed the repository to GitHub yet:

1. Go to [GitHub.com/new](https://github.com/new) and create a new repository (e.g. `nexus-ai-project-management`). Leave it empty (do NOT initialize with README or license).
2. Open PowerShell or Terminal in this project root:
   ```bash
   git remote add origin https://github.com/<YOUR-GITHUB-USERNAME>/nexus-ai-project-management.git
   git branch -M main
   git push -u origin main
   ```

---

## Part 2: Deploy Frontend on GitHub Pages (100% Free)

The repository includes an automated GitHub Actions deployment workflow (`.github/workflows/deploy-pages.yml`).

### Enable GitHub Pages in 2 Clicks:
1. Navigate to your repository on GitHub: `https://github.com/<YOUR-USERNAME>/<YOUR-REPO>`.
2. Click **Settings** (top tab) ➜ **Pages** (in left sidebar).
3. Under **Build and deployment** ➜ **Source**, select:
   👉 **GitHub Actions**
4. Push any commit or click **Actions** ➜ **Deploy Frontend to GitHub Pages** ➜ **Run workflow**.
5. Within 1-2 minutes, your website will be live at:
   🌐 `https://<YOUR-USERNAME>.github.io/<YOUR-REPO>/`

---

## Part 3: Deploy Full-Stack Backend & PostgreSQL (100% Free on Render)

The repository includes a ready-to-deploy Infrastructure-as-Code Blueprint (`render.yaml`).

1. Create a free account on [Render.com](https://render.com).
2. Click **New +** ➜ **Blueprint**.
3. Connect your GitHub repository (`nexus-ai-project-management`).
4. Render automatically reads `render.yaml` and provisions:
   - ✅ **nexus-db**: Free PostgreSQL managed database
   - ✅ **nexus-backend**: Free Node.js Express web service connected to the database
5. (Optional) In the Render dashboard, add your `GEMINI_API_KEY` under Environment variables if you want to use the live Gemini 1.5 Flash API (otherwise the built-in domain heuristic engine runs automatically).
6. Click **Apply**. Within a few minutes, your backend API will be live at:
   🌐 `https://nexus-backend-<id>.onrender.com`

---

## Summary of Free Deployment

| Component | Free Platform | Status |
|---|---|---|
| **Frontend Web App** | GitHub Pages | Deployed automatically via GitHub Actions workflow |
| **Backend API Gateway** | Render / Railway (Free Tier) | Configured via `render.yaml` |
| **PostgreSQL Database** | Render / Neon / Supabase (Free Tier) | Auto-provisioned |
| **Domain & SSL** | GitHub / Render | Free HTTPS certificate included |
