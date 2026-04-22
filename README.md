# PayPath

Pre-collections payment recovery tool. Lets businesses send BNPL payment links to customers with unpaid invoices before sending them to collections.

## Tech Stack

- **Backend:** Node.js + Express + TypeScript
- **Frontend:** React + TypeScript + Vite
- **Database:** PostgreSQL + Prisma ORM
- **Payments:** Stripe (PaymentElement — card, Affirm, Klarna, Link, Apple Pay, Google Pay)
- **Email:** SendGrid
- **SMS:** Twilio
- **Styling:** Tailwind CSS v4
- **Auth:** Session-based admin auth (env-var credentials)

## Project Structure

```
├── server/          Express API
│   └── src/
│       ├── routes/      health, auth, admin, upload, messages, invoice, webhook
│       ├── services/    messaging.ts (SendGrid + Twilio)
│       ├── middleware/  requireAdmin.ts
│       └── index.ts     App entry point
├── client/          React frontend
│   └── src/
│       ├── layouts/     AdminLayout, PublicLayout
│       ├── pages/       Admin pages + public checkout/success pages
│       ├── lib/         api.ts, AuthContext.tsx
│       └── App.tsx      Router setup
├── prisma/          Schema
└── .env.example     All required env vars documented
```

## Setup

### Prerequisites

- Node.js 18+
- PostgreSQL running locally (or a remote connection string)
- Stripe account (test mode keys are fine for development)

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Configure environment

```bash
cp .env.example .env
# Fill in DATABASE_URL, admin credentials, Stripe keys, SendGrid, Twilio
```

### 3. Set up database schema

```bash
npm run db:push          # push schema to database
npm run db:generate      # generate Prisma client
```

### 4. Run development servers

```bash
npm run dev
```

This starts both:
- **API server** at http://localhost:3001
- **React dev server** at http://localhost:5173

### Admin Login

Navigate to http://localhost:5173/admin/login and use the credentials from your `.env`.

### Stripe Webhooks (local)

To test webhooks locally, use the Stripe CLI:

```bash
stripe listen --forward-to http://localhost:3001/api/webhooks/stripe
```

Copy the webhook signing secret it prints and set it as `STRIPE_WEBHOOK_SECRET` in your `.env`.

## API Endpoints

### Public (no auth)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/invoice/:token` | Get invoice for checkout page |
| POST | `/api/invoice/:token/payment-intent` | Create/retrieve Stripe PaymentIntent |
| POST | `/api/webhooks/stripe` | Stripe webhook handler |

### Auth

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Admin login |
| POST | `/api/auth/logout` | Admin logout |
| GET | `/api/auth/me` | Check auth status |

### Admin (session required)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/invoices` | List all invoices |
| GET | `/api/admin/invoices/:id` | Invoice detail with messages |
| GET | `/api/admin/invoices/:id/messages` | Message log for invoice |
| GET | `/api/admin/invoices/:id/preview` | Email/SMS preview |
| GET | `/api/admin/invoices/:id/stripe` | Stripe PaymentIntent status |
| POST | `/api/admin/invoices/:id/resend` | Resend messages for invoice |
| POST | `/api/admin/upload` | Upload CSV of invoices |
| GET | `/api/admin/batches` | List upload batches |
| GET | `/api/admin/batches/:id` | Batch detail with invoices |
| POST | `/api/admin/batches/:id/send` | Send messages to all pending invoices |

## Customer Payment Flow

1. Customer receives email/SMS with link: `/pay/:token`
2. Checkout page loads invoice details and creates a Stripe PaymentIntent
3. Customer selects payment method (card, Affirm, Klarna, Apple Pay, Google Pay, Link)
4. Payment is confirmed via Stripe Elements
5. Stripe webhook fires `payment_intent.succeeded` → invoice marked PAID
6. Customer lands on `/pay/:token/success`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | Secret for session cookies |
| `ADMIN_USERNAME` | Admin login username |
| `ADMIN_PASSWORD` | Admin login password |
| `PORT` | API server port (default: 3001) |
| `VITE_API_URL` | API URL (for CORS) |
| `APP_BASE_URL` | Public app URL (used in payment links in emails/SMS) |
| `STRIPE_SECRET_KEY` | Stripe secret key (sk_test_... or sk_live_...) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (whsec_...) |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (pk_test_... or pk_live_...) |
| `SENDGRID_API_KEY` | SendGrid API key |
| `SENDGRID_FROM_EMAIL` | Verified sender email address |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_FROM_NUMBER` | Twilio phone number (E.164 format) |
