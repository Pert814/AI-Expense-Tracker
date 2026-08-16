from collections import defaultdict
from datetime import date, timedelta
from typing import Any

def build_weekly_report(
    expenses: list[dict],
    reference_date: date,
    primary_currency: str,
) -> dict:
    week_start = reference_date - timedelta(days=reference_date.weekday())  # weekday()：星期一是 0，星期日是 6
    week_end = week_start + timedelta(days=6)
    previous_week_start = week_start - timedelta(days=7) 
    previous_week_end = week_start - timedelta(days=1)

    # 分成兩週的處理資料 跳過日期錯誤與幣別不同的資料
    current_week_expenses = []
    previous_week_expenses = []
    for expense in expenses:
        try:
            expense_date = date.fromisoformat(expense["date"])
        except (KeyError, ValueError, TypeError):
            continue
        expense_currency = expense.get("currency") or primary_currency
        if expense_currency != primary_currency:
            continue
        
        if week_start <= expense_date <= week_end:
            current_week_expenses.append(expense)
        elif previous_week_start <= expense_date <= previous_week_end:
            previous_week_expenses.append(expense)
    
    # 計算各週花費總和
    def calculate_total(records: list[dict]) -> float:
        total = 0.0
        for record in records:
            try:
                total += float(record["amount"])
            except (KeyError, ValueError, TypeError):
                continue

        return round(total, 2)
    
    # 計算兩週花費總和與增減比例
    current_total = calculate_total(current_week_expenses)
    previous_total = calculate_total(previous_week_expenses)
    change_amount = round(current_total - previous_total, 2)
    if previous_total == 0:
        change_percent = None
    else:
        change_percent = round(
            (change_amount / previous_total) * 100,
            1,
        )
   
    # 計算本週各分類的支出總額
    category_totals = defaultdict(float)
    for expense in current_week_expenses:
        try:
            amount = float(expense["amount"])
        except (KeyError, ValueError, TypeError):
            continue
        category = expense.get("category") or "Others"
        category_totals[category] += amount
    category_summary = [
        {"category": category,"amount": round(amount, 2),}
        # 按金額大小排列
        for category, amount in sorted(
            category_totals.items(),
            key=lambda item: item[1],
            reverse=True,
        )
    ]

    # 找出本週的「最大單筆支出」與「消費最高日」。
    largest_expense = None
    daily_totals = defaultdict(float)
    for expense in current_week_expenses:
        try:
            amount = float(expense["amount"])
        except (KeyError, ValueError, TypeError):
            continue
        
        expense_date = expense["date"]
        category = expense.get("category") or "Others"
        # 累計每天的消費
        daily_totals[expense_date] += amount
        # 找出最大筆支出
        if largest_expense is None or amount > largest_expense["amount"]:
            largest_expense = {
                "item": expense.get("item") or "Unknown item",
                "amount": round(amount, 2),
                "date": expense_date,
                "category": category,
            }
    # 找出消費最高日
    if daily_totals:
        top_date, top_amount = max(
            daily_totals.items(),
            key=lambda item: item[1],
        )
        top_spending_day = {
                "date": top_date,
                "amount": round(top_amount, 2),
            }
    else:
        top_spending_day = None

    return {
        "week_start": week_start.isoformat(),
        "week_end": week_end.isoformat(),
        "currency": primary_currency,
        "expense_count": len(current_week_expenses),
        "total": current_total,
        "previous_week_total": previous_total,
        "change_amount": change_amount,
        "change_percent": change_percent,
        "category_totals": category_summary,
        "largest_expense": largest_expense,
        "top_spending_day": top_spending_day,
    }









