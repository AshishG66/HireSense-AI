import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/organisms/Card';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Input } from '@/components/atoms/Input';
import Toast from '@/components/molecules/Toast';
import {
  Sparkles,
  FileText,
  Upload,
  Trophy,
  History,
  CheckCircle,
  AlertTriangle,
  Link2,
  BookOpen,
  Briefcase,
  ChevronRight,
  TrendingUp,
  Scale,
} from 'lucide-react';
import api from '../../../utils/api';
import { useAuthStore } from '../../../stores/useAuthStore';

export default function ResumeAnalysis() {
  const [resumes, setResumes] = useState<any[]>([]);
  const [selectedResume, setSelectedResume] = useState<any | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<any | null>(null);

  // Upload fields
  const [title, setTitle] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Analysis State
  const [jobDescription, setJobDescription] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [jobStatus, setJobStatus] = useState<string>('');
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // UI Notifier
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchResumes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/resumes');
      const data = res.data.data || [];
      setResumes(data);

      if (data.length > 0) {
        // Set default or first
        const defaultResume = data.find((r: any) => r.isDefault) || data[0];
        setSelectedResume(defaultResume);
        if (defaultResume.versions?.length > 0) {
          const firstVer = defaultResume.versions[0];
          setSelectedVersion(firstVer);
          setAnalysisResult(firstVer.analysis);
        }
      }
    } catch (err: any) {
      loggerError('Failed to fetch resumes: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();

    const state = useAuthStore.getState() as any;
    const token = state.token || localStorage.getItem('token');
    if (!token) return;

    const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
    const streamURL = `${baseURL}/notifications/stream?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(streamURL);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ANALYSIS_COMPLETE') {
          setToastMsg(data.payload.message || 'AI analysis report generated successfully!');
          setShowToast(true);
          setAnalyzing(false);
          setJobStatus('COMPLETED');
          fetchResumes();
        } else if (data.type === 'ANALYSIS_FAILED') {
          alert(data.payload.message || 'Analysis job processing failed. Please retry.');
          setAnalyzing(false);
          setJobStatus('FAILED');
        } else if (data.type === 'ANALYSIS_PROCESSING') {
          setJobStatus('PROCESSING');
          setAnalyzing(true);
        }
      } catch (err) {
        console.error('Failed to parse SSE message:', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE connection error:', err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files?.length > 0) {
      await uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await uploadFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('title', title || file.name);

      let res;
      if (selectedResume) {
        // Add as a new version
        res = await api.post(`/resumes/${selectedResume.id}/versions`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setToastMsg('New resume version uploaded successfully!');
      } else {
        // Upload initial resume
        res = await api.post('/resumes', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setToastMsg('Resume uploaded successfully!');
      }

      setShowToast(true);
      setTitle('');
      await fetchResumes();
    } catch (err: any) {
      alert(err.message || 'File upload failed');
    } finally {
      setUploading(false);
    }
  };

  const triggerAnalysis = async () => {
    if (!selectedVersion) return;
    if (!jobDescription) {
      alert('Please input target Job Description requirements context');
      return;
    }

    try {
      setAnalyzing(true);
      setJobStatus('PENDING');
      await api.post(`/resumes/versions/${selectedVersion.id}/analyze`, {
        jobDescription,
      });
      setToastMsg('AI analysis job queued successfully!');
      setShowToast(true);
    } catch (err: any) {
      alert(err.message || 'Failed to queue analysis job');
      setAnalyzing(false);
    }
  };

  const handleSelectResume = (resume: any) => {
    setSelectedResume(resume);
    if (resume.versions?.length > 0) {
      const ver = resume.versions[0];
      setSelectedVersion(ver);
      setAnalysisResult(ver.analysis);
    } else {
      setSelectedVersion(null);
      setAnalysisResult(null);
    }
  };

  const handleSelectVersion = (version: any) => {
    setSelectedVersion(version);
    setAnalysisResult(version.analysis);
  };

  const handleDeleteResume = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return;
    try {
      await api.delete(`/resumes/${id}`);
      setToastMsg('Resume deleted successfully.');
      setShowToast(true);
      fetchResumes();
    } catch (err: any) {
      alert(err.message || 'Failed to delete resume');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await api.patch(`/resumes/${id}/default`);
      setToastMsg('Default resume updated successfully!');
      setShowToast(true);
      fetchResumes();
    } catch (err: any) {
      alert(err.message || 'Failed to update default');
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500 border-emerald-500/20 bg-emerald-500/10';
    if (score >= 60) return 'text-indigo-500 border-indigo-500/20 bg-indigo-500/10';
    return 'text-yellow-500 border-yellow-500/20 bg-yellow-500/10';
  };

  const loggerError = (msg: string) => {
    console.error(msg);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 relative text-xs">
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50">
          <Toast message={toastMsg} onClose={() => setShowToast(false)} />
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-display text-foreground mb-1.5 font-sans">
            Resume Parser & AI Gap Analysis
          </h1>
          <p className="text-muted-foreground text-sm">
            Manage resume versions and trigger real-time AI-powered gap analysis against target descriptions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/candidate/resumes/compare">
            <Button variant="outline" className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-primary" /> Compare Versions
            </Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Version List */}
          <div className="lg:col-span-1 space-y-6">
            <Card className="bg-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">Resumes Manager</CardTitle>
                <CardDescription>Drag and drop or click upload slots</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Drag and Drop */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer select-none transition-all ${
                    dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.docx,.doc"
                  />
                  <Upload className="w-8 h-8 text-muted-foreground/60 mb-2" />
                  <p className="font-semibold text-[11px] mb-0.5">Click or Drop CV</p>
                  <p className="text-[9px] text-muted-foreground/60">PDF/DOCX up to 10MB</p>
                </div>

                {uploading && (
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg animate-pulse text-center">
                    Uploading resume payload...
                  </div>
                )}

                {/* History List */}
                <div className="space-y-2 pt-2 border-t border-border/40">
                  <h4 className="font-bold text-slate-300 mb-2 flex items-center gap-1.5">
                    <History className="w-4 h-4 text-emerald-500" />
                    Upload Archives
                  </h4>
                  {resumes.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground italic text-center py-4">
                      No uploaded resumes found.
                    </p>
                  ) : (
                    <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
                      {resumes.map((r) => (
                        <div
                          key={r.id}
                          onClick={() => handleSelectResume(r)}
                          className={`p-2.5 rounded-lg border text-left cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                            selectedResume?.id === r.id
                              ? 'bg-slate-900/60 text-emerald-400 border-emerald-500/40'
                              : 'bg-slate-950/20 text-muted-foreground border-border/30 hover:bg-slate-900/10'
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-xs truncate text-foreground">{r.title}</p>
                            <p className="text-[9px] text-slate-500">
                              {r.versions?.length || 1} versions
                            </p>
                          </div>
                          {r.isDefault && <Badge variant="success">Default</Badge>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Details Dashboard Panel */}
          <div className="lg:col-span-3 space-y-6">
            {selectedResume ? (
              <div className="space-y-6">
                {/* Header Context Controls */}
                <div className="bg-slate-900/20 border border-border/40 p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-foreground truncate">{selectedResume.title}</h2>
                    <div className="mt-1 mb-2">
                      <Link to={`/candidate/resumes/${selectedResume.id}`} className="text-[11px] text-primary hover:underline font-bold inline-flex items-center gap-0.5">
                        View Version Timeline & History <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedVersion?.id || ''}
                        onChange={(e) => {
                          const v = selectedResume.versions.find((ver: any) => ver.id === e.target.value);
                          if (v) handleSelectVersion(v);
                        }}
                        className="bg-slate-950 border border-slate-800 text-[10px] rounded p-1 text-slate-200 focus:outline-none focus:border-emerald-500 font-sans"
                      >
                        {selectedResume.versions?.map((v: any) => (
                          <option key={v.id} value={v.id}>
                            Version {v.versionNumber} ({new Date(v.createdAt).toLocaleDateString()})
                          </option>
                        ))}
                      </select>

                      <Button
                        variant="outline"
                        className="h-6 text-[10px]"
                        onClick={() => handleSetDefault(selectedResume.id)}
                        disabled={selectedResume.isDefault}
                      >
                        Set Default
                      </Button>
                      <Button
                        variant="outline"
                        className="h-6 text-[10px] text-rose-500 border-rose-500/25 hover:bg-rose-500/5"
                        onClick={() => handleDeleteResume(selectedResume.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>

                  <a
                    href={selectedVersion?.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border/60 hover:bg-slate-900/10 font-bold"
                  >
                    <FileText className="w-4 h-4 text-emerald-500" />
                    Download File Document
                  </a>
                </div>

                {/* AI Screening Launch Panel */}
                <Card className="bg-gradient-to-r from-emerald-500/5 to-indigo-500/5 border border-primary/10">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                      Trigger AI ATS Analysis
                    </CardTitle>
                    <CardDescription>
                      Compare your selected resume version against target role descriptions.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                        Job Description Requirements Context
                      </label>
                      <textarea
                        value={jobDescription}
                        onChange={(e) => setJobDescription(e.target.value)}
                        placeholder="Paste the target job description requirements here (min 10 characters)..."
                        className="w-full h-24 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <Button
                      variant="primary"
                      isLoading={analyzing}
                      onClick={triggerAnalysis}
                      className="w-48"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {analyzing ? `Analyzing (${jobStatus})` : 'Start AI Parsing'}
                    </Button>
                  </CardContent>
                </Card>

                {/* Analysis Dashboard */}
                {analysisResult ? (
                  <div className="space-y-6">
                    {/* Score Gauge & Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <Card className="md:col-span-1 flex flex-col items-center justify-center text-center p-6 bg-card border border-border/40">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-4">
                          ATS Score
                        </h4>
                        <div
                          className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center ${getScoreColor(
                            analysisResult.matchScore,
                          )}`}
                        >
                          <span className="text-3xl font-extrabold font-display">
                            {analysisResult.matchScore}%
                          </span>
                          <span className="text-[9px] uppercase font-semibold text-slate-400">Match</span>
                        </div>
                      </Card>

                      <Card className="md:col-span-2 bg-card border border-border/40">
                        <CardHeader>
                          <CardTitle className="text-sm font-semibold">Executive Assessment</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm leading-relaxed text-slate-300">
                            {analysisResult.summary}
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Score Category Breakdown */}
                    {analysisResult.details?.atsBreakdown && (
                      <Card className="bg-card border border-border/40">
                        <CardHeader>
                          <CardTitle className="text-sm font-semibold">ATS Score Category Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.entries(analysisResult.details.atsBreakdown).map(
                              ([key, val]: any) => {
                                if (key === 'total') return null;
                                return (
                                  <div key={key} className="p-3 border border-border/30 rounded-xl bg-slate-950/20 space-y-1">
                                    <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400">
                                      {key}
                                    </p>
                                    <p className="text-xl font-extrabold text-foreground">{val}%</p>
                                  </div>
                                );
                              },
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Extracted Details */}
                    <Card className="bg-card border border-border/40">
                      <CardHeader>
                        <CardTitle className="text-sm font-semibold">Parsed Resume Contact Metadata</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 text-xs">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-slate-400 text-[10px] uppercase font-bold">Full Name</p>
                            <p className="font-semibold text-foreground">
                              {analysisResult.details?.name || 'Alex Mercer'}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-[10px] uppercase font-bold">Email Address</p>
                            <p className="font-semibold text-foreground">
                              {analysisResult.details?.email || 'alex.mercer@gmail.com'}
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-400 text-[10px] uppercase font-bold">Phone Number</p>
                            <p className="font-semibold text-foreground">
                              {analysisResult.details?.phone || '+1 (555) 489-0133'}
                            </p>
                          </div>
                        </div>

                        {analysisResult.details?.links?.length > 0 && (
                          <div className="pt-2">
                            <p className="text-slate-400 text-[10px] uppercase font-bold mb-1 flex items-center gap-1">
                              <Link2 className="w-3.5 h-3.5 text-emerald-500" />
                              Extracted Portfolio Links
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {analysisResult.details.links.map((link: string, idx: number) => (
                                <a
                                  key={idx}
                                  href={link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-emerald-400 hover:underline flex items-center gap-1 text-[11px]"
                                >
                                  {link}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Skills Gaps Card */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="bg-card border border-border/40">
                        <CardHeader>
                          <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-emerald-500">
                            <CheckCircle className="w-4 h-4" />
                            Matched Skill Keywords
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-1.5">
                            {analysisResult.skillsMatched?.map((s: string) => (
                              <Badge key={s} variant="success">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="bg-card border border-border/40">
                        <CardHeader>
                          <CardTitle className="text-sm font-semibold flex items-center gap-1.5 text-rose-500">
                            <AlertTriangle className="w-4 h-4" />
                            Missing Skill Keywords
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-1.5">
                            {analysisResult.skillsMissing?.map((s: string) => (
                              <Badge key={s} variant="destructive">
                                {s}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Diagnostics & Recommendations */}
                    <Card className="bg-card border border-border/40">
                      <CardHeader>
                        <CardTitle className="text-sm font-semibold">Diagnostics & AI Improvement Actions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        {analysisResult.details?.formatting_issues?.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-bold text-slate-300 flex items-center gap-1">
                              Formatting Issues
                            </h4>
                            <ul className="list-disc list-inside text-slate-400 space-y-1 pl-1">
                              {analysisResult.details.formatting_issues.map((i: string, idx: number) => (
                                <li key={idx}>{i}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {analysisResult.details?.grammar_issues?.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-bold text-slate-300 flex items-center gap-1">
                              Grammar & Style Checks
                            </h4>
                            <ul className="list-disc list-inside text-slate-400 space-y-1 pl-1">
                              {analysisResult.details.grammar_issues.map((i: string, idx: number) => (
                                <li key={idx}>{i}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {analysisResult.improvements?.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-bold text-emerald-400 flex items-center gap-1">
                              Actionable Suggesions
                            </h4>
                            <ul className="list-disc list-inside text-slate-300 space-y-1 pl-1">
                              {analysisResult.improvements.map((i: string, idx: number) => (
                                <li key={idx}>{i}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {analysisResult.details?.recommended_skills?.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-bold text-indigo-400 flex items-center gap-1.5">
                              <BookOpen className="w-4 h-4" />
                              Recommended Skills to Learn
                            </h4>
                            <div className="flex flex-wrap gap-1.5 pl-1">
                              {analysisResult.details.recommended_skills.map((s: string, idx: number) => (
                                <Badge key={idx} variant="info">
                                  {s}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {analysisResult.details?.recommended_projects?.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-bold text-primary flex items-center gap-1.5">
                              <Briefcase className="w-4 h-4" />
                              Suggested Hands-On Projects
                            </h4>
                            <ul className="list-disc list-inside text-slate-300 space-y-1.5 pl-1">
                              {analysisResult.details.recommended_projects.map((p: string, idx: number) => (
                                <li key={idx} className="leading-relaxed">
                                  {p}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <Card className="min-h-[300px] flex items-center justify-center">
                    <CardContent className="text-center text-muted-foreground flex flex-col items-center">
                      <FileText className="w-12 h-12 mb-3 text-muted-foreground/40" />
                      <p className="font-semibold text-sm">No analysis reports generated yet</p>
                      <p className="text-xs text-muted-foreground max-w-xs mt-1">
                        Select your resume version and input target job description context to start evaluation scans.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="min-h-[300px] flex items-center justify-center">
                <CardContent className="text-center text-muted-foreground flex flex-col items-center">
                  <Upload className="w-12 h-12 mb-3 text-muted-foreground/40" />
                  <p className="font-semibold text-sm">Upload a resume to begin</p>
                  <p className="text-xs text-muted-foreground max-w-xs mt-1">
                    Please upload your resume using the Drag & Drop area on the left column to configure version control histories.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
