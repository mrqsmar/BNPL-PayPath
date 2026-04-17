# PayPath

Pre-collections payment recovery tool. Lets businesses send BNPL payment links to customers with unpaid invoices before sending them to collections.

## Tech Stack

- **Backend:** Node.js + Express + TypeScript
- **Frontend:** React + TypeScript + Vite
- **Database:** PostgreSQL + Prisma ORM
- **Styling:** Tailwind CSS v4
- **Auth:** Session-based admin auth (env-var credentials)

## Project Structure

```
├── server/          Express API
│   └── src/
│       ├── routes/      API route handlers
│       ├── middleware/   Auth middleware
│       ├── types.ts     TypeScript declarations
│       └── index.ts     App entry point
├── client/          React frontend
│   └── src/
│       ├── layouts/     AdminLayout, PublicLayout
│       ├── pages/       Login, Dashboard, Invoices, Upload
│       ├── lib/         API client, AuthContext
│       └── App.tsx      Router setup
├── prisma/          Schema and migrations
└── .env.example     All required env vars
```

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL running locally (or a connection string)

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your database URL and admin credentials
```

### 3. Set up database

```bash
npm run db:push
```

### 4. Generate Prisma client

```bash
npm run db:generate
```

### 5. Run development servers

```bash
npm run dev
```

This starts both:
- **API server** at http://localhost:3001
- **React dev server** at http://localhost:5173

### Login

Navigate to http://localhost:5173/admin/login and use the credentials from your `.env` file.

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | No | Health check |
| POST | `/api/auth/login` | No | Admin login |
| POST | `/api/auth/logout` | No | Admin logout |
| GET | `/api/auth/me` | No | Check auth status |
| GET | `/api/admin/invoices` | Admin | List all invoices |
| GET | `/api/admin/invoices/:id` | Admin | Get invoice detail |
| GET | `/api/admin/batches` | Admin | List upload batches |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Secret for session cookies |
| `ADMIN_USERNAME` | Admin login username |
| `ADMIN_PASSWORD` | Admin login password |
| `PORT` | API server port (default: 3001) |
