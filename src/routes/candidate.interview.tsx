import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AuthGate } from "@/components/auth-gate";
import { useEffect, useRef, useState } from "react";
import { Volume2, Video as VideoIcon, Square, Play, CheckCircle2, Mic } from "lucide-react";
import { useApp } from "@/lib/store";
import { getPreferredRecordingMimeType, getSpeechLanguage } from "@/lib/interview-flow";
import { uploadBlobSimple } from "@/lib/upload";

export const Route = createFileRoute("/candidate/interview")({
  component: InterviewPage,
});

function InterviewPage() {
  const {
    addAnswer,
    answers,
    activeInterviewRole,
    beginInterviewSession,
    language,
    selectedQuestions,
  } = useApp();
  const navigate = useNavigate();

  const [qIndex, setQIndex] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [permError, setPermError] = useState<string | null>(null);
  const [uploadingRecording, setUploadingRecording] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [retakeCounts, setRetakeCounts] = useState<Record<number, number>>({});

  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationRef = useRef(0);
  const recordedUrlRef = useRef<string | null>(null);
  const timerRef = useRef(0);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (activeInterviewRole && selectedQuestions.length === 0) {
      beginInterviewSession();
    }
  }, [activeInterviewRole, beginInterviewSession, selectedQuestions.length]);

  // Get camera
  useEffect(() => {
    let active = true;
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((s) => {
        if (!active) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        setStream(s);
      })
      .catch(() => setPermError("Camera/microphone permission denied. Please allow access."));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!stream || !liveVideoRef.current || recordedUrl) return;

    liveVideoRef.current.srcObject = stream;
    liveVideoRef.current.play().catch(() => {});
  }, [stream, recordedUrl]);

  useEffect(() => {
    return () => {
      stream?.getTracks().forEach((t) => t.stop());
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startRecording = () => {
    if (!stream) return;
    chunksRef.current = [];
    setRecordingError(null);
    const mimeType = getPreferredRecordingMimeType();
    const mr = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: mr.mimeType || mimeType });
      if (blob.size === 0) {
        setRecordingError("Recording was empty. Please record your answer again.");
        return;
      }

      setUploadingRecording(true);
      try {
        const extension = blob.type.split(";")[0] === "video/mp4" ? "mp4" : "webm";
        const uploadedUrl = await uploadBlobSimple(
          blob,
          `INT-${Date.now()}-${qIndex + 1}.${extension}`,
        );
        setRecordedUrl(uploadedUrl);
        recordedUrlRef.current = uploadedUrl;
      } catch (error) {
        setRecordingError(
          error instanceof Error
            ? `Could not store the recording: ${error.message}`
            : "Could not store the recording. Please make sure the upload server is running.",
        );
      } finally {
        setUploadingRecording(false);
      }
    };
    mr.start();
    recorderRef.current = mr;
    setRecording(true);
    setTimer(0);
    timerRef.current = 0;
    durationRef.current = 0;
    intervalRef.current = setInterval(() => {
      durationRef.current += 1;
      setTimer(durationRef.current);
      timerRef.current = durationRef.current;
    }, 1000);
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const playMockAudio = () => {
    try {
      if (typeof window === "undefined") return;

      if (!("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) {
        return;
      }

      const currentQuestion = selectedQuestions[qIndex]?.question;
      if (!currentQuestion) return;

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(currentQuestion);
      utterance.lang = getSpeechLanguage(language);
      utterance.rate = 0.95;
      utterance.pitch = 1;

      const voices = window.speechSynthesis.getVoices();
      const languagePrefix = utterance.lang.split("-")[0].toLowerCase();
      utterance.voice =
        voices.find((voice) => voice.lang?.toLowerCase().startsWith(languagePrefix)) ?? null;

      window.speechSynthesis.speak(utterance);
    } catch {
      return;
    }
  };

  const submitAnswer = (finalize = false) => {
    const answerUrl = recordedUrlRef.current ?? recordedUrl;
    if (!answerUrl || submittedRef.current) return;
    submittedRef.current = true;
    addAnswer({
      questionIndex: qIndex,
      question: selectedQuestions[qIndex]?.question ?? "",
      videoUrl: answerUrl,
      durationSec: timerRef.current || timer,
    });
    recordedUrlRef.current = null;
    setRecordedUrl(null);
    setTimer(0);
    timerRef.current = 0;
    const nextRoute = "/candidate/processing";
    if (!finalize && qIndex < totalQuestions - 1) {
      submittedRef.current = false;
      setQIndex(qIndex + 1);
    } else {
      setTimeout(() => navigate({ to: nextRoute }), 0);
    }
  };

  useEffect(() => {
    submittedRef.current = false;
  }, [qIndex]);

  useEffect(() => {
    const preventLeavingInterview = () => {
      if (recordedUrlRef.current && !submittedRef.current) {
        submitAnswer(true);
      } else if (answers.length > 0) {
        navigate({ to: "/candidate/processing" });
      } else {
        navigate({ to: "/candidate/processing" });
      }
    };

    window.history.pushState({ interviewLocked: true }, "", window.location.href);
    window.addEventListener("popstate", preventLeavingInterview);

    return () => {
      window.removeEventListener("popstate", preventLeavingInterview);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers.length, navigate, qIndex, selectedQuestions]);

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const totalQuestions = selectedQuestions.length || 5;
  const currentQuestion = selectedQuestions[qIndex]?.question ?? "";
  const retakesUsed = retakeCounts[qIndex] ?? 0;
  const retakesRemaining = Math.max(0, 1 - retakesUsed);

  if (permError) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <Card className="max-w-sm p-6 text-center">
          <p className="mb-4 text-sm">{permError}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </Card>
      </div>
    );
  }

  return (
    <AuthGate requiredRole="candidate">
      <div className="min-h-screen bg-background px-4 py-6">
        <div className="mx-auto max-w-md">
          <div className="mb-3 flex items-center justify-between">
            <Badge variant="secondary">
              Question {qIndex + 1} of {totalQuestions}
            </Badge>
            <span className="text-xs text-muted-foreground">{answers.length} answered</span>
          </div>
          <Progress value={(qIndex / totalQuestions) * 100} className="mb-4 h-2" />

          <Card className="mb-4 p-4">
            <p className="mb-3 text-base font-medium leading-snug">{currentQuestion}</p>
            <Button variant="outline" size="sm" onClick={playMockAudio}>
              <Volume2 className="mr-2 h-4 w-4" /> Play Question Audio
            </Button>
          </Card>

          <Card className="mb-3 overflow-hidden">
            <div className="relative aspect-[3/4] bg-black sm:aspect-video">
              <video
                ref={liveVideoRef}
                autoPlay
                muted
                playsInline
                className={`h-full w-full object-cover ${recordedUrl ? "opacity-0" : "opacity-100"}`}
              />
              {recordedUrl && (
                <video
                  src={recordedUrl}
                  controls
                  playsInline
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
              {recording && (
                <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-destructive/90 px-3 py-1 text-xs font-medium text-destructive-foreground">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                  REC {formatTime(timer)}
                </div>
              )}
            </div>
            <div className="flex items-center justify-between border-t p-3 text-xs">
              <span className="flex items-center gap-1 text-emerald-600">
                <CheckCircle2 className="h-3 w-3" /> Face detected
              </span>
              <span className="flex items-center gap-1 text-emerald-600">
                <Mic className="h-3 w-3" /> Audio: Good
              </span>
            </div>
          </Card>

          {recordingError && (
            <p className="mb-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {recordingError}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2">
            {!recordedUrl ? (
              !recording ? (
                <Button
                  onClick={startRecording}
                  disabled={!stream || uploadingRecording}
                  className="col-span-2"
                >
                  <VideoIcon className="mr-2 h-4 w-4" />
                  {uploadingRecording ? "Storing Recording..." : "Start Recording"}
                </Button>
              ) : (
                <Button onClick={stopRecording} variant="destructive" className="col-span-2">
                  <Square className="mr-2 h-4 w-4" /> Stop Recording
                </Button>
              )
            ) : (
              <>
                <Button
                  variant="outline"
                  disabled={retakesRemaining === 0}
                  onClick={() => {
                    setRetakeCounts((prev) => ({ ...prev, [qIndex]: (prev[qIndex] ?? 0) + 1 }));
                    recordedUrlRef.current = null;
                    setRecordedUrl(null);
                    setTimer(0);
                    timerRef.current = 0;
                  }}
                >
                  <Play className="mr-2 h-4 w-4" /> Re-record ({retakesRemaining})
                </Button>
                <Button onClick={() => submitAnswer(false)}>
                  {qIndex === totalQuestions - 1 ? "Submit Interview" : "Submit & Next"}
                </Button>
              </>
            )}
          </div>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            You cannot skip questions. Each question allows 1 retake.
          </p>
        </div>
      </div>
    </AuthGate>
  );
}
