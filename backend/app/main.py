from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
from app.core.parser import expense_parser
from app.core.database import db_client
from google.oauth2 import id_token
from google.auth.transport import requests

# Initialize FastAPI application
app = FastAPI(
    title="AI Expense Tracker API",
    description="An AI-powered API that parses natural language into structured expense records.",
    version="1.0.0"
)

# Add CORS Middleware for Vite(different port) to connect to API
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],  # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# read GOOGLE_CLIENT_ID from .env
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

# GOOGLE_CLIENT_ID Token request model
class TokenBody(BaseModel):
    id_token: str

# Expense request model
class ExpenseRequest(BaseModel):
    text: str
    user_id: Optional[str] = "guest"

# Google auth endpoint
@app.post("/auth/google")
async def google_auth(body: TokenBody):
    try:
        idinfo = id_token.verify_oauth2_token(
            body.id_token,  # The user get this token after login in Google
            requests.Request(), 
            GOOGLE_CLIENT_ID
        )
        user_id = idinfo['sub']  # Google unique user ID
        email = idinfo.get('email')
        name = idinfo.get('name')

        print(f"✅ Google Auth Success: {name} ({email})")

        # Check and initialize user data in Firestore
        db_client.check_user_exists(user_id, email, name)

        return {
            "status": "success",
            "user": {"id": user_id, "name": name, "email": email}
        }
    except ValueError:
        raise HTTPException(status_code=401, detail="Google Token 驗證失敗")
# Create expense endpoint
@app.post("/parse-expense")
async def create_expense(request: ExpenseRequest):

    # get user categories from firestore and pass user input and categories to parser
    user_categories = db_client.get_user_categories(request.user_id)
    success, parsed_data = expense_parser.parse_text(request.text, categories=user_categories)
    if not success:
        raise HTTPException(status_code=500, detail=f"AI Parsing Error: {parsed_data}")
    # for frontend to parse the data
    # 存入firebase時會新增 firestore.SERVER_TIMESTAMP 欄位導致前端無法解析
    return_data = parsed_data.copy()

    db_success, db_result = db_client.create_user_record(request.user_id, parsed_data)
    
    if not db_success:
        raise HTTPException(status_code=500, detail=f"Database Error: {db_result}")
    
    return {
        "status": "success",
        "message": "Expense recorded to your personal account!",
        "data": return_data, 
        "db_id": db_result   
    }
# Read expense from user endpoint
@app.get("/user-data/{user_id}")
async def read_user_data(user_id: str):
    success, result = db_client.read_user_record(user_id)
    
    if not success:
        raise HTTPException(status_code=500, detail=f"Database Error: {result}")
    
    return {
        "status": "success",
        "data": result
    }
# update expense from user endpoint
@app.put("/user-data/{user_id}/{record_id}")
async def update_user_data(user_id: str, record_id: str, data: dict):
    success, result = db_client.update_user_record(user_id, record_id, data)
    
    if not success:
        raise HTTPException(status_code=500, detail=f"Database Error: {result}")
    
    return {
        "status": "success",
        "message": "Record updated successfully"
    }
# delete expense from user endpoint
@app.delete("/user-data/{user_id}/{record_id}")
async def delete_user_data(user_id: str, record_id: str):
    success, result = db_client.delete_user_record(user_id, record_id)
    
    if not success:
        raise HTTPException(status_code=500, detail=f"Database Error: {result}")
    
    return {
        "status": "success",
        "message": "Record deleted successfully"
    }

# test case
# 1. I spent 50 dollars on groceries yesterday.
# 2. Bought a new laptop for 1200 USD last week.
# 3. Spent 15 bucks on coffee this morning.
# 4. Paid 200 dollars for car maintenance two days ago.
# 5. Yesterday, I spent 100 dollars on a new phone.


