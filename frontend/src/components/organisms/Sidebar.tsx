import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Sparkles,
  TrendingUp,
  Video,
  User,
  Settings,
  Briefcase,
  Users,
  BarChart3,
  Building2,
  Cpu,
  History,
  Component,
  ChevronLeft,
  ChevronRight,
  Code,
  FileCheck,
  Bookmark,
  FileEdit,
  Activity,
  ClipboardList,
} from 'lucide-react';
import useAuthStore from '../../stores/useAuthStore';

interface SidebarProps {
  isCollapsed: boolean;
  toggleCollapse: () => void;
  className?: string;
}

export default function Sidebar({ isCollapsed, toggleCollapse, className = '' }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuthStore() as any;

  // Dynamic menu sets based on active user role
  const getNavItems = () => {
    switch (user?.role) {
      case 'CANDIDATE':
        return [
          { name: 'Dashboard', href: '/', icon: LayoutDashboard },
          { name: 'Resume Analysis', href: '/candidate/resume-analysis', icon: Sparkles },
          { name: 'Resume Builder', href: '/candidate/resume-builder', icon: FileEdit },
          { name: 'ATS Score', href: '/candidate/ats-score', icon: TrendingUp },
          { name: 'Mock Interview', href: '/candidate/mock-interview', icon: Video },
          { name: 'Coding Assessment', href: '/candidate/assessments', icon: Code },
          { name: 'Applications', href: '/candidate/applications', icon: FileCheck },
          { name: 'Saved Jobs', href: '/candidate/saved-jobs', icon: Bookmark },
          { name: 'Profile', href: '/candidate/profile', icon: User },
          { name: 'Settings', href: '/candidate/settings', icon: Settings },
        ];
      case 'RECRUITER':
        return [
          { name: 'Dashboard', href: '/', icon: LayoutDashboard },
          { name: 'Jobs', href: '/recruiter/jobs', icon: Briefcase },
          { name: 'Candidates', href: '/recruiter/candidates', icon: Users },
          { name: 'Coding Assessments', href: '/recruiter/assessments', icon: Code },
          { name: 'Interview Reports', href: '/recruiter/interview-reports', icon: ClipboardList },
          { name: 'Analytics', href: '/recruiter/analytics', icon: BarChart3 },
          { name: 'Company Profile', href: '/recruiter/company-profile', icon: Building2 },
          { name: 'Settings', href: '/recruiter/settings', icon: Settings },
        ];
      case 'ADMIN':
        return [
          { name: 'Dashboard', href: '/', icon: LayoutDashboard },
          { name: 'User Management', href: '/admin/user-management', icon: Users },
          { name: 'Platform Analytics', href: '/admin/platform-analytics', icon: BarChart3 },
          { name: 'AI Usage', href: '/admin/ai-usage', icon: Cpu },
          { name: 'Audit Logs', href: '/admin/audit-logs', icon: History },
          { name: 'Monitoring', href: '/admin/monitoring', icon: Activity },
          { name: 'Architecture', href: '/architecture', icon: Cpu },
          { name: 'Design System', href: '/design-system', icon: Component },
        ];
      default:
        return [{ name: 'Dashboard', href: '/', icon: LayoutDashboard }];
    }
  };

  const navItems = getNavItems();

  return (
    <aside
      className={`bg-slate-950 text-slate-100 flex flex-col border-r border-slate-900 transition-all duration-300 relative select-none shrink-0 ${
        isCollapsed ? 'w-16' : 'w-64'
      } ${className}`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-slate-900 justify-between">
        {!isCollapsed && (
          <span className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent font-display animate-in fade-in duration-200">
            HireSense AI
          </span>
        )}
        <button
          onClick={toggleCollapse}
          className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-lg transition-colors ml-auto"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 relative group ${
                isActive
                  ? 'bg-slate-900 text-emerald-400 border-l-4 border-emerald-500 pl-2'
                  : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!isCollapsed && (
                <span className="animate-in fade-in duration-200 truncate">{item.name}</span>
              )}
              {isCollapsed && (
                <div className="absolute left-14 bg-slate-900 text-white text-xs px-2.5 py-1 rounded shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity font-bold z-50 whitespace-nowrap">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Profile Footer */}
      <div className="p-3 border-t border-slate-900 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-slate-900 shrink-0">
          {user?.name ? user.name[0] : 'U'}
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden animate-in fade-in duration-200">
            <p className="text-xs font-semibold text-slate-200 truncate">
              {user?.name || 'John Doe'}
            </p>
            <p className="text-[10px] text-slate-500 truncate">{user?.role || 'Guest'}</p>
          </div>
        )}
      </div>
    </aside>
  );
}
