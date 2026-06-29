import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/organisms/Card';
import { Badge } from '@/components/atoms/Badge';
import { Button } from '@/components/atoms/Button';
import Skeleton from '@/components/atoms/Skeleton';
import { Trophy, AlertCircle, FileText, LayoutGrid } from 'lucide-react';
import api from '../../../utils/api';

export default function ATSScore() {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<any>(null);
  const [defaultVersion, setDefaultVersion] = useState<any>(null);

  useEffect(() => {
    const fetchLatestATS = async () => {
      try {
        setLoading(true);
        const res = await api.get('/resumes');
        const list = res.data.data || [];
        // Find default resume or first
        const defaultResume = list.find((r: any) => r.isDefault) || list[0];
        if (defaultResume && defaultResume.versions?.length > 0) {
          const latestVer = defaultResume.versions[0];
          setDefaultVersion(latestVer);
          setAnalysis(latestVer.analysis);
        }
      } catch (err) {
        console.error('Failed to load ATS details:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLatestATS();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 animate-pulse" />
        <div className="grid grid-cols-3 gap-8">
          <Skeleton className="h-64 col-span-1 animate-pulse" />
          <Skeleton className="h-64 col-span-2 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center py-16 space-y-4">
        <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground">
          <FileText className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-foreground">No Resumes Analyzed Yet</h2>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Upload and run matching evaluations on a resume version first to generate your ATS score dashboard.
        </p>
        <Link to="/candidate/resume-analysis">
          <Button className="mt-2">Go to Upload</Button>
        </Link>
      </div>
    );
  }

  const breakdown = analysis.details?.atsBreakdown || {};
  const score = breakdown.total || analysis.matchScore || 0;

  // Compile formatting and grammar recommendations
  const suggestions: { title: string; desc: string; impact: string }[] = [];
  analysis.details?.formatting_issues?.forEach((issue: string) => {
    suggestions.push({
      title: 'Formatting Optimization',
      desc: issue,
      impact: 'High Impact',
    });
  });
  analysis.details?.grammar_issues?.forEach((issue: string) => {
    suggestions.push({
      title: 'Grammar and Phrasing',
      desc: issue,
      impact: 'Medium Impact',
    });
  });
  analysis.skillsMissing?.forEach((skill: string) => {
    suggestions.push({
      title: 'Missing Keyword / Skill',
      desc: `Add target skill "${skill}" to your skills grid or experiences.`,
      impact: 'High Impact',
    });
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-display text-foreground mb-1.5 flex items-center gap-2">
            <Trophy className="w-8 h-8 text-primary" /> ATS Score Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">
            Review detailed parser metrics extracted from your default resume: <b>{defaultVersion?.fileName}</b>
          </p>
        </div>
        <Link to="/candidate/resume-analysis">
          <Button variant="outline">
            Upload & Compare versions
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Metric Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="text-center p-6 bg-gradient-to-br from-indigo-500/10 to-emerald-500/10 border-primary/20 bg-card">
            <CardHeader className="items-center pb-2">
              <Trophy className="w-12 h-12 text-emerald-500 mb-2" />
              <CardTitle className="text-lg font-bold">Overall ATS Score</CardTitle>
              <CardDescription>Generated from latest uploaded version.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-6xl font-black font-display text-gradient">{score}/100</p>
              <Badge variant={score >= 80 ? 'success' : score >= 60 ? 'warning' : 'destructive'}>
                {score >= 80 ? 'Optimized' : score >= 60 ? 'Gaps Detected' : 'Action Required'}
              </Badge>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {score >= 80
                  ? 'Your resume meets structural readability requirements and keyword volume filters for top applicant trackers.'
                  : 'Your resume has spacing or content gaps. Implement the recommendations on the right to optimize indexing rates.'}
              </p>
            </CardContent>
          </Card>

          {/* Sub category score breakdowns */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-primary" /> Subcategories
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: 'Formatting', val: breakdown.formatting || 100 },
                { label: 'Keywords', val: breakdown.keywords || 75 },
                { label: 'Experience', val: breakdown.experience || 60 },
                { label: 'Projects', val: breakdown.projects || 50 },
                { label: 'Skills volume', val: breakdown.skills || 60 },
                { label: 'Education', val: breakdown.education || 100 },
                { label: 'Grammar', val: breakdown.grammar || 100 },
                { label: 'Completeness', val: breakdown.completeness || 80 },
              ].map((item, idx) => (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="text-foreground">{item.val}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${item.val}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Feedback List Card */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Priority Improvements</CardTitle>
              <CardDescription>
                Address these items to maximize search indexing rates.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 divide-y divide-border/40">
              {suggestions.length > 0 ? (
                suggestions.map((item, idx) => (
                  <div key={idx} className="pt-4 first:pt-0 flex gap-4 text-sm leading-relaxed">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-primary">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-semibold text-foreground">{item.title}</p>
                        <Badge variant={item.impact === 'High Impact' ? 'destructive' : 'warning'}>
                          {item.impact}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-xs">{item.desc}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-xs text-muted-foreground">
                  Perfect formatting! No structural or grammar adjustments required.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
