# DealMind Setup & Running Guide

## Quick Start (Local Development)

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
```

Start the FastAPI backend (automatically initializes the database and seeds the Acme flagship story):
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be live at `http://localhost:8000/docs`.

---

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Docker Deployment (PostgreSQL + Hindsight + Full Stack)

Run the entire production stack in one command:
```bash
docker-compose up --build
```
Services started:
- `dealmind-frontend`: `http://localhost:5173`
- `dealmind-backend`: `http://localhost:8000`
- `dealmind-hindsight`: `http://localhost:8888`
- `dealmind-postgres`: `localhost:5432`
