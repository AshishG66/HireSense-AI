from pydantic import BaseModel, Field
from typing import List

class CodeReviewRequest(BaseModel):
    code: str = Field(..., description="The code snippet submitted by the candidate")
    language: str = Field(..., description="The programming language name or code")
    problem_title: str = Field(..., description="The coding question title")
    problem_description: str = Field(..., description="The coding question description")

class CodeReviewResponse(BaseModel):
    time_complexity: str = Field(..., description="Determined Big-O time complexity (e.g., O(NlogN))")
    space_complexity: str = Field(..., description="Determined Big-O space complexity (e.g., O(N))")
    alternative_approach: str = Field(..., description="Detailed description of an alternative or more optimal solution")
    code_quality: int = Field(..., description="Rating out of 10 on clean code practices", ge=0, le=10)
    naming_suggestions: List[str] = Field(..., description="Specific suggestions for variable or function naming improvements")
    edge_cases_missed: List[str] = Field(..., description="List of edge cases (e.g., empty lists, integer overflow) not fully handled")
    optimization_suggestions: List[str] = Field(..., description="Suggestions to reduce time/space footprints or code complexity")
    interview_feedback: str = Field(..., description="Summary advice for technical interviews based on this solution")
