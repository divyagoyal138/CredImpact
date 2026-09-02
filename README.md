# CredImpact

**CredImpact** is an enterprise-grade SaaS platform and credit management portal designed for educational institutions. It empowers students to track academic and extracurricular performance, earn CreditCoins (CC), participate in events, monitor leaderboards, build personal portfolios, and manage their college profile within a modern, responsive interface.

---

## 🚀 Key Features

- **Secure Authentication & Token Flow**
  - **College Verification**: Validates institutional access codes.
  - **Student UID & Dynamic OTP**: 4-digit verification code with secure session verification.
  - **Admin Login**: Hashed password authorization (`werkzeug.security`) issuing signed JWT tokens.
  - **Authorization**: Bearer JWT tokens attached to protected API requests.

- **Student Dashboard**
  - **KPI Metrics**: Overview of CreditCoins, completed tasks, and activity streaks.
  - **Student Profile**: Quick overview of student details, department, semester, and CC balance.
  - **Task Tracking**: Management for Recommended, Urgent, Applied, and Completed activities.
  - **Events & Leaderboard**: Track upcoming campus events and real-time peer rankings.
  - **My Portfolio**: Showcase verified achievements, skills, and activity records.
  - **CC Wallet**: Manage and view transactions of earned CreditCoins.

- **Admin Dashboard & Class CC Allocation**
  - Institutional administrative portal (`/admin-dashboard`) with 6 core navigation sections:
    1. **Manage Tasks**: Task creation, filter by status, and per-task applicant counters.
    2. **View Applicants**: Directory table with task dropdown filter, status filter, and student preview popovers.
    3. **Analytics**: Institutional metric breakdown, status donuts, and department distribution charts.
    4. **Student Chat (Approved)**: Real-time messaging with approved applicants (50-word cap enforcement).
    5. **CC Allocation to Class**: Edit task CC reward, enter venue location, create inline events, filter by class/department, and grant CC to selected student rosters.
    6. **Allocation History**: Audit directory with search filter and 2-column detail inspector.

- **Theme System (Light & Dark Mode)**
  - Theme switching powered by React Context (`light`, `dark`, `dark-warm`, `system`).
  - Persistent storage in `localStorage` and dynamic CSS variable application.

