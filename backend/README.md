# CredImpact Backend

## Setup Instructions

1. Install Python (3.10+)

2. Create and activate virtual environment:
```bash
cd backend
python -m venv venv
# Windows
.\venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Set up PostgreSQL:
- Install PostgreSQL
- Create a database named `credimpact` (or your preferred name)
- Create a `.env` file in the `backend/` directory:
```env
DB_HOST=localhost
DB_NAME=credimpact
DB_USER=postgres
DB_PASSWORD=your_postgres_password
DB_PORT=5432
```

5. Run the schema and seed data:
```bash
psql -U postgres -d credimpact -f schema.sql
```

6. Start the backend server:
```bash
python app.py
```

The backend will be running on http://localhost:5000
