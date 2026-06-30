import { useState, useEffect } from 'react';
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
import Skeleton from '@/components/atoms/Skeleton';
import Toast from '@/components/molecules/Toast';
import {
  Code,
  Flame,
  Trophy,
  CheckCircle,
  Clock,
  Sparkles,
  ChevronRight,
  Award,
} from 'lucide-react';
import api from '../../../utils/api';

export default function CandidateAssessments() {
  const [stats, setStats] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [statsRes, questionsRes] = await Promise.all([
          api.get('/assessments/candidate/dashboard'),
          api.get('/assessments/candidate/questions'),
        ]);
        setStats(statsRes.data.data);
        setQuestions(questionsRes.data.data || []);
      } catch (err: any) {
        triggerToast('Unable to retrieve coding dashboard: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const dist = stats?.distribution || {
    easy: { solved: 0, total: 2 },
    medium: { solved: 0, total: 1 },
    hard: { solved: 0, total: 1 },
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-xs">
      {showToast && <Toast message={toastMsg} onClose={() => setShowToast(false)} />}

      <div>
        <h1 className="text-3xl font-extrabold font-display text-foreground mb-1.5 flex items-center gap-2">
          <Code className="w-8 h-8 text-primary" /> Coding Assessment Academy
        </h1>
        <p className="text-muted-foreground text-sm">
          Solve algorithmic mock tests, track metrics, review complexities, and prepare for top-tier coding screenings.
        </p>
      </div>

      {/* Main Metrics Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Problems Solved */}
        <Card className="flex items-center gap-4 p-5 bg-card border border-border/40">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              Problems Solved
            </p>
            <p className="text-2xl font-black text-foreground mt-1">
              {stats?.problemsSolved || 0}
            </p>
          </div>
        </Card>

        {/* Coding Streak */}
        <Card className="flex items-center gap-4 p-5 bg-card border border-border/40">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              Active Streak
            </p>
            <p className="text-2xl font-black text-foreground mt-1">
              {stats?.streak || 0} Days
            </p>
          </div>
        </Card>

        {/* Acceptance Rate */}
        <Card className="flex items-center gap-4 p-5 bg-card border border-border/40">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              Acceptance Rate
            </p>
            <p className="text-2xl font-black text-foreground mt-1">
              {stats?.acceptanceRate || 100}%
            </p>
          </div>
        </Card>

        {/* Achievements Level */}
        <Card className="flex items-center gap-4 p-5 bg-card border border-border/40">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
              Academy Badges
            </p>
            <p className="text-2xl font-black text-foreground mt-1">
              Level {stats?.problemsSolved >= 3 ? 'Intermediate' : 'Beginner'}
            </p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Practice Problems and Active Tests */}
        <div className="lg:col-span-2 space-y-6">
          {/* Upcoming assigned recruiter tests */}
          {stats?.upcomingAssessments?.length > 0 && (
            <Card className="bg-gradient-to-r from-primary/10 to-indigo-500/5 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  Assigned Screening Assessments
                </CardTitle>
                <CardDescription>
                  Tests officially scheduled by recruitment panels for candidate evaluation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-2">
                {stats.upcomingAssessments.map((test: any) => (
                  <div
                    key={test.id}
                    className="flex justify-between items-center p-3.5 bg-slate-950/40 border border-primary/20 rounded-xl"
                  >
                    <div>
                      <p className="font-bold text-foreground">{test.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> {test.duration} mins &bull; {test.questionsCount} algorithmic questions
                      </p>
                    </div>

                    <Link to={`/candidate/assessments/workspace/${questions[0]?.id}?testId=${test.id}`}>
                      <Button variant="primary">
                        Start Test
                      </Button>
                    </Link>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Sandbox practice problems table list */}
          <Card>
            <CardHeader>
              <CardTitle>Algorithmic Question Bank</CardTitle>
              <CardDescription>
                Practice general challenges to optimize syntax execution efficiency.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 border-t border-border/40">
              <div className="divide-y divide-border/30">
                {questions.map((q) => (
                  <div
                    key={q.id}
                    className="flex justify-between items-center p-4 hover:bg-slate-900/10 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-foreground text-sm truncate">{q.title}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-bold uppercase">
                        {q.category} &bull; {q.points} Points
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <Badge
                        variant={
                          q.difficulty === 'HARD'
                            ? 'destructive'
                            : q.difficulty === 'MEDIUM'
                            ? 'warning'
                            : 'success'
                        }
                      >
                        {q.difficulty}
                      </Badge>

                      <Link to={`/candidate/assessments/workspace/${q.id}`}>
                        <Button variant="outline" className="flex items-center gap-1">
                          Solve Problem <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Solve Distribution and Submissions History */}
        <div className="lg:col-span-1 space-y-6">
          {/* Solve breakdown distribution */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Solve Distribution</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-2">
              {/* Easy solve gauge */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-emerald-500 font-bold">EASY</span>
                  <span className="text-slate-400 font-bold">
                    {dist.easy.solved}/{dist.easy.total}
                  </span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${(dist.easy.solved / (dist.easy.total || 1)) * 100}%` }}
                  />
                </div>
              </div>

              {/* Medium solve gauge */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-yellow-500 font-bold">MEDIUM</span>
                  <span className="text-slate-400 font-bold">
                    {dist.medium.solved}/{dist.medium.total}
                  </span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-500 rounded-full"
                    style={{ width: `${(dist.medium.solved / (dist.medium.total || 1)) * 100}%` }}
                  />
                </div>
              </div>

              {/* Hard solve gauge */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px]">
                  <span className="text-rose-500 font-bold">HARD</span>
                  <span className="text-slate-400 font-bold">
                    {dist.hard.solved}/{dist.hard.total}
                  </span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full"
                    style={{ width: `${(dist.hard.solved / (dist.hard.total || 1)) * 100}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submissions History */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Recent Submissions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-2">
              {stats?.submissionHistory?.length === 0 ? (
                <p className="text-[10px] text-muted-foreground italic text-center py-4">
                  No solution submissions completed yet.
                </p>
              ) : (
                stats?.submissionHistory?.map((sub: any) => (
                  <div
                    key={sub.id}
                    className="p-3 bg-secondary/15 border border-border/30 rounded-xl space-y-1.5"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-foreground truncate max-w-[120px]">
                        {sub.codingQuestion?.title}
                      </span>
                      <Badge variant={sub.status === 'ACCEPTED' ? 'success' : 'destructive'}>
                        {sub.status}
                      </Badge>
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>{sub.language?.name}</span>
                      <span>{new Date(sub.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
