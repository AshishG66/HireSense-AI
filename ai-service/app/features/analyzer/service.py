import json
from app.config import settings
from app.core.gemini import gemini_client
from app.features.analyzer.schemas import (
    ResumeAnalysisRequest,
    ResumeAnalysisResponse,
    ResumeBuilderRequest,
    ResumeBuilderResponse,
    SkillsMatch,
    EducationItem,
    ExperienceItem,
    ProjectItem,
)

class AnalyzerService:
    async def analyze_resume(self, data: ResumeAnalysisRequest) -> ResumeAnalysisResponse:
        """
        Submits parsed resume information and job descriptions to Gemini models
        and parses returns into validated schemas.
        """

        prompt = f"""
        You are an expert AI Resume Screener and Technical Recruiter. Analyze the candidate's resume text against the provided job description.
        
        Job Description:
        {data.job_description}

        Candidate Resume:
        {data.resume_text}

        Perform the following operations:
        1. Extract candidate contact info: full name, email, phone, location.
        2. Find links: LinkedIn, GitHub, portfolio.
        3. Parse academic timeline (education), professional timeline (experience), and projects.
        4. List all extracted skills (plain array).
        5. Extract achievements, certificates, and languages.
        6. Compute the matching score (0-100), summary fit, matched skills, and missing skills.
        7. Provide recommendations: strengths, weaknesses, missing skills, missing keywords, suggested projects, recommended certifications, suggested summary, and interview preparation tips.
        8. Detect formatting anomalies and grammar issues.

        Provide the output in structured JSON matching the expected schema.
        """

        result = await gemini_client.generate_structured(
            prompt=prompt,
            response_schema=ResumeAnalysisResponse,
            temperature=0.1
        )
        return result

    async def build_resume(self, data: ResumeBuilderRequest) -> ResumeBuilderResponse:
        """
        Structures and optimizes candidate raw details into a professional resume summary, experience bullets, and skills.
        """
        prompt = f"""
        You are an expert Resume Writer and Technical Recruiter. Refine and structure the candidate's raw profile details into a professional resume format optimized for their target role.
        
        Target Role / Job Title:
        {data.target_role or "Software Engineer"}
        
        Raw Profile Data:
        {data.raw_profile_data}
        
        Refine the professional summary, rewrite the experience bullets to use strong action verbs and quantified achievements where possible, format education, and optimize the skills list.
        
        Provide the output in structured JSON matching the expected schema.
        """
        result = await gemini_client.generate_structured(
            prompt=prompt,
            response_schema=ResumeBuilderResponse,
            temperature=0.3
        )
        return result


analyzer_service = AnalyzerService()

