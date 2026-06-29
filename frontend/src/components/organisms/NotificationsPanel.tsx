import { Bell, X, Info, Sparkles, UserCheck } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './Card';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsPanel = ({ isOpen, onClose }: NotificationsPanelProps) => {
  if (!isOpen) return null;

  const list = [
    {
      id: '1',
      title: 'Resume Parsed',
      text: "Alice Smith's CV matching score evaluated at 94%.",
      icon: <Sparkles className="w-4 h-4 text-emerald-500" />,
      time: '5m ago',
    },
    {
      id: '2',
      title: 'Interview Complete',
      text: 'Bob Johnson finished his screening round.',
      icon: <UserCheck className="w-4 h-4 text-primary" />,
      time: '2h ago',
    },
    {
      id: '3',
      title: 'System Alert',
      text: 'AI Token usage limit warning: 82% threshold exceeded.',
      icon: <Info className="w-4 h-4 text-amber-500" />,
      time: '1d ago',
    },
  ];

  return (
    <div className="absolute right-0 mt-2 w-80 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-3 duration-250">
      <Card className="border-0 shadow-none rounded-none bg-card">
        <CardHeader className="flex flex-row items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Notifications</CardTitle>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-accent rounded-lg text-muted-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </CardHeader>
        <CardContent className="p-2 divide-y divide-border/40">
          {list.map((item) => (
            <div
              key={item.id}
              className="p-3 hover:bg-accent/40 transition-colors flex gap-3 text-xs leading-relaxed"
            >
              <div className="w-7 h-7 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center justify-between font-semibold text-foreground">
                  <span>{item.title}</span>
                  <span className="text-[10px] text-muted-foreground/60 font-normal">
                    {item.time}
                  </span>
                </div>
                <p className="text-muted-foreground">{item.text}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationsPanel;
