# CredImpact Backend API & Security Guide

## Overview

The CredImpact backend is a lightweight Python Flask server providing RESTful endpoints for student management, task tracking, application processing, CreditCoin allocations, portfolio summaries, and chat messaging.

---

## Setup Instructions

1. Prerequisites: Python 3.10+ & PostgreSQL 13+

2. Create and activate a virtual environment:
   ```bash
   cd backend
   python -m venv venv
   # Windows (PowerShell)
   .\venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Configure Environment Variables (`backend/.env`):
   ```env
   DB_HOST=localhost
   DB_NAME=credimpact
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password
   DB_PORT=5432
   JWT_SECRET=credimpact_jwt_secret_key_prod_2026
   TWOFACTOR_API_KEY=your_2factor_api_key
   ```

5. Initialize Database Schema & Seed Data:
   ```bash
   psql -U postgres -d credimpact -f schema.sql
   ```

6. Start Flask Development Server:
   ```bash
   python app.py
   ```
   Backend listens at `http://localhost:5000`.

---

## Key Security Practices

- **Hashed Passwords**: Passwords stored using `werkzeug.security` scrypt hashes.
- **JWT Authorization**: Issued upon login (`/api/admin/login` & `/api/student/login/verify-otp`) and validated via `Authorization: Bearer <token>` headers.
- **Database Transactions**: Atomic multi-table updates (`conn.commit()` / `conn.rollback()`).
- **Word-Count Enforcement**: Chat messages validated to maximum 50 words per message.
