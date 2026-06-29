import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/organisms/Card';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Input } from '@/components/atoms/Input';
import { Select } from '@/components/atoms/Select';
import Drawer from '@/components/organisms/Drawer';
import Toast from '@/components/molecules/Toast';
import { Briefcase, Plus, Search, Trash2, Copy, Power } from 'lucide-react';
import api from '../../../utils/api';

export default function RecruiterJobs() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [responsibilities, setResponsibilities] = useState('');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [preferredSkills, setPreferredSkills] = useState('');
  const [salaryMin, setSalaryMin] = useState('50000');
  const [salaryMax, setSalaryMax] = useState('120000');
  const [experienceLevel, setExperienceLevel] = useState('Senior');
  const [employmentType, setEmploymentType] = useState('Full-time');
  const [location] = useState('Remote');
  const [remoteType, setRemoteType] = useState('Remote');
  const [openings, setOpenings] = useState('1');
  const [deadline] = useState('');
  const [status] = useState('ACTIVE');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRemote, setFilterRemote] = useState('');

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await api.get('/jobs', {
        params: {
          search: searchTerm || undefined,
          remoteType: filterRemote || undefined,
        },
      });
      setJobs(res.data.data || []);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch job postings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [searchTerm, filterRemote]);

  const handleCreateJob = async () => {
    if (!title || !description || !responsibilities || !requiredSkills) return;

    try {
      const payload = {
        title,
        description,
        responsibilities,
        requiredSkills: requiredSkills
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        preferredSkills: preferredSkills
          ? preferredSkills
              .split(',')
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        salaryMin: Number(salaryMin),
        salaryMax: Number(salaryMax),
        experienceLevel,
        employmentType,
        location,
        remoteType,
        openings: Number(openings),
        deadline: deadline ? new Date(deadline).toISOString() : undefined,
        status,
      };

      const res = await api.post('/jobs', payload);
      setJobs((prev) => [res.data.data, ...prev]);
      setTitle('');
      setDescription('');
      setResponsibilities('');
      setRequiredSkills('');
      setPreferredSkills('');
      setIsDrawerOpen(false);
      setToastMessage('New job posting created successfully!');
      setShowToast(true);
    } catch (err: any) {
      alert(err.message || 'Failed to create job posting');
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (!confirm('Are you sure you want to delete this job posting?')) return;
    try {
      await api.delete(`/jobs/${id}`);
      setJobs((prev) => prev.filter((job) => job.id !== id));
      setToastMessage('Job posting deleted successfully!');
      setShowToast(true);
    } catch (err: any) {
      alert(err.message || 'Failed to delete job posting');
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'CLOSED' : 'ACTIVE';
    try {
      const res = await api.patch(`/jobs/${id}/status`, { status: nextStatus });
      setJobs((prev) => prev.map((job) => (job.id === id ? res.data.data : job)));
      setToastMessage(`Job posting updated to ${nextStatus}!`);
      setShowToast(true);
    } catch (err: any) {
      alert(err.message || 'Failed to toggle job status');
    }
  };

  const handleDuplicateJob = async (id: string) => {
    try {
      const res = await api.post(`/jobs/${id}/duplicate`);
      setJobs((prev) => [res.data.data, ...prev]);
      setToastMessage('Job posting duplicated as DRAFT!');
      setShowToast(true);
    } catch (err: any) {
      alert(err.message || 'Failed to duplicate job posting');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 relative">
      {showToast && (
        <div className="fixed bottom-6 right-6 z-50">
          <Toast message={toastMessage} onClose={() => setShowToast(false)} />
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-display text-foreground mb-1.5 font-sans">
            Job Postings
          </h1>
          <p className="text-muted-foreground text-sm">
            Create and configure job screen parameters and screening templates.
          </p>
        </div>
        <Button variant="primary" onClick={() => setIsDrawerOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Job Post
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search job postings..."
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
              className="h-48 rounded-xl bg-card border border-border/40 animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 text-rose-500 font-semibold">{error}</div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-border/50 rounded-2xl">
          <Briefcase className="w-12 h-12 text-muted-foreground/40 mx-auto mb-4" />
          <h3 className="font-bold text-foreground mb-1">No job postings found</h3>
          <p className="text-muted-foreground text-sm">Create a new posting to find candidates.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <Card
              key={job.id}
              className="relative overflow-hidden bg-card border border-border/40 hover:border-border transition-colors"
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-4">
                  <div className="space-y-1">
                    <div className="flex gap-2">
                      <Badge variant={job.status === 'ACTIVE' ? 'success' : 'default'}>
                        {job.status}
                      </Badge>
                      <Badge variant="info">{job.remoteType}</Badge>
                    </div>
                    <CardTitle className="text-base font-bold font-display pt-1">
                      {job.title}
                    </CardTitle>
                  </div>
                  <Briefcase className="w-5 h-5 text-muted-foreground/50 shrink-0" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4 border-t border-border/50 text-xs">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Openings:</span>
                  <span className="font-semibold text-foreground">{job.openings} positions</span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Salary Range:</span>
                  <span className="font-semibold text-foreground">
                    ${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Applicants count:</span>
                  <span className="font-semibold text-foreground">
                    {job._count?.applications || 0} applied
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/40">
                  <button
                    onClick={() => handleToggleStatus(job.id, job.status)}
                    title={job.status === 'ACTIVE' ? 'Unpublish Job' : 'Publish Job'}
                    className="p-1.5 hover:bg-slate-900 rounded text-slate-400 hover:text-emerald-400 transition-colors"
                  >
                    <Power className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDuplicateJob(job.id)}
                    title="Duplicate Job"
                    className="p-1.5 hover:bg-slate-900 rounded text-slate-400 hover:text-indigo-400 transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteJob(job.id)}
                    title="Delete Job"
                    className="p-1.5 hover:bg-slate-900 rounded text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Create Job Posting"
        footerActions={
          <>
            <Button variant="outline" onClick={() => setIsDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateJob}>
              Create Post
            </Button>
          </>
        }
      >
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          <Input
            label="Job Position Title"
            placeholder="e.g. Lead Frontend Architect"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="space-y-1 text-xs font-semibold text-slate-300">
            <label>Job Description</label>
            <textarea
              className="w-full h-24 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              placeholder="Detailed job summary..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-1 text-xs font-semibold text-slate-300">
            <label>Responsibilities</label>
            <textarea
              className="w-full h-24 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
              placeholder="Responsibilities details..."
              value={responsibilities}
              onChange={(e) => setResponsibilities(e.target.value)}
            />
          </div>
          <Input
            label="Required Skills (comma separated)"
            placeholder="React, TypeScript, Next.js"
            value={requiredSkills}
            onChange={(e) => setRequiredSkills(e.target.value)}
          />
          <Input
            label="Preferred Skills (comma separated)"
            placeholder="AWS, Docker, CI/CD"
            value={preferredSkills}
            onChange={(e) => setPreferredSkills(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Salary Min ($)"
              type="number"
              value={salaryMin}
              onChange={(e) => setSalaryMin(e.target.value)}
            />
            <Input
              label="Salary Max ($)"
              type="number"
              value={salaryMax}
              onChange={(e) => setSalaryMax(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Employment Type"
              options={[
                { value: 'Full-time', label: 'Full-time' },
                { value: 'Part-time', label: 'Part-time' },
                { value: 'Contract', label: 'Contract' },
              ]}
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value)}
            />
            <Select
              label="Remote Type"
              options={[
                { value: 'Remote', label: 'Remote' },
                { value: 'Hybrid', label: 'Hybrid' },
                { value: 'On-site', label: 'On-site' },
              ]}
              value={remoteType}
              onChange={(e) => setRemoteType(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Experience Level"
              placeholder="Senior"
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
            />
            <Input
              label="Openings Count"
              type="number"
              value={openings}
              onChange={(e) => setOpenings(e.target.value)}
            />
          </div>
        </div>
      </Drawer>
    </div>
  );
}
