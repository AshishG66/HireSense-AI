import { Card, CardHeader, CardContent } from '@/components/organisms/Card';
import { Shield, Cpu, Users, History } from 'lucide-react';
import ChartsContainer from '@/components/organisms/ChartsContainer';

export default function AdminDashboard() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-extrabold font-display text-foreground mb-1.5">
          Admin Control Workspace
        </h1>
        <p className="text-muted-foreground text-sm">
          Monitor platform resource consumption, token rates, user lists, and audit trails.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Users
            </h3>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold font-display">1,402</p>
            <p className="text-xs text-muted-foreground mt-1">42 registered today</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              AI Tokens Used
            </h3>
            <Cpu className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold font-display">2.4M</p>
            <p className="text-xs text-muted-foreground mt-1">82% of current monthly quota</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Audit Triggers
            </h3>
            <History className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold font-display">34</p>
            <p className="text-xs text-muted-foreground mt-1">0 critical exceptions logged</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Security Status
            </h3>
            <Shield className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold font-display">Normal</p>
            <p className="text-xs text-muted-foreground mt-1">SSL certificates active</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartsContainer
          title="Global Platform API Traffic"
          type="line"
          description="Hourly API request distributions."
        />
        <ChartsContainer
          title="Gemini AI Performance Tokens"
          type="bar"
          description="Token usage grouped by role."
        />
      </div>
    </div>
  );
}
