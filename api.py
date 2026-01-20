from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from core.parser import expense_parser
from core.database import db_client

# 初始化 FastAPI 應用
app = FastAPI(
    title="AI Expense Tracker API",
    description="An AI-powered API that parses natural language into structured expense records.",
    version="1.0.0"
)

class ExpenseRequest(BaseModel):
    text: str

# 檢查伺服器狀態端點
@ app.get("/")
def health_check():
    return {
        "status": "online",
        "message": "AI Expense Tracker API is running smoothly."
    }

# 費用解析端點
@app.post("/parse-expense")
async def add_expense(request: ExpenseRequest): # 用async def來避免同時等待伺服器的阻塞
    succes, parsed_data = expense_parser.parse_text(request.text)
    if not succes:
        raise HTTPException(status_code=500, detail=f"AI Parsing Error: {parsed_data}")

    db_success, db_result = db_client.add_record("expenses", parsed_data)
    if not db_success:
        raise HTTPException(status_code=500, detail=f"Database Error: {db_result}")
    
    return {
        "status": "success",
        "message": "Expense recorded successfully!",
    }

# 以下測試代碼
if __name__ == "__main__":
    import uvicorn
    print("🚀 API Server starting...")
    uvicorn.run(app, host="127.0.0.1", port=8000)
