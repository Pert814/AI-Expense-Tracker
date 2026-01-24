from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
import os
from core.parser import expense_parser
from core.database import db_client
from google.oauth2 import id_token
from google.auth.transport import requests


GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")

# 初始化 FastAPI 應用
app = FastAPI(
    title="AI Expense Tracker API",
    description="An AI-powered API that parses natural language into structured expense records.",
    version="1.0.0"
)

# 定義 Token 接收格式
class TokenBody(BaseModel):
    id_token: str

# 定義請求資料模型
class ExpenseRequest(BaseModel):
    text: str
    user_id: Optional[str] = "guest"

# 首頁載入 index.html
@ app.get("/")
def home():
    return FileResponse("index.html")

# Google 登入驗證端點
@app.post("/auth/google")
async def google_auth(body: TokenBody):
    try:
        idinfo = id_token.verify_oauth2_token(
            body.id_token, 
            requests.Request(), 
            GOOGLE_CLIENT_ID
        )
        user_id = idinfo['sub']  # Google 唯一用戶 ID
        email = idinfo.get('email')
        name = idinfo.get('name')

        print(f"✅ 使用者已登入: {name} ({email})")

        return {
            "status": "success",
            "user": {"id": user_id, "name": name, "email": email}
        }
    except ValueError:
        raise HTTPException(status_code=401, detail="Google Token 驗證失敗")

# 費用解析端點
@app.post("/parse-expense")
async def add_expense(request: ExpenseRequest):

    success, parsed_data = expense_parser.parse_text(request.text)
    if not success:
        raise HTTPException(status_code=500, detail=f"AI Parsing Error: {parsed_data}")
    
    # 存入伺服器時會新增 firestore.SERVER_TIMESTAMP 欄位導致前端無法解析
    return_data = parsed_data.copy()

    db_success, db_result = db_client.add_user_record(request.user_id, parsed_data)
    
    if not db_success:
        raise HTTPException(status_code=500, detail=f"Database Error: {db_result}")
    
    return {
        "status": "success",
        "message": "Expense recorded to your personal account!",
        "data": return_data, 
        "db_id": db_result   
    }

# 以下測試代碼
if __name__ == "__main__":
    import uvicorn
    print("🚀 API Server starting...")
    uvicorn.run(app, host="127.0.0.1", port=8000)
# 測試用例句:
# 1. I spent 50 dollars on groceries yesterday.
# 2. Bought a new laptop for 1200 USD last week.
# 3. Spent 15 bucks on coffee this morning.
# 4. Paid 200 dollars for car maintenance two days ago.

