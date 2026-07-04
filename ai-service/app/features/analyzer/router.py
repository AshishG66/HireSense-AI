from fastapi import APIRouter, HTTPException
from app.features.analyzer.schemas import (
    ResumeAnalysisRequest,
    ResumeAnalysisResponse,
    ResumeBuilderRequest,
    ResumeBuilderResponse,
)
from app.features.analyzer.service import analyzer_service

router = APIRouter()

@router.post("/analyze", response_model=ResumeAnalysisResponse)
async def analyze_resume(request: ResumeAnalysisRequest):
    try:
        result = await analyzer_service.analyze_resume(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.post("/builder", response_model=ResumeBuilderResponse)
async def build_resume(request: ResumeBuilderRequest):
    try:
        result = await analyzer_service.build_resume(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Resume building failed: {str(e)}")
