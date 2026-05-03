import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AuthGate } from "@/components/auth-gate";
import { useApp, QUESTIONS } from "@/lib/store";
import { useEffect, useRef, useState } from "react";
import { Volume2, Video as VideoIcon, Square, Play, CheckCircle2, Mic } from "lucide-react";

export const Route = createFileRoute("/candidate/interview")({
  component: InterviewPage,
});

function InterviewPage() {
  const { addAnswer, answers } = useApp();
  const navigate = useNavigate();

  const [qIndex, setQIndex] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [permError, setPermError] = useState<string | null>(null);

  const liveVideoRef = useRef<HTMLVideoElement>(null);
  const previewRef = useRef<HTMLVideoElement>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const durationRef = useRef(0);

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
    if (stream && liveVideoRef.current) {
      liveVideoRef.current.srcObject = stream;
    }
    return () => {
      if (qIndex === QUESTIONS.length - 1) {
        // cleanup later
      }
    };
  }, [stream]);

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
    const mr = new MediaRecorder(stream);
    mr.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setRecordedUrl(url);
    };
    mr.start();
    recorderRef.current = mr;
    setRecording(true);
    setTimer(0);
    durationRef.current = 0;
    intervalRef.current = setInterval(() => {
      durationRef.current += 1;
      setTimer(durationRef.current);
    }, 1000);
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const playMockAudio = () => {
    // Mock audio play - small beep via Web Audio API
    try {
      const ctx = new AudioContext();
      const o = ctx.createOscillator();
      o.frequency.value = 660;
      o.connect(ctx.destination);
      o.start();
      setTimeout(() => {
        o.stop();
        ctx.close();
      }, 250);
    } catch {}
  };

  const submitAnswer = () => {
    if (!recordedUrl) return;
    addAnswer({ questionIndex: qIndex, videoUrl: recordedUrl, durationSec: timer });
    setRecordedUrl(null);
    setTimer(0);
    if (qIndex < QUESTIONS.length - 1) {
      setQIndex(qIndex + 1);
    } else {
      navigate({ to: "/candidate/review" });
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

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
              Question {qIndex + 1} of {QUESTIONS.length}
            </Badge>
            <span className="text-xs text-muted-foreground">{answers.length} answered</span>
          </div>
          <Progress value={qIndex / QUESTIONS.length * 100} className="mb-4 h-2" />

          <Card className="mb-4 p-4">
            <p className="mb-3 text-base font-medium leading-snug">{QUESTIONS[qIndex]}</p>
            <Button variant="outline" size="sm" onClick={playMockAudio}>
              <Volume2 className="mr-2 h-4 w-4" /> Play Question Audio
            </Button>
          </Card>

          <Card className="mb-3 overflow-hidden">
            <div className="relative aspect-[3/4] bg-black sm:aspect-video">
              {!recordedUrl ? (
                <video
                  ref={liveVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="h-full w-full object-cover"
                />
              ) : (
                <video
                  ref={previewRef}
                  src={recordedUrl}
                  controls
                  playsInline
                  className="h-full w-full object-cover"
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

          <div className="grid grid-cols-2 gap-2">
            {!recordedUrl ? (
              !recording ? (
                <Button onClick={startRecording} disabled={!stream} className="col-span-2">
                  <VideoIcon className="mr-2 h-4 w-4" /> Start Recording
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
                  onClick={() => {
                    setRecordedUrl(null);
                    setTimer(0);
                  }}
                >
                  <Play className="mr-2 h-4 w-4" /> Re-record
                </Button>
                <Button onClick={submitAnswer}>
                  {qIndex === QUESTIONS.length - 1 ? "Submit & Review" : "Submit & Next"}
                </Button>
              </>
            )}
          </div>

          <p className="mt-3 text-center text-xs text-muted-foreground">
            You cannot skip questions. Answer all {QUESTIONS.length} to continue.
          </p>
        </div>
      </div>
    </AuthGate>
  );
}
