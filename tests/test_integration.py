import sys
import os
import json

# 將根目錄加入系統路徑，方便匯入 core 模組
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.parser import expense_parser
from core.database import db_client

# 測試database和parser的整合
def run_integration_test():
    print("🚀 Starting Integration Test: Parser + Database")
    print("-" * 50)

    raw_input = "I spent 300 dollars on a new keyboard today"
    print(f"📝 User Input: {raw_input}")

    print("\n🧠 AI is parsing the text...")
    success, parsed_result = expense_parser.parse_text(raw_input)

    if not success:
        print(f"❌ Parser Error: {parsed_result}")
        return

    print("✅ AI Parsing Successful!")
    print(f"   Parsed Data: {json.dumps(parsed_result, indent=4)}")

    print("\n💾 Saving to Firestore...")
    db_success, db_id = db_client.add_record("integration_tests", parsed_result)

    if db_success:
        print(f"🎉 Integration Test Passed!")
        print(f"   Document ID in Firestore: {db_id}")
    else:
        print(f"❌ Database Error: {db_id}")

if __name__ == "__main__":
    run_integration_test()