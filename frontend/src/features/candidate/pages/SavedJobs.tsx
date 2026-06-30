import { useState, useEffect } from 'react';
import { Bookmark, Building2, Briefcase, MapPin, DollarSign, ExternalLink, Trash2 } from 'lucide-react';
import { api } from '../../../utils/api';
export default function SavedJobs() {
  const [savedJobs, setSavedJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSavedJobs();
  }, []);

  const fetchSavedJobs = async () => {
    try {
      const { data } = await api.get('/jobs/saved');
      setSavedJobs(data.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Unable to retrieve saved jobs');
    } finally {
      setLoading(false);
    }
  };

  const unsaveJob = async (jobId: string) => {
    try {
      await api.delete(`/jobs/${jobId}/save`);
      setSavedJobs(savedJobs.filter((sj) => sj.job.id !== jobId));
    } catch (err: any) {
      alert('Unable to remove saved job');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">Saved Jobs</h1>
          <p className="text-muted-foreground mt-1">Manage your bookmarked job opportunities</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-64 bg-slate-900/50 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <div className="text-red-400 p-4 bg-red-950/20 rounded-lg">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-display font-bold">Saved Jobs</h1>
        <p className="text-muted-foreground mt-1">Manage your bookmarked job opportunities</p>
      </div>

      {savedJobs.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-slate-800">
          <Bookmark className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold">No saved jobs yet</h3>
          <p className="text-slate-400 mt-2">Jobs you bookmark will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {savedJobs.map((record) => {
            const job = record.job;
            return (
              <div key={record.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-emerald-500/30 transition-colors group relative flex flex-col h-full">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <Building2 className="w-6 h-6 text-emerald-400" />
                  </div>
                  <button
                    onClick={() => unsaveJob(job.id)}
                    className="p-2 bg-slate-800/50 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                    title="Remove from saved"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                
                <h3 className="text-lg font-bold text-slate-100 line-clamp-1" title={job.title}>
                  {job.title}
                </h3>
                <p className="text-slate-400 text-sm mt-1">{job.company?.name || 'Unknown Company'}</p>

                <div className="mt-4 space-y-2 flex-grow">
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <MapPin className="w-4 h-4 text-emerald-500/70" />
                    <span>{job.location || 'Remote'} ({job.remoteType})</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <Briefcase className="w-4 h-4 text-indigo-400/70" />
                    <span>{job.employmentType} • {job.experienceLevel}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-300">
                    <DollarSign className="w-4 h-4 text-yellow-400/70" />
                    <span>${job.salaryMin.toLocaleString()} - ${job.salaryMax.toLocaleString()}</span>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/50">
                  <button 
                    onClick={() => window.alert('Job application portal opening soon!')}
                    className="w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-lg transition-colors flex justify-center items-center gap-2"
                  >
                    Apply Now
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
