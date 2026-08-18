import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()

# Read SMTP configuration from environment
SMTP_HOST = os.getenv("SMTP_HOST")
SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_FROM = os.getenv("SMTP_FROM")

# 開端口在587
try:
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
except ValueError:
    SMTP_PORT = 587

# Fallback sender address to username if not specified
SMTP_FROM = SMTP_FROM or SMTP_USERNAME


def send_weekly_report_email(recipient_email: str, report: dict) -> tuple[bool, str]:
    """
    Formats the weekly report as HTML and sends it via SMTP.
    Returns (success_boolean, status_message).
    """
    if not SMTP_HOST or not SMTP_USERNAME or not SMTP_PASSWORD:
        return False, "SMTP configuration is incomplete. Please set SMTP_HOST, SMTP_USERNAME, and SMTP_PASSWORD in .env."

    try:
        week_start = report.get("week_start", "")
        week_end = report.get("week_end", "")
        currency = report.get("currency", "USD")
        expense_count = report.get("expense_count", 0)
        total = report.get("total", 0.0)
        previous_week_total = report.get("previous_week_total", 0.0)
        change_amount = report.get("change_amount", 0.0)
        change_percent = report.get("change_percent")

        abs_change_amount = abs(change_amount)
        if change_amount > 0:
            change_sign = "+"
            change_color = "#e76e55"  # red for increase (negative in budgeting context)
        elif change_amount < 0:
            change_sign = "-"
            change_color = "#92cc41"  # green for decrease (savings/success)
        else:
            change_sign = ""
            change_color = "#212529"

        if change_percent is None:
            change_percent_str = "N/A"
        else:
            change_percent_str = f"{abs(change_percent)}%"

        # Format category breakdown table rows (compatible with email clients)
        category_rows = []
        if report.get("category_totals"):
            category_rows.append('<table style="width: 100%; border-collapse: collapse; font-size: 13px;">')
            for item in report["category_totals"]:
                cat = str(item["category"]).upper()
                amt = item["amount"]
                category_rows.append(f"""
                <tr style="border-bottom: 1px solid #eeeeee;">
                    <td style="padding: 8px 0; color: #212529; text-align: left;">{cat}</td>
                    <td style="padding: 8px 0; text-align: right; font-weight: bold; color: #212529;">{amt} {currency}</td>
                </tr>
                """)
            category_rows.append('</table>')
            category_rows_html = "\n".join(category_rows)
        else:
            category_rows_html = '<div style="font-size: 13px; color: #adafbc; text-align: center; padding: 10px;">NO EXPENSES RECORDED</div>'

        # Format insights table rows
        insights_html = ""
        if report.get("largest_expense") or report.get("top_spending_day"):
            insights = []
            insights.append('<div style="margin-bottom: 25px;">')
            insights.append('<h2 style="font-size: 16px; text-transform: uppercase; color: #212529; border-bottom: 4px solid #212529; padding-bottom: 5px; margin-top: 0; font-family: inherit;">Notable Insights</h2>')
            insights.append('<table style="width: 100%; border-collapse: collapse; font-size: 13px;">')

            if report.get("largest_expense"):
                le = report["largest_expense"]
                item_name = le["item"]
                item_amount = le["amount"]
                item_cat = str(le["category"]).upper()
                insights.append(f"""
                <tr style="border-bottom: 1px dashed #eeeeee;">
                    <td style="padding: 8px 0; vertical-align: top; color: #212529; text-align: left;"><strong>Largest Single Expense</strong></td>
                    <td style="padding: 8px 0; text-align: right; color: #212529;">
                        <strong>{item_name}</strong> ({item_cat})<br/>
                        <span style="color: #e76e55; font-weight: bold;">{item_amount} {currency}</span>
                    </td>
                </tr>
                """)

            if report.get("top_spending_day"):
                tsd = report["top_spending_day"]
                tsd_date = tsd["date"]
                tsd_amount = tsd["amount"]
                insights.append(f"""
                <tr>
                    <td style="padding: 8px 0; vertical-align: top; color: #212529; text-align: left;"><strong>Top Spending Day</strong></td>
                    <td style="padding: 8px 0; text-align: right; color: #212529;">
                        <strong>{tsd_date}</strong><br/>
                        <span style="color: #e76e55; font-weight: bold;">{tsd_amount} {currency}</span>
                    </td>
                </tr>
                """)

            insights.append('</table>')
            insights.append('</div>')
            insights_html = "\n".join(insights)

        # Assemble Full Responsive HTML Email Body (retro theme inspired)
        html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Weekly Expense Report</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #f8f9fa; font-family: 'Courier New', Courier, monospace, sans-serif;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border: 4px solid #212529; box-shadow: 4px 4px 0px #adafbc; padding: 20px; box-sizing: border-box;">
        <!-- Header -->
        <div style="background-color: #212529; color: #ffffff; padding: 15px; text-align: center; border-bottom: 4px solid #212529; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 2px; color: #ffffff;">Weekly Report</h1>
            <p style="margin: 5px 0 0 0; font-size: 12px; color: #adafbc;">{week_start} ~ {week_end}</p>
        </div>

        <!-- Summary Statistics -->
        <div style="margin-bottom: 25px;">
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="font-size: 14px; padding: 8px 0; border-bottom: 2px dashed #212529; color: #212529; text-align: left;"><strong>Total Expenses</strong></td>
                    <td style="font-size: 16px; padding: 8px 0; border-bottom: 2px dashed #212529; text-align: right; color: #209cee; font-weight: bold;">
                        {total} {currency}
                    </td>
                </tr>
                <tr>
                    <td style="font-size: 14px; padding: 8px 0; border-bottom: 2px dashed #212529; color: #212529; text-align: left;"><strong>Expense Count</strong></td>
                    <td style="font-size: 14px; padding: 8px 0; border-bottom: 2px dashed #212529; text-align: right; color: #212529;">
                        {expense_count} items
                    </td>
                </tr>
                <tr>
                    <td style="font-size: 14px; padding: 8px 0; border-bottom: 2px dashed #212529; color: #212529; text-align: left;"><strong>Previous Week Total</strong></td>
                    <td style="font-size: 14px; padding: 8px 0; border-bottom: 2px dashed #212529; text-align: right; color: #212529;">
                        {previous_week_total} {currency}
                    </td>
                </tr>
                <tr>
                    <td style="font-size: 14px; padding: 8px 0; border-bottom: 2px dashed #212529; color: #212529; text-align: left;"><strong>Weekly Change</strong></td>
                    <td style="font-size: 14px; padding: 8px 0; border-bottom: 2px dashed #212529; text-align: right; color: {change_color}; font-weight: bold;">
                        {change_sign}{abs_change_amount} {currency} ({change_percent_str})
                    </td>
                </tr>
            </table>
        </div>

        <!-- Category Breakdown -->
        <div style="margin-bottom: 25px;">
            <h2 style="font-size: 16px; text-transform: uppercase; color: #212529; border-bottom: 4px solid #212529; padding-bottom: 5px; margin-top: 0; font-family: inherit;">Category Breakdown</h2>
            {category_rows_html}
        </div>

        <!-- Notable Insights -->
        {insights_html}

        <!-- Footer -->
        <div style="text-align: center; border-top: 2px dashed #adafbc; padding-top: 15px; margin-top: 30px; font-size: 11px; color: #adafbc;">
            Sent by AI Expense Tracker.
        </div>
    </div>
