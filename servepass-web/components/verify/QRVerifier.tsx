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

function playScannerSound(status: "VALID" | "USED" | "REJECTED") {
  const AudioContextClass =
    window.AudioContext || (window as any).webkitAudioContext;

  const audioCtx = new AudioContextClass();

  function tone(
    frequency: number,
    duration: number,
    type: OscillatorType = "square",
    volume = 1
  ) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.value = frequency;

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    gain.gain.setValueAtTime(volume, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      audioCtx.currentTime + duration
    );

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + duration);
  }

  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }

  if (status === "VALID") {
    tone(1450, 0.18, "square", 1);
  }

  if (status === "USED") {
    tone(950, 0.12, "square", 1);

    setTimeout(() => {
      tone(950, 0.12, "square", 1);
    }, 170);
  }

  if (status === "REJECTED") {
    tone(250, 0.55, "sawtooth", 1);
  }
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
      {
        facingMode: { exact: "environment" },
      },
      {
        fps: 15,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const size = Math.floor(
            Math.min(viewfinderWidth, viewfinderHeight) * 0.82
          );

          return {
            width: size,
            height: size,
          };
        },
        aspectRatio: 1,
        disableFlip: true,
        videoConstraints: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
      },
      async (decodedText) => {
        await stopScanner();

        const ticketUuid = extractUuid(decodedText);

        try {
          const data = await verifyTicket(ticketUuid);

          setResult(data);
          setStatus("success");
          playScannerSound("VALID");
          toast.success("Ticket verified");
        } catch (err: any) {
          const message =
            err?.response?.data?.message ?? "Verification failed";

          setResult(err?.response?.data?.data ?? null);
          setStatus("error");

          if (message.toLowerCase().includes("already used")) {
            playScannerSound("USED");
          } else {
            playScannerSound("REJECTED");
          }

          toast.error(message);
        }
      },
      () => {}
    );

    setScanning(true);

    // Apply autofocus and zoom only after the camera has started.
    try {
      const capabilities =
        scanner.getRunningTrackCapabilities() as any;

      const advancedConstraints: Record<string, unknown> = {};

      if (Array.isArray(capabilities.focusMode)) {
        if (capabilities.focusMode.includes("continuous")) {
          advancedConstraints.focusMode = "continuous";
        } else if (capabilities.focusMode.includes("single-shot")) {
          advancedConstraints.focusMode = "single-shot";
        }
      }

      if (capabilities.zoom) {
        const minZoom = capabilities.zoom.min ?? 1;
        const maxZoom = capabilities.zoom.max ?? 1;

        // Mild zoom improves small printed QR recognition.
        advancedConstraints.zoom = Math.min(
          Math.max(1.5, minZoom),
          maxZoom
        );
      }

      if (Object.keys(advancedConstraints).length > 0) {
        await scanner.applyVideoConstraints({
          advanced: [advancedConstraints],
        } as MediaTrackConstraints);
      }
    } catch (constraintError) {
      console.warn(
        "Camera focus/zoom constraints are unsupported:",
        constraintError
      );
    }
  } catch (error) {
    console.error(error);
    playScannerSound("REJECTED");
    toast.error("Unable to start camera");
  }
}

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
      <Card className="p-5">
        <div
  id="qr-reader"
  className="min-h-[360px] w-full overflow-hidden rounded-3xl bg-black"
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