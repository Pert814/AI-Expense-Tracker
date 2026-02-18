from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import os
from app.core.parser import expense_parser
from app.core.database import db_client
from app.core.models import ExpenseRecord, UserUpdate, ParseRequestModel
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
    allow_origins=["*"],  # Allow all origins for development; consider restricting in production
    allow_credentials=False,  # CORS doesn't need to send cookies or auth headers
    allow_methods=["*"],
    allow_headers=["*"],
)

# read GOOGLE_CLIENT_ID from .env
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

# GOOGLE_CLIENT_ID Token request model
class TokenBody(BaseModel):
    id_token: str

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
        raise HTTPException(status_code=401, detail="Google Token verification failed")

# parse expense from gemini AI
@app.post("/parse_expense")
async def parse_expense(request: ParseRequestModel):
    # get user settings from firestore
    success, user_info = db_client.get_user_info(request.user_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"User not found: {request.user_id}")
    user_categories = user_info.get("categories", [])
    user_currency = user_info.get("currency", "USD")
    
    success, parsed_data = expense_parser.parse_text(
        request.text, 
        categories=user_categories, 
        default_currency=user_currency
    )
    if not success:
        raise HTTPException(status_code=500, detail=f"AI Parsing Error: {parsed_data}")
    return{
        "status": "success",
        "data": parsed_data
    }
# Create expense in user's database record
@app.post("/expense/create")
async def create_expense_data(request: ExpenseRecord, user_id: str):
    expense_data = request.model_dump()  # Convert Pydantic model to dict
    db_success, db_result = db_client.create_user_record(user_id, expense_data)
    
    if not db_success:
        raise HTTPException(status_code=500, detail=f"Database Error: {db_result}")
    
    return {
        "status": "success",
        "message": "Expense recorded to your personal account!",
        "user_id": user_id,
        "data": expense_data, 
        "db_id": db_result   
    }

# Read expense from user
@app.get("/expense/{user_id}")
async def read_expense_data(user_id: str):
    print(f"[DEBUG] Received request for user_id: {user_id}")
    success, result = db_client.read_user_record(user_id)
    
    if not success:
        print(f"[ERROR] Database error: {result}")
        raise HTTPException(status_code=500, detail=f"Database Error: {result}")
    
    print(f"[DEBUG] Returning data for user_id: {user_id}, data: {result}")
    return {
        "status": "success",
        "data": result
    }
# Update expense data from user 
@app.put("/expense/{user_id}/{record_id}")
async def update_expense_data(user_id: str, record_id: str, data: dict):
    success, result = db_client.update_user_record(user_id, record_id, data)
    
    if not success:
        raise HTTPException(status_code=500, detail=f"Database Error: {result}")
    
    return {
        "status": "success",
        "message": "Record updated successfully"
    }
# delete expense from user 
@app.delete("/expense/{user_id}/{record_id}")
async def delete_expense_data(user_id: str, record_id: str):
    success, result = db_client.delete_user_record(user_id, record_id)
    
    if not success:
        raise HTTPException(status_code=500, detail=f"Database Error: {result}")
    
    return {
        "status": "success",        
    }

# Get user information 
@app.get("/user_data/{user_id}")
async def get_user_info(user_id: str):
    success, result = db_client.get_user_info(user_id)
    
    if not success:
        status_code = 404 if result == "User not found" else 500
        raise HTTPException(status_code=status_code, detail=f"Database Error: {result}")
    
    return {
        "status": "success",
        "data": result
    }

# Update user information
@app.put("/user_data/{user_id}")
async def update_user_info(user_id: str, body: UserUpdate):
    # Filter out None values to only update provided fields
    body_dict = body.model_dump()
    update_data = {k: v for k, v in body_dict.items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data provided for update")
        
    success, result = db_client.update_user_info(user_id, update_data)
    
    if not success:
        raise HTTPException(status_code=500, detail=f"Database Error: {result}")
    
    return {
        "status": "success",
        "message": "User information updated successfully"
    }

# test case
# 1. I spent 50 dollars on groceries yesterday.
# 2. Bought a new laptop for 1200 USD last week.
# 3. Spent 15 bucks on coffee this morning.
# 4. Paid 200 dollars for car maintenance two days ago.
# 5. Yesterday, I spent 100 dollars on a new phone.


