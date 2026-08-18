import sys
import os

# Add backend directory to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.email import send_weekly_report_email


def run_email_test():
    print("--- Starting SMTP Weekly Report Email Unit Test ---")

    # 1. Define recipient email
    recipient = "nick0928800077@gmail.com"

    # 2. Mock a realistic weekly report data
    mock_report = {
        "week_start": "2026-08-10",
        "week_end": "2026-08-16",
        "currency": "TWD",
        "expense_count": 5,
        "total": 1580.0,
        "previous_week_total": 2100.0,
        "change_amount": -520.0,
        "change_percent": -24.8,
        "category_totals": [
            {"category": "Food", "amount": 680.0},
            {"category": "Transport", "amount": 400.0},
            {"category": "Entertainment", "amount": 350.0},
            {"category": "Bills", "amount": 150.0}
        ],
        "largest_expense": {
            "item": "Concert Ticket",
            "amount": 350.0,
            "date": "2026-08-12",
            "category": "Entertainment"
        },
        "top_spending_day": {
            "date": "2026-08-15",
            "amount": 680.0
        }
    }

    print(f"[INFO] Attempting to send test weekly report to: {recipient}")
    print(f"[INFO] Mock Report Details:")
    print(f"  - Week: {mock_report['week_start']} to {mock_report['week_end']}")
    print(f"  - Total: {mock_report['total']} {mock_report['currency']}")
    print(f"  - Change: {mock_report['change_amount']} {mock_report['currency']} ({mock_report['change_percent']}%)")

    # 3. Call email utility
    success, msg = send_weekly_report_email(recipient, mock_report)

    if success:
        print("\n[SUCCESS] Email sent successfully! Please check your inbox at nick0928800077@gmail.com.")
    else:
        print(f"\n[FAIL] Email delivery failed.")
        print(f"[ERROR MESSAGE] {msg}")
        print("\n[HELP] Please ensure your SMTP environment variables (SMTP_HOST, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD) are set correctly in backend/.env.")


if __name__ == "__main__":
    run_email_test()


# cd backend
# source venv/bin/activate      
# PYTHONPATH=. python3 tests/test_email.py