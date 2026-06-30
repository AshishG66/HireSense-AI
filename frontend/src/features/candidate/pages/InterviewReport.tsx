import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/organisms/Card';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import Skeleton from '@/components/atoms/Skeleton';
import Toast from '@/components/molecules/Toast';
import {
  Trophy,
  ArrowLeft,
  Download,
  BookOpen,
  Briefcase,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react';
import api from '../../../utils/api';

export default function InterviewReport() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
  };

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/interviews/${id}`);
        setSession(res.data.data);
      } catch (err: any) {
        triggerToast('Failed to load interview report: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchReport();
  }, [id]);

  const handleExportPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Skeleton className="h-64 col-span-1 animate-pulse" />
          <Skeleton className="h-64 col-span-2 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!session || !session.feedbackDetails) {
    return (
      <div className="text-center py-20 space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-foreground">Report Not Available</h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          The final report could not be found or evaluation compiles are still pending in the background.
        </p>
        <Button onClick={() => navigate('/candidate/mock-interview')}>
          Back to Interviews
        </Button>
      </div>
    );
  }

  const report = session.feedbackDetails;
  const score = report.overall_score || session.score || 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300 print:p-0 text-xs">
      {showToast && <Toast message={toastMsg} onClose={() => setShowToast(false)} />}

      {/* Header controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            to="/candidate/mock-interview"
            className="p-2 hover:bg-accent rounded-lg text-muted-foreground transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-foreground mb-1">
              Interview Evaluation Report
            </h1>
            <p className="text-xs text-muted-foreground">
              Detailed performance metrics for <b>{session.jobRole}</b> mock round.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="w-4 h-4 mr-1.5" /> Export PDF Report
          </Button>
        </div>
      </div>

      {/* Main Scorecard Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Composite Score Circle Gauge */}
        <Card className="md:col-span-1 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 border-primary/20">
          <Trophy className="w-12 h-12 text-emerald-500 mb-2" />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            Overall Grade
          </p>
          <p className="text-6xl font-black text-foreground mt-4 mb-2">{score}/100</p>
          <Badge variant={score >= 80 ? 'success' : score >= 60 ? 'warning' : 'destructive'}>
            {score >= 80 ? 'Optimized' : score >= 60 ? 'Gaps Detected' : 'Needs Practice'}
          </Badge>
          <p className="text-[10px] text-muted-foreground mt-4 leading-relaxed">
            AI recommends next difficulty: <b className="text-foreground">{report.next_difficulty || 'MEDIUM'}</b>
          </p>
        </Card>

        {/* Index Subcategories Breakdown gauges */}
        <Card className="md:col-span-3 bg-card border border-border/40">
          <CardHeader>
            <CardTitle>Core Indexes Performance</CardTitle>
            <CardDescription>
              Evaluation ratings mapped across primary interview skill competencies.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
            {[
              { label: 'Technical depth', val: report.technical_score || score },
              { label: 'Behavioral & values', val: report.behavioral_score || score },
              { label: 'Communication flow', val: report.communication_score || score },
            ].map((idxItem, idx) => (
              <div key={idx} className="space-y-2 border border-border/30 rounded-xl p-4 bg-secondary/10">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  {idxItem.label}
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-black text-foreground">{idxItem.val}%</p>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${idxItem.val}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Strengths and weaknesses side-by-side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader className="bg-emerald-500/5 rounded-t-xl border-b border-border/45">
            <CardTitle className="text-base text-emerald-500 flex items-center gap-1.5">
              <CheckCircle className="w-5 h-5" /> Key Strengths
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ul className="list-disc pl-5 space-y-2 text-xs text-muted-foreground leading-relaxed">
              {report.strengths?.map((s: string, idx: number) => (
                <li key={idx} className="text-slate-300">
                  {s}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="bg-rose-500/5 rounded-t-xl border-b border-border/45">
            <CardTitle className="text-base text-rose-500 flex items-center gap-1.5">
              <AlertTriangle className="w-5 h-5" /> Gaps & Weaknesses
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <ul className="list-disc pl-5 space-y-2 text-xs text-muted-foreground leading-relaxed">
              {report.weaknesses?.map((w: string, idx: number) => (
                <li key={idx} className="text-slate-300">
                  {w}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Actionable Learning and suggested projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-1.5">
              <BookOpen className="w-5 h-5 text-primary" /> Recommended Learning Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.learning_resources?.map((res: string, idx: number) => (
              <div key={idx} className="flex gap-3 text-xs leading-relaxed">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                  <Lightbulb className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{res}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-1.5">
              <Briefcase className="w-5 h-5 text-primary" /> Suggested Practice Projects
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {report.suggested_projects?.map((proj: string, idx: number) => (
              <div key={idx} className="flex gap-3 text-xs leading-relaxed">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                  <TrendingUp className="w-3.5 h-3.5" />
                </div>
                <p className="text-muted-foreground">{proj}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
