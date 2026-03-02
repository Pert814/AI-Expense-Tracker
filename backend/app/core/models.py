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
    currency: Optional[str] = ""
    date: str  # Format: YYYY-MM-DD
    note: Optional[str] = ""

    class Config:
        # Extra fields will be ignored to keep the database clean
        extra = "ignore"

# User's information request model
class UserUpdate(BaseModel):
    name: Optional[str] = None
    categories: Optional[list[str]] = None
    currency: Optional[str] = None
    stats_start_date: Optional[str] = None # Format: YYYY-MM-DD

# Parse expense request model
class ParseRequestModel(BaseModel):
    text: str

# GOOGLE_CLIENT_ID Token request model
class TokenBody(BaseModel):
    id_token: str