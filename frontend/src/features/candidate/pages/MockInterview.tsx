import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Select } from '@/components/atoms/Select';

import Toast from '@/components/molecules/Toast';
import {
  Mic,
  StopCircle,
  Play,
  Pause,
  RefreshCw,
  Video,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
} from 'lucide-react';
import api from '../../../utils/api';

export default function MockInterview() {
  const navigate = useNavigate();

  // Wizard Setup Form States
  const [wizardStep, setWizardStep] = useState(true);
  const [companyName, setCompanyName] = useState('Google');
  const [jobRole, setJobRole] = useState('Frontend Engineer');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [interviewType, setInterviewType] = useState('MIXED');

  // Active Session States
  const [session, setSession] = useState<any>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [recording, setRecording] = useState(false);
  const [textAnswer, setTextAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [paused, setPaused] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);

  // Loaders & Toast
  const [generating, setGenerating] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Audio Recording Ref variables
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (session && !paused && !wizardStep) {
      timerRef.current = setInterval(() => {
        setSessionTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [session, paused, wizardStep]);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setShowToast(true);
  };

  const handleStartInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setGenerating(true);
      const res = await api.post('/interviews', {
        companyName,
        jobRole,
        difficulty,
        interviewType,
      });
      setSession(res.data.data);
      setWizardStep(false);
      triggerToast('AI Interview generated successfully! Let\'s begin.');
    } catch (err: any) {
      triggerToast('Setup failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setGenerating(false);
    }
  };

  // Recording triggers
  const startRecordingAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await handleUploadAudioBlob(audioBlob);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err: any) {
      triggerToast('Could not access microphone API: ' + err.message);
    }
  };

  const stopRecordingAudio = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleUploadAudioBlob = async (blob: Blob) => {
    const activeQuestion = session.questions[currentIdx];
    const formData = new FormData();
    formData.append('audio', blob, 'response.webm');

    try {
      setSubmitting(true);
      const res = await api.post(
        `/interviews/${session.id}/questions/${activeQuestion.id}/answer`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );
      setSession(res.data.data);
      triggerToast('Audio response saved and graded!');
    } catch (err: any) {
      triggerToast('Failed to transcribe audio: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  // Text Answer submission fallback
  const handleSubmitTextResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textAnswer.trim()) return;

    const activeQuestion = session.questions[currentIdx];
    try {
      setSubmitting(true);
      const res = await api.post(
        `/interviews/${session.id}/questions/${activeQuestion.id}/answer`,
        { textAnswer },
      );
      setSession(res.data.data);
      setTextAnswer('');
      triggerToast('Text response saved and graded!');
    } catch (err: any) {
      triggerToast('Response failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndInterview = async () => {
    if (!window.confirm('Are you sure you want to end this interview? Final report analytics will compile.')) return;
    try {
      setSubmitting(true);
      await api.post(`/interviews/${session.id}/report`);
      navigate(`/candidate/mock-interview/report/${session.id}`);
    } catch (err: any) {
      triggerToast('Report generation failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (generating) {
    return (
      <div className="space-y-6 text-center py-20 animate-pulse">
        <RefreshCw className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
        <h3 className="text-xl font-bold text-foreground">Assembling AI Panel...</h3>
        <p className="text-sm text-muted-foreground">
          Gemini is synthesizing resume experience indicators and preparing targeted scenario checks.
        </p>
      </div>
    );
  }

  // WIZARD SETUP SCREEN
  if (wizardStep) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
        {showToast && <Toast message={toastMsg} onClose={() => setShowToast(false)} />}

        <div>
          <h1 className="text-3xl font-extrabold font-display text-foreground mb-1.5 flex items-center gap-2">
            <ClipboardList className="w-8 h-8 text-primary" /> Start AI Mock Interview
          </h1>
          <p className="text-muted-foreground text-sm">
            Setup parameters to configure a customized technical or behavioral simulation.
          </p>
        </div>

        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleStartInterview} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Target Company */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Target Company
                  </label>
                  <Input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Google, Amazon, Vercel"
                  />
                </div>

                {/* Job Role */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Job Role
                  </label>
                  <Select
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    options={[
                      { value: 'Frontend Engineer', label: 'Frontend Engineer' },
                      { value: 'Backend Engineer', label: 'Backend Engineer' },
                      { value: 'Fullstack Architect', label: 'Fullstack Architect' },
                      { value: 'DevOps / Site Reliability', label: 'DevOps / Site Reliability' },
                      { value: 'Product Manager', label: 'Product Manager' },
                      { value: 'Data Scientist', label: 'Data Scientist' },
                    ]}
                  />
                </div>

                {/* Difficulty */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Interview Difficulty
                  </label>
                  <Select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    options={[
                      { value: 'EASY', label: 'Easy (General definitions)' },
                      { value: 'MEDIUM', label: 'Medium (Real-world scenarios)' },
                      { value: 'HARD', label: 'Hard (Live design & diagnostics)' },
                    ]}
                  />
                </div>

                {/* Interview Type */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Interview Category
                  </label>
                  <Select
                    value={interviewType}
                    onChange={(e) => setInterviewType(e.target.value)}
                    options={[
                      { value: 'TECHNICAL', label: 'Technical Screening' },
                      { value: 'BEHAVIORAL', label: 'Behavioral & Core Values' },
                      { value: 'SITUATIONAL', label: 'Situational Troubleshooting' },
                      { value: 'HR', label: 'HR Conversation' },
                      { value: 'MIXED', label: 'Mixed Evaluation' },
                    ]}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-12">
                Launch AI Practice Room
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ACTIVE INTERVIEW ROOM SCREEN
  const activeQuestion = session.questions[currentIdx];
  const answer = activeQuestion?.answers?.[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-300 relative text-xs">
      {showToast && <Toast message={toastMsg} onClose={() => setShowToast(false)} />}

      {/* Control Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            Practice for {session.companyName} &bull; {session.jobRole}
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Timer: <span className="font-bold text-primary">{formatTime(sessionTime)}</span> &bull; Status:{' '}
            <span className="font-bold uppercase text-emerald-500">
              {paused ? 'PAUSED' : 'IN PROGRESS'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setPaused(!paused)}>
            {paused ? (
              <>
                <Play className="w-4 h-4 mr-1.5 text-emerald-500" /> Resume Interview
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 mr-1.5 text-amber-500" /> Pause Interview
              </>
            )}
          </Button>

          <Button variant="danger" onClick={handleEndInterview} disabled={submitting}>
            Finish and Grade Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Workspace Card */}
        <div className="lg:col-span-2 space-y-6">
          <Card className={paused ? 'opacity-40 pointer-events-none select-none transition-opacity' : 'transition-opacity'}>
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/40">
              <div>
                <CardTitle className="text-sm font-semibold">
                  Question {currentIdx + 1} of {session.questions?.length}
                </CardTitle>
                <CardDescription>
                  Read the scenario guidelines below and speak or write your response.
                </CardDescription>
              </div>
              <Badge variant="info">{activeQuestion.questionText ? 'Active Check' : 'Pending'}</Badge>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="min-h-[100px] flex items-center bg-secondary/30 border border-border/30 rounded-xl p-5">
                <p className="text-sm font-bold text-foreground leading-relaxed">
                  {activeQuestion.questionText}
                </p>
              </div>

              {/* Speech Voice Recorders */}
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-4">
                  {recording ? (
                    <Button variant="danger" className="h-12 px-6" onClick={stopRecordingAudio}>
                      <StopCircle className="w-5 h-5 mr-2 animate-pulse text-white" /> Stop Recording
                    </Button>
                  ) : (
                    <Button variant="primary" className="h-12 px-6" onClick={startRecordingAudio} disabled={submitting}>
                      <Mic className="w-5 h-5 mr-2" /> Record Response (Speech-to-Text)
                    </Button>
                  )}
                </div>
              </div>

              {/* Text Fallback response */}
              <form onSubmit={handleSubmitTextResponse} className="border-t border-border/40 pt-4 space-y-3">
                <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
                  Write Response Fallback
                </label>
                <textarea
                  className="w-full h-24 bg-card border border-border rounded-xl p-3 resize-none text-xs text-foreground placeholder-slate-500 focus:outline-none focus:border-primary"
                  placeholder="Or write down your complete technical explanation here to test the AI grading metrics..."
                  value={textAnswer}
                  onChange={(e) => setTextAnswer(e.target.value)}
                  disabled={recording || submitting}
                />
                <div className="flex justify-end">
                  <Button type="submit" disabled={!textAnswer.trim() || submitting}>
                    Submit Typed Response
                  </Button>
                </div>
              </form>

              {/* Question selector tags */}
              <div className="flex items-center justify-between border-t border-border/40 pt-4">
                <Button
                  variant="outline"
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((p) => p - 1)}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous Question
                </Button>

                <Button
                  variant="outline"
                  disabled={currentIdx === session.questions.length - 1}
                  onClick={() => setCurrentIdx((p) => p + 1)}
                >
                  Next Question <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dynamic AI Answer review sidebar */}
        <div className="lg:col-span-1">
          {submitting ? (
            <Card className="animate-pulse p-6 text-center space-y-3">
              <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
              <p className="font-bold text-foreground">AI Grader is Evaluating...</p>
              <p className="text-xs text-muted-foreground">
                Analyzing technical terminology correctness, language flow confidence, and syntax grammar checks.
              </p>
            </Card>
          ) : answer ? (
            <Card className="space-y-4 p-6 leading-relaxed bg-gradient-to-b from-card to-background border-primary/10">
              <div className="flex justify-between items-center border-b border-border/40 pb-3">
                <span className="font-bold text-foreground text-xs uppercase tracking-wider">
                  Answer Feedback
                </span>
                <Badge variant={answer.aiScore >= 8 ? 'success' : answer.aiScore >= 6 ? 'warning' : 'destructive'}>
                  Score: {answer.aiScore}/10
                </Badge>
              </div>

              <div className="space-y-3 text-[11px]">
                <div>
                  <p className="font-bold text-muted-foreground uppercase tracking-widest text-[9px] mb-1">
                    Your Response Transcript
                  </p>
                  <p className="p-3 bg-secondary/35 border border-border/40 rounded-xl italic text-foreground text-[10px] leading-relaxed">
                    "{answer.transcript}"
                  </p>
                </div>

                <div>
                  <p className="font-bold text-muted-foreground uppercase tracking-widest text-[9px] mb-1">
                    Gemini Scoring Comments
                  </p>
                  <p className="text-muted-foreground leading-relaxed">{answer.aiFeedback}</p>
                </div>

                {/* Subcategory score checklist */}
                <div className="pt-2 border-t border-border/40 space-y-2">
                  <p className="font-bold text-muted-foreground uppercase tracking-widest text-[9px]">
                    Metrics Breakdown
                  </p>
                  {[
                    { label: 'Technical accuracy', val: answer.technicalAccuracy },
                    { label: 'Communication flow', val: answer.communication },
                    { label: 'Problem solving logic', val: answer.problemSolving },
                    { label: 'Confidence tone', val: answer.confidence },
                    { label: 'Completeness check', val: answer.completeness },
                    { label: 'Grammar parameters', val: answer.grammar },
                  ].map(
                    (scoreItem, idx) =>
                      scoreItem.val !== undefined && (
                        <div key={idx} className="flex justify-between items-center text-[10px]">
                          <span className="text-muted-foreground">{scoreItem.label}</span>
                          <span className="font-bold text-foreground">{scoreItem.val}/10</span>
                        </div>
                      ),
                  )}
                </div>
              </div>
            </Card>
          ) : (
            <Card className="min-h-[300px] flex items-center justify-center text-center bg-card">
              <CardContent className="text-muted-foreground flex flex-col items-center">
                <Video className="w-12 h-12 mb-3 text-muted-foreground/30" />
                <p className="font-semibold text-sm">Awaiting Response</p>
                <p className="text-xs text-muted-foreground max-w-xs mt-1">
                  Grade reviews and speech evaluations will compile here immediately once you submit a response to this question.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
