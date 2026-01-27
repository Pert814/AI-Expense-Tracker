from core.database import Database
from core.parser import expense_parser # Import parser to test it

def main():
    print("--- Starting Dynamic Category Test in index.py ---")
    
    # Initialize Database
    try:
        db = Database()
        print("[INFO] Database connection initialized.")
    except Exception as e:
        print(f"[ERROR] Database connection failed: {e}")
        return

    # User ID to test (New User)
    user_id = "test_user_new_002"

    # 1. Test Get User Categories
    print(f"\n[1] Testing get_user_categories for user: {user_id}...")
    cats = db.get_user_categories(user_id)
    print(f"  Categories found: {cats}")
    
    if not cats:
        print("  [WARN] No categories found (User might not exist yet). Run previous test to create user.")
    else:
        print("  [SUCCESS] Categories retrieved.")

    # 2. Test Parser with Custom Categories
    print(f"\n[2] Testing parser with custom categories...")
    custom_cats = ["Tech", "Food", "Travel"]
    test_input = "Bought a new mouse for $50"
    print(f"  Input: '{test_input}'")
    print(f"  Custom Categories: {custom_cats}")
    
    success, result = expense_parser.parse_text(test_input, categories=custom_cats)
    
    if success:
        print("  [SUCCESS] Parse Result:")
        print(f"  Category: {result.get('category')}")
        print(f"  Full: {result}")
        if result.get('category') in custom_cats:
             print("  [SUCCESS] Category matches one of the custom categories!")
        else:
             print(f"  [WARN] Category '{result.get('category')}' is not in custom list (Gemini generated meaningful new one?).")
    else:
        print(f"  [FAIL] Parsing failed: {result}")

if __name__ == "__main__":
    main()
