import os
import json
from datetime import datetime
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

class GeminiParser:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("❌ Error: GEMINI_API_KEY not found in .env")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')

    def parse_text(self, user_input: str):
        """Parse natural language into structured JSON via Gemini"""
        today_date = datetime.now().strftime("%Y-%m-%d")

        # Instruction for the AI
        prompt = f"""
        You are a professional expense tracking assistant. Today's date is {today_date}.
        Extract the following fields from the user input: item, amount, date, and note.

        Rules:
        1. Format the 'date' as "YYYY-MM-DD".
        2. If the user says "yesterday" or "day before yesterday", calculate the date based on {today_date}.
        3. If no date is mentioned, default to today ({today_date}).
        4. The 'amount' must be a number.
        5. If there is no note, use an empty string "".

        Return ONLY a JSON object:
        {{
            "item": "item name",
            "amount": number,
            "date": "YYYY-MM-DD",
            "note": "any additional info"
        }}

        User input: "{user_input}"
        """

        try:
            response = self.model.generate_content(prompt)
            clean_json = response.text.strip().replace('```json', '').replace('```', '')
            data = json.loads(clean_json)
            data['amount'] = float(data['amount'])
            return True, data
        except Exception as e:
            return False, f"AI Parsing Error: {str(e)}"

expense_parser = GeminiParser()

if __name__ == "__main__":
    print(f"--- Starting AI Parser Test (Base Date: {datetime.now().strftime('%Y-%m-%d')}) ---")
    test_text = "Bought a 45 dollar latte at 7-11 yesterday"
    success, result = expense_parser.parse_text(test_text)
    
    if success:
        print("✅ Parsing Successful:")
        print(json.dumps(result, indent=4))
    else:
        print(f"❌ Parsing Failed: {result}")
