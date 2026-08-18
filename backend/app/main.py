from fastapi import FastAPI, HTTPException, Depends, Header, File, UploadFile
from pydantic import BaseModel
from typing import Optional
import os
from app.core.parser import expense_parser
from app.core.database import db_client
from app.core.models import ChatRequestModel, ExpenseRecord, UserUpdate, ParseRequestModel, TokenBody, WeeklyReportRequest 
from app.core.reports import build_weekly_report
from app.core.email import send_weekly_report_email
import firebase_admin
from firebase_admin import auth as firebase_auth
from fastapi.middleware.cors import CORSMiddleware
from datetime import date as Date


# Initialize FastAPI application
app = FastAPI(
    title="AI Expense Tracker API",
    description="An AI-powered API that parses natural language into structured expense records.",
    version="1.0.0"
)

# Add CORS Middleware for Vite(different port) to connect to API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development; consider restricting in production
    allow_credentials=False,  # CORS doesn't need to send cookies or auth headers
    allow_methods=["*"],
    allow_headers=["*"],
)

# read GOOGLE_CLIENT_ID from .env
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

# get firebase user id from firebase token
async def get_current_user_id(authorization: str = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    token = authorization.split("Bearer ")[1]
    try:
        decoded_token = firebase_auth.verify_id_token(token)
        return decoded_token['uid']
    except Exception as e:
        print(f"❌ Token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid ID token")

# Google auth endpoint
@app.post("/auth/google")
async def google_auth(body: TokenBody):
    try:
        # Since frontend authenticates via Firebase Client SDK and sends the Firebase ID token,
        # we verify it using Firebase Admin SDK instead of Google OAuth2 verification.
        decoded_token = firebase_auth.verify_id_token(body.id_token)
        user_id = decoded_token['uid']  # Firebase unique user ID
        email = decoded_token.get('email')
        name = decoded_token.get('name')

        print(f"✅ Google Auth Success: {name} ({email})")

        # Check and initialize user data in Firestore
        db_client.check_user_exists(user_id, email, name)

        return {
            "status": "success",
            "user": {"id": user_id, "name": name, "email": email}
        }
    except Exception as e:
        print(f"❌ Token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Token verification failed")

# Parse expense with gemini AI to get structured data
@app.post("/parse_expense")
async def parse_expense(request: ParseRequestModel, user_id: str = Depends(get_current_user_id)):
    # get user settings from firestore
    success, user_info = db_client.get_user_info(user_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"User not found: {user_id}")
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

# Parse expense from image with gemini AI to get structured data
# 這個API 目前還用不到...
@app.post("/parse_expense_image")
async def parse_expense_image(
    file: UploadFile = File(...), 
    user_id: str = Depends(get_current_user_id)
):
    # 1. 防呆：檢查檔案格式
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Uploaded file must be an image.")

    # 2. 拿使用者偏好設定
    success, user_info = db_client.get_user_info(user_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"User not found: {user_id}")
    
    user_categories = user_info.get("categories", [])
    user_currency = user_info.get("currency", "USD")

    try:
        # 3. 讀取圖檔資料與格式
        image_bytes = await file.read()
        file_content_type = file.content_type

        # 4. 呼叫 GeminiParser 解析
        parse_success, parsed_data = expense_parser.parse_image(
            image_bytes=image_bytes,
            content_type=file_content_type,
            categories=user_categories,
            default_currency=user_currency
        )

        if not parse_success:
            raise HTTPException(status_code=500, detail=f"AI Image Parsing Error: {parsed_data}")

        return {
            "status": "success",
            "data": parsed_data
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Server Error: {str(e)}")

# Create expense in user's database record(firebase firestore)
@app.post("/expense/create")
async def create_expense_data(request: ExpenseRecord, user_id: str = Depends(get_current_user_id)):
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

# Read expense from database
@app.get("/expense")
async def read_expense_data(user_id: str = Depends(get_current_user_id)):
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
@app.put("/expense/{record_id}")
async def update_expense_data(record_id: str, data: dict, user_id: str = Depends(get_current_user_id)):
    success, result = db_client.update_user_record(user_id, record_id, data)
    
    if not success:
        raise HTTPException(status_code=500, detail=f"Database Error: {result}")
    
    return {
        "status": "success",
        "message": "Record updated successfully"
    }

# Delete expense from user 
@app.delete("/expense/{record_id}")
async def delete_expense_data(record_id: str, user_id: str = Depends(get_current_user_id)):
    success, result = db_client.delete_user_record(user_id, record_id)
    
    if not success:
        raise HTTPException(status_code=500, detail=f"Database Error: {result}")
    
    return {
        "status": "success",        
    }

# Get user information 
@app.get("/user_data")
async def get_user_info(user_id: str = Depends(get_current_user_id)):
    success, result = db_client.get_user_info(user_id)
    
    if not success:
        status_code = 404 if result == "User not found" else 500
        raise HTTPException(status_code=status_code, detail=f"Database Error: {result}")
    
    return {
        "status": "success",
        "data": result
    }

# Update user information
@app.put("/user_data")
async def update_user_info(body: UserUpdate, user_id: str = Depends(get_current_user_id)):
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

# 聊天端口 讓ai讀取紀錄和使用者問題並回應
@app.post("/expense/chat")
async def chat_about_expenses(request: ChatRequestModel, user_id: str = Depends(get_current_user_id)):
    """Answer an expense question with the browser-managed conversation context."""
    question = request.message.strip()
    if not question:
        raise HTTPException(status_code=400, detail="A question is required.")

    user_success, user_info = db_client.get_user_info(user_id)
    if not user_success:
        raise HTTPException(status_code=404, detail=f"User not found: {user_id}")

    expenses_success, expenses = db_client.read_user_record(user_id)
    if not expenses_success:
        raise HTTPException(status_code=500, detail=f"Database Error: {expenses}")

    history = [message.model_dump() for message in request.history]
    success, answer = expense_parser.answer_expense_question(
        question=question,
        history=history,
        expenses=expenses,
        user_info=user_info,
    )
    if not success:
        raise HTTPException(status_code=500, detail=answer)

    return {"status": "success", "answer": answer}

# Generate and save weekly report
@app.post("/report/weekly/generate")
async def generate_and_save_weekly_report(
    request: WeeklyReportRequest,
    user_id: str = Depends(get_current_user_id)
):
    try:
        reference_date = (
            Date.fromisoformat(request.date)
            if request.date
            else Date.today()
        )
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="date must use YYYY-MM-DD format.",
        )
    user_success, user_info = db_client.get_user_info(user_id)
    if not user_success:
        raise HTTPException(
            status_code=404,
            detail=f"User not found: {user_id}",
        )
    expenses_success, expenses = db_client.read_user_record(user_id)
    if not expenses_success:
        raise HTTPException(
            status_code=500,
            detail=f"Database Error: {expenses}",
        )
    primary_currency = user_info.get("currency") or "USD"
    report = build_weekly_report(
        expenses=expenses,
        reference_date=reference_date,
        primary_currency=primary_currency,
    )
    recipient_email = request.recipient_email or user_info.get("email")
    save_success, result = db_client.save_weekly_report(
        user_id=user_id,
        report=report,
        recipient_email=recipient_email,
    )
    if not save_success:
        raise HTTPException(
            status_code=500,
            detail=f"Database Error: {result}",
        )

    # Send weekly report email
    email_success, email_msg = send_weekly_report_email(recipient_email, report)
    if not email_success:
        return {
            "status": "success",
            "message": f"Weekly report generated and saved, but failed to send email: {email_msg}",
            "data": report,
        }

    return {
        "status": "success",
        "message": "Weekly report generated and saved. Email sent successfully!",
        "data": report,
    }


# test case if you want
# 1. I spent 50 dollars on groceries yesterday.
# 2. Bought a new laptop for 1200 USD last week.
# 3. Spent 15 bucks on coffee this morning.
# 4. Paid 200 dollars for car maintenance two days ago.
# 5. Yesterday, I spent 100 dollars on a new phone.

# 這個月比起上個月 有什麼值得注意的地方？
