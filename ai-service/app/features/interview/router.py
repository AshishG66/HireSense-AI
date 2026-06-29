from fastapi import APIRouter, HTTPException
from app.features.interview.schemas import (
    InterviewGenerationRequest,
    InterviewGenerationResponse,
    AnswerEvaluationRequest,
    AnswerEvaluationResponse,
    ReportGenerationRequest,
    ReportGenerationResponse,
)
from app.features.interview.service import interview_service

router = APIRouter(prefix="/api/v1/interview", tags=["interview"])

@router.post("/questions", response_model=InterviewGenerationResponse)
async def generate_questions(data: InterviewGenerationRequest):
    try:
        return await interview_service.generate_questions(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/evaluate", response_model=AnswerEvaluationResponse)
async def evaluate_answer(data: AnswerEvaluationRequest):
    try:
        return await interview_service.evaluate_answer(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/report", response_model=ReportGenerationResponse)
async def generate_report(data: ReportGenerationRequest):
    try:
        return await interview_service.generate_report(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
