# Quick Start Guide

## Setup Steps

1. **Install PostgreSQL** (if not installed)
   - Download from https://www.postgresql.org/download/

2. **Create Database**
   ```sql
   CREATE DATABASE lawyer_db;
   ```

3. **Configure Backend**
   - Navigate to `backend` folder
   - Copy `.env.example` to `.env`
   - Update database credentials in `.env`

4. **Install Dependencies**
   ```bash
   # Backend
   cd backend
   npm install

   # Frontend
   cd ../frontend
   npm install
   ```

5. **Start the Application**

   Open two terminals:

   **Terminal 1 - Backend:**
   ```bash
   cd backend
   npm run dev
   ```

   **Terminal 2 - Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

6. **Access Application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## First Time Setup

The database tables will be created automatically when you start the backend for the first time.

## Default Ports

- Backend: 5000
- Frontend: 5173
- PostgreSQL: 5432

## Need Help?

Check the main README.md for detailed documentation.
