import ChartsContainer from '@/components/organisms/ChartsContainer';

export default function RecruiterAnalytics() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-extrabold font-display text-foreground mb-1.5">
          Recruitment Analytics
        </h1>
        <p className="text-muted-foreground text-sm">
          Review metrics tracking, candidate conversion funnel rates, and AI grading parameters.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ChartsContainer
          title="Applicant Evaluation Funnel"
          type="bar"
          description="Monthly candidate registration metrics."
        />
        <ChartsContainer
          title="Convert Ratios"
          type="line"
          description="Hourly interview schedule conversion logs."
        />
      </div>
    </div>
  );
}
