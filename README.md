# SplitEase
### Smart Group Expense & Bill Splitting Platform
> *"Split expenses. Simplify life."*

SplitEase is a full-stack MERN (MongoDB, Express, React, Node.js) web application designed for friends, roommates, and travel groups to effortlessly record expenses, calculate member balances, simplify complex webs of debt into minimal payments, track settlement transactions, and view deep spending analytics.

---

## 🌟 Key Features

1. **Enterprise-Grade Authentication**
   - JWT Access Token (7 days) and Refresh Token (30 days) rotation.
   - Secure password hashing using `bcryptjs`.
   - Protected client-side routes with persistent state and automatic token refresh interceptors.
   - Pre-seeded 1-click demo accounts for quick college evaluation.

2. **Group Management & Collaboration**
   - Create multi-currency groups (INR ₹, USD $, EUR €, GBP £, etc.).
   - Invite and manage members by email with duplicate prevention.
   - Creator and admin role management.

3. **Flexible 4-Way Expense Splitting Engine**
   - **Equal Split**: Even division with automated penny/paise distribution to eliminate fractional rounding drift.
   - **Exact Amount Split**: Custom manual rupee amounts with real-time balance validation (`sum === total`).
   - **Percentage Split**: Percentage shares with real-time `sum === 100%` validation.
   - **Shares Split**: Ratio-based distribution (e.g., 2 shares for couples, 1 share for singles).

4. **Greedy Debt Simplification Algorithm ("Who Owes Whom?")**
   - Converts pairwise spiderwebs of debt into the minimum practical number of direct payments.
   - Calculates exact net balances:
     $$\text{Net Balance} = (\text{Total Paid} + \text{Settled Paid}) - (\text{Total Share} + \text{Settled Received})$$
   - Pairs highest debtors with highest creditors to eliminate intermediate transactions.

5. **Settlement Tracking**
   - Record offline cash and UPI payments directly from debt simplification cards.
   - Three-state settlement tracking: `PENDING`, `PAID`, `CANCELLED`.
   - Immediate balance and debt recalculation upon status confirmation.

6. **Interactive Financial Analytics (Recharts)**
   - Category-wise spending breakdown (Food, Travel, Hotel, Utilities, etc.) with animated donut charts.
   - Monthly expenditure trend line charts.
   - Group-by-group comparative expenditure bar charts.
   - Key financial indicators: Average bill size, highest recorded expense, and top spend category.

7. **Receipt Attachments**
   - Upload receipt photos and invoices (JPG, PNG, WEBP, PDF) up to 5MB.
   - In-app preview and external tab inspection.

8. **One-Click Export**
   - **Branded PDF Export**: Generates a clean tabular document via `jspdf` and `jspdf-autotable` containing the expense ledger, member balances, and settlement history.
   - **CSV Export**: Clean spreadsheet format ready for Microsoft Excel and Google Sheets.

9. **In-App Activity Notifications**
   - Automatic triggers on expense additions, edits, deletions, member joins, and settlement confirmations.
   - Unread badge counters, mark as read, and bulk mark-all-read.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, React Router v7, Axios, Lucide React, Recharts, jsPDF, jsPDF-AutoTable |
| **Backend** | Node.js, Express.js, MongoDB, Mongoose, JWT (`jsonwebtoken`), `bcryptjs`, Multer, Morgan, Express Rate Limit |
| **Architecture** | Monorepo with Clean MVC Architecture & Service Layer |

---

## 📁 Project Architecture & Directory Structure

```
splitease/
│
├── client/                     # Vite + React Frontend
│   ├── src/
│   │   ├── api/                # Axios instance & token interceptors
│   │   ├── components/
│   │   │   └── common/         # Button, Input, Modal, Avatar, Badge, Toast, Loader, EmptyState
│   │   ├── context/            # AuthContext, NotificationContext
│   │   ├── layouts/            # AppLayout, PublicLayout
│   │   ├── pages/              # Landing, Login, Register, Dashboard, Groups, GroupDetail, AddExpense, etc.
│   │   ├── utils/              # exportUtils (PDF & CSV generators)
│   │   ├── App.jsx             # Router configuration & guards
│   │   ├── main.jsx            # Entry point
│   │   └── index.css           # Tailwind CSS directives
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/                     # Node.js + Express Backend
│   ├── config/                 # db.js (Mongoose connection)
│   ├── controllers/            # auth, user, group, expense, balance, settlement, analytics, notification
│   ├── middleware/             # authMiddleware, uploadMiddleware, errorHandler
│   ├── models/                 # User, Group, Expense, Settlement, Notification
│   ├── routes/                 # Express API routes
│   ├── services/               # balanceService, debtSimplification, notificationService
│   ├── utils/                  # splitCalculator, tokenUtils, seed.js
│   ├── uploads/                # Local uploaded receipts
│   ├── server.js               # Application entry point
│   ├── .env.example            # Environment configuration template
│   └── package.json
│
├── .gitignore
├── package.json                # Monorepo root scripts
└── README.md
```

---

## ⚡ Quick Start & Installation

### 1. Prerequisites
- **Node.js**: v18+ (v24 recommended)
- **MongoDB**: Local MongoDB Server running on `mongodb://127.0.0.1:27017` or MongoDB Atlas URI.

### 2. Clone / Open Directory
```bash
cd splitease
```

### 3. Server Setup
```bash
cd server
npm install
```

