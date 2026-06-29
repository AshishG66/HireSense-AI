import { GeminiAnalysisResult } from './geminiAnalyzer.service';

export interface AtsBreakdown {
  formatting: number;
  keywords: number;
  experience: number;
  projects: number;
  skills: number;
  education: number;
  grammar: number;
  completeness: number;
  total: number;
}

export class AtsScorerService {
  calculateScore(analysis: GeminiAnalysisResult): AtsBreakdown {
    // 1. Formatting
    const formatting = Math.max(30, 100 - (analysis.formatting_issues?.length || 0) * 15);

    // 2. Grammar
    const grammar = Math.max(30, 100 - (analysis.grammar_issues?.length || 0) * 15);

    // 3. Keywords
    const matchedCount = analysis.skills_match?.matched_skills?.length || 0;
    const missingCount = analysis.skills_match?.missing_skills?.length || 0;
    const totalKeywords = matchedCount + missingCount;
    const keywords = totalKeywords > 0 ? Math.round((matchedCount / totalKeywords) * 100) : 75;

    // 4. Experience
    const experience = Math.min(100, 40 + (analysis.experience?.length || 0) * 20);

    // 5. Projects
    const projects = Math.min(100, 40 + (analysis.projects?.length || 0) * 20);

    // 6. Skills
    const skills = Math.min(100, 50 + (analysis.skills?.length || 0) * 5);

    // 7. Education
    const education = Math.min(100, 50 + (analysis.education?.length || 0) * 25);

    // 8. Completeness
    let completenessScore = 20;
    if (analysis.full_name && analysis.full_name !== 'Candidate Name') completenessScore += 15;
    if (analysis.email) completenessScore += 15;
    if (analysis.phone) completenessScore += 15;
    if (analysis.location && analysis.location !== 'Unknown') completenessScore += 10;
    if (analysis.linkedin || analysis.github || analysis.portfolio) completenessScore += 15;
    if (analysis.summary) completenessScore += 10;
    const completeness = Math.min(100, completenessScore);

    // 9. Weighted Composite Score
    const total = Math.round(
      keywords * 0.2 +
        skills * 0.2 +
        experience * 0.15 +
        projects * 0.15 +
        completeness * 0.1 +
        education * 0.1 +
        formatting * 0.05 +
        grammar * 0.05,
    );

    return {
      formatting,
      keywords,
      experience,
      projects,
      skills,
      education,
      grammar,
      completeness,
      total,
    };
  }
}

export const atsScorerService = new AtsScorerService();
export default atsScorerService;
