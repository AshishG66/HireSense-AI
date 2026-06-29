from fastapi import APIRouter, HTTPException
from app.features.assessment.schemas import CodeReviewRequest, CodeReviewResponse
from app.features.assessment.service import assessment_service

router = APIRouter(prefix="/api/v1/assessment", tags=["assessment"])

@router.post("/review", response_model=CodeReviewResponse)
async def review_code(data: CodeReviewRequest):
    try:
        return await assessment_service.review_code(data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
