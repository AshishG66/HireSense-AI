import json
from app.config import settings
from app.core.gemini import gemini_client
from app.features.analyzer.schemas import (
    ResumeAnalysisRequest,
    ResumeAnalysisResponse,
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

        raw_text = gemini_client.client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config={
                "response_mime_type": "application/json",
                "response_schema": ResumeAnalysisResponse,
                "temperature": 0.1
            }
        ).text

        parsed = json.loads(raw_text)
        
        # Map education, experience, and projects arrays to Pydantic models
        education_list = [EducationItem(**item) for item in parsed.get("education", [])]
        experience_list = [ExperienceItem(**item) for item in parsed.get("experience", [])]
        project_list = [ProjectItem(**item) for item in parsed.get("projects", [])]
        
        skills_data = parsed.get("skills_match", {})
        skills_match_obj = SkillsMatch(
            matched_skills=skills_data.get("matched_skills", []),
            missing_skills=skills_data.get("missing_skills", [])
        )

        return ResumeAnalysisResponse(
            full_name=parsed.get("full_name", ""),
            email=parsed.get("email", ""),
            phone=parsed.get("phone", ""),
            location=parsed.get("location", ""),
            linkedin=parsed.get("linkedin", ""),
            github=parsed.get("github", ""),
            portfolio=parsed.get("portfolio", ""),
            education=education_list,
            experience=experience_list,
            projects=project_list,
            skills=parsed.get("skills", []),
            certifications=parsed.get("certifications", []),
            achievements=parsed.get("achievements", []),
            languages=parsed.get("languages", []),
            match_percentage=float(parsed.get("match_percentage", 75.0)),
            summary=parsed.get("summary", "Resume evaluated successfully."),
            skills_match=skills_match_obj,
            strengths=parsed.get("strengths", []),
            weaknesses=parsed.get("weaknesses", []),
            missing_skills=parsed.get("missing_skills", []),
            missing_keywords=parsed.get("missing_keywords", []),
            suggested_projects=parsed.get("suggested_projects", []),
            recommended_certifications=parsed.get("recommended_certifications", []),
            suggested_summary=parsed.get("suggested_summary", ""),
            interview_prep_tips=parsed.get("interview_prep_tips", []),
            formatting_issues=parsed.get("formatting_issues", []),
            grammar_issues=parsed.get("grammar_issues", [])
        )



analyzer_service = AnalyzerService()

