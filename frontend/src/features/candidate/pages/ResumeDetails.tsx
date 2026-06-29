import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  FileText,
  Plus,
  Trash2,
  CheckCircle2,
  ChevronRight,
  Play,
  RefreshCw,
  UploadCloud,
  FileDown,
} from 'lucide-react';
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
import Skeleton from '@/components/atoms/Skeleton';
import Toast from '@/components/molecules/Toast';
import api from '../../../utils/api';

export default function ResumeDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resume, setResume] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [renaming, setRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [uploadingVer, setUploadingVer] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState('');

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
  };

  const fetchResumeDetails = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/resumes/${id}`);
      setResume(res.data.data);
      setNewTitle(res.data.data.title);
    } catch (err: any) {
      triggerToast('Failed to load resume details: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchResumeDetails();
  }, [id]);

  const handleRename = async () => {
    if (!newTitle.trim()) return;
    try {
      setRenaming(true);
      await api.patch(`/resumes/${id}`, { title: newTitle });
      triggerToast('Resume renamed successfully');
      fetchResumeDetails();
    } catch (err: any) {
      triggerToast('Rename failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setRenaming(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this entire resume? All versions will be archived.')) return;
    try {
      await api.delete(`/resumes/${id}`);
      navigate('/');
    } catch (err: any) {
      triggerToast('Delete failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleSetDefault = async () => {
    try {
      await api.patch(`/resumes/${id}/default`);
      triggerToast('Set as default resume successfully');
      fetchResumeDetails();
    } catch (err: any) {
      triggerToast('Set default failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleVersionUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('resume', selectedFile);
    if (jobDescription.trim()) {
      formData.append('jobDescription', jobDescription);
    }

    try {
      setUploadingVer(true);
      await api.post(`/resumes/${id}/versions`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      triggerToast('New version uploaded and queued for analysis!');
      setSelectedFile(null);
      setJobDescription('');
      fetchResumeDetails();
    } catch (err: any) {
      triggerToast('Upload failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setUploadingVer(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-6 w-full animate-pulse" />
            <Skeleton className="h-24 w-full animate-pulse" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="text-center p-8 space-y-4">
        <p className="text-muted-foreground text-sm">Resume not found.</p>
        <Button onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {showToast && (
        <Toast
          message={toastMsg}
          onClose={() => setShowToast(false)}
        />
      )}

      {/* Navigation Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-2 hover:bg-accent rounded-lg text-muted-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-foreground mb-1 flex items-center gap-2">
              {resume.title}
              {resume.isDefault && <Badge variant="success">Default</Badge>}
            </h1>
            <p className="text-xs text-muted-foreground">
              Created {new Date(resume.createdAt).toLocaleDateString()} &bull;{' '}
              {resume.versions?.length || 0} Versions
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!resume.isDefault && (
            <Button variant="outline" onClick={handleSetDefault}>
              Set Default
            </Button>
          )}
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete Resume
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Timeline Block */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Resume Versions History</CardTitle>
              <CardDescription>
                Track how your resume evolved. Click on any version to see its breakdown.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative border-l border-border pl-6 ml-4 space-y-8">
                {resume.versions?.map((ver: any, index: number) => {
                  const score = ver.analysis?.matchScore || 0;
                  return (
                    <div key={ver.id} className="relative">
                      {/* Anchor Timeline Icon */}
                      <span className="absolute -left-10 top-1.5 w-8 h-8 rounded-full bg-secondary border-2 border-border flex items-center justify-center text-xs font-bold text-foreground">
                        v{ver.versionNumber}
                      </span>

                      <div className="flex items-start justify-between gap-4 bg-accent/20 hover:bg-accent/40 transition-colors p-4 rounded-xl border border-border/40">
                        <div className="space-y-1">
                          <p className="text-sm font-bold text-foreground">
                            {ver.fileName}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-primary" />
                            {new Date(ver.createdAt).toLocaleString()}
                          </p>
                          <div className="flex gap-2 pt-2">
                            <Badge variant={score >= 80 ? 'success' : score >= 60 ? 'warning' : 'destructive'}>
                              Score: {score}/100
                            </Badge>
                            <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
                              {(ver.size / 1024).toFixed(1)} KB
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Link
                            to={`/candidate/resume-analysis?versionId=${ver.id}`}
                            className="flex items-center gap-1.5 text-xs text-primary font-bold hover:underline"
                          >
                            View Report <ChevronRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Upload & Actions sidebar */}
        <div className="space-y-6">
          {/* Quick upload card */}
          <Card className="bg-gradient-to-br from-secondary/50 to-background border-primary/10">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" /> Upload Version {resume.versions?.length + 1}
              </CardTitle>
              <CardDescription>
                Upload a revised file to compare and run matches against new requirements.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleVersionUpload} className="space-y-4">
                <div className="border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-xl p-6 text-center cursor-pointer relative bg-card">
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                  />
                  <UploadCloud className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs font-bold text-foreground">
                    {selectedFile ? selectedFile.name : 'Select PDF or DOCX'}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Max size 10MB
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Target Job Description (Optional)
                  </label>
                  <textarea
                    className="w-full h-24 text-xs bg-card border border-border rounded-lg p-2.5 resize-none focus:outline-none focus:border-primary"
                    placeholder="Paste job details here to evaluate matching score upon upload..."
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={!selectedFile || uploadingVer}
                >
                  {uploadingVer ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Uploading & Analyzing...
                    </>
                  ) : (
                    'Upload & Scan'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Settings rename card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rename Resume</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter resume title"
              />
              <Button
                variant="outline"
                className="w-full"
                onClick={handleRename}
                disabled={renaming || !newTitle.trim() || newTitle === resume.title}
              >
                {renaming ? 'Saving...' : 'Save Title'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
