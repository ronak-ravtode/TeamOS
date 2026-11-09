# Team OS — AI Operating System for Teams (Milestone 1)

Milestone 1 establishes the core multi-tenant workspace foundation, role-based access control (RBAC), team management, project containers, Kanban board & list task management, task comments, and database-driven dashboard metrics.

Built with **React (Vite + Tailwind CSS)** on the frontend, a modular **Node.js (Express + TypeScript)** REST API on the backend with **nodemon**, and backed by **PostgreSQL / Supabase**.

---

## 🚀 Quick Start — Running Locally with npm

### 1. Prerequisites
- **Node.js**: v18+ (tested on v24.13)
- **npm**: v9+ (tested on v11.6)
- **PostgreSQL / Supabase**: PostgreSQL running locally on port `5432` or a remote Supabase project

---

### 2. Install Dependencies
```bash
npm install
```

---

### 3. Database Setup (Supabase or Local PostgreSQL)

Configure your `DATABASE_URL` in `.env` and `apps/api/.env`:
```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

Push the database schema and seed the initial workspaces:
```bash
# Push Prisma schema to PostgreSQL / Supabase
npm run db:push

# Populate Company Alpha and Company Beta demo data
npm run db:seed
```

---

### 4. Start Development Servers

You can start both backend and frontend together with a single command:
```bash
npm run dev
```

Or run them in two separate terminal windows:

#### Terminal 1 — Backend API (Node.js + Express with nodemon)
```bash
npm run dev:api
```
- API Base URL: `http://localhost:4000/api`
- Health check: `http://localhost:4000/api/health`
- Automatically watches `src/` and restarts via **nodemon** on code changes!

#### Terminal 2 — Frontend Application (React + Vite)
```bash
npm run dev:web
```
- Web Application: `http://localhost:5174` (or `http://localhost:5173`)

---

## 🔑 Development Test Accounts

All pre-seeded test accounts share the password:
```text
Password1234!
```

| Email | Name | Workspace | Role | Notes |
| :--- | :--- | :--- | :--- | :--- |
| `owner@alpha.test` | Alpha Owner | Company Alpha | **OWNER** | Full workspace access |
| `admin@alpha.test` | Alpha Admin | Company Alpha | **ADMIN** | Can invite members, create projects/teams |
| `alice@alpha.test` | Alice Johnson | Company Alpha | **MEMBER** | Standard task & comment collaborator |
| `david@beta.test` | David Miller | Company Beta | **OWNER** | Isolated tenant boundary (cannot view Alpha) |

---

## 🧪 Testing

```bash
# Run backend API integration test suite (46/46 passed)
npm run test:api

# Run frontend Vitest component tests (7/7 passed)
npm run test:web

# Run full project build across all workspaces
npm run build
```