</body>
</html>
"""

        # Setup MIME email
        msg = MIMEMultipart("alternative")
        msg["Subject"] = f"[AI Expense Tracker] Weekly Report ({week_start} ~ {week_end})"
        msg["From"] = SMTP_FROM
        msg["To"] = recipient_email

        # Plain text fallback for simple clients
        text_fallback = (
            f"Weekly Report ({week_start} ~ {week_end})\n\n"
            f"Total Expenses: {total} {currency} ({expense_count} items)\n"
            f"Previous Week Total: {previous_week_total} {currency}\n"
            f"Weekly Change: {change_sign}{abs_change_amount} {currency} ({change_percent_str})\n"
        )

        msg.attach(MIMEText(text_fallback, "plain", "utf-8"))
        msg.attach(MIMEText(html_content, "html", "utf-8"))

        # Setup connection (SSL on port 465 or TLS/STARTTLS on others)
        if SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=15)
        else:
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=15)
            server.ehlo()
            server.starttls()
            server.ehlo()

        # Login and send
        server.login(SMTP_USERNAME, SMTP_PASSWORD)
        server.sendmail(SMTP_FROM, [recipient_email], msg.as_string())
        server.quit()

        return True, "Email sent successfully!"
    except Exception as e:
        print(f"[ERROR] Failed to send weekly report email: {e}")
        return False, f"Failed to send email: {str(e)}"
