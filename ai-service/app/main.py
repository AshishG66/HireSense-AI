from fastapi import FastAPI, Request
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

incoming_requests_log = []

@app.middleware("http")
async def log_requests(request: Request, call_next):
    path = request.url.path
    method = request.method
    incoming_requests_log.append(f"{method} {path}")
    if len(incoming_requests_log) > 100:
        incoming_requests_log.pop(0)
    return await call_next(request)

@app.get("/debug-logs")
async def get_debug_logs():
    return {"logs": incoming_requests_log}

# Route mount
app.include_router(analyzer_router, prefix="/api/v1/analyzer", tags=["Resume Analyzer"])
app.include_router(interview_router)
app.include_router(assessment_router)

# Health checks
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "ai-service"}
