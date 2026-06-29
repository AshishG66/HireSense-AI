from pydantic import BaseModel, Field
from typing import List, Optional

class QuestionItem(BaseModel):
    question_text: str = Field(..., description="Text of the interview question")
    expected_criteria: str = Field(..., description="Evaluation guidelines or expected points for this answer")
    question_type: str = Field(..., description="Type of question: TECHNICAL, HR, BEHAVIORAL, SITUATIONAL, FOLLOW_UP")

class InterviewGenerationRequest(BaseModel):
    resume_text: str = Field(..., description="Candidate resume text")
    job_description: str = Field(..., description="Target job description")
    difficulty: str = Field(..., description="EASY, MEDIUM, or HARD")
    interview_type: str = Field(..., description="TECHNICAL, HR, BEHAVIORAL, SITUATIONAL, MIXED")
    previous_history: Optional[str] = Field(default="", description="Summary details of previous interviews")

class InterviewGenerationResponse(BaseModel):
    questions: List[QuestionItem] = Field(..., description="Generated list of interview questions")

class AnswerEvaluationRequest(BaseModel):
    question: str = Field(..., description="Interview question text")
    expected_criteria: str = Field(..., description="Expected criteria or model guidelines")
    student_answer: str = Field(..., description="Transcribed response of the candidate")
    difficulty: str = Field(..., description="Session difficulty level")

class AnswerEvaluationResponse(BaseModel):
    technical_accuracy: float = Field(..., description="Grade 0-10 on accuracy of concepts", ge=0, le=10)
    communication: float = Field(..., description="Grade 0-10 on language articulation", ge=0, le=10)
    problem_solving: float = Field(..., description="Grade 0-10 on logic analysis skills", ge=0, le=10)
    confidence: float = Field(..., description="Grade 0-10 on posture and response flow confidence", ge=0, le=10)
    completeness: float = Field(..., description="Grade 0-10 on completeness of response to requested constraints", ge=0, le=10)
    grammar: float = Field(..., description="Grade 0-10 on language syntax errors", ge=0, le=10)
    overall_score: float = Field(..., description="Aggregate grade 0-10", ge=0, le=10)
    feedback: str = Field(..., description="Detailed grading comments on performance")
    suggestions: List[str] = Field(..., description="Improvement bullet actions")

class AnswerDetail(BaseModel):
    question: str
    expected_criteria: str
    student_answer: str
    overall_score: float

class ReportGenerationRequest(BaseModel):
    answers: List[AnswerDetail] = Field(..., description="List of completed evaluations")

class ReportGenerationResponse(BaseModel):
    overall_score: float = Field(..., description="Overall interview performance grade 0-100", ge=0, le=100)
    technical_score: float = Field(..., description="Aggregate technical index score")
    behavioral_score: float = Field(..., description="Aggregate behavioral index score")
    communication_score: float = Field(..., description="Aggregate communication index score")
    strengths: List[str] = Field(..., description="Candidate strengths list")
    weaknesses: List[str] = Field(..., description="Development areas or weaknesses list")
    learning_resources: List[str] = Field(..., description="Checklist of recommended training/documentation links")
    suggested_projects: List[str] = Field(..., description="Suggested hands-on projects to address gaps")
    next_difficulty: str = Field(..., description="Recommended difficulty for next round: EASY, MEDIUM, or HARD")
