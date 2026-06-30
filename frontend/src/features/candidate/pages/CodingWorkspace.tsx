import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Card,
} from '@/components/organisms/Card';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';

import Toast from '@/components/molecules/Toast';
import {
  Terminal,
  Clock,
  Sparkles,
  ChevronLeft,
  RefreshCw,
  Lightbulb,
} from 'lucide-react';
import api from '../../../utils/api';

export default function CodingWorkspace() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const testId = searchParams.get('testId');
  const navigate = useNavigate();

  // Problem metadata
  const [question, setQuestion] = useState<any>(null);
  const [, setLanguages] = useState<any[]>([]);
  const [selectedLang, setSelectedLang] = useState('javascript');
  const [loading, setLoading] = useState(true);

  // Coding variables
  const [code, setCode] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [unsaved, setUnsaved] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Action states
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'hints' | 'editorial'>('description');

  // Console output
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [consoleOutput, setConsoleOutput] = useState<any>(null);
  const [aiReview, setAiReview] = useState<any>(null);

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  const timerRef = useRef<any>(null);
  const autoSaveRef = useRef<any>(null);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
  };

  // Language default boilerplates mapping
  const boilerplates: Record<string, string> = {
    javascript: `// Write your JavaScript solution\nfunction solve(nums, target) {\n    // Implement your algorithm here\n    return [0, 1];\n}`,
    python: `# Write your Python 3 solution\ndef solve(nums, target):\n    # Implement logic\n    return [0, 1]`,
    java: `// Write your Java solution\npublic class Solution {\n    public int[] solve(int[] nums, int target) {\n        return new int[]{0, 1};\n    }\n}`,
    cpp: `// Write your C++ solution\n#include <vector>\nusing namespace std;\nclass Solution {\npublic:\n    vector<int> solve(vector<int>& nums, int target) {\n        return {0, 1};\n    }\n};`,
    c: `// Write your C solution\nint* solve(int* nums, int numsSize, int target, int* returnSize) {\n    int* result = (int*)malloc(2 * sizeof(int));\n    result[0] = 0; result[1] = 1;\n    *returnSize = 2;\n    return result;\n}`,
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [questRes, langRes] = await Promise.all([
          api.get(`/assessments/candidate/questions/${id}`),
          api.get('/assessments/languages'),
        ]);
        setQuestion(questRes.data.data);
        setLanguages(langRes.data.data || []);
        
        // Load initial boilerplate
        setCode(boilerplates.javascript);
      } catch (err: any) {
        triggerToast('Failed to load workspace data: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchData();
  }, [id]);

  // Workspace Timer loops
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // 10 Seconds Auto save trigger
  useEffect(() => {
    autoSaveRef.current = setInterval(() => {
      if (unsaved && question) {
        localStorage.setItem(`save_code_${question.id}_${selectedLang}`, code);
        setUnsaved(false);
        triggerToast('Code state auto-saved (10s checkpoint)');
      }
    }, 10000);

    return () => clearInterval(autoSaveRef.current);
  }, [code, unsaved, question, selectedLang]);

  const handleLangChange = (lang: string) => {
    setSelectedLang(lang);
    const cached = localStorage.getItem(`save_code_${question?.id}_${lang}`);
    setCode(cached || boilerplates[lang] || '');
    setUnsaved(false);
  };

  const handleCodeChange = (val: string) => {
    setCode(val);
    setUnsaved(true);
  };

  const handleRunCode = async () => {
    try {
      setRunning(true);
      setConsoleOpen(true);
      setConsoleOutput({ status: 'RUNNING', details: 'Compiling standard definitions...' });
      
      const res = await api.post(`/assessments/candidate/questions/${id}/run`, {
        code,
        languageCode: selectedLang,
        input: customInput || question.testCases?.[0]?.input || '2,7,11,15\n9',
      });
      setConsoleOutput(res.data.data);
    } catch (err: any) {
      setConsoleOutput({
        status: 'COMPILE_ERROR',
        stderr: err.response?.data?.message || err.message,
      });
    } finally {
      setRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    try {
      setSubmitting(true);
      setConsoleOpen(true);
      setConsoleOutput({ status: 'RUNNING', details: 'Grading solution code against test cases...' });
      setAiReview(null);

      const res = await api.post(`/assessments/candidate/questions/${id}/submit`, {
        code,
        languageCode: selectedLang,
        codingTestId: testId || undefined,
      });

      const submission = res.data.data;
      setConsoleOutput(submission);
      triggerToast(`Grading complete! Status: ${submission.status}`);

      // Async fetch review history after submission
      setTimeout(async () => {
        try {
          await api.get(`/assessments/candidate/questions/${id}`);
          // Retrieve last submission review
          const subList = await api.get('/assessments/candidate/dashboard');
          const lastSub = subList.data.data.submissionHistory[0];
          if (lastSub && lastSub.aiFeedback) {
            setAiReview(lastSub.aiFeedback);
          }
        } catch (err) {
          loggerError('Failed to retrieve background AI review');
        }
      }, 3000);

    } catch (err: any) {
      setConsoleOutput({
        status: 'COMPILE_ERROR',
        stderr: err.response?.data?.message || err.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatElapsedTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  const loggerError = (msg: string) => {
    console.error(msg);
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse p-10 text-center">
        <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
        <h3 className="text-xl font-bold">Bootstrapping Workspace...</h3>
        <p className="text-xs text-slate-500">Checking environment limits and test specifications.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-xs select-none">
      {showToast && <Toast message={toastMsg} onClose={() => setShowToast(false)} />}

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate('/candidate/assessments')}
            className="h-8 p-2"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Academy
          </Button>
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              {question.title}
              <Badge
                variant={
                  question.difficulty === 'HARD'
                    ? 'destructive'
                    : question.difficulty === 'MEDIUM'
                    ? 'warning'
                    : 'success'
                }
              >
                {question.difficulty}
              </Badge>
            </h2>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Category: <b>{question.category}</b> &bull; Time Limit: {question.timeLimit}ms
            </p>
          </div>
        </div>

        {/* Timer and Auto Save indicators */}
        <div className="flex items-center gap-4">
          <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-primary" /> {formatElapsedTime(elapsedTime)}
          </span>

          <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${unsaved ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
            {unsaved ? 'Unsaved Changes' : 'Saved'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Side: Description / Hints / Editorial */}
        <div className="lg:col-span-5 space-y-4 flex flex-col justify-start">
          <div className="flex border-b border-border/40 pb-1.5 gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('description')}
              className={`pb-1.5 px-3 font-bold border-b-2 text-xs transition-colors ${
                activeTab === 'description' ? 'border-primary text-primary' : 'border-transparent text-slate-500'
              }`}
            >
              Description
            </button>
            <button
              onClick={() => setActiveTab('hints')}
              className={`pb-1.5 px-3 font-bold border-b-2 text-xs transition-colors ${
                activeTab === 'hints' ? 'border-primary text-primary' : 'border-transparent text-slate-500'
              }`}
            >
              Hints
            </button>
            <button
              onClick={() => setActiveTab('editorial')}
              className={`pb-1.5 px-3 font-bold border-b-2 text-xs transition-colors ${
                activeTab === 'editorial' ? 'border-primary text-primary' : 'border-transparent text-slate-500'
              }`}
            >
              Editorial
            </button>
          </div>

          <Card className="flex-1 bg-card overflow-y-auto p-5 text-slate-300 leading-relaxed max-h-[600px] border border-border/40">
            {activeTab === 'description' && (
              <div className="space-y-4">
                <p className="text-xs">{question.description}</p>

                {/* Public test cases details */}
                <div className="space-y-3 pt-3 border-t border-border/30">
                  <p className="font-bold text-foreground text-xs uppercase tracking-wider">
                    Public Test Cases
                  </p>
                  {question.testCases
                    ?.filter((t: any) => !t.isHidden)
                    .map((tc: any, index: number) => (
                      <div key={index} className="p-3 bg-secondary/15 rounded-xl border border-border/30 space-y-2">
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Input</p>
                          <pre className="font-mono text-[10px] text-foreground bg-secondary/20 p-1.5 rounded-lg mt-0.5 whitespace-pre-wrap">
                            {tc.input}
                          </pre>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Expected Output</p>
                          <pre className="font-mono text-[10px] text-foreground bg-secondary/20 p-1.5 rounded-lg mt-0.5">
                            {tc.expectedOutput}
                          </pre>
                        </div>
                        {tc.explanation && (
                          <p className="text-[10px] italic text-slate-400 mt-1">
                            Explanation: {tc.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {activeTab === 'hints' && (
              <div className="space-y-4">
                <p className="font-bold text-foreground">Algorithmic Hints</p>
                {question.hints?.length > 0 ? (
                  question.hints.map((hint: string, index: number) => (
                    <div key={index} className="p-3 bg-secondary/15 rounded-xl border border-border/30 flex gap-2">
                      <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-[11px]">{hint}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-slate-500 italic">No hints configured for this problem.</p>
                )}
              </div>
            )}

            {activeTab === 'editorial' && (
              <div className="space-y-4">
                <p className="font-bold text-foreground">Recommended Editorial Approach</p>
                {question.editorial ? (
                  <p className="text-xs leading-relaxed">{question.editorial}</p>
                ) : (
                  <p className="text-slate-500 italic">Editorial solution is not available yet.</p>
                )}
              </div>
            )}
          </Card>
        </div>

        {/* Right Side: Language select, Text Editor, and output console */}
        <div className="lg:col-span-7 space-y-4 flex flex-col justify-start">
          <div className="flex justify-between items-center shrink-0">
            <select
              value={selectedLang}
              onChange={(e) => handleLangChange(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-[10px] rounded p-1 text-slate-200 focus:outline-none focus:border-primary font-sans"
            >
              <option value="javascript">JavaScript (Node)</option>
              <option value="python">Python 3</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
              <option value="c">C</option>
            </select>

            <span className="text-[10px] uppercase text-muted-foreground font-bold">
              Sandbox Playground
            </span>
          </div>

          {/* Styled Text Code Editor */}
          <div className="relative border border-border/40 rounded-xl overflow-hidden bg-slate-950 font-mono text-xs flex-1 min-h-[300px]">
            <textarea
              value={code}
              onChange={(e) => handleCodeChange(e.target.value)}
              className="w-full h-full min-h-[300px] bg-transparent text-slate-200 p-4 resize-none border-none outline-none focus:ring-0 leading-relaxed font-mono"
              spellCheck="false"
              placeholder="// Write code here..."
            />
          </div>

          {/* Action buttons run custom/submit code */}
          <div className="flex justify-between items-center gap-4 shrink-0">
            <Button
              variant="outline"
              onClick={() => setConsoleOpen(!consoleOpen)}
              className="flex items-center gap-1.5"
            >
              <Terminal className="w-4 h-4 text-primary" /> Output Console
            </Button>

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleRunCode} disabled={running || submitting}>
                {running ? 'Executing...' : 'Run Code'}
              </Button>
              <Button variant="primary" onClick={handleSubmitCode} disabled={running || submitting}>
                {submitting ? 'Submitting...' : 'Submit Solution'}
              </Button>
            </div>
          </div>

          {/* Console Drawer & AI Review */}
          {consoleOpen && (
            <Card className="bg-slate-950 border border-border/40 p-4 font-mono text-xs space-y-4">
              <div className="border-b border-border/30 pb-2 flex justify-between items-center">
                <span className="font-bold text-slate-400 flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-primary" /> Execution Output Console
                </span>
                <button onClick={() => setConsoleOpen(false)} className="text-slate-500 hover:text-white font-sans text-xs">
                  Hide
                </button>
              </div>

              {/* Console log outputs */}
              {consoleOutput && (
                <div className="space-y-2 bg-secondary/10 p-3 rounded-lg border border-border/30 max-h-[200px] overflow-y-auto">
                  {consoleOutput.status === 'RUNNING' ? (
                    <p className="text-slate-400 animate-pulse">{consoleOutput.details}</p>
                  ) : consoleOutput.status === 'COMPILE_ERROR' ? (
                    <p className="text-rose-500 whitespace-pre-wrap">{consoleOutput.stderr}</p>
                  ) : consoleOutput.status === 'ACCEPTED' ? (
                    <div className="space-y-1">
                      <p className="text-emerald-500 font-bold">ACCEPTED &bull; {consoleOutput.score}% Passed</p>
                      <p className="text-[10px] text-slate-400">
                        Runtime: {consoleOutput.executionTime}ms &bull; Memory: {consoleOutput.memoryUsage}kb
                      </p>
                    </div>
                  ) : consoleOutput.status === 'WRONG_ANSWER' ? (
                    <div className="space-y-1">
                      <p className="text-amber-500 font-bold">WRONG ANSWER &bull; {consoleOutput.score}% Passed</p>
                    </div>
                  ) : (
                    <div className="space-y-1 text-slate-300">
                      <p className="font-bold text-emerald-500">Output: "{consoleOutput.actualOutput}"</p>
                      {consoleOutput.stdout && <p className="text-[10px] text-slate-500">Stdout: {consoleOutput.stdout}</p>}
                    </div>
                  )}
                </div>
              )}

              {/* Custom execution input text */}
              <div className="space-y-1.5 font-sans">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Custom Input Test Cases
                </label>
                <textarea
                  className="w-full h-12 bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none"
                  placeholder="e.g. 2,7,11,15\n9"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                />
              </div>

              {/* Asynchronous Gemini AI Code Review panel */}
              {aiReview && (
                <div className="pt-2 border-t border-border/30 font-sans space-y-4">
                  <div className="flex items-center gap-1.5 text-primary">
                    <Sparkles className="w-4.5 h-4.5 text-primary animate-pulse" />
                    <span className="font-bold text-xs uppercase tracking-wider">Gemini AI Code Diagnostics</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                    {/* Time Complexity */}
                    <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl space-y-1">
                      <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Time Complexity</span>
                      <p className="font-semibold text-indigo-400">{aiReview.time_complexity}</p>
                    </div>

                    {/* Space Complexity */}
                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl space-y-1">
                      <span className="font-bold text-slate-400 uppercase tracking-widest text-[9px]">Space Complexity</span>
                      <p className="font-semibold text-emerald-400">{aiReview.space_complexity}</p>
                    </div>
                  </div>

                  <div className="space-y-3 text-[11px] leading-relaxed">
                    {/* Alternative approach description */}
                    <div>
                      <p className="font-bold text-slate-300">Alternative Strategy</p>
                      <p className="text-slate-400">{aiReview.alternative_approach}</p>
                    </div>

                    {/* Optimizations recommendations */}
                    {aiReview.optimization_suggestions?.length > 0 && (
                      <div className="space-y-1">
                        <p className="font-bold text-slate-300">Optimization Suggestions</p>
                        <ul className="list-disc pl-4 space-y-1 text-slate-400">
                          {aiReview.optimization_suggestions.map((opt: string, idx: number) => (
                            <li key={idx}>{opt}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Missed edge cases checklist */}
                    {aiReview.edge_cases_missed?.length > 0 && (
                      <div className="space-y-1">
                        <p className="font-bold text-slate-300">Edge Cases to Consider</p>
                        <ul className="list-disc pl-4 space-y-1 text-slate-400">
                          {aiReview.edge_cases_missed.map((edge: string, idx: number) => (
                            <li key={idx}>{edge}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
