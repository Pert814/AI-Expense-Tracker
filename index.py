from core.database import Database
import json

def main():
    print("--- Starting Database Logic Test in index.py ---")
    
    # Initialize Database
    try:
        db = Database()
        print("✅ Database connection initialized.")
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return

    # User ID to test
    user_id = "test_user_001"

    # 1. Test Add (Adding a new record to ensure we have data)
    print(f"\n[1] Testing add_user_record for user: {user_id}...")
    record_data = {
        "item": "Test Item for Get Test",
        "amount": 100,
        "category": "Testing",
        "note": "Verifying get_user_record functionality"
    }
    
    success, result = db.add_user_record(user_id, record_data)

    if success:
        print(f"  ✅ Add Success! Document ID: {result}")
    else:
        print(f"  ❌ Add Failed! Error: {result}")

    # 2. Test Get
    print(f"\n[2] Testing get_user_record for user: {user_id}...")
    success, records = db.get_user_record(user_id)
    
    if success:
        print(f"  ✅ Get Success! Found {len(records)} records.")
        print("  --- Records Preview ---")
        # Print all records
        for i, rec in enumerate(records):
            # Print cleanly
            print(f"  📄 Record {i+1}: {rec}")
    else:
        print(f"  ❌ Get Failed! Error: {records}")

if __name__ == "__main__":
    main()
