import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/organisms/Card';
import { Button } from '@/components/atoms/Button';
import { Input } from '@/components/atoms/Input';
import Toast from '@/components/molecules/Toast';
import {
  Sparkles,
  FileText,
  User,
  Briefcase,
  GraduationCap,
  Wrench,
  Copy,
  Check,
  RefreshCw,
} from 'lucide-react';
import api from '../../../utils/api';

export default function ResumeBuilder() {
  const [rawProfileData, setRawProfileData] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Toast notifications
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawProfileData.trim()) {
      triggerToast('Please provide your raw profile data to analyze and polish.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.post('/resumes/build', {
        rawProfileData,
        targetRole: targetRole || undefined,
      });
      setResult(res.data.data);
      triggerToast('Resume content generated successfully!');
    } catch (err: any) {
      triggerToast(
        'Generation failed: ' + (err.response?.data?.message || err.message)
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCopyText = (text: string, sectionName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionName);
    triggerToast(`${sectionName} copied to clipboard!`);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleCopyAll = () => {
    if (!result) return;
    const formattedText = `
${result.suggested_summary}

EXPERIENCE:
${result.formatted_experience
  .map(
    (exp: any) =>
      `- ${exp.position} at ${exp.company} (${exp.start_date} - ${exp.end_date})\n  ${exp.description}`
  )
  .join('\n\n')}

EDUCATION:
${result.formatted_education
  .map(
    (edu: any) =>
      `- ${edu.degree} in ${edu.field_of_study} from ${edu.school} (${edu.start_date} - ${edu.end_date})`
  )
  .join('\n')}

SKILLS:
${result.suggested_skills.join(', ')}
    `.trim();

    handleCopyText(formattedText, 'Full Resume Markdown');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-xs">
      {showToast && <Toast message={toastMsg} onClose={() => setShowToast(false)} />}

      <div>
        <h1 className="text-3xl font-extrabold font-display text-foreground mb-1.5 flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-primary animate-pulse" /> AI Resume Builder
        </h1>
        <p className="text-muted-foreground text-sm">
          Optimize, format, and polish your raw qualifications and project details into a premium, job-tailored resume draft.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-border/40 bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" /> Input Profile Information
              </CardTitle>
              <CardDescription>
                Provide raw text representing your work timeline, skills, and target job description.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerate} className="space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Target Job Title
                  </label>
                  <Input
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Senior Frontend Engineer"
                    disabled={loading}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Raw Profile Data
                  </label>
                  <textarea
                    className="w-full h-80 bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-primary disabled:opacity-50"
                    placeholder="Paste your raw, unformatted resume notes, bullet points, skills list, and education details here..."
                    value={rawProfileData}
                    onChange={(e) => setRawProfileData(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-full flex items-center justify-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" /> Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" /> Optimize & Polish Profile
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: AI Output preview */}
        <div className="lg:col-span-3">
          {loading ? (
            <Card className="min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-card border border-border/40">
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse"></div>
                <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin"></div>
              </div>
              <p className="font-semibold text-sm text-foreground">Polishing your qualifications...</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                Gemini is formatting experiences, improving bullet action verbs, and grouping specialized developer skills.
              </p>
            </Card>
          ) : !result ? (
            <Card className="min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-slate-950/40 border border-border/20 border-dashed">
              <Sparkles className="w-12 h-12 text-slate-600/30 mb-3" />
              <p className="font-semibold text-sm text-slate-400">Preview Draft</p>
              <p className="text-xs text-slate-500 max-w-xs mt-1">
                Fill in the profile details on the left, click optimize, and watch your polished resume structure appear here.
              </p>
            </Card>
          ) : (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom duration-300">
              <div className="flex justify-between items-center bg-slate-950/80 border border-border/30 rounded-xl p-4">
                <div>
                  <h3 className="font-bold text-sm text-foreground">Resume Draft Ready</h3>
                  <p className="text-slate-400 text-[10px] mt-0.5">Optimized for: {targetRole || 'Software Engineer'}</p>
                </div>
                <Button variant="outline" className="gap-1.5" onClick={handleCopyAll}>
                  {copiedSection === 'Full Resume Markdown' ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  Copy Full Text
                </Button>
              </div>

              {/* Summary Section */}
              <Card>
                <CardHeader className="flex flex-row justify-between items-center pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" /> Professional Summary
                  </CardTitle>
                  <Button
                    variant="outline"
                    className="p-1.5 h-auto text-[10px]"
                    onClick={() => handleCopyText(result.suggested_summary, 'Summary')}
                  >
                    Copy
                  </Button>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300 leading-relaxed text-xs">
                    {result.suggested_summary}
                  </p>
                </CardContent>
              </Card>

              {/* Experience Section */}
              <Card>
                <CardHeader className="flex flex-row justify-between items-center pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-primary" /> Work Experience
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.formatted_experience.map((exp: any, index: number) => (
                    <div key={index} className="border-l-2 border-primary/20 pl-4 py-1.5 relative space-y-1">
                      <div className="absolute w-2 h-2 rounded-full bg-primary -left-[5px] top-[14px]"></div>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-foreground text-xs">{exp.position}</p>
                          <p className="text-slate-400 text-[10px]">{exp.company}</p>
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">{exp.start_date} - {exp.end_date}</span>
                      </div>
                      <p className="text-slate-300 text-xs leading-relaxed mt-2 whitespace-pre-line">
                        {exp.description}
                      </p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Education Section */}
              <Card>
                <CardHeader className="flex flex-row justify-between items-center pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-primary" /> Education
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.formatted_education.map((edu: any, index: number) => (
                    <div key={index} className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-foreground text-xs">{edu.degree} in {edu.field_of_study}</p>
                        <p className="text-slate-400 text-[10px]">{edu.school}</p>
                        {edu.description && <p className="text-slate-500 text-[10px] mt-1">{edu.description}</p>}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">{edu.start_date} - {edu.end_date}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Skills Section */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-primary" /> Suggested Skills
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {result.suggested_skills.map((skill: string, index: number) => (
                      <span
                        key={index}
                        className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white transition-colors text-[10px]"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
