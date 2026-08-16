# backend/tests/test_weekly_endpoint.py
from fastapi.testclient import TestClient
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.main import app, get_current_user_id
from app.core.database import db_client

# 1. 建立測試客戶端
client = TestClient(app)

# 2. 定義測試用的 User ID（例如使用之前的 test_user_new_002）
TEST_USER_ID = "test_user_new_002"

# 3. 確保該 User 在 Firestore 中已初始化，避免 404 錯誤
# 如果資料庫沒有此帳號，這行會自動幫你建立測試設定檔（主幣別 USD、預設分類等）
db_client.check_user_exists(TEST_USER_ID, "test@example.com", "Test User")

# 4. 模擬驗證：強制將 get_current_user_id 替換為測試用的 user_id
app.dependency_overrides[get_current_user_id] = lambda: TEST_USER_ID

def test_generate_report():
    print("--- 測試生成週報 API ---")
    # 發送請求，不帶 date 預設抓今日，帶 "2026-08-16" 則以該日為基準日
    response = client.post("/report/weekly/generate", json={"date": "2026-08-16"})
    
    print(f"Status Code: {response.status_code}")
    print("Response JSON:")
    import pprint
    pprint.pprint(response.json())

if __name__ == "__main__":
    test_generate_report()