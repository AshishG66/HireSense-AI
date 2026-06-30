import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/organisms/Card';
import { Badge } from '@/components/atoms/Badge';
import { Briefcase, Users, FileCheck2, TrendingUp } from 'lucide-react';
import ChartsContainer from '@/components/organisms/ChartsContainer';
import api from '../../../utils/api';

export default function RecruiterDashboard() {
  const [stats, setStats] = useState({
    activePostings: 0,
    totalApplicants: 0,
    screeningsDone: 0,
    avgMatchScore: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [jobsRes, reportsRes] = await Promise.all([
          api.get('/jobs'),
          api.get('/interviews/recruiter/reports'),
        ]);

        const jobs = jobsRes.data.data || [];
        const reports = reportsRes.data.data || [];

        const activePostings = jobs.filter((j: any) => j.status === 'ACTIVE').length;
        
        let totalApplicants = 0;
        jobs.forEach((j: any) => {
          totalApplicants += (j.applications?.length || 0);
        });

        const screeningsDone = reports.length;
        const avgMatchScore = screeningsDone > 0 
          ? Math.round(reports.reduce((sum: number, r: any) => sum + (r.score || 0), 0) / screeningsDone)
          : 0;

        setStats({
          activePostings,
          totalApplicants,
          screeningsDone,
          avgMatchScore,
        });
      } catch (error) {
        console.error("Failed to load recruiter dashboard stats", error);
      }
    };
    fetchDashboardData();
  }, []);
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-extrabold font-display text-foreground mb-1.5">
          Recruiter Command Workspace
        </h1>
        <p className="text-muted-foreground text-sm">
          Monitor job posts, screen incoming candidates, and review automated AI matching indices.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Active Postings
            </h3>
            <Briefcase className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold font-display">{stats.activePostings}</p>
            <p className="text-xs text-muted-foreground mt-1">Live job postings</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Applicants
            </h3>
            <Users className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold font-display">{stats.totalApplicants}</p>
            <p className="text-xs text-muted-foreground mt-1">Total application pipeline</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              AI Screenings Done
            </h3>
            <FileCheck2 className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold font-display">{stats.screeningsDone}</p>
            <p className="text-xs text-muted-foreground mt-1">Avg candidate match score: {stats.avgMatchScore}%</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Interview Conversion
            </h3>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold font-display">24%</p>
            <p className="text-xs text-muted-foreground mt-1">+3% increase over last quarter</p>
          </CardContent>
        </Card>
      </div>

      {/* Analytics widgets and active items */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <ChartsContainer
            title="Applicant Pipeline Activity"
            type="line"
            description="Hourly screening event registrations."
          />
        </div>
        <div className="lg:col-span-1">
          <Card className="h-full bg-card">
            <CardHeader>
              <CardTitle className="text-sm font-semibold">Priority Action Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-xs">
              <div className="p-3 bg-muted/40 rounded-lg border border-border/40 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-foreground">Evaluate Alice Smith</p>
                  <p className="text-muted-foreground text-[10px]">
                    94% Match — Full Stack Engineer
                  </p>
                </div>
                <Badge variant="success">Review</Badge>
              </div>

              <div className="p-3 bg-muted/40 rounded-lg border border-border/40 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-foreground">Grading Bob Johnson</p>
                  <p className="text-muted-foreground text-[10px]">Mock screening complete</p>
                </div>
                <Badge variant="info">Grade</Badge>
              </div>

              <div className="p-3 bg-muted/40 rounded-lg border border-border/40 flex justify-between items-center">
                <div>
                  <p className="font-semibold text-foreground">AI Limit Warning</p>
                  <p className="text-muted-foreground text-[10px]">Quota status at 82% threshold</p>
                </div>
                <Badge variant="warning">Alert</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
