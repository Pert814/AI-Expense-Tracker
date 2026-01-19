import firebase_admin
from firebase_admin import credentials, firestore
import os
import json
from dotenv import load_dotenv

load_dotenv()

class Database:
    def __init__(self):
        """Initialize Firebase connection"""
        if not firebase_admin._apps:
            config_str = os.getenv('FIREBASE_CONFIG')
            if not config_str:
                raise ValueError("❌ Error: FIREBASE_CONFIG not found in .env")

            try:
                cred_dict = json.loads(config_str)
                cred = credentials.Certificate(cred_dict)
                firebase_admin.initialize_app(cred)
                print("✅ Firebase initialized successfully")
            except Exception as e:
                print(f"❌ Firebase initialization failed: {e}")
                raise

        self.db = firestore.client()

    def add_record(self, collection_name, data):
        """Generic method to add data to Firestore"""
        try:
            data['created_at'] = firestore.SERVER_TIMESTAMP
            _, doc_ref = self.db.collection(collection_name).add(data)
            return True, doc_ref.id
        except Exception as e:
            return False, str(e)

db_client = Database()

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

