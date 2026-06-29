import { useEffect, useState } from 'react';
import { Search, Terminal, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommandPalette = ({ isOpen, onClose }: CommandPaletteProps) => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // Controlled externally in layout
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commands = [
    {
      label: 'Switch to Candidate Portal',
      action: () => {
        login({
          id: '1',
          name: 'Alice Candidate',
          email: 'candidate@hiresense.ai',
          role: 'CANDIDATE',
        });
        navigate('/');
        onClose();
      },
    },
    {
      label: 'Switch to Recruiter Portal',
      action: () => {
        login({
          id: '2',
          name: 'Bob Recruiter',
          email: 'recruiter@hiresense.ai',
          role: 'RECRUITER',
        });
        navigate('/');
        onClose();
      },
    },
    {
      label: 'Switch to Admin Portal',
      action: () => {
        login({ id: '3', name: 'System Admin', email: 'admin@hiresense.ai', role: 'ADMIN' });
        navigate('/');
        onClose();
      },
    },
    {
      label: 'Go to Design System Catalog',
      action: () => {
        navigate('/design-system');
        onClose();
      },
    },
    {
      label: 'Go to AI Interviews Board',
      action: () => {
        navigate('/interviews');
        onClose();
      },
    },
  ];

  const filtered = commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="fixed inset-0" onClick={onClose} />
      <div className="w-full max-w-xl bg-card border border-border shadow-2xl rounded-xl overflow-hidden relative animate-in zoom-in-95 duration-200 z-10">
        <div className="flex items-center px-4 border-b border-border">
          <Search className="w-5 h-5 text-muted-foreground mr-3 shrink-0" />
          <input
            autoFocus
            type="text"
            placeholder="Type a command to navigate or switch roles..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full py-4 bg-transparent border-0 focus:ring-0 outline-none text-foreground placeholder-muted-foreground/50 text-sm"
          />
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-bold bg-muted border border-border text-muted-foreground rounded shadow-sm select-none">
            ESC
          </kbd>
        </div>

        <div className="max-h-72 overflow-y-auto p-2 space-y-0.5">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No results found for "{query}"
            </div>
          ) : (
            filtered.map((cmd, idx) => (
              <button
                key={idx}
                onClick={cmd.action}
                className="w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm text-left text-foreground hover:bg-accent hover:text-accent-foreground transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Terminal className="w-4 h-4 text-muted-foreground/60 group-hover:text-accent-foreground" />
                  <span>{cmd.label}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground/40 opacity-0 group-hover:opacity-100 group-hover:text-accent-foreground transition-all shrink-0" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CommandPalette;
