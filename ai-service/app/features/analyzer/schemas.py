from pydantic import BaseModel, Field
from typing import List, Optional

class ResumeAnalysisRequest(BaseModel):
    resume_text: str = Field(..., description="Raw text content parsed from candidate's resume")
    job_description: str = Field(..., description="Job role profile requirements context")

class SkillsMatch(BaseModel):
    matched_skills: List[str] = Field(default_factory=list, description="List of skills found in resume matching job description")
    missing_skills: List[str] = Field(default_factory=list, description="List of skills mentioned in job description but missing in resume")

class EducationItem(BaseModel):
    school: str = Field(default="", description="School or university name")
    degree: str = Field(default="", description="Degree obtained (e.g. B.S., M.S.)")
    field_of_study: str = Field(default="", description="Major or field of study")
    start_date: str = Field(default="", description="Start date (e.g. Sept 2020)")
    end_date: str = Field(default="", description="End date or 'Present'")
    description: str = Field(default="", description="Relevant courses or accomplishments")

class ExperienceItem(BaseModel):
    company: str = Field(default="", description="Company or employer name")
    position: str = Field(default="", description="Job title or position")
    start_date: str = Field(default="", description="Start date")
    end_date: str = Field(default="", description="End date or 'Present'")
    description: str = Field(default="", description="Bulleted achievements and responsibilities")

class ProjectItem(BaseModel):
    title: str = Field(default="", description="Project title")
    description: str = Field(default="", description="Short project overview")
    technologies: List[str] = Field(default_factory=list, description="Tech stack list used")
    link: str = Field(default="", description="Hyperlink to repository or live deploy")

class ResumeAnalysisResponse(BaseModel):
    # Candidate Personal Info
    full_name: str = Field(default="", description="Candidate's full name")
    email: str = Field(default="", description="Candidate's contact email")
    phone: str = Field(default="", description="Candidate's contact phone number")
    location: str = Field(default="", description="Candidate's location (city, state/country)")
    
    # Links
    linkedin: str = Field(default="", description="LinkedIn profile URL")
    github: str = Field(default="", description="GitHub profile URL")
    portfolio: str = Field(default="", description="Portfolio or personal website URL")
    
    # Detailed sections
    education: List[EducationItem] = Field(default_factory=list, description="Academic records extracted")
    experience: List[ExperienceItem] = Field(default_factory=list, description="Work timeline items extracted")
    projects: List[ProjectItem] = Field(default_factory=list, description="Project details extracted")
    skills: List[str] = Field(default_factory=list, description="Plain text list of all extracted skills")
    certifications: List[str] = Field(default_factory=list, description="Certifications and licenses list")
    achievements: List[str] = Field(default_factory=list, description="Key awards or notable achievements")
    languages: List[str] = Field(default_factory=list, description="Languages spoken by candidate")

    # Match analysis metadata (for comparison and scoring)
    match_percentage: float = Field(..., description="Match percentage score between resume and job description", ge=0, le=100)
    summary: str = Field(..., description="Synthesized executive summary of candidate fit")
    skills_match: SkillsMatch = Field(..., description="Details of matched and missing skills relative to the job description")

    # Recommendations
    strengths: List[str] = Field(default_factory=list, description="List of core candidate strengths")
    weaknesses: List[str] = Field(default_factory=list, description="List of candidate weaknesses or development areas")
    missing_skills: List[str] = Field(default_factory=list, description="Specific missing skills matching job requirements")
    missing_keywords: List[str] = Field(default_factory=list, description="High priority missing keywords that should be added to the resume")
    suggested_projects: List[str] = Field(default_factory=list, description="Hands-on project recommendations to fill skill gaps")
    recommended_certifications: List[str] = Field(default_factory=list, description="Recommended certifications to build credibility")
    suggested_summary: str = Field(default="", description="A suggested professional resume summary tailor-fit for the role")
    interview_prep_tips: List[str] = Field(default_factory=list, description="Specific interview prep tips for the candidate")

    # ATS Diagnostics
    formatting_issues: List[str] = Field(default_factory=list, description="Formatting issues found (e.g. complex layouts, columns, margins)")
    grammar_issues: List[str] = Field(default_factory=list, description="Grammar and spelling issues detected")

