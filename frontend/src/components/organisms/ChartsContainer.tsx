import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './Card';

interface ChartsContainerProps {
  title: string;
  description?: string;
  type?: 'bar' | 'line';
}

export const ChartsContainer = ({ title, description, type = 'bar' }: ChartsContainerProps) => {
  return (
    <Card className="w-full bg-card">
      <CardHeader>
        <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="h-64 flex items-end justify-between gap-2 pt-8 select-none">
        {type === 'bar' ? (
          <>
            {/* Custom SVG bars with tooltips */}
            {[45, 60, 85, 30, 95, 50, 75].map((val, idx) => (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center gap-2 group h-full justify-end"
              >
                <div
                  className="w-full bg-primary/10 hover:bg-primary/20 rounded-t-md transition-all relative flex items-end justify-center"
                  style={{ height: `${val}%` }}
                >
                  <span className="opacity-0 group-hover:opacity-100 absolute -top-7 bg-slate-900 dark:bg-slate-800 text-white text-[10px] px-1.5 py-0.5 rounded shadow transition-opacity font-bold">
                    {val}%
                  </span>
                  <div className="w-full bg-primary rounded-t-md transition-all h-[25%] group-hover:h-full" />
                </div>
                <span className="text-[10px] text-muted-foreground font-semibold">M{idx + 1}</span>
              </div>
            ))}
          </>
        ) : (
          <div className="w-full h-full relative flex items-end">
            {/* Custom responsive SVG Line chart */}
            <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(99, 102, 241, 0.3)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="rgba(99, 102, 241, 0)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M 0 40 Q 20 20 40 30 T 80 10 T 100 20"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M 0 40 Q 20 20 40 30 T 80 10 T 100 20 L 100 50 L 0 50 Z"
                fill="url(#chartGrad)"
              />
            </svg>
            <div className="absolute inset-0 flex items-end justify-between text-[10px] text-muted-foreground/60 select-none pointer-events-none p-4">
              <span>Q1</span>
              <span>Q2</span>
              <span>Q3</span>
              <span>Q4</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ChartsContainer;
