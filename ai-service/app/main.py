from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.features.analyzer.router import router as analyzer_router
from app.features.interview.router import router as interview_router
from app.features.assessment.router import router as assessment_router

app = FastAPI(
    title="HireSense AI Service",
    description="FastAPI text parsing and interview audio analysis backend using Google Gemini.",
    version="1.0.0"
)

# CORS configurations
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict this to trusted origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Route mount
app.include_router(analyzer_router, prefix="/api/v1/analyzer", tags=["Resume Analyzer"])
app.include_router(interview_router)
app.include_router(assessment_router)

# Health checks
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "ai-service"}
