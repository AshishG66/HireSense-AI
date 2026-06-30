import axios from 'axios';
import logger from '../lib/logger';

export interface EducationItem {
  school: string;
  degree: string;
  field_of_study: string;
  start_date: string;
  end_date: string;
  description: string;
}

export interface ExperienceItem {
  company: string;
  position: string;
  start_date: string;
  end_date: string;
  description: string;
}

export interface ProjectItem {
  title: string;
  description: string;
  technologies: string[];
  link: string;
}

export interface GeminiAnalysisResult {
  full_name: string;
  email: string;
  phone: string;
  location: string;
  linkedin: string;
  github: string;
  portfolio: string;
  education: EducationItem[];
  experience: ExperienceItem[];
  projects: ProjectItem[];
  skills: string[];
  certifications: string[];
  achievements: string[];
  languages: string[];
  match_percentage: number;
  summary: string;
  skills_match: {
    matched_skills: string[];
    missing_skills: string[];
  };
  strengths: string[];
  weaknesses: string[];
  missing_skills: string[];
  missing_keywords: string[];
  suggested_projects: string[];
  recommended_certifications: string[];
  suggested_summary: string;
  interview_prep_tips: string[];
  formatting_issues: string[];
  grammar_issues: string[];
}

export class GeminiAnalyzerService {
  private aiServiceUrl: string;

  constructor() {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
  }

  async analyze(resumeText: string, jobDescription: string): Promise<GeminiAnalysisResult> {
    const response = await axios.post(`${this.aiServiceUrl}/api/v1/analyzer/analyze`, {
      resume_text: resumeText,
      job_description: jobDescription,
    });

    return response.data;
  }
}

export const geminiAnalyzerService = new GeminiAnalyzerService();
export default geminiAnalyzerService;
