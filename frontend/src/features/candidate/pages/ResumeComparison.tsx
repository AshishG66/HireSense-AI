import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Scale,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/organisms/Card';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Select } from '@/components/atoms/Select';
import Skeleton from '@/components/atoms/Skeleton';
import Toast from '@/components/molecules/Toast';
import api from '../../../utils/api';

export default function ResumeComparison() {
  const [resumes, setResumes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected values
  const [ver1Id, setVer1Id] = useState('');
  const [ver2Id, setVer2Id] = useState('');

  const [ver1Data, setVer1Data] = useState<any>(null);
  const [ver2Data, setVer2Data] = useState<any>(null);

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
  };

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        setLoading(true);
        const res = await api.get('/resumes');
        const data = res.data.data || [];
        setResumes(data);

        // Pre-select first two versions if possible
        const allVersions: any[] = [];
        data.forEach((r: any) => {
          r.versions?.forEach((v: any) => {
            allVersions.push({ ...v, resumeTitle: r.title });
          });
        });

        if (allVersions.length > 0) {
          setVer1Id(allVersions[0].id);
          setVer1Data(allVersions[0]);
          if (allVersions.length > 1) {
            setVer2Id(allVersions[1].id);
            setVer2Data(allVersions[1]);
          }
        }
      } catch (err: any) {
        triggerToast('Failed to fetch resumes: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };
    fetchResumes();
  }, []);

  const handleSelectVer1 = (val: string) => {
    setVer1Id(val);
    const ver = findVersion(val);
    setVer1Data(ver);
  };

  const handleSelectVer2 = (val: string) => {
    setVer2Id(val);
    const ver = findVersion(val);
    setVer2Data(ver);
  };

  const findVersion = (verId: string) => {
    for (const r of resumes) {
      const v = r.versions?.find((item: any) => item.id === verId);
      if (v) return { ...v, resumeTitle: r.title };
    }
    return null;
  };

  // Compile list of options for Select dropdown
  const getVersionOptions = () => {
    const options: { value: string; label: string }[] = [];
    resumes.forEach((r: any) => {
      r.versions?.forEach((v: any) => {
        options.push({
          value: v.id,
          label: `${r.title} (v${v.versionNumber}) - ${new Date(v.createdAt).toLocaleDateString()}`,
        });
      });
    });
    return options;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48 animate-pulse" />
        <div className="grid grid-cols-2 gap-8">
          <Skeleton className="h-64 w-full animate-pulse" />
          <Skeleton className="h-64 w-full animate-pulse" />
        </div>
      </div>
    );
  }

  const score1 = ver1Data?.analysis?.matchScore || 0;
  const score2 = ver2Data?.analysis?.matchScore || 0;
  const diff = score2 - score1;

  const breakdown1 = ver1Data?.analysis?.details?.atsBreakdown || {};
  const breakdown2 = ver2Data?.analysis?.details?.atsBreakdown || {};

  const categories = [
    { key: 'formatting', label: 'Formatting' },
    { key: 'keywords', label: 'Keywords & Match' },
    { key: 'experience', label: 'Work Experience' },
    { key: 'projects', label: 'Projects' },
    { key: 'skills', label: 'Skills Volume' },
    { key: 'education', label: 'Education' },
    { key: 'grammar', label: 'Grammar' },
    { key: 'completeness', label: 'Completeness' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {showToast && (
        <Toast
          message={toastMsg}
          onClose={() => setShowToast(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/"
          className="p-2 hover:bg-accent rounded-lg text-muted-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-foreground mb-1 flex items-center gap-2">
            <Scale className="w-6 h-6 text-primary" /> Resume Comparison Workspace
          </h1>
          <p className="text-xs text-muted-foreground">
            Compare two versions side-by-side to track keywords matching progress and score increases.
          </p>
        </div>
      </div>

      {/* Selectors card */}
      <Card className="bg-gradient-to-br from-indigo-500/5 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* Version 1 Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Select Base Version (Left)
              </label>
              <Select
                value={ver1Id}
                onChange={(e) => handleSelectVer1(e.target.value)}
                options={getVersionOptions()}
              />
            </div>

            {/* Version 2 Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                Select Comparison Version (Right)
              </label>
              <Select
                value={ver2Id}
                onChange={(e) => handleSelectVer2(e.target.value)}
                options={getVersionOptions()}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Grid */}
      {ver1Data && ver2Data ? (
        <div className="space-y-8">
          {/* Main Score Comparison Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {/* Base Score */}
            <Card className="text-center p-6 bg-card flex flex-col justify-center items-center">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                {ver1Data.resumeTitle} (v{ver1Data.versionNumber})
              </p>
              <p className="text-6xl font-black text-foreground mt-4 mb-2">{score1}/100</p>
              <Badge variant={score1 >= 80 ? 'success' : score1 >= 60 ? 'warning' : 'destructive'}>
                {score1 >= 80 ? 'Optimized' : score1 >= 60 ? 'Gaps Present' : 'Under-optimized'}
              </Badge>
            </Card>

            {/* Performance Diff Card */}
            <Card className="text-center p-6 bg-gradient-to-br from-secondary/40 to-accent/20 flex flex-col justify-center items-center">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                ATS Score Delta
              </p>
              {diff > 0 ? (
                <div className="text-emerald-500 flex flex-col items-center mt-3">
                  <TrendingUp className="w-12 h-12" />
                  <p className="text-4xl font-extrabold mt-1">+{diff} Points</p>
                  <p className="text-xs text-emerald-500/80 font-bold mt-1">Version Improved!</p>
                </div>
              ) : diff < 0 ? (
                <div className="text-rose-500 flex flex-col items-center mt-3">
                  <TrendingDown className="w-12 h-12" />
                  <p className="text-4xl font-extrabold mt-1">{diff} Points</p>
                  <p className="text-xs text-rose-500/80 font-bold mt-1">Score Decreased</p>
                </div>
              ) : (
                <div className="text-muted-foreground flex flex-col items-center mt-3">
                  <p className="text-4xl font-extrabold mt-1">No Change</p>
                  <p className="text-xs text-muted-foreground font-bold mt-1">Scores are Equal</p>
                </div>
              )}
            </Card>

            {/* Compare Score */}
            <Card className="text-center p-6 bg-card flex flex-col justify-center items-center">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                {ver2Data.resumeTitle} (v{ver2Data.versionNumber})
              </p>
              <p className="text-6xl font-black text-foreground mt-4 mb-2">{score2}/100</p>
              <Badge variant={score2 >= 80 ? 'success' : score2 >= 60 ? 'warning' : 'destructive'}>
                {score2 >= 80 ? 'Optimized' : score2 >= 60 ? 'Gaps Present' : 'Under-optimized'}
              </Badge>
            </Card>
          </div>

          {/* ATS Category Breakdown comparison */}
          <Card>
            <CardHeader>
              <CardTitle>ATS Metrics Comparison Breakdown</CardTitle>
              <CardDescription>
                Compare individual sub-sections to see where details were improved or omitted.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {categories.map((cat) => {
                const val1 = breakdown1[cat.key] || 0;
                const val2 = breakdown2[cat.key] || 0;
                const diffVal = val2 - val1;
                return (
                  <div key={cat.key} className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-foreground">
                      <span>{cat.label}</span>
                      <div className="flex gap-4">
                        <span>v{ver1Data.versionNumber}: <b className="text-muted-foreground">{val1}%</b></span>
                        <span>v{ver2Data.versionNumber}: <b className="text-primary">{val2}%</b></span>
                        {diffVal > 0 ? (
                          <span className="text-emerald-500">+{diffVal}%</span>
                        ) : diffVal < 0 ? (
                          <span className="text-rose-500">{diffVal}%</span>
                        ) : (
                          <span className="text-muted-foreground">0%</span>
                        )}
                      </div>
                    </div>
                    {/* Double stacked compare progress bar */}
                    <div className="h-3 w-full bg-secondary rounded-full overflow-hidden relative flex flex-col">
                      <div className="absolute inset-y-0 left-0 bg-muted-foreground/30 rounded-full h-1.5 top-0" style={{ width: `${val1}%` }} />
                      <div className="absolute inset-y-0 left-0 bg-primary rounded-full h-1.5 bottom-0" style={{ width: `${val2}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Side-by-side comparison tables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Version 1 Details */}
            <Card>
              <CardHeader className="bg-secondary/20 rounded-t-xl border-b border-border">
                <CardTitle className="text-base text-muted-foreground">
                  Base Version (v{ver1Data.versionNumber})
                </CardTitle>
                <CardDescription>{ver1Data.fileName}</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6 text-sm leading-relaxed">
                <div>
                  <h4 className="font-bold text-foreground mb-2">Strengths</h4>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground">
                    {ver1Data.analysis?.strengths?.map((s: string, idx: number) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-2">Improvements Needed</h4>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground">
                    {ver1Data.analysis?.improvements?.map((s: string, idx: number) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-2">Extracted Keywords</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {ver1Data.analysis?.skillsMatched?.map((s: string, idx: number) => (
                      <Badge key={idx} variant="success" className="text-[10px]">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Version 2 Details */}
            <Card>
              <CardHeader className="bg-primary/5 rounded-t-xl border-b border-border">
                <CardTitle className="text-base text-primary">
                  Comparison Version (v{ver2Data.versionNumber})
                </CardTitle>
                <CardDescription>{ver2Data.fileName}</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6 text-sm leading-relaxed">
                <div>
                  <h4 className="font-bold text-foreground mb-2">Strengths</h4>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground">
                    {ver2Data.analysis?.strengths?.map((s: string, idx: number) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-2">Improvements Needed</h4>
                  <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground">
                    {ver2Data.analysis?.improvements?.map((s: string, idx: number) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold text-foreground mb-2">Extracted Keywords</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {ver2Data.analysis?.skillsMatched?.map((s: string, idx: number) => (
                      <Badge key={idx} variant="success" className="text-[10px]">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <div className="text-center p-12 text-sm text-muted-foreground bg-secondary/20 border border-border rounded-xl">
          Please upload multiple resume versions to view side-by-side comparison overlays.
        </div>
      )}
    </div>
  );
}