- **Backend REST API & Transaction Security**
  - Flask backend server (`backend/app.py`) backed by PostgreSQL database with dedicated tables (`Student`, `Admin`, `Task`, `Application`, `Portfolio`, `Messages`, `CcAllocationHistory`, `CcAllocationStudents`).
  - Atomic transaction handling (`conn.commit()` / `conn.rollback()`) ensuring credit coin allocations and portfolio updates modify database state safely.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **UI & Styling**: [React 19](https://react.dev/), [Tailwind CSS 4](https://tailwindcss.com/), `@base-ui/react`
- **Icons**: `lucide-react`, `@tabler/icons-webfont`
- **Language**: TypeScript & JavaScript (ES6+)

### Backend
- **Framework**: [Flask](https://flask.palletsprojects.com/) (Python 3.10+)
- **Security & Tokens**: `werkzeug.security`, `PyJWT`
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **Database Client**: `psycopg2-binary`, `flask-cors`, `python-dotenv`

---

## 📁 Repository Structure

```
CredImpact/
├── app/                      # Next.js App Router (Pages & Layouts)
│   ├── admin-dashboard/      # Admin portal page
│   ├── dashboard/            # Student dashboard & sub-routes
│   │   ├── applied/          # Applied tasks
│   │   ├── cc-wallet/        # CreditCoin wallet management
│   │   ├── completed/        # Completed tasks history
│   │   ├── events/           # Campus events calendar
│   │   ├── leaderboard/      # Student leaderboards
│   │   ├── my-portfolio/     # Verified portfolio showcase
│   │   ├── recommended/      # Recommended tasks
│   │   ├── settings/         # Theme & account settings
│   │   └── urgent/           # Urgent/Priority tasks
│   ├── login/                # Multi-step authentication flow
│   ├── globals.css           # Design tokens & theme definitions
│   └── layout.tsx            # Global layout with ThemeProvider
├── backend/                  # Python Flask Backend
│   ├── app.py                # REST API routes & database logic
│   ├── schema.sql            # PostgreSQL schema, indexes & seed data
│   ├── requirements.txt      # Python dependencies
│   ├── .env.example          # Sample backend environment variables
│   └── README.md             # Backend setup & API documentation
├── components/               # Shared React UI Components
│   ├── Sidebar.jsx           # Dashboard navigation sidebar
│   ├── TopNav.tsx            # Header bar with user context & search
│   ├── TaskCard.jsx          # Interactive task item card
│   ├── RightPanel.jsx        # Dashboard side panel
│   ├── theme-toggle.tsx      # Theme toggle button
│   └── analytics/            # Export dropdown & analytics widgets
├── lib/                      # Core Utilities & API Client
│   ├── api.ts                # API client with JWT Authorization headers
│   ├── theme-context.tsx     # Light/Dark mode state
│   └── utils.ts              # Styling helpers
├── REDESIGN_SUMMARY.md       # Design system notes
└── THEME_SYSTEM.md           # Theme implementation details
```

---

## 🔒 Security Architecture

1. **Password Hashing**: Passwords stored using Werkzeug `generate_password_hash` (scrypt algorithm).
2. **Session Security**: JWT Bearer tokens issued upon verification and verified on protected endpoints.
3. **Database Integrity**: PostgreSQL FK constraints (`ON DELETE CASCADE`), UNIQUE constraints on applications (`studentid, taskid`), and database indexes on query targets.
4. **Transaction Protection**: Multi-table updates (CC distribution, applicant status changes) run inside atomic SQL transactions.

---

## ⚡ Quick Start

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Package Manager**: `npm` or `pnpm`
- **Python**: 3.10 or higher
- **PostgreSQL**: 13 or higher

---

### 1. Backend Setup

1. Navigate to `backend`:
   ```bash
   cd backend
   ```

2. Create and activate a Python virtual environment:
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\activate

   # macOS / Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure environment variables (`backend/.env`):
   ```env
   DB_HOST=localhost
   DB_NAME=credimpact
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password
   DB_PORT=5432
   JWT_SECRET=credimpact_jwt_secret_key_prod_2026
   TWOFACTOR_API_KEY=your_2factor_api_key
   ```

5. Set up PostgreSQL database schema and seed data:
   ```bash
   psql -U postgres -d credimpact -f schema.sql
   ```

6. Start the Flask backend server:
   ```bash
   python app.py
   ```
   Backend API runs at `http://localhost:5000`.

---

### 2. Frontend Setup

1. From the project root directory, install Node.js dependencies:
   ```bash
   npm install
   ```

2. Start the Next.js development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to:
   - **Student Portal & Login**: [http://localhost:3000/login](http://localhost:3000/login)
   - **Admin Dashboard**: [http://localhost:3000/admin-dashboard](http://localhost:3000/admin-dashboard)

---

## 🌐 API Overview

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/college/verify` | Public | Verify institutional college code |
| `POST` | `/api/admin/verify-username` | Public | Check admin ID/username |
| `POST` | `/api/admin/login` | Public | Authenticate admin & receive JWT |
| `POST` | `/api/student/login/verify-uid` | Public | Verify student ID & trigger OTP |
| `POST` | `/api/student/login/verify-otp` | Public | Verify student OTP & receive JWT |
| `GET` | `/api/student/:id` | Bearer Token | Fetch student profile & portfolio summary |
| `PUT` | `/api/student/:id` | Bearer Token | Update student email/phone/portfolio link |
| `GET` | `/api/tasks` | Public | Fetch active campus tasks |
| `POST` | `/api/tasks` | Admin | Create a new campus task |
| `POST` | `/api/applications` | Bearer Token | Apply for a task |
| `DELETE`| `/api/applications` | Bearer Token | Withdraw task application |
| `POST` | `/api/admin/applications/action` | Admin | Approve/Reject student application |
| `POST` | `/api/admin/distribute-cc` | Admin | Allocate CCs to student roster atomically |
| `GET` | `/api/admin/cc-allocation-history` | Admin | Fetch CC allocation audit history |
| `GET` | `/api/chat/messages` | Bearer Token | Fetch conversation messages |
| `POST` | `/api/chat/messages` | Bearer Token | Send chat message (Max 50 words) |
