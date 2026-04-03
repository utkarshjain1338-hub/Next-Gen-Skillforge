"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { Loader2, Radio, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { createInterviewSocket } from "@/lib/interview-socket";

type Line = { role: "interviewer" | "you" | "system"; text: string };

function InterviewSessionContent({
  skillName,
  onVerified,
  onPhaseChange,
}: {
  skillName: string;
  onVerified: (skill: string) => void;
  onPhaseChange: (p: "live" | "done" | "fail") => void;
}) {
  const socketRef = useRef<Socket | null>(null);
  const onVerifiedRef = useRef(onVerified);
  useEffect(() => {
    onVerifiedRef.current = onVerified;
  }, [onVerified]);

  useLayoutEffect(() => {
    onPhaseChange("live");
  }, [onPhaseChange]);

  const [connected, setConnected] = useState(false);
  const [lines, setLines] = useState<Line[]>([]);
  const [answer, setAnswer] = useState("");
  const [phase, setPhase] = useState<"live" | "done" | "fail">("live");
  const [round, setRound] = useState({ current: 0, total: 5 });
  const [requiredCorrect, setRequiredCorrect] = useState(4);
  const [correctSoFar, setCorrectSoFar] = useState(0);
  const [lastRoundOk, setLastRoundOk] = useState<boolean | null>(null);

  const append = useCallback((role: Line["role"], text: string) => {
    setLines((prev) => [...prev, { role, text }]);
  }, []);

  useEffect(() => {
    const socket = createInterviewSocket();
    socketRef.current = socket;

    const onConnect = () => {
      setConnected(true);
      append("system", `Connected — rapid technical interview for ${skillName}.`);
      socket.emit("interview:start", { skillName });
    };

    const onStarted = (p: { skillName: string; total: number; requiredCorrect: number }) => {
      setRound((r) => ({ ...r, total: p.total }));
      setRequiredCorrect(p.requiredCorrect);
      append("interviewer", `You need ${p.requiredCorrect}/${p.total} correct answers to verify ${p.skillName}. Answer fast.`);
    };

    const onQuestion = (q: { id: string; prompt: string; round: number; total: number }) => {
      setRound({ current: q.round, total: q.total });
      setLastRoundOk(null);
      append("interviewer", q.prompt);
    };

    const onRoundResult = (r: {
      correct: boolean;
      round: number;
      total: number;
      correctSoFar: number;
      requiredCorrect: number;
    }) => {
      setCorrectSoFar(r.correctSoFar);
      setLastRoundOk(r.correct);
      append("system", r.correct ? "✓ Correct — next question." : "✗ Not quite — keep going.");
    };

    const onComplete = (r: {
      skillName: string;
      verified: boolean;
      correct: number;
      total: number;
      requiredCorrect: number;
    }) => {
      const next = r.verified ? "done" : "fail";
      setPhase(next);
      onPhaseChange(next);
      if (r.verified) {
        append("system", `Verified: ${r.skillName} (${r.correct}/${r.total} correct).`);
        onVerifiedRef.current(r.skillName);
      } else {
        append("system", `Not verified yet — ${r.correct}/${r.total} correct (need ${r.requiredCorrect}).`);
      }
    };

    const onErr = (e: { message?: string }) => {
      append("system", `[Error] ${e?.message ?? "Interview failed"}`);
      setPhase("fail");
      onPhaseChange("fail");
    };

    socket.on("connect", onConnect);
    socket.on("interview:started", onStarted);
    socket.on("interview:question", onQuestion);
    socket.on("interview:round-result", onRoundResult);
    socket.on("interview:complete", onComplete);
    socket.on("interview:error", onErr);
    socket.on("disconnect", () => setConnected(false));

    return () => {
      socket.off("connect", onConnect);
      socket.off("interview:started", onStarted);
      socket.off("interview:question", onQuestion);
      socket.off("interview:round-result", onRoundResult);
      socket.off("interview:complete", onComplete);
      socket.off("interview:error", onErr);
      socket.emit("interview:cancel");
      socket.disconnect();
      socketRef.current = null;
    };
  }, [skillName, append, onPhaseChange]);

  const submitAnswer = () => {
    const s = answer.trim();
    if (!s || !socketRef.current) return;
    append("you", s);
    setAnswer("");
    socketRef.current.emit("interview:answer", { answer: s });
  };

  return (
    <>
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          {connected ? <Radio className="h-3.5 w-3.5 text-green-500" /> : <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {connected ? "WebSocket live" : "Connecting…"}
        </span>
        {round.current > 0 && (
          <span>
            Round {round.current}/{round.total} · score {correctSoFar}/{requiredCorrect} needed
          </span>
        )}
      </div>

      <ScrollArea className="h-72 rounded-md border border-border bg-muted/30 p-3">
        <div className="space-y-2 pr-2">
          {lines.length === 0 && (
            <p className="text-center text-sm text-muted-foreground">Waiting for the first question…</p>
          )}
          {lines.map((line, i) => (
            <div
              key={i}
              className={`rounded-md px-2 py-1.5 text-sm ${
                line.role === "interviewer"
                  ? "border border-primary/30 bg-primary/10 text-foreground"
                  : line.role === "you"
                    ? "ml-4 border border-border bg-background text-foreground"
                    : "text-xs text-muted-foreground italic"
              }`}
            >
              {line.role === "interviewer" && <span className="mr-1 font-semibold text-primary">AI · </span>}
              {line.role === "you" && <span className="mr-1 font-semibold text-muted-foreground">You · </span>}
              {line.text}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="flex gap-2">
        <Input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Type your answer and press Enter…"
          disabled={phase !== "live" || !connected}
          onKeyDown={(e) => {
            if (e.key === "Enter") submitAnswer();
          }}
          className="flex-1"
        />
        <Button type="button" onClick={submitAnswer} disabled={phase !== "live" || !connected || !answer.trim()}>
          Send
        </Button>
      </div>

      {lastRoundOk === false && (
        <p className="text-xs text-amber-600 dark:text-amber-400">Tip: use concrete terms from the domain (tools, concepts, commands).</p>
      )}
    </>
  );
}

export function SkillInterviewDialog({
  open,
  onOpenChange,
  skillName,
  sessionId,
  onVerified,
  onCancel,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  skillName: string | null;
  /** Increment when starting a new interview so the session remounts cleanly */
  sessionId: number;
  onVerified: (skill: string) => void;
  onCancel: (skill: string) => void;
}) {
  const [sessionPhase, setSessionPhase] = useState<"live" | "done" | "fail">("live");

  const handleClose = (v: boolean) => {
    if (!v && skillName && sessionPhase === "live") {
      onCancel(skillName);
    }
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Live AI technical interview
          </DialogTitle>
          <DialogDescription>
            {skillName ? (
              <>
                Rapid-fire questions for <span className="font-medium text-foreground">{skillName}</span>. Your graph
                updates when you pass.
              </>
            ) : (
              "Select a skill."
            )}
          </DialogDescription>
        </DialogHeader>

        {open && skillName ? (
          <InterviewSessionContent
            key={sessionId}
            skillName={skillName}
            onPhaseChange={setSessionPhase}
            onVerified={onVerified}
          />
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
          >
            {sessionPhase === "done" ? "Close" : "Cancel"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
