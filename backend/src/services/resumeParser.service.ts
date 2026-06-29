export interface ParsedResumeInfo {
  name?: string;
  email?: string;
  phone?: string;
  links: string[];
}

export class ResumeParserService {
  parseResume(text: string): ParsedResumeInfo {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
    const phoneRegex = /(\+?\d{1,4}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    const urlRegex = /https?:\/\/[^\s/$.?#].[^\s]*/g;

    const emailMatch = text.match(emailRegex);
    const phoneMatch = text.match(phoneRegex);
    const urls = text.match(urlRegex) || [];

    const lines = text
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 2);
    let name = 'Candidate Name';
    if (lines.length > 0) {
      const candidateName = lines[0];
      if (
        candidateName.length < 50 &&
        !candidateName.includes('@') &&
        !candidateName.includes('http')
      ) {
        name = candidateName;
      }
    }

    return {
      name,
      email: emailMatch ? emailMatch[0] : undefined,
      phone: phoneMatch ? phoneMatch[0] : undefined,
      links: Array.from(new Set(urls)),
    };
  }
}

export const resumeParserService = new ResumeParserService();
export default resumeParserService;
