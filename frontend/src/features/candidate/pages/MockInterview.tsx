import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardTitle,
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
  ClipboardList,
  Sparkles,
  SkipForward,
  Volume2,
  VolumeX,
  Gauge,
  Info,
  Radio,
  Clock,
  MessageSquare,
} from 'lucide-react';
import api from '../../../utils/api';
import { useAuthStore } from '../../../stores/useAuthStore';

// Web Speech API interfaces
const SpeechRecognition = typeof window !== 'undefined' ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : null;
const SpeechSynthesis = typeof window !== 'undefined' ? window.speechSynthesis : null;

export default function MockInterview() {
  const navigate = useNavigate();
  const { user } = useAuthStore() as any;

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

  // Voice Interviewer States
  const [voiceModeOn, setVoiceModeOn] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [speechVolume, setSpeechVolume] = useState(1.0);
  const [questionCountdown, setQuestionCountdown] = useState(90);

  // Ref variables for Speech
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);

  // Loaders & Toast
  const [generating, setGenerating] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Audio Recording Ref variables (for fallback voice upload mode)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Speech synthesis cancellation on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  // Speech voices changed listener
  const loadVoices = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const allVoices = window.speechSynthesis.getVoices();
    setVoices(allVoices);
    // Prefer clean English voices
    const defaultVoice = allVoices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Microsoft'))) || 
                         allVoices.find(v => v.lang.startsWith('en')) || 
                         allVoices[0];
    setSelectedVoice(defaultVoice || null);
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  // Total session stopwatch
  useEffect(() => {
    if (session && !paused && !wizardStep) {
      timerRef.current = setInterval(() => {
        setSessionTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [session, paused, wizardStep]);

  // Per-question countdown timer (only counts down if voiceModeOn is active, not paused, not speaking/evaluating)
  useEffect(() => {
    let countdownInterval: any;
    if (session && !paused && !wizardStep && voiceModeOn && !isSpeaking && !submitting) {
      countdownInterval = setInterval(() => {
        setQuestionCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            triggerToast('Time limit exceeded. Submitting your current response...');
            handleSubmitResponse();
            return 90;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(countdownInterval);
  }, [session, paused, wizardStep, voiceModeOn, isSpeaking, submitting, currentIdx]);

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

  // Speaks text and runs callback on end
  const speakText = (text: string, onEnd?: () => void) => {
    if (!voiceModeOn || !SpeechSynthesis) {
      if (onEnd) onEnd();
      return;
    }

    try {
      // Disable speech recognition during synthesis
      stopSpeechRecognition();

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }
      utterance.rate = speechRate;
      utterance.volume = speechVolume;

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        console.error('SpeechSynthesis error:', e);
        setIsSpeaking(false);
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.error('SpeechSynthesis exception:', err);
      setIsSpeaking(false);
      if (onEnd) onEnd();
    }
  };

  // Speech Recognition API controllers
  const startSpeechRecognition = () => {
    if (!SpeechRecognition) {
      console.warn("SpeechRecognition not supported in this browser.");
      return;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';

    rec.onstart = () => {
      setIsListening(true);
      isListeningRef.current = true;
    };

    rec.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const currentText = finalTranscript || interimTranscript;
      setLiveTranscript(currentText);
      setTextAnswer(currentText);
    };

    rec.onend = () => {
      setIsListening(false);
      // Restart listening if we are still active, in voice mode, AI is not speaking, and we didn't cancel manually
      if (voiceModeOn && isListeningRef.current && !window.speechSynthesis.speaking && !submitting && !paused) {
        try {
          rec.start();
          setIsListening(true);
        } catch (e) {}
      }
    };

    rec.onerror = (e: any) => {
      console.error("SpeechRecognition error:", e);
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch (err) {
      console.error("Failed to start recognition", err);
    }
  };

  const stopSpeechRecognition = () => {
    isListeningRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
  };

  // Dynamic greeting and intro trigger on start
  useEffect(() => {
    let t: any;
    if (!wizardStep && session) {
      const uName = user ? (user.name || user.firstName || user.email?.split('@')[0] || user.role) : 'there';
      let greeting = `Hello there.`;
      
      if (user) {
        const uRole = user.role?.toUpperCase();
        if (uRole === 'CANDIDATE') {
          greeting = `Hello ${uName}. Welcome to HireSense AI.`;
        } else if (uRole === 'RECRUITER') {
          greeting = `Hello ${uName}. Welcome back.`;
        } else if (uRole === 'ADMIN') {
          greeting = `Hello ${uName}. Welcome back to HireSense AI.`;
        }
      }

      const intro = `Welcome to HireSense AI. Today's interview is for ${session.jobRole}. There will be ${session.questions?.length || 0} questions. Please answer clearly. Good luck.`;
      
      const fullGreetingText = `${greeting} ${intro}`;

      t = setTimeout(() => {
        speakText(fullGreetingText, () => {
          readQuestion(0);
        });
      }, 1000);
    }
    return () => {
      if (t) clearTimeout(t);
    };
  }, [wizardStep]);

  // Read single question aloud
  const readQuestion = (idx: number) => {
    if (!session || !session.questions || !session.questions[idx]) return;
    const q = session.questions[idx];
    const textToSpeak = `Question ${idx + 1}. ${q.questionText}`;
    
    setQuestionCountdown(90);
    setLiveTranscript('');
    setTextAnswer('');

    speakText(textToSpeak, () => {
      if (voiceModeOn) {
        startSpeechRecognition();
      }
    });
  };

  // Submit live transcript response (typed or spoken)
  const handleSubmitResponse = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const responseText = textAnswer || liveTranscript;
    if (!responseText.trim()) {
      triggerToast('Please speak or type a response first.');
      return;
    }

    stopSpeechRecognition();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);

    const activeQuestion = session.questions[currentIdx];
    try {
      setSubmitting(true);
      const res = await api.post(
        `/interviews/${session.id}/questions/${activeQuestion.id}/answer`,
        { textAnswer: responseText },
      );
      
      const updatedSession = res.data.data;
      setSession(updatedSession);
      triggerToast('Response submitted successfully!');

      const updatedQuestion = updatedSession.questions[currentIdx];
      const answerObj = updatedQuestion?.answers?.[0];

      if (answerObj && voiceModeOn) {
        // Read feedback comments
        const comments = answerObj.aiFeedback || 'Good effort. Response evaluated.';
        speakText(comments, () => {
          handleAutoAdvance(updatedSession);
        });
      } else {
        handleAutoAdvance(updatedSession);
      }
    } catch (err: any) {
      triggerToast('Submission failed: ' + (err.response?.data?.message || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoAdvance = (latestSession: any) => {
    if (currentIdx < latestSession.questions.length - 1) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      setTimeout(() => {
        readQuestion(nextIdx);
      }, 1500);
    } else {
      handleFinalReportCompilation();
    }
  };

  const handleFinalReportCompilation = async () => {
    stopSpeechRecognition();
    try {
      setSubmitting(true);
      const res = await api.post(`/interviews/${session.id}/report`);
      const finalReport = res.data.data;

      const score = finalReport.score || 0;
      const feedback = finalReport.feedback || 'Completed successfully.';
      
      const finalSpeech = `Congratulations. You have completed your interview. Communication Score: ${score}. Technical Score: ${score}. Confidence Score: ${score}. Overall Score: ${score}. Recommendation: ${feedback}. Thank you for using HireSense AI.`;

      speakText(finalSpeech, () => {
        navigate(`/candidate/mock-interview/report/${session.id}`);
      });
    } catch (err: any) {
      triggerToast('Report failed: ' + (err.response?.data?.message || err.message));
      navigate('/candidate/dashboard');
    } finally {
      setSubmitting(false);
    }
  };

  // Voice controls
  const handlePlayVoice = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsSpeaking(true);
      } else {
        const activeQuestion = session.questions[currentIdx];
        if (activeQuestion) {
          readQuestion(currentIdx);
        }
      }
    }
  };

  const handlePauseVoice = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.pause();
      setIsSpeaking(false);
    }
  };

  const handleReplayVoice = () => {
    readQuestion(currentIdx);
  };

  const handleSkipQuestion = () => {
    stopSpeechRecognition();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    
    if (currentIdx < session.questions.length - 1) {
      const nextIdx = currentIdx + 1;
      setCurrentIdx(nextIdx);
      setTimeout(() => {
        readQuestion(nextIdx);
      }, 1000);
    } else {
      handleFinalReportCompilation();
    }
  };

  const handleToggleMicrophone = () => {
    if (isListening) {
      stopSpeechRecognition();
    } else {
      startSpeechRecognition();
    }
  };

  // Fallback Audio uploading functions (legacy webm blob mode when voiceModeOn is false)
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

  const handleEndInterview = async () => {
    if (!window.confirm('Are you sure you want to end this interview? Final report analytics will compile.')) return;
    handleFinalReportCompilation();
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
      <style>{`
        @keyframes speaking-glow {
          0% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.5); }
          70% { box-shadow: 0 0 0 20px rgba(59, 130, 246, 0); }
          100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
        }
        @keyframes listening-glow {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.6); }
          70% { box-shadow: 0 0 0 20px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        @keyframes sound-bar {
          0%, 100% { transform: scaleY(0.2); }
          50% { transform: scaleY(1.4); }
        }
        .animate-speaking-glow {
          animation: speaking-glow 1.8s infinite;
        }
        .animate-listening-glow {
          animation: listening-glow 1.5s infinite;
        }
        .sound-bar-item {
          animation: sound-bar 0.9s ease-in-out infinite;
        }
        .sound-bar-item:nth-child(2) { animation-delay: 0.1s; }
        .sound-bar-item:nth-child(3) { animation-delay: 0.25s; }
        .sound-bar-item:nth-child(4) { animation-delay: 0.4s; }
        .sound-bar-item:nth-child(5) { animation-delay: 0.55s; }
      `}</style>

      {showToast && <Toast message={toastMsg} onClose={() => setShowToast(false)} />}

      {/* Top Controls Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            Practice for {session.companyName} &bull; {session.jobRole}
          </h2>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-primary" /> Timer: <span className="font-bold text-foreground">{formatTime(sessionTime)}</span></span>
            <span className="w-1.5 h-1.5 rounded-full bg-border"></span>
            <span className="font-semibold uppercase tracking-wider text-emerald-500 flex items-center gap-1">
              <Radio className="w-3 h-3 animate-pulse" /> {paused ? 'PAUSED' : 'IN PROGRESS'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Voice Mode toggle control */}
          <div className="bg-secondary/40 border border-border/40 rounded-xl p-1.5 px-3 flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Voice Assistant</span>
            <button
              onClick={() => {
                const updated = !voiceModeOn;
                setVoiceModeOn(updated);
                if (!updated) {
                  stopSpeechRecognition();
                  if (typeof window !== 'undefined' && window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                  }
                  setIsSpeaking(false);
                } else {
                  readQuestion(currentIdx);
                }
              }}
              className={`w-10 h-5.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none ${voiceModeOn ? 'bg-primary' : 'bg-slate-700'}`}
            >
              <div className={`w-4.5 h-4.5 bg-white rounded-full shadow-md transform transition-transform duration-200 ${voiceModeOn ? 'translate-x-4.5' : 'translate-x-0'}`} />
            </button>
          </div>

          <Button variant="outline" onClick={() => setPaused(!paused)}>
            {paused ? (
              <>
                <Play className="w-4 h-4 mr-1.5 text-emerald-500" /> Resume
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 mr-1.5 text-amber-500" /> Pause
              </>
            )}
          </Button>

          <Button variant="danger" onClick={handleEndInterview} disabled={submitting}>
            Finish and Grade
          </Button>
        </div>
      </div>

      {!activeQuestion ? (
        <div className="text-center py-20 bg-slate-900/30 rounded-2xl border border-slate-800">
          <h3 className="text-xl font-bold">No Questions Found</h3>
          <p className="text-slate-400 mt-2">Failed to load or generate questions for this interview session.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Interview Workspace */}
          <div className="lg:col-span-2 space-y-6">
            {/* Progress and Countdown Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-secondary/20 border border-border/30 rounded-xl p-3.5 text-center">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Question Index</span>
                <span className="text-sm font-bold text-foreground">{currentIdx + 1} / {session.questions?.length}</span>
              </div>
              <div className="bg-secondary/20 border border-border/30 rounded-xl p-3.5 text-center">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Remaining</span>
                <span className="text-sm font-bold text-foreground">{session.questions?.length - (currentIdx + 1)} Questions</span>
              </div>
              <div className="bg-secondary/20 border border-border/30 rounded-xl p-3.5 text-center relative overflow-hidden">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">Time Remaining</span>
                <span className={`text-sm font-extrabold ${questionCountdown <= 15 ? 'text-destructive animate-pulse' : 'text-primary'}`}>
                  {questionCountdown}s
                </span>
                <div className="absolute bottom-0 left-0 h-1 bg-primary/25 transition-all duration-1000" style={{ width: `${(questionCountdown / 90) * 100}%` }}></div>
              </div>
            </div>

            {/* AI Avatar Console Card */}
            <Card className="overflow-hidden border-primary/20 bg-gradient-to-r from-slate-950 to-slate-900">
              <CardContent className="p-6 flex flex-col items-center justify-center text-center space-y-4">
                {/* Glowing Avatar */}
                <div className={`relative flex items-center justify-center w-24 h-24 rounded-full bg-slate-900 border-2 border-border/60 transition-all duration-300 ${isSpeaking ? 'animate-speaking-glow border-primary' : isListening ? 'animate-listening-glow border-emerald-500' : ''}`}>
                  {isSpeaking ? (
                    <Sparkles className="w-10 h-10 text-primary animate-pulse" />
                  ) : isListening ? (
                    <Mic className="w-10 h-10 text-emerald-500 animate-bounce" />
                  ) : (
                    <Video className="w-10 h-10 text-muted-foreground" />
                  )}
                  {/* Status Indicator Badge */}
                  <span className={`absolute -bottom-1.5 px-2.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider text-white shadow-md ${isSpeaking ? 'bg-primary' : isListening ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                    {isSpeaking ? 'AI Speaks' : isListening ? 'Listening' : 'Ready'}
                  </span>
                </div>

                {/* Speaks Waveform */}
                <div className="h-6 flex items-center gap-1 justify-center">
                  {isSpeaking ? (
                    <>
                      <div className="w-1 h-3 bg-primary rounded-full sound-bar-item"></div>
                      <div className="w-1 h-4 bg-primary rounded-full sound-bar-item"></div>
                      <div className="w-1 h-6 bg-primary rounded-full sound-bar-item"></div>
                      <div className="w-1 h-4 bg-primary rounded-full sound-bar-item"></div>
                      <div className="w-1 h-3 bg-primary rounded-full sound-bar-item"></div>
                    </>
                  ) : isListening ? (
                    <p className="text-[10px] text-emerald-500 font-semibold tracking-wider animate-pulse flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Speak clearly now...
                    </p>
                  ) : (
                    <p className="text-[10px] text-muted-foreground">AI voice system initialized.</p>
                  )}
                </div>

                {/* Display Current Question text */}
                <div className="w-full max-w-lg border-t border-border/40 pt-4">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest block mb-1">
                    Current Question
                  </span>
                  <h3 className="text-base font-bold text-foreground leading-relaxed">
                    {activeQuestion.questionText}
                  </h3>
                </div>
              </CardContent>
            </Card>

            {/* Answer Panel Card */}
            <Card className={paused ? 'opacity-40 pointer-events-none select-none transition-opacity' : 'transition-opacity'}>
              <CardContent className="space-y-6 pt-6">
                
                {/* Voice mode active live transcript view */}
                {voiceModeOn ? (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-primary" /> Live Response Transcript
                      </label>
                      {!SpeechRecognition && (
                        <span className="text-[9px] font-bold text-amber-500 flex items-center gap-1">
                          <Info className="w-3 h-3" /> Voice Input Unsupported (Chrome/Edge recommended)
                        </span>
                      )}
                    </div>
                    <div className="min-h-[100px] bg-secondary/20 border border-border/40 rounded-xl p-4 relative">
                      {liveTranscript ? (
                        <p className="text-xs text-foreground leading-relaxed italic">
                          "{liveTranscript}"
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          Start speaking... your transcript will populate here live in real-time. Or use the typed fallback below.
                        </p>
                      )}
                      {isListening && (
                        <div className="absolute right-3 top-3 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                          <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">Mic Live</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {/* Manual textbox editor fallback */}
                <form onSubmit={handleSubmitResponse} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                      {voiceModeOn ? 'Edit Typed / Spoken Response' : 'Write Response Text'}
                    </label>
                  </div>
                  <textarea
                    className="w-full h-28 bg-card border border-border rounded-xl p-3 resize-none text-xs text-foreground placeholder-slate-500 focus:outline-none focus:border-primary"
                    placeholder="Provide your complete technical answer or scenario solution details here..."
                    value={textAnswer}
                    onChange={(e) => setTextAnswer(e.target.value)}
                    disabled={submitting}
                  />

                  {/* Submit / Action buttons */}
                  <div className="flex justify-between items-center pt-2">
                    {/* Old legacy recording mode buttons (only shown when Voice Mode is OFF) */}
                    {!voiceModeOn ? (
                      <div>
                        {recording ? (
                          <Button variant="danger" className="h-10 px-4" onClick={stopRecordingAudio}>
                            <StopCircle className="w-4 h-4 mr-2 animate-pulse text-white" /> Stop Recording
                          </Button>
                        ) : (
                          <Button variant="outline" className="h-10 px-4" onClick={startRecordingAudio} disabled={submitting}>
                            <Mic className="w-4 h-4 mr-2 text-primary" /> Record Audio Response
                          </Button>
                        )}
                      </div>
                    ) : (
                      <div />
                    )}

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleSkipQuestion}
                        disabled={submitting}
                      >
                        Skip Question <SkipForward className="w-4 h-4 ml-1.5" />
                      </Button>

                      <Button
                        type="submit"
                        disabled={submitting || (!textAnswer.trim() && !liveTranscript.trim())}
                      >
                        {submitting ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-1.5 animate-spin" /> Evaluating...
                          </>
                        ) : (
                          'Submit and Grade'
                        )}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Voice Control Panel Card */}
            <Card className="border-primary/10">
              <CardHeader className="py-3.5 border-b border-border/30">
                <CardTitle className="text-xs font-semibold flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-primary" /> Voice Control Assistant Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left side play controls */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handlePlayVoice} disabled={!SpeechSynthesis}>
                      <Play className="w-3.5 h-3.5 mr-1" /> Play Voice
                    </Button>
                    <Button variant="outline" onClick={handlePauseVoice} disabled={!SpeechSynthesis}>
                      <Pause className="w-3.5 h-3.5 mr-1" /> Pause Voice
                    </Button>
                    <Button variant="outline" onClick={handleReplayVoice} disabled={!SpeechSynthesis}>
                      <RefreshCw className="w-3.5 h-3.5 mr-1" /> Replay
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleToggleMicrophone}
                      className={isListening ? 'bg-emerald-950/40 border-emerald-500 text-emerald-500' : ''}
                      disabled={!SpeechRecognition}
                    >
                      <Mic className="w-3.5 h-3.5 mr-1" /> Mic
                    </Button>
                  </div>

                  {/* Volume Slider */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-muted-foreground uppercase font-bold tracking-wider">Volume</span>
                      <span className="font-bold text-foreground">{Math.round(speechVolume * 100)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <VolumeX className="w-4 h-4 text-muted-foreground" />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={speechVolume}
                        onChange={(e) => setSpeechVolume(parseFloat(e.target.value))}
                        className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                      />
                      <Volume2 className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                </div>

                {/* Right side speech configs */}
                <div className="space-y-4">
                  {/* Speech Rate Speed */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-muted-foreground uppercase font-bold tracking-wider flex items-center gap-1"><Gauge className="w-3 h-3" /> Speech Speed (Rate)</span>
                      <span className="font-bold text-foreground">{speechRate}x</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.1"
                      value={speechRate}
                      onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                      className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
                    />
                  </div>

                  {/* Voice Select list */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                      Choose AI Speaker Voice
                    </label>
                    <select
                      className="w-full bg-card border border-border/80 rounded-xl p-2 text-[10px] text-foreground focus:outline-none focus:border-primary"
                      value={selectedVoice?.voiceURI || ''}
                      onChange={(e) => {
                        const voice = voices.find(v => v.voiceURI === e.target.value);
                        if (voice) setSelectedVoice(voice);
                      }}
                    >
                      {voices.map((v, idx) => (
                        <option key={idx} value={v.voiceURI}>
                          {v.name} ({v.lang})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar: Dynamic AI Answer Grading Breakdown */}
          <div className="lg:col-span-1">
            {submitting ? (
              <Card className="animate-pulse p-6 text-center space-y-4 bg-slate-900/40 border-primary/20">
                <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
                <p className="font-bold text-foreground">AI Evaluation processing...</p>
                <p className="text-xs text-muted-foreground">
                  Analyzing semantic response match, domain logic checking, and grammar metrics via Gemini analysis engine.
                </p>
              </Card>
            ) : answer ? (
              <Card className="space-y-4 p-6 leading-relaxed bg-gradient-to-b from-card to-background border-primary/10">
                <div className="flex justify-between items-center border-b border-border/40 pb-3">
                  <span className="font-bold text-foreground text-xs uppercase tracking-wider">
                    Answer Evaluation
                  </span>
                  <Badge variant={answer.aiScore >= 8 ? 'success' : answer.aiScore >= 6 ? 'warning' : 'destructive'}>
                    Score: {answer.aiScore}/10
                  </Badge>
                </div>

                <div className="space-y-4 text-[11px]">
                  <div>
                    <span className="font-bold text-muted-foreground uppercase tracking-widest text-[9px] mb-1 block">
                      Your Transcript
                    </span>
                    <p className="p-3 bg-secondary/35 border border-border/40 rounded-xl italic text-foreground text-[10px] leading-relaxed">
                      "{answer.transcript}"
                    </p>
                  </div>

                  <div>
                    <span className="font-bold text-muted-foreground uppercase tracking-widest text-[9px] mb-1 block">
                      Scoring feedback
                    </span>
                    <p className="text-muted-foreground leading-relaxed bg-secondary/10 border border-border/30 rounded-xl p-3">
                      {answer.aiFeedback}
                    </p>
                  </div>

                  {/* Detailed scorecard categories */}
                  <div className="pt-3 border-t border-border/40 space-y-3">
                    <span className="font-bold text-muted-foreground uppercase tracking-widest text-[9px] block">
                      Metrics Grading
                    </span>
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
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-muted-foreground">{scoreItem.label}</span>
                              <span className="font-bold text-foreground">{scoreItem.val}/10</span>
                            </div>
                            <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${scoreItem.val * 10}%` }} />
                            </div>
                          </div>
                        ),
                    )}
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="min-h-[300px] flex items-center justify-center text-center bg-card">
                <CardContent className="text-muted-foreground flex flex-col items-center p-6 space-y-3">
                  <Radio className="w-12 h-12 text-muted-foreground/30 animate-pulse" />
                  <p className="font-bold text-sm">Awaiting Response Submission</p>
                  <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                    AI grader reviews, subcategory feedback graphs, and candidate confidence tone ratings will display here instantly once you submit your response.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
