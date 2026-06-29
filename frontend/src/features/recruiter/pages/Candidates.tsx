import { useState, useEffect } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/organisms/Table';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import Pagination from '@/components/molecules/Pagination';
import EmptyState from '@/components/molecules/EmptyState';
import Drawer from '@/components/organisms/Drawer';
import { UserX, Clock } from 'lucide-react';
import { Input } from '@/components/atoms/Input';
import api from '../../../utils/api';

export default function RecruiterCandidates() {
  const [query, setQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApp, setSelectedApp] = useState<any | null>(null);
  const [notes, setNotes] = useState('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await api.get('/applications');
      setApplications(res.data.data || []);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to fetch candidate applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleUpdateStatus = async (appId: string, newStatus: string, changeNotes?: string) => {
    try {
      const res = await api.patch(`/applications/${appId}/status`, {
        status: newStatus,
        notes: changeNotes || `Moved to ${newStatus}`,
      });
      // Refresh list to update status and trigger updates
      setApplications((prev) => prev.map((app) => (app.id === appId ? res.data.data : app)));
      if (selectedApp?.id === appId) {
        // Refresh details drawer if open
        const detailRes = await api.get(`/applications/${appId}`);
        setSelectedApp(detailRes.data.data);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update application status');
    }
  };

  const handleReviewDetails = async (app: any) => {
    try {
      const res = await api.get(`/applications/${app.id}`);
      setSelectedApp(res.data.data);
      setNotes('');
      setIsDrawerOpen(true);
    } catch (err: any) {
      alert('Failed to load application history details');
    }
  };

  const filtered = applications.filter((app) => {
    const candidateName = `${app.candidateProfile?.firstName || ''} ${app.candidateProfile?.lastName || ''}`;
    return candidateName.toLowerCase().includes(query.toLowerCase());
  });

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

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-extrabold font-display text-foreground mb-1.5">Applicants</h1>
        <p className="text-muted-foreground text-sm">
          Review, screen, and select candidate applications across active jobs.
        </p>
      </div>

      <div className="flex items-center gap-4 max-w-md">
        <Input
          placeholder="Filter by candidate name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-12 w-full bg-slate-900 border border-slate-800 animate-pulse rounded-lg"
            />
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 text-rose-500 font-semibold">{error}</div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No candidates found"
          description="Try modifying your query parameters to search other criteria."
          icon={<UserX className="w-6 h-6" />}
        />
      ) : (
        <div className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate</TableHead>
                <TableHead>Target Position</TableHead>
                <TableHead>Current Stage</TableHead>
                <TableHead>Pipeline Transition</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((app) => {
                const name = `${app.candidateProfile?.firstName || 'First'} ${app.candidateProfile?.lastName || 'Last'}`;
                return (
                  <TableRow key={app.id}>
                    <TableCell>
                      <div>
                        <p className="font-semibold text-foreground">{name}</p>
                        <p className="text-xs text-muted-foreground">
                          {app.candidateProfile?.user?.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{app.job?.title}</TableCell>
                    <TableCell>{getStatusBadge(app.status)}</TableCell>
                    <TableCell>
                      <select
                        value={app.status}
                        onChange={(e) => handleUpdateStatus(app.id, e.target.value)}
                        className="bg-slate-950 border border-slate-800 text-xs rounded p-1 text-slate-200 focus:outline-none focus:border-emerald-500 font-sans"
                      >
                        <option value="APPLIED">Applied</option>
                        <option value="RESUME_SCREENING">Resume Screening</option>
                        <option value="TECHNICAL_INTERVIEW">Technical Interview</option>
                        <option value="HR_INTERVIEW">HR Interview</option>
                        <option value="OFFER">Offer</option>
                        <option value="HIRED">Hired</option>
                        <option value="REJECTED">Rejected</option>
                      </select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        className="h-8 px-3 text-xs"
                        onClick={() => handleReviewDetails(app)}
                      >
                        History Details
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <Pagination
            currentPage={currentPage}
            totalPages={1}
            onPageChange={(p) => setCurrentPage(p)}
          />
        </div>
      )}

      {/* Review Details Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title="Application Status History Logs"
        footerActions={
          <Button variant="outline" onClick={() => setIsDrawerOpen(false)}>
            Close
          </Button>
        }
      >
        {selectedApp && (
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 text-xs">
            <div className="border border-slate-800 rounded-xl p-4 bg-slate-950 space-y-2">
              <h3 className="font-bold text-sm text-foreground">
                {selectedApp.candidateProfile?.firstName} {selectedApp.candidateProfile?.lastName}
              </h3>
              <p className="text-slate-400">Position: {selectedApp.job?.title}</p>
              <p className="text-slate-400">Current Status: {selectedApp.status}</p>
            </div>

            {/* Change Status Form in Drawer */}
            <div className="space-y-3 p-4 border border-slate-800/80 rounded-xl bg-slate-900/30">
              <h4 className="font-bold text-foreground">Add Custom Progress Notes</h4>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-semibold">Change Stage</label>
                <select
                  value={selectedApp.status}
                  onChange={(e) => handleUpdateStatus(selectedApp.id, e.target.value, notes)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 font-sans"
                >
                  <option value="APPLIED">Applied</option>
                  <option value="RESUME_SCREENING">Resume Screening</option>
                  <option value="TECHNICAL_INTERVIEW">Technical Interview</option>
                  <option value="HR_INTERVIEW">HR Interview</option>
                  <option value="OFFER">Offer</option>
                  <option value="HIRED">Hired</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] text-slate-400 font-semibold">Stage Notes</label>
                <textarea
                  className="w-full h-16 bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                  placeholder="Reason for change or screening notes..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* History timeline */}
            <div className="space-y-4">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-500" />
                Pipeline Timeline
              </h4>
              <div className="relative border-l border-slate-800 ml-2.5 pl-6 space-y-6">
                {selectedApp.statusHistory?.map((hist: any) => (
                  <div key={hist.id} className="relative">
                    {/* Circle marker */}
                    <div className="absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full bg-slate-950 border-2 border-emerald-500" />
                    <div className="space-y-1">
                      <p className="font-bold text-foreground text-xs uppercase tracking-wider">
                        {hist.status.replace('_', ' ')}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(hist.changedAt).toLocaleString()}
                      </p>
                      {hist.notes && (
                        <p className="p-2 border border-slate-800/50 bg-slate-900/10 rounded text-slate-300 italic mt-1">
                          "{hist.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
