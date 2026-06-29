import { Bell, HelpCircle, Sun, Moon } from 'lucide-react';
import useThemeStore from '../stores/useThemeStore';

interface NavbarProps {
  className?: string;
}

export default function Navbar({ className = '' }: NavbarProps) {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <header
      className={`h-16 bg-card border-b border-border flex items-center justify-between px-8 shadow-sm ${className}`}
    >
      {/* Workspace indicator */}
      <div>
        <span className="text-sm font-medium text-muted-foreground">
          Workspace: Main Recruitment Team
        </span>
      </div>

      {/* Control panel buttons and profile */}
      <div className="flex items-center gap-4 text-muted-foreground">
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className="p-2 hover:bg-accent hover:text-accent-foreground rounded-full transition-colors text-muted-foreground"
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>

        <button
          className="p-2 hover:bg-accent hover:text-accent-foreground rounded-full transition-colors relative"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full"></span>
        </button>

        <button
          className="p-2 hover:bg-accent hover:text-accent-foreground rounded-full transition-colors"
          aria-label="Help"
        >
          <HelpCircle className="w-5 h-5" />
        </button>

        <div className="h-6 w-px bg-border"></div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Recruiter Admin</span>
        </div>
      </div>
    </header>
  );
}
