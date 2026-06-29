import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/organisms/Table';
import { Badge } from '@/components/atoms/Badge';

export default function AdminAuditLogs() {
  const logs = [
    {
      id: '1',
      event: 'Recruiter Register',
      user: 'admin@hiresense.ai',
      ip: '192.168.1.1',
      time: '2026-06-29 14:30',
      status: 'Success',
    },
    {
      id: '2',
      event: 'Database Backup',
      user: 'System System',
      ip: '127.0.0.1',
      time: '2026-06-29 12:00',
      status: 'Success',
    },
    {
      id: '3',
      event: 'Role Upgrade Blocked',
      user: 'candidate@hiresense.ai',
      ip: '192.168.1.42',
      time: '2026-06-29 10:15',
      status: 'Blocked',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-extrabold font-display text-foreground mb-1.5">
          Audit Event Trail Logs
        </h1>
        <p className="text-muted-foreground text-sm">
          Review platform actions log, authentication checks, and settings modification activities.
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Event Trigger</TableHead>
            <TableHead>Account User</TableHead>
            <TableHead>Origin IP</TableHead>
            <TableHead>Timestamp</TableHead>
            <TableHead className="text-right">Execution Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-semibold text-foreground">{log.event}</TableCell>
              <TableCell>{log.user}</TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">{log.ip}</TableCell>
              <TableCell className="text-muted-foreground">{log.time}</TableCell>
              <TableCell className="text-right">
                <Badge variant={log.status === 'Success' ? 'success' : 'destructive'}>
                  {log.status}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
