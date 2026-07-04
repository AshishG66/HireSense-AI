import { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/organisms/Card';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { Input } from '@/components/atoms/Input';

import Skeleton from '@/components/atoms/Skeleton';
import Toast from '@/components/molecules/Toast';
import {
  Code,
  Plus,
  Trash2,
  Copy,
  Clock,
  Award,
  Globe,
  X,
  Sparkles,
} from 'lucide-react';
import api from '../../../utils/api';

export default function RecruiterAssessments() {
  const [tests, setTests] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form parameters
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('60');
  const [passingScore, setPassingScore] = useState('60');
  const [visibility] = useState('PRIVATE');
  const [negativeMarking, setNegativeMarking] = useState(false);
  const [randomQuestionOrder, setRandomQuestionOrder] = useState(false);
  const [allowedLangs, setAllowedLangs] = useState<string[]>(['javascript', 'python']);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState<'FIXED' | 'RANDOM' | 'MIXED'>('FIXED');
  const [randomCount, setRandomCount] = useState('3');

  // Toast
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
  };

  const fetchTestsAndQuestions = async () => {
    try {
      setLoading(true);
      const [testsRes, questionsRes] = await Promise.all([
        api.get('/assessments/tests'),
        api.get('/assessments/candidate/questions'), // Reuse candidate questions list
      ]);
      setTests(testsRes.data.data || []);
      setQuestions(questionsRes.data.data || []);
    } catch (err: any) {
      triggerToast('Unable to retrieve assessment data: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTestsAndQuestions();
  }, []);

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    if (selectionMode !== 'RANDOM' && selectedQuestions.length === 0) {
      triggerToast('Please select at least 1 question from the problem bank.');
      return;
    }

    try {
      const questionsPayload = selectedQuestions.map((qId, idx) => ({
        codingQuestionId: qId,
        orderIndex: idx + 1,
      }));

      await api.post('/assessments/tests', {
        title,
        description,
        duration: parseInt(duration),
        passingScore: parseInt(passingScore),
        visibility,
        negativeMarking,
        randomQuestionOrder,
        allowedLanguages: allowedLangs,
        questions: selectionMode === 'RANDOM' ? [] : questionsPayload,
        selectionMode,
        randomCount: selectionMode !== 'FIXED' ? parseInt(randomCount) : undefined,
      });

      triggerToast('Coding assessment test created successfully!');
      setIsOpen(false);
      
      // Reset form
      setTitle('');
      setDescription('');
      setSelectedQuestions([]);
      setSelectionMode('FIXED');
      setRandomCount('3');
      
      fetchTestsAndQuestions();
    } catch (err: any) {
      triggerToast('Creation failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleDeleteTest = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this test?')) return;
    try {
      await api.delete(`/assessments/tests/${id}`);
      triggerToast('Test deleted successfully.');
      fetchTestsAndQuestions();
    } catch (err: any) {
      triggerToast('Delete failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handlePublishTest = async (id: string) => {
    try {
      await api.patch(`/assessments/tests/${id}`, { visibility: 'PUBLIC' });
      triggerToast('Assessment published successfully.');
      fetchTestsAndQuestions();
    } catch (err: any) {
      triggerToast('Publish failed: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    triggerToast('Invite link copied to clipboard!');
  };

  const toggleLanguage = (lang: string) => {
    if (allowedLangs.includes(lang)) {
      setAllowedLangs((prev) => prev.filter((l) => l !== lang));
    } else {
      setAllowedLangs((prev) => [...prev, lang]);
    }
  };

  const toggleQuestion = (qId: string) => {
    if (selectedQuestions.includes(qId)) {
      setSelectedQuestions((prev) => prev.filter((id) => id !== qId));
    } else {
      setSelectedQuestions((prev) => [...prev, qId]);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-xs">
      {showToast && <Toast message={toastMsg} onClose={() => setShowToast(false)} />}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold font-display text-foreground mb-1.5 flex items-center gap-2">
            <Code className="w-8 h-8 text-primary" /> Recruiter Assessments Portal
          </h1>
          <p className="text-muted-foreground text-sm">
            Create, edit, and assign custom programming assessments to benchmark candidate algorithmic capabilities.
          </p>
        </div>

        <Button variant="primary" onClick={() => setIsOpen(true)}>
          <Plus className="w-4 h-4 mr-1.5" /> Create Coding Test
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-20 w-full animate-pulse" />
          <Skeleton className="h-20 w-full animate-pulse" />
        </div>
      ) : tests.length === 0 ? (
        <Card className="min-h-[250px] flex items-center justify-center text-center">
          <CardContent className="text-muted-foreground flex flex-col items-center">
            <Code className="w-12 h-12 mb-3 text-muted-foreground/30" />
            <p className="font-semibold text-sm">No assessments configured yet</p>
            <p className="text-xs text-muted-foreground max-w-xs mt-1">
              Click the "Create Coding Test" button to begin building your candidate evaluators.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tests.map((test) => (
            <Card key={test.id} className="border border-border/40 hover:border-primary/20 transition-all bg-card">
              <CardHeader className="pb-3 flex flex-row justify-between items-start">
                <div>
                  <CardTitle className="text-base font-bold text-foreground">
                    {test.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 mt-1">
                    {test.description || 'No description provided.'}
                  </CardDescription>
                </div>
                <Badge variant={test.visibility === 'PUBLIC' ? 'success' : 'info'}>
                  {test.visibility}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-2 text-[10px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary" /> {test.duration} mins
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-primary" /> Pass: {test.passingScore}%
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-primary" /> {test.allowedLanguages.length} Langs
                  </div>
                </div>

                {/* Invite link copying drawer */}
                {test.inviteLink && (
                  <div className="flex items-center justify-between p-2.5 bg-slate-950 border border-slate-800 rounded-lg gap-2">
                    <span className="font-mono text-[9px] truncate text-slate-400 select-all">
                      {test.inviteLink}
                    </span>
                    <button
                      onClick={() => handleCopyLink(test.inviteLink)}
                      className="p-1.5 hover:bg-slate-900 text-primary hover:text-white rounded transition-colors"
                      title="Copy Invite Link"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                <div className="flex justify-end gap-2 border-t border-border/30 pt-3">
                  {test.visibility !== 'PUBLIC' && (
                    <Button
                      variant="outline"
                      onClick={() => handlePublishTest(test.id)}
                      className="text-emerald-500 hover:bg-emerald-500/5 hover:border-emerald-500/30"
                    >
                      Publish
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => handleDeleteTest(test.id)}
                    className="text-rose-500 hover:bg-rose-500/5 hover:border-rose-500/30"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* CREATE TEST DIALOG FORM OVERLAY */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <Card className="max-w-xl w-full bg-card border border-border p-6 space-y-6 relative max-h-[90vh] overflow-y-auto font-sans">
            <div className="flex justify-between items-center border-b border-border/40 pb-4">
              <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" /> Create Algorithmic Coding Assessment
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTest} className="space-y-5 text-xs text-slate-300">
              {/* Title input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Assessment Title
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Software Engineer Screening Phase 1"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Description / Guidelines
                </label>
                <textarea
                  className="w-full h-20 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-primary"
                  placeholder="Add details parameters or candidate guidelines instructions here..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Duration */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Duration (Minutes)
                  </label>
                  <Input
                    type="number"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    min="10"
                    max="180"
                  />
                </div>

                {/* Passing Score */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Passing Score (%)
                  </label>
                  <Input
                    type="number"
                    value={passingScore}
                    onChange={(e) => setPassingScore(e.target.value)}
                    min="1"
                    max="100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Question Selection Mode */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Question Selection Mode
                  </label>
                  <select
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-primary font-sans"
                    value={selectionMode}
                    onChange={(e) => setSelectionMode(e.target.value as any)}
                  >
                    <option value="FIXED">Fixed Manual Selection</option>
                    <option value="RANDOM">Fully Random Selection</option>
                    <option value="MIXED">Mixed Selection Mode</option>
                  </select>
                </div>

                {/* Random Questions Count */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Random Question Count
                  </label>
                  <Input
                    type="number"
                    value={randomCount}
                    onChange={(e) => setRandomCount(e.target.value)}
                    disabled={selectionMode === 'FIXED'}
                    min="1"
                    max="20"
                  />
                </div>
              </div>

              {/* Language Selection checkboxes */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Allowed Coding Languages
                </label>
                <div className="flex flex-wrap gap-2.5 pt-1">
                  {['javascript', 'python', 'java', 'cpp', 'c'].map((lang) => (
                    <label key={lang} className="flex items-center gap-2 cursor-pointer font-bold uppercase text-[9px] text-slate-400">
                      <input
                        type="checkbox"
                        checked={allowedLangs.includes(lang)}
                        onChange={() => toggleLanguage(lang)}
                        className="w-4 h-4 rounded border-slate-800 text-primary bg-slate-950"
                      />
                      {lang}
                    </label>
                  ))}
                </div>
              </div>

              {/* Config Option toggles */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={negativeMarking}
                    onChange={(e) => setNegativeMarking(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-800 text-primary bg-slate-950"
                  />
                  <span>Allowed Negative Marking</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={randomQuestionOrder}
                    onChange={(e) => setRandomQuestionOrder(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-800 text-primary bg-slate-950"
                  />
                  <span>Randomize Question Order</span>
                </label>
              </div>

              {/* Problem Selection checklist table */}
              {selectionMode !== 'RANDOM' && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Select Question Bank Problems ({selectedQuestions.length} selected)
                  </label>
                  <div className="border border-border/30 rounded-xl overflow-hidden divide-y divide-border/30 max-h-[150px] overflow-y-auto">
                    {questions.map((q) => (
                      <div key={q.id} className="flex items-center justify-between p-3.5 bg-slate-950/40">
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={selectedQuestions.includes(q.id)}
                            onChange={() => toggleQuestion(q.id)}
                            className="w-4 h-4 rounded border-slate-800 text-primary bg-slate-950"
                          />
                          <span className="font-bold text-foreground truncate max-w-[200px]">{q.title}</span>
                        </div>
                        <Badge
                          variant={
                            q.difficulty === 'HARD'
                              ? 'destructive'
                              : q.difficulty === 'MEDIUM'
                              ? 'warning'
                              : 'success'
                          }
                        >
                          {q.difficulty}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 border-t border-border/30 pt-4">
                <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit" disabled={selectionMode !== 'RANDOM' && selectedQuestions.length === 0}>
                  Create & Launch Assessment
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
