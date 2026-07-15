import firebase_admin
from firebase_admin import credentials, firestore
import os
import json
from dotenv import load_dotenv
from app.core.models import ExpenseRecord

load_dotenv()

class Database:
    # Initialize connection to Firebase database
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

    
    # Check if user exists, if not create user document with default fields.
    # Automatically migrates legacy user data (Google sub ID) to the new Firebase UID.
    def check_user_exists(self, user_id, email, name):
        try:
            # 1. Search for legacy user document with the same email
            old_user_doc = None
            legacy_query = self.db.collection("users").where("email", "==", email).get()
            for d in legacy_query:
                if d.id != user_id:
                    old_user_doc = d
                    break
            
            user_ref = self.db.collection("users").document(user_id)
            doc = user_ref.get()
            
            # If a legacy document exists, perform migration
            if old_user_doc:
                old_id = old_user_doc.id
                print(f"[INFO] Found legacy user document '{old_id}' for email '{email}'. Migrating data...")
                old_data = old_user_doc.to_dict()
                
                # Check if the new user document exists
                if not doc.exists:
                    # Copy user settings to the new user doc
                    user_ref.set({
                        "email": email,
                        "name": name,
                        "created_at": old_data.get("created_at") or firestore.SERVER_TIMESTAMP,
                        "categories": old_data.get("categories", ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Other"]),
                        "currency": old_data.get("currency", "USD"),
                        "stats_start_date": old_data.get("stats_start_date", "2026-01-01")
                    })
                else:
                    # New user doc already exists, make sure settings are merged if missing in new doc
                    new_data = doc.to_dict()
                    update_payload = {}
                    if "categories" not in new_data or not new_data["categories"]:
                        update_payload["categories"] = old_data.get("categories", [])
                    if "currency" not in new_data:
                        update_payload["currency"] = old_data.get("currency", "USD")
                    if "stats_start_date" not in new_data:
                        update_payload["stats_start_date"] = old_data.get("stats_start_date", "2026-01-01")
                    if update_payload:
                        user_ref.update(update_payload)
                
                # 2. Migrate expenses subcollection
                old_expenses_ref = self.db.collection("users").document(old_id).collection("expenses")
                new_expenses_ref = self.db.collection("users").document(user_id).collection("expenses")
                
                old_expenses = old_expenses_ref.get()
                batch = self.db.batch()
                count = 0
                
                for exp_doc in old_expenses:
                    batch.set(new_expenses_ref.document(exp_doc.id), exp_doc.to_dict())
                    batch.delete(exp_doc.reference)
                    count += 1
                    if count >= 200:  # Avoid exceeding Firestore batch limit of 500
                        batch.commit()
                        batch = self.db.batch()
                        count = 0
                
                if count > 0:
                    batch.commit()
                    
                # 3. Delete the old user document
                old_user_doc.reference.delete()
                print(f"[INFO] Successfully migrated {email} from '{old_id}' to '{user_id}'.")
                return True, "User migrated"
            
            # If no legacy document exists
            if not doc.exists:
                # Initialize default values for brand new users
                print(f"[INFO] No legacy data found for {email}. Initializing default profile.")
                user_ref.set({
                    "email": email,
                    "name": name,
                    "created_at": firestore.SERVER_TIMESTAMP,
                    "categories": ["Food", "Transport", "Shopping", "Bills", "Entertainment", "Other"],
                    "currency": "USD",
                    "stats_start_date": "2026-01-01"
                })
                return True, "User initialized"
            
            return True, "User exists"
        except Exception as e:
            print(f"[ERROR] check_user_exists failed: {e}")
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
            # Create a copy to avoid modifying the original dict in-place
            # which might be returned as JSON later (Sentinel object error)
            record_to_save = data.copy()
            record_to_save['created_at'] = firestore.SERVER_TIMESTAMP
            
            collection_path = f"users/{user_id}/expenses" 
            _, doc_ref = self.db.collection(collection_path).add(record_to_save)
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
                record = doc.to_dict()
                record['id'] = doc.id # Include the Firestore document ID so that frontend can delete/update the record
                records.append(record)
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

    # method to get user info
    def get_user_info(self, user_id):
        try:
            user_ref = self.db.collection("users").document(user_id)
            doc = user_ref.get()
            if doc.exists:
                user_data = doc.to_dict()
                user_data['id'] = doc.id
                return True, user_data
            return False, "User not found"
        except Exception as e:
            return False, str(e)

    # method to update user info
    def update_user_info(self, user_id, data):
        try:
            user_ref = self.db.collection("users").document(user_id)
            user_ref.update(data)
            return True, "User info updated successfully"
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

