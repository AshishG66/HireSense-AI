import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardContent,
} from '@/components/organisms/Card';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import Skeleton from '@/components/atoms/Skeleton';
import Toast from '@/components/molecules/Toast';
import {
  Users,
  Search,
  Scale,
  Star,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import api from '../../../utils/api';

export default function RecruiterInterviewReports() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState('ALL');

  // Candidate Comparison Selection State
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [comparing, setComparing] = useState(false);

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
  };

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const res = await api.get('/interviews/recruiter/reports');
        setSessions(res.data.data || []);
      } catch (err: any) {
        triggerToast('Failed to load candidate reports: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  const handleSelectCompare = (id: string) => {
    if (compareIds.includes(id)) {
      setCompareIds((prev) => prev.filter((item) => item !== id));
    } else {
      if (compareIds.length >= 2) {
        triggerToast('You can compare a maximum of 2 candidates at once.');
        return;
      }
      setCompareIds((prev) => [...prev, id]);
    }
  };

  // Filters & sorting (rank candidates dynamically)
  const filtered = sessions
    .filter((s) => {
      const matchSearch =
        s.candidateProfile?.firstName?.toLowerCase().includes(search.toLowerCase()) ||
        s.candidateProfile?.lastName?.toLowerCase().includes(search.toLowerCase()) ||
        s.jobRole?.toLowerCase().includes(search.toLowerCase());
      const matchRole = selectedRole === 'ALL' || s.jobRole === selectedRole;
      return matchSearch && matchRole;
    })
    .sort((a, b) => (b.score || 0) - (a.score || 0)); // Ranked by score descending

  const uniqueRoles = Array.from(new Set(sessions.map((s) => s.jobRole))).filter(Boolean);

  const comparedSessions = sessions.filter((s) => compareIds.includes(s.id));

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-xs">
      {showToast && <Toast message={toastMsg} onClose={() => setShowToast(false)} />}

      <div>
        <h1 className="text-3xl font-extrabold font-display text-foreground mb-1.5 flex items-center gap-2">
          <Users className="w-8 h-8 text-primary" /> Candidate AI Screening Reports
        </h1>
        <p className="text-muted-foreground text-sm">
          Browse evaluated automated interview rounds, compare performance scores, and rank candidate talent pools.
        </p>
      </div>

      {/* Comparisons Workspace Box */}
      {compareIds.length > 0 && (
        <Card className="bg-primary/5 border border-primary/20 animate-in slide-in-from-top-4 duration-300">
          <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Scale className="w-8 h-8 text-primary" />
              <div>
                <p className="font-bold text-foreground">
                  Comparison Work Space ({compareIds.length}/2 selected)
                </p>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  {compareIds.length === 1
                    ? 'Select one more candidate to enable index comparisons.'
                    : 'Compare matching technical capability profiles side-by-side.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setCompareIds([])}
                className="text-muted-foreground"
              >
                Clear Selection
              </Button>
              <Button
                variant="primary"
                disabled={compareIds.length < 2}
                onClick={() => setComparing(true)}
              >
                Compare Side-by-Side
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/10 border border-border/40 p-4 rounded-xl">
        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 w-full md:max-w-md">
          <Search className="w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search candidate name or targeted job roles..."
            className="bg-transparent border-none text-xs text-white placeholder-slate-600 focus:outline-none w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="bg-slate-950 border border-slate-800 text-xs rounded-lg p-2 text-slate-200 focus:outline-none focus:border-primary font-sans"
        >
          <option value="ALL">All Job Roles</option>
          {uniqueRoles.map((role: any) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full animate-pulse" />
          <Skeleton className="h-20 w-full animate-pulse" />
        </div>
      ) : filtered.length === 0 ? (
        <Card className="min-h-[250px] flex items-center justify-center text-center">
          <CardContent className="text-muted-foreground flex flex-col items-center">
            <Users className="w-12 h-12 mb-3 text-muted-foreground/30" />
            <p className="font-semibold text-sm">No screening sessions found</p>
            <p className="text-xs text-muted-foreground max-w-xs mt-1">
              Adjust search values or wait for candidates to complete practice screening rounds.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Candidates screening list table (Ranked automatically by score descending) */}
          <div className="border border-border/40 rounded-xl overflow-hidden bg-card">
            <div className="grid grid-cols-12 p-3.5 bg-slate-950/40 border-b border-border/30 font-bold text-slate-400 uppercase tracking-wider text-[10px]">
              <div className="col-span-1 text-center">Select</div>
              <div className="col-span-3">Candidate</div>
              <div className="col-span-3">Practice Role & Company</div>
              <div className="col-span-2 text-center">Difficulty</div>
              <div className="col-span-2 text-center">Overall Score</div>
              <div className="col-span-1 text-center">Report</div>
            </div>

            {filtered.map((s, idx) => (
              <div
                key={s.id}
                className="grid grid-cols-12 items-center p-3.5 border-b border-border/20 last:border-none hover:bg-slate-900/10 transition-colors text-slate-300"
              >
                {/* Select check box */}
                <div className="col-span-1 flex justify-center">
                  <input
                    type="checkbox"
                    checked={compareIds.includes(s.id)}
                    onChange={() => handleSelectCompare(s.id)}
                    className="w-4 h-4 rounded border-slate-800 text-primary focus:ring-primary focus:ring-offset-slate-950 bg-slate-950"
                  />
                </div>

                {/* Candidate identity details */}
                <div className="col-span-3 min-w-0">
                  <p className="font-semibold text-foreground">
                    {s.candidateProfile?.firstName} {s.candidateProfile?.lastName}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">
                    Rank #{idx + 1} in Category
                  </p>
                </div>

                {/* Targeted job and company */}
                <div className="col-span-3">
                  <p className="font-bold text-slate-300">{s.jobRole}</p>
                  <p className="text-[10px] text-slate-500">{s.companyName || 'General Mock'}</p>
                </div>

                {/* Difficulty level badge */}
                <div className="col-span-2 text-center">
                  <Badge variant={s.difficulty === 'HARD' ? 'destructive' : s.difficulty === 'MEDIUM' ? 'warning' : 'success'}>
                    {s.difficulty || 'MEDIUM'}
                  </Badge>
                </div>

                {/* Composite overall score */}
                <div className="col-span-2 text-center font-black text-foreground text-sm flex items-center justify-center gap-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  {s.score || 'Evaluating'}%
                </div>

                {/* Link to detail report page */}
                <div className="col-span-1 flex justify-center">
                  <Link to={`/candidate/mock-interview/report/${s.id}`}>
                    <Button variant="outline" className="h-7 w-7 p-0">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Side-by-side Compare modal/panel */}
      {comparing && comparedSessions.length === 2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Card className="max-w-4xl w-full bg-card border border-border p-6 space-y-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-border/40 pb-4">
              <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary" /> Profile Comparison Analysis
              </h3>
              <Button variant="outline" onClick={() => setComparing(false)}>
                Close
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-8">
              {comparedSessions.map((s, idx) => {
                const rep = s.feedbackDetails || {};
                return (
                  <div key={idx} className="space-y-4">
                    <div className="text-center p-4 bg-slate-900/40 border border-border/30 rounded-xl space-y-1">
                      <ShieldCheck className="w-8 h-8 text-primary mx-auto mb-1" />
                      <p className="font-extrabold text-foreground text-sm">
                        {s.candidateProfile?.firstName} {s.candidateProfile?.lastName}
                      </p>
                      <p className="text-[10px] text-slate-500">{s.jobRole}</p>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center p-2 bg-secondary/15 border border-border/30 rounded-lg">
                        <span className="font-bold text-slate-400">Overall Grade</span>
                        <span className="font-black text-foreground text-sm">{s.score}%</span>
                      </div>

                      {/* Technical metric comparative index */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Technical Score</span>
                          <span>{rep.technical_score || s.score}%</span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500"
                            style={{ width: `${rep.technical_score || s.score}%` }}
                          />
                        </div>
                      </div>

                      {/* Behavioral metric comparative index */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Behavioral Score</span>
                          <span>{rep.behavioral_score || s.score}%</span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500"
                            style={{ width: `${rep.behavioral_score || s.score}%` }}
                          />
                        </div>
                      </div>

                      {/* Communication metric comparative index */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-slate-400">
                          <span>Communication Score</span>
                          <span>{rep.communication_score || s.score}%</span>
                        </div>
                        <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500"
                            style={{ width: `${rep.communication_score || s.score}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Key Strengths list */}
                    <div className="space-y-1">
                      <p className="font-bold text-foreground">Top Strengths</p>
                      <ul className="list-disc pl-4 space-y-1 text-slate-400 leading-relaxed text-[11px]">
                        {rep.strengths?.slice(0, 2).map((st: string, sIdx: number) => (
                          <li key={sIdx}>{st}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Performance delta scorecard */}
            <div className="p-4 bg-slate-950/40 border border-primary/10 rounded-xl space-y-2">
              <p className="font-bold text-foreground">Comparative Verdict</p>
              {comparedSessions[0].score !== comparedSessions[1].score ? (
                <p className="text-slate-400 leading-relaxed">
                  {comparedSessions[0].candidateProfile?.firstName} leads{' '}
                  {comparedSessions[1].candidateProfile?.firstName} by a margin of{' '}
                  <span className="font-bold text-emerald-500">
                    {Math.abs(comparedSessions[0].score - comparedSessions[1].score)}%
                  </span>{' '}
                  in total aggregate performance.
                </p>
              ) : (
                <p className="text-slate-400 leading-relaxed">
                  Both candidates are tied at an equal match score of {comparedSessions[0].score}%. Check individual strengths lists to assess candidate suitability.
                </p>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