Create a `.env` file in `server/`:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/splitease
JWT_ACCESS_SECRET=splitease_access_super_secret_key_2026_jwt_token
JWT_REFRESH_SECRET=splitease_refresh_super_secret_key_2026_jwt_token
CLIENT_URL=http://localhost:5173
```

Seed initial sample data (Akash, Rahul, Jay, Dev with "Goa Trip 2026"):
```bash
npm run seed
```

Start backend development server:
```bash
npm run dev
# Server runs on http://localhost:5000
```

### 4. Client Setup
In a new terminal window:
```bash
cd client
npm install
npm run dev
# Frontend runs on http://localhost:5173
```

---

## 👥 Demo Accounts (Seeded)

All accounts share the password: `Password123!`

| Name | Email | Role in Demo |
|---|---|---|
| **Akash Sharma** | `akash@splitease.dev` | Group Creator / Creditor |
| **Rahul Verma** | `rahul@splitease.dev` | Member / Debtor |
| **Jay Patel** | `jay@splitease.dev` | Member / Debtor |
| **Dev Malhotra** | `dev@splitease.dev` | Member / Debtor |

*(Tip: You can use the **1-Click Demo Profiles** buttons on the Login page to authenticate instantly!)*

---

## 🧮 Debt Simplification Algorithm

### The Problem
When $N$ group members pay for various items, pairwise debts create up to $\frac{N(N-1)}{2}$ transactions. For 4 people, this could require 6 transactions.

### The Algorithm
1. Aggregate net balance for each member:
   $$\text{Net} = \text{Total Paid} - \text{Total Share} + \text{Settled Adjustments}$$
2. Split users into **Debtors** ($\text{Net} < 0$) and **Creditors** ($\text{Net} > 0$).
3. Sort Debtors descending by amount owed. Sort Creditors descending by amount owed to them.
4. Greedy Step:
   $$\text{Transfer} = \min(|\text{Debtor}|, \text{Creditor})$$
5. Decrement balances, record transfer transaction, and repeat until all balances reach 0.

### Example in Goa Trip 2026:
- Akash paid for Villa (₹18,000) & Dive Tickets (₹8,000)
- Rahul paid for Dinner (₹4,800)
- Jay paid for Self-Drive Cabs (₹6,400)
- Dev paid for Flea Market (₹3,200)

**SplitEase simplifies this down to just 2 transactions:**
1. `Jay Patel owes Akash Sharma ₹2,200`
2. `Dev Malhotra owes Akash Sharma ₹5,300`

---

## 📡 REST API Reference

### Auth & Users
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Authenticate user & return tokens
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Invalidate session
- `GET  /api/auth/me` - Get authenticated profile
- `PUT  /api/users/me` - Update profile details & currency
- `PUT  /api/users/me/password` - Update password

### Groups
- `GET    /api/groups` - List user groups
- `POST   /api/groups` - Create new group
- `GET    /api/groups/:id` - Group details
- `PUT    /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group & associated data
- `POST   /api/groups/:id/members` - Add member by email
- `DELETE /api/groups/:id/members/:userId` - Remove member

### Expenses
- `GET    /api/groups/:groupId/expenses` - Filtered group expenses
- `POST   /api/groups/:groupId/expenses` - Create expense (supports multipart receipt upload)
- `GET    /api/expenses/:id` - Get expense details
- `PUT    /api/expenses/:id` - Update expense & recalculate splits
- `DELETE /api/expenses/:id` - Delete expense

### Balances & Debt Simplification
- `GET /api/groups/:groupId/balances` - Returns member balances + simplified "who owes whom" debts
- `GET /api/dashboard/overview` - Returns global user KPI cards (Total Groups, Expenses, You Owe, You Are Owed, Net Balance)

### Settlements
- `GET  /api/groups/:groupId/settlements` - List settlements
- `POST /api/groups/:groupId/settlements` - Record settlement payment
- `PUT  /api/settlements/:id/settle` - Update status (`PAID`, `CANCELLED`)
- `DELETE /api/settlements/:id` - Delete settlement

### Analytics
- `GET /api/analytics/group/:groupId` - Category, monthly & member charts for group
- `GET /api/analytics/global` - User-level aggregate financial charts
- `GET /api/analytics/monthly` - Monthly expenditure trends
- `GET /api/analytics/categories` - Category breakdown

### Notifications
- `GET    /api/notifications` - List user notifications & unread count
- `PUT    /api/notifications/:id/read` - Mark single as read
- `PUT    /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

---

## 🔒 Security Best Practices Implemented

- Passwords hashed using bcrypt with salt rounds.
- Passwords and refresh tokens hidden from JSON serialization via Mongoose hooks.
- JWT Access token verified on every protected endpoint.
- Express Rate Limiter prevents brute-force login attempts.
- Central error handler standardizes error messages and prevents stack trace leakage in production.
- Multer restricts upload types to image/pdf and enforces a 5MB size limit.

---

## 🔮 Future Enhancements
- Integration with Razorpay / UPI deep links for direct in-app mobile transfers.
- AI-based OCR bill scanner using Tesseract.js / Gemini Vision to auto-fill expense forms from receipt photos.
- Push notifications via WebSockets or Web Push API.
- Offline-first IndexedDB synchronization with Service Workers.

---

## 📜 License
This project is open-source and available under the **MIT License**.
