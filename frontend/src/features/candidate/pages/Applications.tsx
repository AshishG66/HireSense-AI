import { useState, useEffect } from 'react';
import { api } from '../../../utils/api';
import { FileCheck, Building2, Briefcase, Calendar, ChevronRight } from 'lucide-react';
export default function Applications() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data } = await api.get('/applications');
      setApplications(data.data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Unable to retrieve applications');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPLIED': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'RESUME_SCREENING': return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
      case 'TECHNICAL_INTERVIEW': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'HR_INTERVIEW': return 'bg-pink-500/20 text-pink-400 border-pink-500/30';
      case 'OFFER': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'HIRED': return 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30';
      case 'REJECTED': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const formatStatus = (status: string) => {
    return status.replace(/_/g, ' ').replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-display font-bold">My Applications</h1>
          <p className="text-muted-foreground mt-1">Track the status of jobs you've applied to</p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-slate-900/50 rounded-xl animate-pulse"></div>
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
        <h1 className="text-3xl font-display font-bold">My Applications</h1>
        <p className="text-muted-foreground mt-1">Track the status of jobs you've applied to</p>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-slate-800">
          <FileCheck className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold">No applications yet</h3>
          <p className="text-slate-400 mt-2">Start applying to jobs and they will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => (
            <div key={app.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-emerald-500/30 transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="flex gap-4 items-center">
                <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shrink-0">
                  <Building2 className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">{app.job?.title || 'Unknown Job'}</h3>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-slate-400 mt-1">
                    <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" /> {app.job?.company?.name || 'Unknown Company'}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> Applied: {new Date(app.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(app.status)}`}>
                  {formatStatus(app.status)}
                </div>
                <button className="p-2 text-slate-400 hover:text-emerald-400 transition-colors rounded-lg hover:bg-slate-800">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
