# CredImpact 

**CredImpact** is an enterprise-grade SaaS platform and credit management portal designed for educational institutions. It empowers students to track academic and extracurricular performance, earn CreditCoins (CC), participate in events, monitor leaderboards, build personal portfolios, and manage their college profile within a modern, responsive interface.

---

## 🚀 Features

- **Multi-Step Authentication Flow**
  - **College Verification**: Validates institutional access codes.
  - **Student UID Verification**: Checks registered student credentials.
  - **OTP Authentication**: 4-digit auto-advancing OTP verification for secure login.

- **Student Dashboard**
  - **KPI Metrics**: Overview of CreditCoins, completed tasks, and activity streaks.
  - **Student Profile**: Quick overview of student details, department, semester, and CC balance.
  - **Task Tracking**: Tabbed management for Recommended, Urgent, Applied, and Completed activities.
  - **Events & Leaderboard**: Track upcoming campus events and peer rankings.
  - **My Portfolio**: Showcase verified achievements, skills, and activity records.
  - **CC Wallet**: Manage and view transactions of earned CreditCoins.

- **Admin Dashboard & Class CC Allocation**
  - Institutional administrative portal (`/admin-dashboard`) with 6 core navigation sections:
    1. **Manage Tasks**: Task creation, filter by status, and per-task **View Applicants** count & filter button.
    2. **View Applicants**: Directory table with task dropdown filter, status filter, and **Student Hover Preview Popovers** showing student ID, existing CC, class, semester, and email.
    3. **Analytics**: Institutional metric breakdown, status donuts, and department distribution charts.
    4. **Student Chat (Approved)**: Real-time messaging with approved applicants (50-word cap enforcement).
    5. **CC Allocation to Class**: Edit task CC reward, enter venue location, create inline new events (`+ Add New Event`), filter by class/department, and grant CC to selected student rosters.
    6. **Allocation History**: Audit directory with search filter and tap-to-inspect 2-column view (event details, venue, timestamp, allocating admin, and student recipient list).

- **Theme System (Light & Dark Mode)**
  - Theme switching powered by React Context (`light`, `dark`, `dark-warm`, `system`).
  - Persistent storage in `localStorage` and dynamic CSS variable application (`globals.css`).

- **Backend REST API & Real-Time Sync**
  - Lightweight Flask server (`backend/app.py`) backed by PostgreSQL database with dedicated tables (`CcAllocationHistory`, `CcAllocationStudents`, `Messages`, `Task`, `Student`, `Application`, `Portfolio`).
  - Real-time 3-second polling sync across browser tabs and sessions.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **UI & Styling**: [React 19](https://react.dev/), [Tailwind CSS 4](https://tailwindcss.com/), `@base-ui/react`
- **Icons**: `lucide-react`, `@tabler/icons-webfont`
- **Language**: TypeScript & JavaScript (ES6+)

### Backend
- **Framework**: [Flask](https://flask.palletsprojects.com/) (Python 3.10+)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **Libraries**: `psycopg2-binary`, `flask-cors`, `python-dotenv`

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
│   ├── login/                # 3-step authentication flow
│   ├── globals.css           # Design tokens & theme definitions
│   └── layout.tsx            # Global layout with ThemeProvider
├── backend/                  # Python Flask Backend
│   ├── app.py                # REST API routes & database connection
│   ├── schema.sql            # PostgreSQL database schema & seed data
│   ├── requirements.txt      # Python dependencies
│   ├── .env.example          # Sample backend environment variables
│   └── README.md             # Backend setup guide
├── components/               # Shared React UI Components
│   ├── Sidebar.jsx           # Dashboard navigation sidebar
│   ├── TopNav.jsx            # Header bar with user context & search
│   ├── TaskCard.jsx          # Interactive task item card
│   ├── RightPanel.jsx        # Dashboard side panel (Events & Leaderboard)
│   ├── theme-toggle.tsx      # Theme toggle button
│   └── ui/                   # Reusable UI primitives
├── lib/                      # Core Utilities & Context
│   ├── api.ts                # API client functions for Flask backend
│   ├── theme-context.tsx     # Light/Dark mode state & localStorage persistence
│   └── utils.ts              # Styling helpers (`clsx`, `tailwind-merge`)
├── REDESIGN_SUMMARY.md       # Design system update notes
└── THEME_SYSTEM.md           # Theme implementation details
```

---

## ⚡ Quick Start

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Package Manager**: `npm`, `pnpm`, or `yarn`
- **Python**: 3.10 or higher
- **PostgreSQL**: 13 or higher running locally or hosted

---

### 1. Backend Setup

1. Navigate to the `backend` directory:
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

4. Configure environment variables by creating a `.env` file in the `backend/` directory:
   ```env
   DB_HOST=localhost
   DB_NAME=credimpact
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password
   DB_PORT=5432
   ```

5. Set up the PostgreSQL database schema and seed data:
   ```bash
   psql -U postgres -d credimpact -f schema.sql
   ```

6. Start the Flask backend server:
   ```bash
   python app.py
   ```
   The backend API will run at `http://localhost:5000`.

---

### 2. Frontend Setup

1. From the project root directory, install Node.js dependencies:
   ```bash
   npm install
   # or
   pnpm install
   ```

2. Start the Next.js development server:
   ```bash
   npm run dev
   # or
   pnpm dev
   ```

3. Open your browser and navigate to:
   - **Student Portal & Login**: [http://localhost:3000/login](http://localhost:3000/login)
   - **Admin Dashboard**: [http://localhost:3000/admin-dashboard](http://localhost:3000/admin-dashboard)


## 📄 License

This project is proprietary and intended for institutional application and development within CredImpact.
