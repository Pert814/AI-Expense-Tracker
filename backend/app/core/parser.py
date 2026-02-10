import os
from datetime import datetime
from google import genai
from pydantic import BaseModel
from dotenv import load_dotenv
from app.core.models import ExpenseRecord

# Load environment variables from .env file
load_dotenv()

class GeminiParser:
    # Initialize Google Gemini client
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("❌ Error: GEMINI_API_KEY not found in .env")
        self.client = genai.Client(api_key=api_key)
        self.model_id = "gemini-2.5-flash-lite"

    # method for AI to parse text
    def parse_text(self, user_input: str, categories: list = None, default_currency: str = None):
        # Ensure we have a currency to fallback to
        currency_to_use = default_currency or "USD"
        
        # get today's date for AI to not being silly
        today_date = datetime.now().strftime("%Y-%m-%d")
        prompt = f"""
        Today's date is {today_date}.
        Extract the expense details: item, amount, date (YYYY-MM-DD), note, category, and currency.
        If the user says 'yesterday', calculate based on {today_date}.
        For category, choose the one that best fits from this list: {', '.join(categories)}.
        For currency, follow these rules:
        1. If the user explicitly mentions a currency (e.g., USD, TWD, dollars, bucks), extract that currency.
        2. If NO currency is mentioned, use "{currency_to_use}" as the default currency.
        
        User input: "{user_input}"
        """
        # 進行解析並限制輸出格式
        try:
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=prompt,
                config={
                    'response_mime_type': 'application/json',
                    'response_schema': ExpenseRecord,
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