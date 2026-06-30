import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/organisms/Card';
import { Activity, Server, Cpu, Database, CheckCircle, AlertTriangle } from 'lucide-react';
import api from '../../../utils/api';

export default function Monitoring() {
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
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !metrics) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading system metrics...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-extrabold font-display text-foreground mb-1.5 flex items-center gap-2">
          <Activity className="w-8 h-8 text-primary" /> System Monitoring
        </h1>
        <p className="text-muted-foreground text-sm">
          Live platform health metrics, database latency, and AI service status.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* API Server Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-400" /> API Server Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between border-b border-border/40 pb-2">
              <span className="text-muted-foreground">Uptime</span>
              <span className="font-bold">{metrics?.uptime || 'N/A'}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-2">
              <span className="text-muted-foreground">Total Requests Served</span>
              <span className="font-bold">{metrics?.app?.totalRequests || 0}</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-2">
              <span className="text-muted-foreground">Memory Usage (Heap)</span>
              <span className="font-bold">{metrics?.app?.memory?.heapUsedMb || 0} MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Average Latency</span>
              <span className="font-bold">{metrics?.app?.averageLatencyMs || 0} ms</span>
            </div>
          </CardContent>
        </Card>

        {/* Database & Queue Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5 text-emerald-400" /> Database & Queue
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between border-b border-border/40 pb-2">
              <span className="text-muted-foreground">Database Status</span>
              <span className={`font-bold flex items-center gap-1 capitalize ${metrics?.database?.status === 'healthy' ? 'text-emerald-500' : 'text-amber-500'}`}>
                {metrics?.database?.status === 'healthy' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                {metrics?.database?.status || 'Unknown'}
              </span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-2">
              <span className="text-muted-foreground">DB Query Latency</span>
              <span className="font-bold">{metrics?.database?.queryLatencyMs || 0} ms</span>
            </div>
            <div className="flex justify-between border-b border-border/40 pb-2">
              <span className="text-muted-foreground">Queue Pending Jobs</span>
              <span className="font-bold">{metrics?.queue?.pendingJobs || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Queue Completed</span>
              <span className="font-bold">{metrics?.queue?.completedJobs || 0}</span>
            </div>
          </CardContent>
        </Card>

        {/* AI Service Health */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="w-5 h-5 text-purple-400" /> AI Service Operations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-secondary/20 p-4 rounded-xl text-center border border-border/40">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Total API Calls</p>
                <p className="text-3xl font-display font-extrabold">{metrics?.ai?.totalCalls || 0}</p>
              </div>
              <div className="bg-secondary/20 p-4 rounded-xl text-center border border-border/40">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Success Rate</p>
                <p className="text-3xl font-display font-extrabold">{metrics?.ai?.successRate || 100}%</p>
              </div>
              <div className="bg-secondary/20 p-4 rounded-xl text-center border border-border/40">
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Avg AI Latency</p>
                <p className="text-3xl font-display font-extrabold">{metrics?.ai?.averageLatencyMs || 0} ms</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
