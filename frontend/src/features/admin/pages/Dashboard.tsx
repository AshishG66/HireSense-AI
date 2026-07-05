import { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from '@/components/organisms/Card';
import { Shield, Cpu, Users, Activity } from 'lucide-react';
import ChartsContainer from '@/components/organisms/ChartsContainer';
import api from '../../../utils/api';
import useAuthStore from '../../../stores/useAuthStore';

export default function AdminDashboard() {
  const { user } = useAuthStore() as any;
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await api.get('/monitoring/metrics');
        setMetrics(response.data.data);
      } catch (err) {
        console.error('Failed to fetch metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  if (loading && !metrics) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading dashboard...</div>;
  }

  const firstName = user?.name ? user.name.split(' ')[0] : '';
  const greeting = firstName ? `Hello, ${firstName}` : 'Hello, Admin';

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-extrabold font-display text-foreground mb-1.5">
          {greeting}
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
            <p className="text-3xl font-extrabold font-display">{metrics?.users?.total || 1}</p>
            <p className="text-xs text-muted-foreground mt-1">Platform-wide access</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              AI Total Calls
            </h3>
            <Cpu className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold font-display">{metrics?.ai?.totalCalls || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">{metrics?.ai?.successRate || 100}% success rate</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Avg API Latency
            </h3>
            <Activity className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold font-display">{metrics?.app?.averageLatencyMs || 0}ms</p>
            <p className="text-xs text-muted-foreground mt-1">across {metrics?.app?.totalRequests || 0} recent requests</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Database Status
            </h3>
            <Shield className={`w-4 h-4 ${metrics?.database?.status === 'healthy' ? 'text-emerald-500' : 'text-amber-500'}`} />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-extrabold font-display capitalize">{metrics?.database?.status || 'Unknown'}</p>
            <p className="text-xs text-muted-foreground mt-1">{metrics?.database?.queryLatencyMs || 0}ms ping</p>
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
