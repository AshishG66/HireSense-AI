import ChartsContainer from '@/components/organisms/ChartsContainer';

export default function AdminPlatformAnalytics() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-extrabold font-display text-foreground mb-1.5">
          Platform Analytics
        </h1>
        <p className="text-muted-foreground text-sm">
          Review global platform server metrics and traffic reports.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ChartsContainer
          title="Global Platform API Traffic"
          type="line"
          description="Hourly API request distributions."
        />
        <ChartsContainer
          title="Platform Operations Load"
          type="bar"
          description="Server computation limits status."
        />
      </div>
    </div>
  );
}
