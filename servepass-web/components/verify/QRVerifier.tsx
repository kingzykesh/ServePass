"use client";

import { useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import toast from "react-hot-toast";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { verifyTicket } from "@/services/tickets";

function extractUuid(value: string) {
  const match = value.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
  );

  return match ? match[0] : value;
}

function playBeep(type: "success" | "warning" | "error") {
  const AudioContextClass =
    window.AudioContext || (window as any).webkitAudioContext;

  const audioCtx = new AudioContextClass();
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  if (type === "success") oscillator.frequency.value = 880;
  if (type === "warning") oscillator.frequency.value = 520;
  if (type === "error") oscillator.frequency.value = 220;

  oscillator.type = "sine";

  gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.001,
    audioCtx.currentTime + 0.25
  );

  oscillator.start(audioCtx.currentTime);
  oscillator.stop(audioCtx.currentTime + 0.25);
}

export default function QRVerifier() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  async function stopScanner() {
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }

    setScanning(false);
  }

  async function startScanner() {
    try {
      setResult(null);
      setStatus("idle");

      const scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        async (decodedText) => {
          await stopScanner();

          const ticketUuid = extractUuid(decodedText);

          try {
            const data = await verifyTicket(ticketUuid);

            setResult(data);
            setStatus("success");
            playBeep("success");
            toast.success("Ticket verified");
          } catch (err: any) {
            const message =
              err?.response?.data?.message ?? "Verification failed";

            setResult(err?.response?.data?.data ?? null);
            setStatus("error");

            if (message.toLowerCase().includes("already used")) {
              playBeep("warning");
            } else {
              playBeep("error");
            }

            toast.error(message);
          }
        },
        () => {}
      );

      setScanning(true);
    } catch {
      playBeep("error");
      toast.error("Unable to start camera");
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
      <Card className="p-5">
        <div
          id="qr-reader"
          className="min-h-[320px] overflow-hidden rounded-3xl bg-slate-100"
        />

        <div className="mt-5 flex gap-3">
          <Button onClick={startScanner} disabled={scanning}>
            Start Scanner
          </Button>

          <button
            onClick={stopScanner}
            className="rounded-2xl border border-gray-200 px-5 py-3 text-sm font-bold text-gray-700"
          >
            Stop
          </button>
        </div>
      </Card>

      <Card
        className={`p-6 ${
          status === "success"
            ? "bg-green-50"
            : status === "error"
            ? "bg-red-50"
            : "bg-white"
        }`}
      >
        <p className="text-sm font-bold uppercase tracking-wide text-gray-500">
          Verification Result
        </p>

        {status === "idle" ? (
          <h2 className="mt-4 text-3xl font-black text-gray-950">
            Ready to scan
          </h2>
        ) : status === "success" ? (
          <div className="mt-4 space-y-3">
            <h2 className="text-4xl font-black text-green-700">Verified</h2>

            <p className="text-lg font-bold text-gray-950">
              {result?.holder_name}
            </p>

            <p className="text-sm text-gray-600">
              {result?.event} • {result?.meal_session}
            </p>

            <p className="text-sm text-gray-600">{result?.ticket_code}</p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <h2 className="text-4xl font-black text-red-600">Rejected</h2>

            <p className="text-sm text-gray-700">
              {result?.used_at
                ? `Already used at ${result.used_at}`
                : "Ticket is invalid, revoked, expired, or already used."}
            </p>
          </div>
        )}

        <button
          onClick={startScanner}
          className="mt-8 w-full rounded-2xl bg-gray-950 px-5 py-3 text-sm font-bold text-white"
        >
          Scan Next Ticket
        </button>
      </Card>
    </div>
  );
}