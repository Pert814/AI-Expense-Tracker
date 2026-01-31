# AI Expense Tracker

An AI-powered expense management system featuring Google OAuth integration and intelligent financial analysis.

## 🚀 Quick Start Guide

It is recommended to open two terminal windows to run the frontend and backend separately.

### 1. Frontend
**Stack**: Vite + React + @react-oauth/google

**Command:**
```powershell
cd frontend
npm run dev
```
*   **URL**: [http://localhost:5173/](http://localhost:5173/)
*   **Features**: Google login handling, expense dashboard, and UI components.

---

### 2. Backend
**Stack**: FastAPI + Uvicorn + Google GenAI

**Command:**
```powershell
# Install dependencies first if needed:
# pip install -r requirements.txt
cd backend
python -m uvicorn app.main:app --reload
```
*   **URL**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
*   **Features**: Token verification, AI analysis logic, and API endpoints.

---

## 🛠️ Development Notes
*   **Google Login**: Both frontend and backend share the same `Client ID`.
*   **Persistence**: User session is stored in `localStorage` to prevent frequent logins.
*   **Environment**: Ensure `.env` is properly configured in the `backend` folder.
