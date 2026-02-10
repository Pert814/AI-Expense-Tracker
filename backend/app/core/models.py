from pydantic import BaseModel
from typing import Optional

class ExpenseRecord(BaseModel):
    """
    Fixed schema for an expense record.
    Used for validation in both the AI parser and database storage.
    """
    item: str
    amount: float
    category: str
    currency: str
    date: str  # Format: YYYY-MM-DD
    note: Optional[str] = ""

    class Config:
        # Extra fields will be ignored to keep the database clean
        extra = "ignore"
