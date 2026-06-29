import ChartsContainer from '@/components/organisms/ChartsContainer';

export default function AdminAIUsage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="text-3xl font-extrabold font-display text-foreground mb-1.5">
          AI Engine Token Usage
        </h1>
        <p className="text-muted-foreground text-sm">
          Monitor Gemini API invocation rates, text translation counts, and token quotes status.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <ChartsContainer
          title="Gemini AI Performance Tokens"
          type="bar"
          description="Token usage grouped by role."
        />
        <ChartsContainer
          title="Translation Invocation Requests"
          type="line"
          description="Hourly token query counts."
        />
      </div>
    </div>
  );
}
