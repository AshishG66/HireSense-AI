import { twMerge } from 'tailwind-merge';

interface TabItem {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs = ({ tabs, activeTab, onChange, className = '' }: TabsProps) => {
  return (
    <div className={twMerge('flex border-b border-border gap-1', className)}>
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={twMerge(
              'px-4 py-2.5 text-sm font-semibold border-b-2 border-transparent text-muted-foreground hover:text-foreground transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-t-lg',
              isActive && 'border-primary text-foreground bg-primary/5',
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

export default Tabs;
