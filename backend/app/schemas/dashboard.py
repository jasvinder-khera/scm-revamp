from pydantic import BaseModel
from typing import Optional

class DashboardRequest(BaseModel):
    startdate: str
    enddate: str