"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import jsQR from "jsqr";
import { CheckCircle2, XCircle, ScanLine, CameraOff } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type EventOption = { id: string; title: string; startDate: Date };

type ScanResult =
  | { ok: true; ticket: { attendeeName: string; ticketType: string; eventTitle: string; seat: string | null; entryTime: string } }
  | { ok: false; reason: string };

const FAILURE_COPY: Record<string, string> = {
  INVALID_TICKET: "INVALID TICKET",
  TICKET_ALREADY_USED: "TICKET ALREADY USED",
  TICKET_CANCELLED: "TICKET CANCELLED",
  WRONG_EVENT: "WRONG EVENT",
  TICKET_EXPIRED: "TICKET EXPIRED",
  UNAUTHORIZED: "NOT AUTHORIZED",
};

export function ScannerClient({ events }: { events: EventOption[] }) {
  const [eventId, setEventId] = useState(events[0]?.id ?? "");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [todayCount, setTodayCount] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>();
  const lockRef = useRef(false); // prevents firing verify() repeatedly for the same frame

  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
      tick();
    } catch {
      setCameraError("Camera access was denied. Allow camera permission to scan tickets.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tick = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        if (code && !lockRef.current) {
          lockRef.current = true;
          verify(code.data);
        }
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const verify = async (payload: string) => {
    try {
      const res = await fetch("/api/tickets/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payload, eventId }),
      });
      const data = await res.json();
      setResult(data);
      if (data.ok) setTodayCount((c) => c + 1);
    } catch {
      setResult({ ok: false, reason: "INVALID_TICKET" });
    }
  };

  const dismissResult = () => {
    setResult(null);
    lockRef.current = false;
  };

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#05060B] flex flex-col">
      <div className="p-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 mb-3">
          <ScanLine className="h-5 w-5 text-violet-400" />
          <h1 className="font-display font-semibold text-white">Entry Scanner</h1>
          <span className="ml-auto text-xs text-white/40">{todayCount} checked in this session</span>
        </div>
        <Select value={eventId} onValueChange={setEventId}>
          <SelectTrigger>
            <SelectValue placeholder="Select an event" />
          </SelectTrigger>
          <SelectContent>
            {events.map((e) => (
              <SelectItem key={e.id} value={e.id}>{e.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1 relative flex items-center justify-center bg-black">
        {!scanning && !cameraError && (
          <Button size="lg" onClick={startCamera} disabled={!eventId}>
            <ScanLine className="h-4 w-4" /> Start scanning
          </Button>
        )}
        {cameraError && (
          <div className="text-center px-6">
            <CameraOff className="h-8 w-8 text-white/30 mx-auto mb-3" />
            <p className="text-white/60 text-sm">{cameraError}</p>
          </div>
        )}

        <video ref={videoRef} playsInline muted className={`w-full h-full object-cover ${scanning ? "block" : "hidden"}`} />
        <canvas ref={canvasRef} className="hidden" />

        {scanning && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="h-64 w-64 border-2 border-white/40 rounded-2xl relative">
              <div className="absolute -top-0.5 -left-0.5 h-8 w-8 border-t-4 border-l-4 border-violet-400 rounded-tl-2xl" />
              <div className="absolute -top-0.5 -right-0.5 h-8 w-8 border-t-4 border-r-4 border-violet-400 rounded-tr-2xl" />
              <div className="absolute -bottom-0.5 -left-0.5 h-8 w-8 border-b-4 border-l-4 border-violet-400 rounded-bl-2xl" />
              <div className="absolute -bottom-0.5 -right-0.5 h-8 w-8 border-b-4 border-r-4 border-violet-400 rounded-br-2xl" />
            </div>
          </div>
        )}

        {result && (
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center px-8 text-center ${
              result.ok ? "bg-emerald-600/95" : "bg-red-600/95"
            }`}
            onClick={dismissResult}
          >
            {result.ok ? (
              <>
                <CheckCircle2 className="h-16 w-16 text-white mb-4" />
                <p className="text-white font-display text-2xl font-bold">ENTRY VERIFIED</p>
                <p className="text-white text-lg mt-3">{result.ticket.attendeeName}</p>
                <p className="text-white/85">{result.ticket.ticketType}{result.ticket.seat ? ` · Seat ${result.ticket.seat}` : ""}</p>
                <p className="text-white/70 text-sm mt-1">{result.ticket.eventTitle}</p>
                <p className="text-white/70 text-sm mt-3">
                  Entry time: {new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(result.ticket.entryTime))}
                </p>
              </>
            ) : (
              <>
                <XCircle className="h-16 w-16 text-white mb-4" />
                <p className="text-white font-display text-2xl font-bold">{FAILURE_COPY[result.reason] ?? "INVALID TICKET"}</p>
              </>
            )}
            <p className="text-white/60 text-xs mt-8">Tap anywhere to scan the next ticket</p>
          </div>
        )}
      </div>
    </div>
  );
}
