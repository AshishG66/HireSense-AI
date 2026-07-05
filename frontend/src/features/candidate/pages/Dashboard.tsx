import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/organisms/Card';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Input } from '@/components/atoms/Input';
import { Select } from '@/components/atoms/Select';
import Tabs from '@/components/molecules/Tabs';
import Toast from '@/components/molecules/Toast';
import EmptyState from '@/components/molecules/EmptyState';
import {
  Trophy,
  Briefcase,
  Search,
  Bookmark,
  CheckCircle2,
  BookmarkCheck,
  Trash2,
} from 'lucide-react';
import api from '../../../utils/api';
import useAuthStore from '../../../stores/useAuthStore';

export default function CandidateDashboard() {
  const { user } = useAuthStore() as any;
  const [activeTab, setActiveTab] = useState('explore');
  const [jobs, setJobs] = useState<any[]>([]);
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [atsScore, setAtsScore] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRemote, setFilterRemote] = useState('');

  const fetchCandidateData = async () => {
    try {
      setLoading(true);
      const [jobsRes, savedRes, appsRes, resumesRes] = await Promise.all([
        api.get('/jobs', {
          params: {
            search: searchTerm || undefined,
            remoteType: filterRemote || undefined,
          },
        }),
        api.get('/jobs/saved'),
        api.get('/applications'),
        api.get('/resumes'),
      ]);

      setJobs(jobsRes.data.data || []);
      setSavedJobs(savedRes.data.data || []);
      setApplications(appsRes.data.data || []);

      // Calculate max ATS score across all resume versions
      let maxScore = 0;
      const resumes = resumesRes.data.data || [];
      resumes.forEach((r: any) => {
        r.versions?.forEach((v: any) => {
          if (v.analysis?.matchScore && v.analysis.matchScore > maxScore) {
            maxScore = v.analysis.matchScore;
          }
        });
      });
      setAtsScore(maxScore > 0 ? Math.round(maxScore) : null);

      setError('');
    } catch (err: any) {
      setError(err.message || 'Unable to retrieve Candidate dashboard context');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidateData();
  }, [searchTerm, filterRemote]);

  const handleApply = async (jobId: string) => {
    try {
      const dummyUuid = '00000000-0000-0000-0000-000000000000';
      await api.post(`/jobs/${jobId}/apply`, { resumeVersionId: dummyUuid });
      setToastMessage('Successfully applied to job posting!');
      setShowToast(true);
      fetchCandidateData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit application');
    }
  };

  const handleSaveToggle = async (jobId: string, isSaved: boolean) => {
    try {
      if (isSaved) {
        await api.delete(`/jobs/${jobId}/save`);
        setToastMessage('Job removed from saved list.');
      } else {
        await api.post(`/jobs/${jobId}/save`);
        setToastMessage('Job bookmarked successfully!');
      }
      setShowToast(true);
      fetchCandidateData();
    } catch (err: any) {
      alert(err.message || 'Failed to update bookmarks');
    }
  };

  const handleWithdraw = async (appId: string) => {
    if (!confirm('Are you sure you want to withdraw this application?')) return;
    try {
      await api.delete(`/applications/${appId}`);
      setToastMessage('Application withdrawn successfully.');
      setShowToast(true);
      fetchCandidateData();
    } catch (err: any) {
      alert(err.message || 'Failed to withdraw application');
    }
  };

  const isJobSaved = (jobId: string) => {
    return savedJobs.some((sj) => sj.jobId === jobId);
  };

  const isJobApplied = (jobId: string) => {
    return applications.some((app) => app.jobId === jobId);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'HIRED':
        return <Badge variant="success">Hired</Badge>;
      case 'REJECTED':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'APPLIED':
        return <Badge variant="default">Applied</Badge>;
      default:
        return <Badge variant="info">{status.replace('_', ' ')}</Badge>;
    }
  };

  const firstName = user?.name ? user.name.split(' ')[0] : '';
  const greeting = firstName ? `Hello, ${firstName}` : 'Hello, Candidate';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50">
          <Toast message={toastMessage} onClose={() => setShowToast(false)} />
        </div>
      )}

      <div className="bg-gradient-to-r from-emerald-500/10 to-indigo-500/10 border border-primary/10 rounded-2xl p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-extrabold font-display text-foreground font-sans">
            {greeting}
          </h1>
          <p className="text-muted-foreground text-sm max-w-lg">
            Track your ATS scores, manage active submissions, and explore personalized openings
            matching your profile.
          </p>
        </div>
      </div>

      {error && (
        <div className="text-center py-4 bg-rose-500/10 border border-rose-500/25 rounded-xl text-rose-500 text-sm font-semibold">
          {error}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Profile ATS Score
            </h3>
            <Trophy className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-extrabold font-display">{atsScore !== null ? `${atsScore}%` : 'N/A'}</p>
            <p className="text-xs text-emerald-400 mt-1.5 font-bold">
              {atsScore !== null ? 'Highest Resume Match' : 'Upload Resume to calculate'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Applied Jobs
            </h3>
            <CheckCircle2 className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-extrabold font-display">{applications.length}</p>
            <p className="text-xs text-muted-foreground mt-1.5">Active job submissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Bookmarked Jobs
            </h3>
            <Bookmark className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-extrabold font-display">{savedJobs.length}</p>
            <p className="text-xs text-muted-foreground mt-1.5">Saved for future screening</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Tabs
          tabs={[
            { id: 'explore', label: 'Explore Open Roles' },
            { id: 'applications', label: `My Applications (${applications.length})` },
            { id: 'saved', label: `Saved Jobs (${savedJobs.length})` },
          ]}
          activeTab={activeTab}
          onChange={(tabId: string) => setActiveTab(tabId)}
        />

        {activeTab === 'explore' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search jobs by position or keyword..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                className="w-48"
                options={[
                  { value: '', label: 'All Remote Types' },
                  { value: 'Remote', label: 'Remote' },
                  { value: 'Hybrid', label: 'Hybrid' },
                  { value: 'On-site', label: 'On-site' },
                ]}
                value={filterRemote}
                onChange={(e) => setFilterRemote(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="h-44 rounded-xl bg-card border border-border/40 animate-pulse"
                  />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <EmptyState
                title="No jobs matching criteria"
                description="Refine your filters or search criteria to view other roles."
                icon={<Briefcase className="w-6 h-6" />}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-200">
                {jobs.map((job) => {
                  const saved = isJobSaved(job.id);
                  const applied = isJobApplied(job.id);
                  return (
                    <Card
                      key={job.id}
                      className="relative overflow-hidden bg-card border border-border/45 hover:border-border transition-colors"
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-1">
                            <div className="flex gap-2">
                              <Badge variant="info">{job.remoteType}</Badge>
                              <Badge variant="info">{job.employmentType}</Badge>
                            </div>
                            <CardTitle className="text-base font-bold font-display pt-1">
                              {job.title}
                            </CardTitle>
                            <p className="text-xs text-muted-foreground">
                              {job.company?.name || 'Partner Company'}
                            </p>
                          </div>
                          <button
                            onClick={() => handleSaveToggle(job.id, saved)}
                            className="p-1 hover:bg-slate-900 rounded text-slate-400 hover:text-purple-400 transition-colors"
                          >
                            {saved ? (
                              <BookmarkCheck className="w-5 h-5 text-purple-400" />
                            ) : (
                              <Bookmark className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-4 border-t border-border/50 text-xs">
                        <div className="flex justify-between items-center text-muted-foreground">
                          <span>Location:</span>
                          <span className="font-semibold text-foreground">
                            {job.location || 'Remote'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-muted-foreground">
                          <span>Salary:</span>
                          <span className="font-semibold text-foreground">
                            ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-border/40">
                          {applied ? (
                            <Button className="w-full" variant="outline" disabled>
                              Applied
                            </Button>
                          ) : (
                            <Button
                              className="w-full"
                              variant="primary"
                              onClick={() => handleApply(job.id)}
                            >
                              Apply Now
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="space-y-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2].map((n) => (
                  <div
                    key={n}
                    className="h-16 w-full bg-slate-900 border border-slate-800 animate-pulse rounded-lg"
                  />
                ))}
              </div>
            ) : applications.length === 0 ? (
              <EmptyState
                title="No submissions found"
                description="Explore job openings and submit applications to start your placement process."
                icon={<Briefcase className="w-6 h-6" />}
              />
            ) : (
              <div className="border border-border/40 rounded-xl overflow-hidden bg-card">
                <div className="divide-y divide-border/40 text-xs">
                  {applications.map((app) => (
                    <div
                      key={app.id}
                      className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-900/10 transition-colors"
                    >
                      <div>
                        <h4 className="font-bold text-foreground text-sm">{app.job?.title}</h4>
                        <p className="text-muted-foreground">{app.job?.company?.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Submitted: {new Date(app.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                        {getStatusBadge(app.status)}
                        <button
                          onClick={() => handleWithdraw(app.id)}
                          className="p-1.5 hover:bg-slate-900 rounded text-slate-400 hover:text-rose-500 transition-colors"
                          title="Withdraw Application"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="space-y-6">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1].map((n) => (
                  <div
                    key={n}
                    className="h-44 rounded-xl bg-card border border-border/40 animate-pulse"
                  />
                ))}
              </div>
            ) : savedJobs.length === 0 ? (
              <EmptyState
                title="No saved jobs"
                description="Bookmark job listings from the Explore page to review them here."
                icon={<Bookmark className="w-6 h-6" />}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {savedJobs.map((sj) => (
                  <Card
                    key={sj.id}
                    className="relative overflow-hidden bg-card border border-border/45 hover:border-border transition-colors"
                  >
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <Badge variant="info">{sj.job?.remoteType}</Badge>
                          <CardTitle className="text-base font-bold font-display pt-1">
                            {sj.job?.title}
                          </CardTitle>
                          <p className="text-xs text-muted-foreground">{sj.job?.company?.name}</p>
                        </div>
                        <button
                          onClick={() => handleSaveToggle(sj.jobId, true)}
                          className="p-1 hover:bg-slate-900 rounded text-purple-400 transition-colors"
                        >
                          <BookmarkCheck className="w-5 h-5" />
                        </button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-4 border-t border-border/50 text-xs">
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span>Salary:</span>
                        <span className="font-semibold text-foreground">
                          ${sj.job?.salaryMin.toLocaleString()} - $
                          {sj.job?.salaryMax.toLocaleString()}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-border/40">
                        {isJobApplied(sj.jobId) ? (
                          <Button className="w-full" variant="outline" disabled>
                            Applied
                          </Button>
                        ) : (
                          <Button
                            className="w-full"
                            variant="primary"
                            onClick={() => handleApply(sj.jobId)}
                          >
                            Apply Now
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
