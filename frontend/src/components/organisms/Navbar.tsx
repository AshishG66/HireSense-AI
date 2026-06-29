import { useState, useRef, useEffect } from 'react';
import { Bell, HelpCircle, Sun, Moon, Search } from 'lucide-react';
import useThemeStore from '../../stores/useThemeStore';
import NotificationsPanel from './NotificationsPanel';
import UserMenu from './UserMenu';
import Breadcrumbs from '../molecules/Breadcrumbs';
import { useLocation } from 'react-router-dom';

interface NavbarProps {
  onSearchClick: () => void;
  className?: string;
}

export default function Navbar({ onSearchClick, className = '' }: NavbarProps) {
  const { theme, toggleTheme } = useThemeStore();
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const location = useLocation();

  const notifyRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown drawers on backdrop clicking
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (notifyRef.current && !notifyRef.current.contains(e.target as Node)) {
        setIsNotifyOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Dynamically map path segments list to breadcrumbs
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbItems = pathSegments.map((segment, idx) => {
    const href = '/' + pathSegments.slice(0, idx + 1).join('/');
    const label = segment.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    return { label, href };
  });

  return (
    <header
      className={`h-16 bg-card border-b border-border flex items-center justify-between px-6 sticky top-0 z-40 select-none ${className}`}
    >
      {/* Breadcrumbs Navigation */}
      <div className="flex items-center gap-4">
        <Breadcrumbs
          items={breadcrumbItems.length > 0 ? breadcrumbItems : [{ label: 'Dashboard' }]}
        />
      </div>

      {/* Center Search Input Trigger */}
      <button
        onClick={onSearchClick}
        className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground text-xs font-medium transition-all w-60 select-none"
      >
        <Search className="w-3.5 h-3.5" />
        <span className="text-left flex-1">Search or type command...</span>
        <kbd className="px-1.5 py-0.5 text-[9px] font-bold bg-card border border-border rounded shadow-sm">
          Ctrl+K
        </kbd>
      </button>

      {/* Control panel buttons and profile */}
      <div className="flex items-center gap-3">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors text-muted-foreground"
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        {/* Notifications Panel */}
        <div className="relative" ref={notifyRef}>
          <button
            onClick={() => setIsNotifyOpen(!isNotifyOpen)}
            className={`p-2 hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors relative ${
              isNotifyOpen ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
            }`}
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full"></span>
          </button>
          <NotificationsPanel isOpen={isNotifyOpen} onClose={() => setIsNotifyOpen(false)} />
        </div>

        <button
          className="p-2 hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors text-muted-foreground"
          aria-label="Help"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <div className="h-6 w-px bg-border mx-1"></div>

        {/* User Profile Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-8 h-8 rounded-full bg-primary flex items-center justify-center font-bold text-white text-xs hover:ring-2 hover:ring-ring transition-all shrink-0"
            aria-label="User profile settings"
          >
            JD
          </button>
          <UserMenu isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
        </div>
      </div>
    </header>
  );
}
