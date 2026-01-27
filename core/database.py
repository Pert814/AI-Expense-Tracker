import firebase_admin
from firebase_admin import credentials, firestore
import os
import json
from dotenv import load_dotenv

load_dotenv()

class Database:
    # 初始化 Firebase database連接
    def __init__(self):
        if not firebase_admin._apps:
            config_str = os.getenv('FIREBASE_CONFIG')
            if not config_str:
                raise ValueError("❌ Error: FIREBASE_CONFIG not found in .env")

            try:
                cred_dict = json.loads(config_str)
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred)
                print("[INFO] Firebase initialized successfully")
            except Exception as e:
                print(f"[ERROR] Firebase initialization failed: {e}")
                raise

        self.db = firestore.client()

    
    # Check if user exists, if not create user document with default fields
    def check_user_exists(self, user_id, email, name):
        try:
            user_ref = self.db.collection("users").document(user_id)
            doc = user_ref.get()
            
            if not doc.exists:
                print(f"[INFO] New user detected: {user_id}. Initializing...")
                user_ref.set({
                    "email": email,
                    "name": name,
                    "created_at": firestore.SERVER_TIMESTAMP,
                    "categories": ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Other"] # Default categories
                })
                return True, "User initialized"
            user_data = doc.to_dict()
            return True, "User exists"
        except Exception as e:
            return False, str(e)

    # method to get user categories
    def get_user_categories(self, user_id):
        try:
            user_ref = self.db.collection("users").document(user_id)
            doc = user_ref.get()
            if doc.exists:
                return doc.to_dict().get("categories", [])
            return []
        except Exception:
            return []

    # method to create user record
    def create_user_record(self, user_id, data):
        try:
            data['created_at'] = firestore.SERVER_TIMESTAMP
            collection_path = f"users/{user_id}/expenses" 
            _, doc_ref = self.db.collection(collection_path).add(data)
            return True, doc_ref.id
        except Exception as e:
            return False, str(e)

    # method to read user records
    def read_user_record(self, user_id):
        try:
            collection_path = f"users/{user_id}/expenses"
            docs = self.db.collection(collection_path).stream() # docs : <class 'generator'>
            # Use for loop to run the generator from "stream()"
            records = []
            for doc in docs:
                records.append(doc.to_dict())
            return True, records
        except Exception as e:
            return False, str(e)
    # method to update user record
    def update_user_record(self, user_id, record_id, data):
        try:
            collection_path = f"users/{user_id}/expenses"
            self.db.collection(collection_path).document(record_id).update(data)
            return True, "Record updated successfully"
        except Exception as e:
            return False, str(e)
    # method to delete user record
    def delete_user_record(self, user_id, record_id):
        try:
            collection_path = f"users/{user_id}/expenses"
            self.db.collection(collection_path).document(record_id).delete()
            return True, "Record deleted successfully"
        except Exception as e:
            return False, str(e)
            

db_client = Database()

# 以下為測試代碼
if __name__ == "__main__":
    print("\n--- Starting Database Connection Test ---")
    test_data = {
        "item": "Test Coffee",
        "amount": 150,
        "date": "2026-01-19",
        "note": "Unit test record"
    }
    success, result = db_client.add_record("database_test", test_data)
    
    if success:
        print(f"🎉 Success! Document ID: {result}")
    else:
        print(f"💀 Failed! Error: {result}")

