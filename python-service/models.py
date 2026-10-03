from pydantic import BaseModel, Field
from typing import Optional

# Request Model: What C# backend sends to Python
class ContainerAnalysisRequest(BaseModel):
    container_id: str = Field(..., example="C001")
    cargo_type: str = Field(..., example="Medicine")
    weight_kg: int = Field(..., ge=1, example=800)
    priority_level: str = Field(..., example="High")
    destination: str = Field(..., example="Lahore")

# Response Model: What Python returns back to C#
class ContainerAnalysisResponse(BaseModel):
    container_id: str
    priority_score: int
    risk_level: str
    expected_dwell_hours: int
    explanation: str