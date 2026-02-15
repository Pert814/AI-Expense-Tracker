# AI Expense Tracker

An AI-powered expense management system featuring Google OAuth integration and intelligent financial analysis.

## 🚀 Quick Start Guide

It is recommended to open two terminal windows to run the frontend and backend separately.

### 1. Frontend
**Stack**: Vite + React + @react-oauth/google

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

## 🔧 Environment Variables

### Backend (.env in `/backend` folder)
Create a `.env` file in the `backend` directory with the following variables:

```env
# Google OAuth Client ID (same as frontend)
GOOGLE_CLIENT_ID=your_google_client_id_here

# Firebase Configuration (JSON string from Firebase Console)
FIREBASE_CONFIG={"type":"service_account","project_id":"your_project_id",...}

# Google Gemini API Key for AI parsing
GEMINI_API_KEY=your_gemini_api_key_here
```

### Frontend (.env in `/frontend` folder)
Create a `.env` file in the `frontend` directory with the following variables:

```env
# Backend API URL
VITE_API_URL=http://127.0.0.1:8000

# Google OAuth Client ID (same as backend)
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

### Setup Instructions
1. **Google OAuth**: Create a project in [Google Cloud Console](https://console.cloud.google.com/), enable Google+ API, and create OAuth 2.0 credentials.
2. **Firebase**: Set up a Firebase project, enable Firestore, and download the service account key (for `FIREBASE_CONFIG`).
3. **Gemini API**: Get an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
4. **Copy the Client ID** to both backend and frontend `.env` files.
