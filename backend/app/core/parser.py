import os
from datetime import datetime
from google import genai
from google.genai import types
from dotenv import load_dotenv
from app.core.models import ExpenseRecord, ParsedExpenseList

# Load environment variables from .env file
load_dotenv()

class GeminiParser:
    # Initialize Google Gemini client WITH "GEMINI_API_KEY"
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("❌ Error: GEMINI_API_KEY not found in .env")
        self.client = genai.Client(api_key=api_key)
        self.model_id = "gemini-2.5-flash-lite"

    # method for Gemini to parse text
    def parse_text(self, user_input: str, categories: list = None, default_currency: str = None):
        # Ensure we have a currency to fallback to
        currency_to_use = default_currency or "USD"
        # get today's date for AI to not being silly
        today_date = datetime.now().strftime("%Y-%m-%d")
        # 預防前端傳來空list
        categories_str = ', '.join(categories) if categories else "Food, Transport, Utilities, Entertainment, Others"
        
        prompt = f"""
        Today's date is {today_date}.
        The user input may describe ONE expense or MULTIPLE expenses in a single sentence.
        Extract the expense details: item, amount, date (YYYY-MM-DD), note, category and currency.
        Always return a list, even if there is only one expense.
        The date calculated based on today's date {today_date}.
        For category, choose the one that best fits from this list: {categories_str}.
        For currency, if not specified, use {currency_to_use}.
        User input: "{user_input}"
        """
        # 進行解析並限制輸出格式
        try:
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=prompt,
                config={
                    'response_mime_type': 'application/json',
                    'response_schema': ParsedExpenseList,
                }
            )
            result = response.parsed.model_dump()
            
            return True, result['expenses']
            
        except Exception as e:
            return False, f"New SDK Parsing Error: {str(e)}"

    # method for Gemini to analyze image 
    # bytes是python特有type,較好在https傳輸
    # content_type 是定義傳入bytes的格式(jpg,png...)
    def parse_image(self, image_bytes: bytes, content_type: str = "image/jpeg", categories: list = None, default_currency: str = None):
        currency_to_use = default_currency or "USD"
        today_date = datetime.now().strftime("%Y-%m-%d")
        categories_str = ', '.join(categories) if categories else "Food, Transport, Utilities, Entertainment, Others"

        prompt = f"""
        Today's date is {today_date}.
        Analyze this image to extract the expense details.
        CRITICAL INSTRUCTIONS:
        1. Output EXACTLY ONE single expense record summarizing this image.
        2. If the image is a receipt/invoice with multiple items, extract the overall total amount as the primary amount, and use the store name or main purchase as the item name.
        3. If the image is a summary/chart, extract the most representative main expense or total expense as a single record.
        4. Calculate the exact date (YYYY-MM-DD) based on today's date ({today_date}) if relative dates are mentioned or if missing from the image.
        5. For category, choose the ONE that best fits from this list: {categories_str}.
        6. For currency, if not specified in the image, fallback to using {currency_to_use}.
        """
        # 進行解析並限制輸出格式
        try:
            response = self.client.models.generate_content(
                model=self.model_id,
                contents=[
                    types.Part.from_bytes(
                        data=image_bytes,
                        mime_type=content_type,
                    ),
                    prompt,
                ],
                config={
                    'response_mime_type': 'application/json',
                    'response_schema': ExpenseRecord,
                }
            )
            result = response.parsed.model_dump()
            return True, result

        except Exception as e:
            return False, f"Image Parsing Error: {str(e)}"

expense_parser = GeminiParser()

# 以下為測試代碼
if __name__ == "__main__":
    print(f"--- Starting New SDK Parser Test ({datetime.now().strftime('%Y-%m-%d')}) ---")
    test_text = "Coffee for 150 dollars yesterday and 100 TWD today"
    success, result = expense_parser.parse_text(test_text)
    print(result)
    ...