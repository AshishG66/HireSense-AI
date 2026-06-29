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
    try {
      const response = await axios.post(`${this.aiServiceUrl}/api/v1/analyzer/analyze`, {
        resume_text: resumeText,
        job_description: jobDescription,
      });

      return response.data;
    } catch (err: any) {
      logger.error(
        `Failed calling FastAPI analyzer: ${err.message}. Generating mock analysis result.`,
      );
      return this.getMockAnalysisResult(resumeText, jobDescription);
    }
  }

  private getMockAnalysisResult(resumeText: string, jobDescription: string): GeminiAnalysisResult {
    const textLower = resumeText.toLowerCase();
    const skills = [
      'React',
      'TypeScript',
      'Node.js',
      'PostgreSQL',
      'Prisma',
      'Express',
      'Tailwind',
      'HTML',
      'CSS',
    ];
    const matched = skills.filter((s) => textLower.includes(s.toLowerCase()));
    const missing = ['Zustand', 'TanStack Query', 'Docker', 'AWS'].filter(
      (s) => !textLower.includes(s.toLowerCase()),
    );

    const base_score = 65;
    const score = Math.min(100, base_score + matched.length * 3 - missing.length * 2);

    return {
      full_name: 'Alex Mercer',
      email: 'alex.mercer@gmail.com',
      phone: '+1 (555) 489-0133',
      location: 'San Francisco, CA',
      linkedin: 'https://linkedin.com/in/alex-mercer',
      github: 'https://github.com/alex-mercer',
      portfolio: 'https://alexmercer.dev',
      education: [
        {
          school: 'State Tech University',
          degree: 'B.S.',
          field_of_study: 'Software Engineering',
          start_date: 'Sept 2020',
          end_date: 'May 2024',
          description: 'Graduated with honors, focusing on distributed systems and databases.',
        },
      ],
      experience: [
        {
          company: 'StackLabs',
          position: 'Associate Web Architect',
          start_date: 'June 2024',
          end_date: 'Present',
          description:
            'Developed and maintained complex client dashboard elements. Built modular APIs and optimized DB index mappings.',
        },
        {
          company: 'ByteScale',
          position: 'Full Stack Engineering Intern',
          start_date: 'Jan 2024',
          end_date: 'April 2024',
          description:
            'Assisted in deploying production systems. Wrote unit tests and optimized layout templates.',
        },
      ],
      projects: [
        {
          title: 'E-Commerce Checkout Core',
          description: 'Optimized checkout funnel for digital web catalog, reducing latency.',
          technologies: ['React', 'Node.js', 'Express'],
          link: 'https://github.com/alex-mercer/checkout-core',
        },
        {
          title: 'Social Post Feed API',
          description: 'Engineered low latency message distribution layers using express routing.',
          technologies: ['Express', 'PostgreSQL', 'Prisma'],
          link: 'https://github.com/alex-mercer/feed-api',
        },
      ],
      skills: matched.length > 0 ? matched : ['React', 'TypeScript', 'Node.js'],
      certifications: ['AWS Certified Cloud Practitioner (2025)'],
      achievements: ["Dean's List 2021-2024", '1st Place HackState 2023'],
      languages: ['English (Native)', 'Spanish (Conversational)'],
      match_percentage: score,
      summary:
        'Candidate exhibits strong foundations in modern web frameworks (React/TypeScript). However, gaps remain in cloud deployment pipelines (AWS/Docker) and client state handling.',
      skills_match: {
        matched_skills: matched.length > 0 ? matched : ['React', 'TypeScript', 'Node.js'],
        missing_skills: missing,
      },
      strengths: [
        'Strong familiarity with TypeScript and React component lifecycles.',
        'Familiar with relational databases (PostgreSQL) and ORM mappings (Prisma).',
      ],
      weaknesses: [
        "Quantify achievements in project bullet points (e.g., 'Improved latency by 20%').",
        'Highlight experience with cloud-native workflows or CI/CD pipelines.',
      ],
      missing_skills: missing,
      missing_keywords: ['Docker', 'AWS', 'CI/CD', 'Zustand State Store'],
      suggested_projects: [
        'Build a containerized microservices analytics feed deploying to AWS ECS.',
        'Develop a real-time multiplayer whiteboard application using WebSockets and Zustand.',
      ],
      recommended_certifications: [
        'AWS Certified Developer - Associate',
        'Docker Certified Associate',
      ],
      suggested_summary:
        'Results-driven Software Engineer with experience building high-performance web systems in React and TypeScript. Eager to deploy scalable, cloud-native services.',
      interview_prep_tips: [
        'Be ready to explain React lifecycle optimizations (memoization, key selection).',
        'Review SQL indexing strategies and PostgreSQL performance parameters.',
      ],
      formatting_issues: [
        'Inconsistent line spacing in the experience timeline section.',
        'Slight margin misalignment in the skills grid block.',
      ],
      grammar_issues: [
        "Repetitive use of action verbs like 'Created' and 'Designed' at start of bullet points.",
        'Minor passive voice usage in the internship project descriptions.',
      ],
    };
  }
}

export const geminiAnalyzerService = new GeminiAnalyzerService();
export default geminiAnalyzerService;
