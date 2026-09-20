// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, AlertTriangle, Shield, Send, CheckCircle, XCircle, Loader2, Camera, CameraOff, Smartphone } from 'lucide-react';
import { getInvitationByToken, submitTest } from '../services/assessmentService';
import { usePhoneDetection } from '../hooks/usePhoneDetection';
import type { Assessment, AssessmentQuestion } from '../types/assessment';

type TabState = {
  tab_switches: number;
  blur_start: number | null;
  blur_duration_seconds: number;
  copy_attempts: number;
  phone_detection_count: number;
};

export default function TestPortal() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Omit<AssessmentQuestion, 'answer_key' | 'rubric'>[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentQ, setCurrentQ] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<{ score: number; compositeScore: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Camera gate: false = not started, 'requesting' = asking permission, 'ready' = camera active
  const [cameraGate, setCameraGate] = useState<'idle' | 'requesting' | 'ready' | 'denied'>('idle');
  const [showCameraPreview, setShowCameraPreview] = useState(true);

  const [telemetry, setTelemetry] = useState<TabState>({
    tab_switches: 0,
    blur_start: null,
    blur_duration_seconds: 0,
    copy_attempts: 0,
    phone_detection_count: 0,
  });

  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>(null);
  const phoneSubmittedRef = useRef(false);

  const phoneDetection = usePhoneDetection();

  // Auto-submit on phone detection
  useEffect(() => {
    if (phoneDetection.phoneDetected && !submitted && !submitting && !phoneSubmittedRef.current) {
      phoneSubmittedRef.current = true;
      setTelemetry((prev) => ({
        ...prev,
        phone_detection_count: phoneDetection.phoneDetectionCount,
      }));
      // Small delay to let telemetry update
      setTimeout(() => handleSubmit(true), 500);
    }
  }, [phoneDetection.phoneDetected, phoneDetection.phoneDetectionCount]);

  // Update phone detection count in telemetry continuously
  useEffect(() => {
    if (phoneDetection.phoneDetectionCount > 0) {
      setTelemetry((prev) => ({
        ...prev,
        phone_detection_count: phoneDetection.phoneDetectionCount,
      }));
    }
  }, [phoneDetection.phoneDetectionCount]);

  // Load test data
  useEffect(() => {
    if (!token) return;
    const load = async () => {
      try {
        const data = await getInvitationByToken(token);
        if (!data) {
          setError('Invalid or expired test link.');
          setLoading(false);
          return;
        }
        setAssessment(data.assessment);
        setQuestions(data.questions);
        startTimeRef.current = data.invitation.startedAt
          ? new Date(data.invitation.startedAt).getTime()
          : Date.now();
        // Timer uses the assessment's time_limit_minutes, not the link expiry
        const testTimeLimit = (data.assessment?.timeLimitMinutes || 15) * 60;
        const elapsed = data.invitation.startedAt
          ? Math.floor((Date.now() - new Date(data.invitation.startedAt).getTime()) / 1000)
          : 0;
        const remaining = Math.max(0, testTimeLimit - elapsed);
        setTimeLeft(remaining);
        setLoading(false);
      } catch (err) {
        setError('Failed to load test. Please try again.');
        setLoading(false);
      }
    };
    load();
  }, [token]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0 && assessment && cameraGate === 'ready') {
      handleSubmit();
      return;
    }
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current!);
  }, [timeLeft > 0, assessment, cameraGate]);

  // Anti-cheat: tab switch / blur detection
  useEffect(() => {
    if (cameraGate !== 'ready') return;

    const handleVisibility = () => {
      if (document.hidden) {
        setTelemetry((prev) => ({
          ...prev,
          tab_switches: prev.tab_switches + 1,
          blur_start: Date.now(),
        }));
      } else {
        setTelemetry((prev) => {
          if (prev.blur_start) {
            return {
              ...prev,
              blur_duration_seconds: prev.blur_duration_seconds + Math.floor((Date.now() - prev.blur_start) / 1000),
              blur_start: null,
            };
          }
          return prev;
        });
      }
    };

    const handleBlur = () => {
      setTelemetry((prev) => ({
        ...prev,
        blur_start: Date.now(),
      }));
    };

    const handleFocus = () => {
      setTelemetry((prev) => {
        if (prev.blur_start) {
          return {
            ...prev,
            blur_duration_seconds: prev.blur_duration_seconds + Math.floor((Date.now() - prev.blur_start) / 1000),
            blur_start: null,
          };
        }
        return prev;
      });
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [cameraGate]);

  // Anti-cheat: clipboard prevention
  useEffect(() => {
    if (cameraGate !== 'ready') return;

    const prevent = (e: Event) => {
      e.preventDefault();
      setTelemetry((prev) => ({ ...prev, copy_attempts: prev.copy_attempts + 1 }));
    };
    const preventKey = (e: KeyboardEvent) => {
      if (
        (e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'C' || e.key === 'V')
      ) {
        e.preventDefault();
        setTelemetry((prev) => ({ ...prev, copy_attempts: prev.copy_attempts + 1 }));
        return;
      }
      if (e.key === 'F12' || ((e.ctrlKey || e.shiftKey) && e.key === 'I')) {
        e.preventDefault();
      }
    };

    document.addEventListener('copy', prevent);
    document.addEventListener('cut', prevent);
    document.addEventListener('paste', prevent);
    document.addEventListener('contextmenu', prevent);
    document.addEventListener('keydown', preventKey);

    return () => {
      document.removeEventListener('copy', prevent);
      document.removeEventListener('cut', prevent);
      document.removeEventListener('paste', prevent);
      document.removeEventListener('contextmenu', prevent);
      document.removeEventListener('keydown', preventKey);
    };
  }, [cameraGate]);

  const handleSubmit = useCallback(async (phoneTerminated = false) => {
    if (submitted || submitting || !token) return;
    setSubmitting(true);
    phoneDetection.stopCamera();
    try {
      const res = await submitTest(token, answers, {
        tab_switches: telemetry.tab_switches,
        blur_duration_seconds: telemetry.blur_duration_seconds + (telemetry.blur_start ? Math.floor((Date.now() - telemetry.blur_start) / 1000) : 0),
        copy_attempts: telemetry.copy_attempts,
        phone_detection_count: phoneDetection.phoneDetectionCount,
        phone_terminated: phoneTerminated,
      });
      setResult(res);
      setSubmitted(true);
      if (phoneTerminated) {
        setError('Test auto-submitted: phone detected in camera frame.');
      }
    } catch (err: any) {
      setError(err.message || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  }, [token, answers, telemetry, submitted, submitting, phoneDetection]);

  const handleRequestCamera = async () => {
    setCameraGate('requesting');
    try {
      await phoneDetection.requestCamera();
      setCameraGate('ready');
    } catch {
      setCameraGate('denied');
    }
  };

  const attachPreviewRef = useCallback((el: HTMLVideoElement | null) => {
    if (el && phoneDetection.stream) {
      el.srcObject = phoneDetection.stream;
      el.play().catch(() => {});
    }
  }, [phoneDetection.stream]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const AnsweredBadge = () => {
    const count = Object.keys(answers).length;
    return (
      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-100">
        {count}/{questions.length} answered
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[#9E2A2B] animate-spin" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading test...</p>
        </div>
      </div>
    );
  }

  if (error && !assessment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-red-200 p-8 max-w-md text-center space-y-4">
          <XCircle className="w-12 h-12 text-red-400 mx-auto" />
          <h2 className="text-lg font-extrabold text-slate-900">Test Unavailable</h2>
          <p className="text-sm text-slate-500">{error}</p>
          <button onClick={() => navigate('/')} className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  // Camera gate screen
  if (cameraGate !== 'ready' && assessment && !submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md text-center space-y-6 shadow-lg">
          <div className="w-16 h-16 rounded-full bg-[#FDF2F2] flex items-center justify-center mx-auto border border-rose-100">
            <Camera className="w-7 h-7 text-[#9E2A2B]" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Camera Verification Required</h2>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              This test requires camera access for proctoring. Your camera feed is analyzed locally (not uploaded) to detect unauthorized devices like phones.
            </p>
          </div>

          {cameraGate === 'denied' && phoneDetection.cameraError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
              <CameraOff className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
              <p className="text-[11px] text-red-600 font-semibold text-left">{phoneDetection.cameraError}</p>
            </div>
          )}

          <div className="bg-amber-50/50 border border-amber-200/50 rounded-xl p-3 flex items-start gap-2">
            <Smartphone className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-amber-700/80 font-semibold text-left">
              If a phone or secondary device is detected in your camera view, the test will be auto-submitted immediately.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleRequestCamera}
              disabled={cameraGate === 'requesting'}
              className="w-full px-5 py-3 bg-[#9E2A2B] text-white text-xs font-bold rounded-xl hover:bg-[#802223] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {cameraGate === 'requesting' ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Requesting Camera Access...</>
              ) : (
                <><Camera className="w-4 h-4" /> Enable Camera & Start Test</>
              )}
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (submitted && result) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 max-w-md text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto border border-emerald-100">
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              {error.includes('phone') ? 'Test Terminated' : 'Test Submitted!'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {error.includes('phone')
                ? 'A phone was detected in your camera feed. The test was auto-submitted.'
                : 'Your answers have been graded.'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Your Score</p>
              <p className="text-2xl font-black text-[#9E2A2B] mt-1">{Math.round(result.score)}%</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Composite</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{Math.round(result.compositeScore)}%</p>
            </div>
          </div>
          <button onClick={() => navigate('/')} className="w-full px-4 py-2.5 bg-[#9E2A2B] text-white text-xs font-bold rounded-xl cursor-pointer hover:bg-[#802223]">
            Return to Campus
          </button>
        </div>
      </div>
    );
  }

  const q = questions[currentQ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <Shield className="w-5 h-5 text-[#9E2A2B]" />
          <div>
            <h1 className="text-sm font-extrabold text-slate-900">{assessment?.title || 'Assessment'}</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Secure Exam Portal</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <AnsweredBadge />
          {telemetry.tab_switches > 0 && (
            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-200 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> {telemetry.tab_switches} focus loss
            </span>
          )}
          {phoneDetection.phoneDetectionCount > 0 && (
            <span className="px-2 py-0.5 bg-red-50 text-red-700 text-[10px] font-bold rounded-full border border-red-200 flex items-center gap-1">
              <Smartphone className="w-3 h-3" /> {phoneDetection.phoneDetectionCount} phone alert
            </span>
          )}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-sm font-bold ${timeLeft < 60 ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-xs font-bold text-red-600 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      <div className="flex-1 flex">
        {/* Question navigator */}
        <div className="w-20 bg-white border-r border-slate-200 p-3 hidden md:block">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-2">Questions</p>
          <div className="space-y-1.5">
            {questions.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentQ(i)}
                className={`w-full h-8 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                  i === currentQ
                    ? 'bg-[#9E2A2B] text-white'
                    : answers[questions[i].id]
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Question content */}
        <div className="flex-1 p-6 md:p-8 max-w-3xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-black rounded-md uppercase">
                Q{currentQ + 1} of {questions.length}
              </span>
              <span className={`px-2.5 py-0.5 text-[10px] font-black rounded-md uppercase ${
                q?.type === 'mcq' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-purple-50 text-purple-600 border border-purple-100'
              }`}>
                {q?.type === 'mcq' ? 'Multiple Choice' : 'Code Debug'}
              </span>
            </div>
            <div className="md:hidden">
              <AnsweredBadge />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <p className="text-sm font-semibold text-slate-800 leading-relaxed whitespace-pre-wrap">{q?.prompt}</p>
          </div>

          {q?.type === 'mcq' && q.options && (
            <div className="space-y-2">
              {q.options.map((opt, i) => {
                const letter = String.fromCharCode(65 + i);
                const isSelected = answers[q.id] === letter;
                return (
                  <button
                    key={i}
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: letter }))}
                    className={`w-full text-left p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? 'bg-[#FDF2F2] border-[#9E2A2B] text-[#9E2A2B]'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isSelected ? 'bg-[#9E2A2B] text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {letter}
                    </span>
                    <span className="text-xs font-semibold">{opt.replace(/^[A-D]\)\s*/, '')}</span>
                  </button>
                );
              })}
            </div>
          )}

          {q?.type === 'code_debug' && (
            <div className="space-y-3">
              <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block">
                Your Answer
              </label>
              <textarea
                value={answers[q.id] || ''}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                rows={6}
                placeholder="Type your answer here..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-mono focus:bg-white focus:outline-none focus:border-[#9E2A2B] resize-none"
              />
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              onClick={() => setCurrentQ((p) => Math.max(0, p - 1))}
              disabled={currentQ === 0}
              className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="flex gap-2">
              {currentQ < questions.length - 1 && (
                <button
                  onClick={() => setCurrentQ((p) => p + 1)}
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 cursor-pointer"
                >
                  Next
                </button>
              )}
              {currentQ === questions.length - 1 && (
                <button
                  onClick={() => handleSubmit(false)}
                  disabled={submitting}
                  className="px-5 py-2 bg-[#9E2A2B] text-white text-xs font-bold rounded-xl hover:bg-[#802223] cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Submit Test
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Camera preview — fixed bottom-right */}
      {showCameraPreview && (
        <div className="fixed bottom-4 right-4 z-50 group">
          <div className="relative w-40 h-30 rounded-xl overflow-hidden border-2 border-[#9E2A2B] shadow-lg bg-black">
            <video
              ref={attachPreviewRef}
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
              muted
              playsInline
              autoPlay
            />
            {/* Recording indicator */}
            <div className="absolute top-2 left-2 flex items-center gap-1">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-[8px] text-white font-bold uppercase">REC</span>
            </div>
            {phoneDetection.phoneDetected && (
              <div className="absolute inset-0 bg-red-600/80 flex items-center justify-center">
                <div className="text-center">
                  <Smartphone className="w-8 h-8 text-white mx-auto mb-1" />
                  <p className="text-[10px] text-white font-extrabold uppercase">Phone Detected</p>
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowCameraPreview(false)}
            className="absolute -top-2 -left-2 w-5 h-5 bg-slate-800 text-white rounded-full flex items-center justify-center text-[10px] cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
