import { LogOut, User, Users, ShieldAlert } from 'lucide-react';
import { useAuthStore } from '../../stores/useAuthStore';

interface UserMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserMenu = ({ isOpen, onClose }: UserMenuProps) => {
  if (!isOpen) return null;

  const { user, login } = useAuthStore() as any;

  const roles = [
    {
      label: 'Candidate Portal',
      icon: <User className="w-4 h-4" />,
      role: 'CANDIDATE',
      name: 'Alice Candidate',
      email: 'candidate@hiresense.ai',
    },
    {
      label: 'Recruiter Portal',
      icon: <Users className="w-4 h-4" />,
      role: 'RECRUITER',
      name: 'Bob Recruiter',
      email: 'recruiter@hiresense.ai',
    },
    {
      label: 'Admin Portal',
      icon: <ShieldAlert className="w-4 h-4" />,
      role: 'ADMIN',
      name: 'System Admin',
      email: 'admin@hiresense.ai',
    },
  ];

  const handleRoleSwitch = (r: (typeof roles)[0]) => {
    login({ id: r.role, name: r.name, email: r.email, role: r.role });
    onClose();
  };

  const logout = useAuthStore((state: any) => state.logout);

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-3 duration-200">
      <div className="p-3 border-b border-border text-xs">
        <p className="font-semibold text-foreground">{user?.name || 'Jane Doe'}</p>
        <p className="text-muted-foreground/80">{user?.email || 'jane@example.com'}</p>
      </div>
      <div className="p-1 space-y-0.5 border-b border-border">
        <span className="block px-3 py-1.5 text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest select-none">
          Switch Workspace
        </span>
        {roles.map((r) => {
          const isActive = user?.role === r.role;
          return (
            <button
              key={r.role}
              onClick={() => handleRoleSwitch(r)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs transition-colors ${
                isActive
                   ? 'bg-primary/10 text-primary font-bold'
                  : 'text-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              {r.icon}
              <span>{r.label}</span>
            </button>
          );
        })}
      </div>
      <div className="p-1">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs text-destructive hover:bg-destructive/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};

export default UserMenu;
