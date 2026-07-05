import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, BrainCircuit, Component } from 'lucide-react';
import useAuthStore from '../stores/useAuthStore';

interface SidebarProps {
  className?: string;
}

export default function Sidebar({ className = '' }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuthStore() as any;

  const navigation = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'AI Interviews', href: '/interviews', icon: BrainCircuit },
    { name: 'Design System', href: '/design-system', icon: Component },
  ];

  return (
    <aside
      className={`w-64 bg-slate-950 text-slate-100 flex flex-col border-r border-slate-900 ${className}`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-slate-900 gap-2">
        <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent font-display">
          HireSense AI
        </span>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 py-6 px-4 space-y-1">
        {navigation.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-slate-900 text-emerald-400 border-l-4 border-emerald-500 pl-3'
                  : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Profile Footer */}
      <div className="p-4 border-t border-slate-900 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-slate-900 shrink-0">
          {user?.name ? user.name[0] : 'U'}
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-semibold text-slate-200 truncate">
            {user?.name || user?.email?.split('@')[0] || 'User'}
          </p>
          <p className="text-xs text-slate-500 truncate">{user?.role || 'Guest'}</p>
        </div>
      </div>
    </aside>
  );
}

