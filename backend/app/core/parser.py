import os
from datetime import datetime
from google import genai
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

# 定義模型輸出格式
class ExpenseData(BaseModel):
    item: str
    amount: float
    date: str
    note: str
    category: str

class GeminiParser:
    # 初始化新的 Google Gemini 客户端
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("❌ Error: GEMINI_API_KEY not found in .env")
        self.client = genai.Client(api_key=api_key)
        self.model_id = "gemini-2.5-flash-lite"

    # method for AI to parse text
    def parse_text(self, user_input: str, categories: list = None):
        # get today's date for AI to not being silly
        today_date = datetime.now().strftime("%Y-%m-%d")
        prompt = f"""
        Today's date is {today_date}.
        Extract the expense details: item, amount, date (YYYY-MM-DD), note, and category.
        If the user says 'yesterday', calculate based on {today_date}.
        For category, choose the one that best fits from this list: {', '.join(categories)}. 
        User input: "{user_input}"
        """
        # 進行解析並限制輸出格式
        try:
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=prompt,
                config={
                    'response_mime_type': 'application/json',
                    'response_schema': ExpenseData,
                }
            )
            result = response.parsed.model_dump()
            return True, result
            
        except Exception as e:
            return False, f"New SDK Parsing Error: {str(e)}"

expense_parser = GeminiParser()

# 以下為測試代碼
if __name__ == "__main__":
    print(f"--- Starting New SDK Parser Test ({datetime.now().strftime('%Y-%m-%d')}) ---")
    test_text = "Coffee for 150 dollars yesterday"
    success, result = expense_parser.parse_text(test_text)
    
    if success:
        print("✅ Parsing Successful with New SDK:")
        print(result)
    else:
        print(f"❌ Parsing Failed: {result}")