# Team OS — Supabase & Node.js (Express + nodemon) Setup Guide

This guide explains how to connect **Team OS** to your **Supabase (PostgreSQL)** database and run both the Node.js Express REST API and React frontend locally using **npm**.

---

## 1. Architecture Overview

```
┌─────────────────────────────────┐
│     React Frontend (Vite)       │
│     http://localhost:5174       │
└────────────────┬────────────────┘
                 │ REST API (JSON)
                 ▼
┌─────────────────────────────────┐
│ Node.js (Express + nodemon)     │
│     http://localhost:4000/api   │
└────────────────┬────────────────┘
                 │ Prisma ORM (TCP: 5432 / 6543)
                 ▼
┌─────────────────────────────────┐
│    Supabase (Cloud PostgreSQL)  │
│   Multi-tenant Database Tables  │
└─────────────────────────────────┘
```

---

## 2. Supabase Database Configuration

### Step A: Obtain Your Supabase Connection String
1. Log in to [Supabase Dashboard](https://supabase.com/dashboard) and create a new project.
2. Go to **Project Settings** (gear icon) ➔ **Database**.
3. Under **Connection string**, select **URI** (or **Session Pooler**).
4. Copy the connection string. It looks like:
   ```env
   DATABASE_URL="postgresql://postgres.[YOUR-PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```
   *(Or direct connection string: `postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres`)*

### Step B: Configure Environment Variables
Edit `.env` and `apps/api/.env` in the repository root:
```env
# Database
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# Backend API
PORT=4000
JWT_ACCESS_SECRET="your-super-secret-jwt-access-key-minimum-32-chars-long"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_SECRET="your-super-secret-jwt-refresh-key-minimum-32-chars-long"
JWT_REFRESH_EXPIRATION="7d"
CORS_ORIGIN="*"

# Frontend
VITE_API_URL="http://localhost:4000/api"
```

---

## 3. Applying the Database Schema to Supabase

You can apply the schema using either **Option 1 (Automated with Prisma)** or **Option 2 (Supabase SQL Editor)**.

### Option 1: Automated Push via npm (Recommended)
From the repository root, run:
```bash
npm run db:push
```
This automatically inspects your Supabase database and creates all tables, enums, indexes, and foreign key constraints in under 5 seconds.

### Option 2: Run Schema in Supabase Dashboard SQL Editor
1. In Supabase Dashboard, click on **SQL Editor** in the left sidebar.
2. Click **New Query**.
3. Open and copy the contents of [`docs/supabase-schema.sql`](./supabase-schema.sql).
4. Paste into the SQL editor and click **Run**.

---

## 4. Seeding Demo Workspaces, Teams, Projects & Tasks

Populate your Supabase database with demo data (Company Alpha, Company Beta, users, tasks, and comments):
```bash
npm run db:seed
```

### Pre-Seeded Test Credentials
All accounts share password: `Password1234!`

| Email | Name | Workspace | Role |
| :--- | :--- | :--- | :--- |
| `owner@alpha.test` | Alpha Owner | Company Alpha | **OWNER** |
| `admin@alpha.test` | Alpha Admin | Company Alpha | **ADMIN** |
| `alice@alpha.test` | Alice (Member) | Company Alpha | **MEMBER** |
| `david@beta.test` | Beta Owner | Company Beta | **OWNER** (Isolated Tenant) |

---

## 5. Starting the Application Locally

### Single Command (Starts Both Backend & Frontend with Concurrently)
```bash
npm run dev
```

### Or in Separate Terminals:

#### Terminal 1: Node.js (Express API with nodemon)
```bash
npm run dev:api
```
- Server starts with hot reloading at: `http://localhost:4000/api`
- Health check: `http://localhost:4000/api/health`

#### Terminal 2: React Frontend (Vite)
```bash
npm run dev:web
```
- Application opens at: `http://localhost:5174` (or `http://localhost:5173`)

---

## 6. Running Tests

- **Backend Integration Tests (46/46 passed)**:
  ```bash
  npm run test:api
  ```
- **Frontend Component Tests (7/7 passed)**:
  ```bash
  npm run test:web
  ```
