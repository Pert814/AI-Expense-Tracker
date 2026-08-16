import unittest
from datetime import date

from app.core.reports import build_weekly_report


class WeeklyReportTests(unittest.TestCase):
    def setUp(self):
        # 2026-08-16 是星期日
        # 本週：2026-08-10 ~ 2026-08-16
        # 上週：2026-08-03 ~ 2026-08-09
        self.reference_date = date(2026, 8, 16)

        self.expenses = [
            # 本週 TWD
            {
                "item": "Lunch",
                "amount": 100,
                "category": "Food",
                "currency": "TWD",
                "date": "2026-08-10",
            },
            {
                "item": "Train",
                "amount": 50,
                "category": "Transport",
                "currency": "TWD",
                "date": "2026-08-15",
            },

            # 上週 TWD
            {
                "item": "Coffee",
                "amount": 75,
                "category": "Food",
                "currency": "TWD",
                "date": "2026-08-04",
            },

            # 本週 USD：TWD 週報應忽略
            {
                "item": "Book",
                "amount": 20,
                "category": "Shopping",
                "currency": "USD",
                "date": "2026-08-12",
            },
        ]

    def test_builds_twd_weekly_report(self):
        report = build_weekly_report(
            expenses=self.expenses,
            reference_date=self.reference_date,
            primary_currency="TWD",
        )

        # 週期
        self.assertEqual(report["week_start"], "2026-08-10")
        self.assertEqual(report["week_end"], "2026-08-16")

        # 基本統計
        self.assertEqual(report["currency"], "TWD")
        self.assertEqual(report["expense_count"], 2)
        self.assertEqual(report["total"], 150.0)
        self.assertEqual(report["previous_week_total"], 75.0)
        self.assertEqual(report["change_amount"], 75.0)
        self.assertEqual(report["change_percent"], 100.0)

        # 分類統計
        self.assertEqual(
            report["category_totals"],
            [
                {"category": "Food", "amount": 100.0},
                {"category": "Transport", "amount": 50.0},
            ],
        )

        # 最大單筆
        self.assertEqual(
            report["largest_expense"],
            {
                "item": "Lunch",
                "amount": 100.0,
                "date": "2026-08-10",
                "category": "Food",
            },
        )

        # 消費最高日
        self.assertEqual(
            report["top_spending_day"],
            {
                "date": "2026-08-10",
                "amount": 100.0,
            },
        )

    def test_returns_empty_weekly_report_when_no_matching_expenses(self):
        report = build_weekly_report(
            expenses=[],
            reference_date=self.reference_date,
            primary_currency="TWD",
        )

        self.assertEqual(report["expense_count"], 0)
        self.assertEqual(report["total"], 0.0)
        self.assertEqual(report["previous_week_total"], 0.0)
        self.assertEqual(report["change_amount"], 0.0)
        self.assertIsNone(report["change_percent"])
        self.assertEqual(report["category_totals"], [])
        self.assertIsNone(report["largest_expense"])
        self.assertIsNone(report["top_spending_day"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
    
# PYTHONPATH=. python3 tests/reports_test.py